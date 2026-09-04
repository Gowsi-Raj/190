from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class IngestionPreviewResponse(BaseModel):
    tempDocId: str
    docHash: str
    fileName: str
    extractedText: str
    redactedText: str
    detectedSections: List[str]
    confidenceScore: float


class DocumentCommitRequest(BaseModel):
    caseId: str = Field(..., description="Investigation/Case Tracking ID")
    firNumber: str = Field(..., description="FIR / General Diary Reference Number")
    policeStation: str = Field(..., description="Jurisdictional Police Station")
    district: str = Field(..., description="Jurisdictional District")
    complainantName: str = Field(..., description="Name of Informant / Complainant")
    accusedName: str = Field(..., description="Name of Accused / Suspect(s)")
    docType: str = Field(..., description="Type of document (FIR, SALE_AGREEMENT, etc.)")
    docHash: str = Field(..., description="SHA-256 cryptographic checksum")
    fileName: str = Field(..., description="Original name of uploaded document")
    officerBadgeNumber: str = Field(..., description="Unique Badge/ID of the Attesting Officer")
    officerName: str = Field(..., description="Designation and Name of Officer")
    deviceIdentifier: str = Field("TERMINAL-LEGAL-DMS-STATION-04", description="Workstation Hardware ID")
    verifiedData: Dict[str, Any] = Field(default_factory=dict, description="Verified OCR text and statutory acts")


class CustodyTransferRequest(BaseModel):
    docHash: str = Field(..., description="SHA-256 hash of document being transferred")
    fromOfficer: str = Field(..., description="Current holding officer badge")
    toDepartment: str = Field(..., description="Target department (e.g. Forensic Science Lab, Sessions Court)")
    receivingOfficer: str = Field(..., description="Receiving officer badge or court clerk ID")
    transferReason: str = Field(..., description="Official reason (e.g., Forensic Ballistics Analysis, Charge Sheet Submission)")


class DocumentRecordResponse(BaseModel):
    id: str
    caseId: str
    firNumber: str
    policeStation: str
    district: str
    complainantName: str
    accusedName: str
    docType: str
    docHash: str
    fileName: str
    officerBadgeNumber: str
    officerName: str
    deviceIdentifier: str
    verifiedData: Dict[str, Any]
    blockchainTxHash: str
    timestamp: str


class CaseDossierResponse(BaseModel):
    caseId: str
    firNumber: str
    totalDocuments: int
    documents: List[DocumentRecordResponse]
    chainOfCustodyAudit: List[Dict[str, Any]]