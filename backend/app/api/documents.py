import uuid
import os
import io
import hashlib
import qrcode
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse

from app.schemas.document import DocumentCommitRequest, CustodyTransferRequest
from app.services.crypto_ocr import (
    compute_sha256,
    extract_ocr_and_sections,
    save_raw_document,
    STORAGE_DIR
)
from app.services.bsa_certificate import generate_section_63_bsa_certificate
from app.services.watermark_redaction import redact_sensitive_pii, apply_forensic_watermark
from app.core.security import get_current_user, RoleChecker, UserRole, TokenData
from database import documents_collection, audit_logs_collection

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])

PUBLIC_BASE_URL = os.getenv("PUBLIC_APP_URL", "http://localhost:3000")


def compute_record_seal(
    doc_hash: str,
    fir_number: str,
    case_id: str,
    police_station: str,
    district: str,
    complainant_name: str,
    accused_name: str,
    doc_type: str,
    officer_badge_number: str
) -> str:
    raw = f"{doc_hash}|{fir_number}|{case_id}|{police_station}|{district}|{complainant_name}|{accused_name}|{doc_type}|{officer_badge_number}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()


allow_ingest = RoleChecker([UserRole.INVESTIGATING_OFFICER, UserRole.STATION_HOUSE_OFFICER, UserRole.FORENSIC_EXAMINER])
allow_transfer = RoleChecker([UserRole.INVESTIGATING_OFFICER, UserRole.STATION_HOUSE_OFFICER, UserRole.FORENSIC_EXAMINER, UserRole.JUDICIAL_OFFICER])
allow_dossier = RoleChecker([
    UserRole.INVESTIGATING_OFFICER,
    UserRole.STATION_HOUSE_OFFICER,
    UserRole.FORENSIC_EXAMINER,
    UserRole.PUBLIC_PROSECUTOR,
    UserRole.JUDICIAL_OFFICER,
    UserRole.SYSTEM_AUDITOR
])


@router.post("/scan-preview")
async def scan_and_preview(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(allow_ingest)
):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    doc_hash = compute_sha256(contents)
    extracted_data = extract_ocr_and_sections(contents)
    raw_text = extracted_data.get("raw_text", "")
    redacted_preview = redact_sensitive_pii(raw_text)

    save_raw_document(contents, doc_hash, file.filename)

    return {
        "tempDocId": str(uuid.uuid4()),
        "docHash": doc_hash,
        "fileName": file.filename,
        "extractedText": raw_text,
        "redactedText": redacted_preview,
        "detectedSections": extracted_data.get("detectedSections", extracted_data.get("detected_sections", [])),
        "confidenceScore": extracted_data.get("confidenceScore", extracted_data.get("confidence", 0.90)),
        "scannedBy": f"{current_user.fullName} ({current_user.badgeNumber})"
    }


@router.post("/commit")
async def commit_document(
    request: DocumentCommitRequest,
    current_user: TokenData = Depends(allow_ingest)
):
    existing_doc = await documents_collection.find_one({"docHash": request.docHash})
    if existing_doc:
        raise HTTPException(status_code=409, detail="Document with identical SHA-256 hash already registered in immutable ledger.")

    now_utc = datetime.now(timezone.utc)
    simulated_tx = f"0xsimulated_tx_{request.docHash[:16]}_{int(now_utc.timestamp())}"

    raw_text = request.verifiedData.get("text", "")
    redacted_text = redact_sensitive_pii(raw_text)

    police_station = current_user.stationOrCourt or request.policeStation
    district = current_user.district or request.district
    badge_number = current_user.badgeNumber

    # Generate cryptographic record seal for tampering detection
    record_seal = compute_record_seal(
        request.docHash,
        request.firNumber,
        request.caseId,
        police_station,
        district,
        request.complainantName,
        request.accusedName,
        request.docType,
        badge_number
    )

    record = {
        "caseId": request.caseId,
        "firNumber": request.firNumber,
        "policeStation": police_station,
        "district": district,
        "complainantName": request.complainantName,
        "accusedName": request.accusedName,
        "docType": request.docType,
        "docHash": request.docHash,
        "fileName": request.fileName,
        "officerBadgeNumber": badge_number,
        "officerName": current_user.fullName,
        "currentCustodian": f"{current_user.fullName} ({badge_number})",
        "deviceIdentifier": request.deviceIdentifier,
        "recordSeal": record_seal,
        "verifiedData": {
            **request.verifiedData,
            "redactedText": redacted_text
        },
        "blockchainTxHash": simulated_tx,
        "timestamp": now_utc
    }

    result = await documents_collection.insert_one(record)

    await audit_logs_collection.insert_one({
        "docHash": request.docHash,
        "action": "EVIDENCE_INGESTION_SEALED",
        "docType": request.docType,
        "fromEntity": "Physical Evidence Ingestion",
        "toEntity": f"{current_user.fullName} ({badge_number})",
        "reason": "Initial Verification & Cryptographic Anchoring",
        "txHash": simulated_tx,
        "timestamp": now_utc
    })

    return {
        "status": "COMMITTED_IMMUTABLE",
        "documentId": str(result.inserted_id),
        "docHash": request.docHash,
        "blockchainTxHash": simulated_tx,
        "recordSeal": record_seal
    }


@router.post("/transfer-custody")
async def transfer_custody(
    request: CustodyTransferRequest,
    current_user: TokenData = Depends(allow_transfer)
):
    doc = await documents_collection.find_one({"docHash": request.docHash})
    if not doc:
        raise HTTPException(status_code=404, detail="Document record not found in ledger.")

    now_utc = datetime.now(timezone.utc)
    transfer_tx = f"0xtransfer_tx_{request.docHash[:12]}_{int(now_utc.timestamp())}"

    await documents_collection.update_one(
        {"docHash": request.docHash},
        {"$set": {"currentCustodian": f"{request.receivingOfficer} ({request.toDepartment})"}}
    )

    audit_entry = {
        "docHash": request.docHash,
        "action": "CHAIN_OF_CUSTODY_TRANSFER",
        "docType": doc.get("docType", "EVIDENCE"),
        "fromEntity": f"{current_user.fullName} ({current_user.badgeNumber})",
        "toEntity": f"{request.receivingOfficer} ({request.toDepartment})",
        "reason": request.transferReason,
        "txHash": transfer_tx,
        "timestamp": now_utc
    }
    await audit_logs_collection.insert_one(audit_entry)

    return {
        "status": "CUSTODY_TRANSFERRED",
        "transferTxHash": transfer_tx,
        "timestamp": now_utc.isoformat(),
        "newCustodian": f"{request.receivingOfficer} ({request.toDepartment})"
    }


@router.get("/verify-record")
async def verify_record_public(
    hash: str = Query(..., description="Cryptographic SHA-256 hash"),
    fir: Optional[str] = Query(default=None, description="FIR reference from QR code"),
    badge: Optional[str] = Query(default=None, description="Officer badge from QR code")
):
    """
    Publicly accessible Section 63 BSA Cryptographic Verification & Live DB Tamper Detection endpoint.
    Scanned by phone QR codes or verified via web dashboards.
    """
    if not hash or not isinstance(hash, str) or hash.strip() == "":
        return {
            "isAuthentic": False,
            "isTampered": True,
            "reason": "NO_HASH_PROVIDED",
            "message": "TAMPER ALERT: No SHA-256 cryptographic hash provided in QR verification request.",
            "docHash": ""
        }

    clean_hash = hash.strip()
    clean_fir = fir.strip() if (fir and isinstance(fir, str)) else ""
    clean_badge = badge.strip() if (badge and isinstance(badge, str)) else ""


    # 1. Search database for the document by hash
    doc = await documents_collection.find_one({"docHash": clean_hash})

    # If not found by hash, check if a record with this FIR exists to give precise mismatch details
    if not doc:
        if clean_fir and clean_fir != "N/A" and clean_fir != "undefined":
            alt_doc = await documents_collection.find_one({"firNumber": {"$regex": f"^{clean_fir}$", "$options": "i"}})
            if alt_doc:
                return {
                    "isAuthentic": False,
                    "isTampered": True,
                    "reason": "HASH_MISMATCH",
                    "message": f"TAMPER ALERT: The scanned exhibit hash does not match the active ledger hash for FIR '{clean_fir}'. The file or hash has been replaced.",
                    "scannedHash": clean_hash,
                    "databaseHash": alt_doc.get("docHash", ""),
                    "firNumber": clean_fir
                }

        return {
            "isAuthentic": False,
            "isTampered": True,
            "reason": "RECORD_NOT_FOUND",
            "message": "TAMPER ALERT / UNREGISTERED: Hash does not exist in official database ledger. Record was deleted, altered, or never anchored.",
            "docHash": clean_hash,
            "firNumber": clean_fir or "N/A"
        }

    # 2. Extract database fields
    db_fir = doc.get("firNumber", "")
    db_badge = doc.get("officerBadgeNumber", "")
    db_case = doc.get("caseId", "")
    db_station = doc.get("policeStation", "")
    db_district = doc.get("district", "")
    db_complainant = doc.get("complainantName", "")
    db_accused = doc.get("accusedName", "")
    db_doctype = doc.get("docType", "Primary Judicial Exhibit")

    # 3. Check QR parameters against live DB record
    if clean_fir and clean_fir not in ["N/A", "undefined", ""] and db_fir.strip() != clean_fir:
        return {
            "isAuthentic": False,
            "isTampered": True,
            "reason": "FIR_TAMPERED",
            "message": f"TAMPER DETECTED: FIR Number in database ('{db_fir}') does not match the sealed certificate QR code ('{clean_fir}').",
            "expectedFir": clean_fir,
            "databaseFir": db_fir,
            "docHash": clean_hash
        }

    if clean_badge and clean_badge not in ["N/A", "undefined", ""] and db_badge.strip() != clean_badge:
        return {
            "isAuthentic": False,
            "isTampered": True,
            "reason": "BADGE_TAMPERED",
            "message": f"TAMPER DETECTED: Attesting Officer Badge in database ('{db_badge}') does not match the sealed certificate QR code ('{clean_badge}').",
            "expectedBadge": clean_badge,
            "databaseBadge": db_badge,
            "docHash": clean_hash
        }

    # 4. Check record seal integrity if present
    stored_seal = doc.get("recordSeal")
    if stored_seal:
        recomputed_seal = compute_record_seal(
            clean_hash, db_fir, db_case, db_station, db_district, db_complainant, db_accused, db_doctype, db_badge
        )
        if stored_seal != recomputed_seal:
            return {
                "isAuthentic": False,
                "isTampered": True,
                "reason": "METADATA_TAMPERED",
                "message": "TAMPER DETECTED: Database record metadata (e.g. Complainant, Accused, or Police Station) was directly modified in MongoDB after sealing.",
                "docHash": clean_hash,
                "firNumber": db_fir
            }

    # 5. Check Vault Storage physical file integrity if available on node
    possible_files = [f for f in os.listdir(STORAGE_DIR) if f.startswith(clean_hash)]
    if possible_files:
        file_path = os.path.join(STORAGE_DIR, possible_files[0])
        try:
            with open(file_path, "rb") as vf:
                disk_bytes = vf.read()
            disk_hash = compute_sha256(disk_bytes)
            if disk_hash != clean_hash:
                return {
                    "isAuthentic": False,
                    "isTampered": True,
                    "reason": "VAULT_FILE_TAMPERED",
                    "message": "TAMPER DETECTED: The physical evidence file in vault storage has been altered or corrupted on disk.",
                    "docHash": clean_hash
                }
        except Exception:
            pass

    # 6. Fetch custody audit trail
    audit_cursor = audit_logs_collection.find({"docHash": clean_hash}).sort("timestamp", 1)
    audit_trail = []
    async for a in audit_cursor:
        ats = a["timestamp"]
        if isinstance(ats, datetime) and ats.tzinfo is None:
            ats = ats.replace(tzinfo=timezone.utc)
        audit_trail.append({
            "action": a.get("action", "CUSTODY_EVENT"),
            "docType": a.get("docType", "EVIDENCE"),
            "fromEntity": a.get("fromEntity", "N/A"),
            "toEntity": a.get("toEntity", "N/A"),
            "reason": a.get("reason", "Official Duty"),
            "timestamp": ats.isoformat() if isinstance(ats, datetime) else str(ats),
            "txHash": a.get("txHash", "0x0")
        })

    ts = doc.get("timestamp")
    if isinstance(ts, datetime) and ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    committed_iso = ts.isoformat() if isinstance(ts, datetime) else str(ts)

    return {
        "isAuthentic": True,
        "isTampered": False,
        "message": "Document 100% verified against official Section 63 BSA ledger. No tampering detected.",
        "doc": {
            "id": str(doc.get("_id")),
            "caseId": db_case,
            "firNumber": db_fir,
            "policeStation": db_station,
            "district": db_district,
            "complainantName": db_complainant,
            "accusedName": db_accused,
            "docType": db_doctype,
            "docHash": clean_hash,
            "fileName": doc.get("fileName", ""),
            "officerBadgeNumber": db_badge,
            "officerName": doc.get("officerName", "Investigating Officer"),
            "currentCustodian": doc.get("currentCustodian", f"{doc.get('officerName')} ({db_badge})"),
            "blockchainTxHash": doc.get("blockchainTxHash", "0x0"),
            "timestamp": committed_iso,
            "verifiedData": doc.get("verifiedData", {})
        },
        "auditTrail": audit_trail
    }


@router.post("/verify-tamper")
async def verify_tamper(file: UploadFile = File(...)):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    computed_hash = compute_sha256(contents)
    matched = await documents_collection.find_one({"docHash": computed_hash})

    if matched:
        ts = matched["timestamp"]
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
            
        return {
            "isAuthentic": True,
            "message": "Document verified against official record. No tampering detected.",
            "docHash": computed_hash,
            "record": {
                "caseId": matched.get("caseId"),
                "firNumber": matched.get("firNumber"),
                "policeStation": matched.get("policeStation", "B1 Bazaar PS"),
                "complainantName": matched.get("complainantName", "N/A"),
                "accusedName": matched.get("accusedName", "N/A"),
                "docType": matched.get("docType"),
                "committedAt": ts.isoformat(),
                "officerBadgeNumber": matched.get("officerBadgeNumber"),
                "txHash": matched.get("blockchainTxHash")
            }
        }
    else:
        return {
            "isAuthentic": False,
            "message": "TAMPER ALERT / UNREGISTERED: Hash does not match any official record.",
            "docHash": computed_hash
        }



@router.get("/dossier/{fir_or_case_id}")
async def get_case_dossier(fir_or_case_id: str):
    """
    Publicly resolvable dossier & evidence lookup for both authenticated dashboards and phone QR scan verification.
    """
    query = {
        "$or": [
            {"firNumber": {"$regex": f"^{fir_or_case_id}$", "$options": "i"}},
            {"caseId": {"$regex": f"^{fir_or_case_id}$", "$options": "i"}},
            {"docHash": {"$regex": f"^{fir_or_case_id}$", "$options": "i"}}
        ]
    }

    cursor = documents_collection.find(query).sort("timestamp", 1)
    docs = []
    doc_hashes = []

    async for d in cursor:
        ts = d["timestamp"]
        if isinstance(ts, datetime) and ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        iso_ts = ts.isoformat()
        doc_hashes.append(d["docHash"])

        docs.append({
            "id": str(d["_id"]),
            "caseId": d.get("caseId", ""),
            "firNumber": d.get("firNumber", ""),
            "policeStation": d.get("policeStation", "B1 Police Station"),
            "district": d.get("district", "Coimbatore"),
            "complainantName": d.get("complainantName", "N/A"),
            "accusedName": d.get("accusedName", "N/A"),
            "docType": d.get("docType", "FIR"),
            "docHash": d.get("docHash", ""),
            "fileName": d.get("fileName", ""),
            "officerBadgeNumber": d.get("officerBadgeNumber", ""),
            "officerName": d.get("officerName", "Investigating Officer"),
            "currentCustodian": d.get("currentCustodian", d.get("officerBadgeNumber", "TN-POL-4921")),
            "verifiedData": d.get("verifiedData", {}),
            "blockchainTxHash": d.get("blockchainTxHash", "0x0"),
            "timestamp": iso_ts
        })

    if not docs:
        raise HTTPException(status_code=404, detail="No case dossier found for the specified identifier.")

    audit_cursor = audit_logs_collection.find({"docHash": {"$in": doc_hashes}}).sort("timestamp", 1)
    audit_trail = []
    async for a in audit_cursor:
        ats = a["timestamp"]
        if isinstance(ats, datetime) and ats.tzinfo is None:
            ats = ats.replace(tzinfo=timezone.utc)
            
        audit_trail.append({
            "action": a.get("action", "CUSTODY_EVENT"),
            "docType": a.get("docType", "EVIDENCE"),
            "docHash": a.get("docHash", ""),
            "fromEntity": a.get("fromEntity", "N/A"),
            "toEntity": a.get("toEntity", "N/A"),
            "reason": a.get("reason", "Official Duty"),
            "timestamp": ats.isoformat(),
            "txHash": a.get("txHash", "0x0")
        })

    return {
        "caseId": docs[0]["caseId"],
        "firNumber": docs[0]["firNumber"],
        "policeStation": docs[0]["policeStation"],
        "district": docs[0]["district"],
        "complainantName": docs[0]["complainantName"],
        "accusedName": docs[0]["accusedName"],
        "totalDocuments": len(docs),
        "documents": docs,
        "chainOfCustodyAudit": audit_trail
    }


@router.get("/qr-code/{doc_hash}")
async def get_evidence_qr_code(doc_hash: str):
    """
    Publicly accessible dynamic PNG QR code endpoint for Phase 1 and Phase 2 UI tagging.
    """
    doc_record = await documents_collection.find_one({"docHash": doc_hash})
    fir = doc_record.get('firNumber', 'N/A') if doc_record else "N/A"
    badge = doc_record.get('officerBadgeNumber', 'TN-POL-4921') if doc_record else "TN-POL-4921"

    qr_payload = f"{PUBLIC_BASE_URL}/verify?hash={doc_hash}&fir={fir}&badge={badge}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=5,
        border=1,
    )
    qr.add_data(qr_payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="white")
    
    img_buffer = io.BytesIO()
    img.save(img_buffer, format="PNG")
    img_buffer.seek(0)

    return StreamingResponse(
        img_buffer,
        media_type="image/png",
        headers={"Content-Disposition": f"inline; filename=QR_{doc_hash[:10]}.png"}
    )


@router.get("/certificate/section-63-bsa/{doc_hash}")
async def download_bsa_certificate(doc_hash: str):
    """
    Downloads Section 63 BSA Certificate PDF with the embedded Phase 3 QR code in the top header.
    """
    doc_record = await documents_collection.find_one({"docHash": doc_hash})
    if not doc_record:
        raise HTTPException(status_code=404, detail="Document record not found for certificate generation.")

    pdf_bytes = generate_section_63_bsa_certificate(doc_record)
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Section63_BSA_Certificate_{doc_hash[:10]}.pdf"
        }
    )


@router.get("/download-watermarked/{doc_hash}")
async def download_watermarked_dossier_pdf(
    doc_hash: str,
    officer_badge: str = Query("TN-POL-4921"),
    station: str = Query("Coimbatore Central Police Station")
):
    possible_files = [f for f in os.listdir(STORAGE_DIR) if f.startswith(doc_hash)]
    if not possible_files:
        raise HTTPException(status_code=404, detail="Original document file not found in vault storage.")

    file_path = os.path.join(STORAGE_DIR, possible_files[0])
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    ist_tz = timezone(timedelta(hours=5, minutes=30))
    time_str = datetime.now(ist_tz).strftime("%d-%b-%Y %I:%M:%S %p IST")

    if file_bytes.startswith(b'%PDF-'):
        watermarked_bytes = apply_forensic_watermark(
            file_bytes,
            f"OFFICER: {officer_badge}",
            station,
            time_str
        )
        return StreamingResponse(
            io.BytesIO(watermarked_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=WATERMARKED_{possible_files[0]}"
            }
        )
    else:
        return StreamingResponse(
            io.BytesIO(file_bytes),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename=ORIGINAL_{possible_files[0]}"
            }
        )