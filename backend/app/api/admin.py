from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.core.security import TokenData, get_current_user, RoleChecker, UserRole
from database import officers_collection, cases_collection, audit_logs_collection

router = APIRouter(prefix="/api/v1/admin", tags=["administrator"])

allow_admin = RoleChecker([UserRole.ADMINISTRATOR])

class UserApproveRequest(BaseModel):
    badgeNumber: str
    assignedRole: str
    status: str = "ACTIVE"
    organization: Optional[str] = None

class UserCreateRequest(BaseModel):
    fullName: str
    email: str
    mobile: str
    username: str
    password: str
    organization: str
    organizationId: str
    role: str
    stationOrCourt: Optional[str] = None

class CaseAssignRequest(BaseModel):
    caseId: str
    investigatingOfficer: Optional[str] = None
    forensicOfficer: Optional[str] = None
    prosecutionLawyer: Optional[str] = None
    courtUser: Optional[str] = None

class CaseRevokeRequest(BaseModel):
    caseId: str
    stakeholderRole: str

SEEDED_CASES = [
    {
        "caseId": "CASE-2026-9042",
        "firNumber": "FIR-2026-CBE-0142",
        "caseTitle": "State of Tamil Nadu vs P. Krishnakumar (and Others)",
        "investigationStatus": "ACTIVE_INVESTIGATION",
        "lastActivity": datetime.now(timezone.utc).isoformat(),
        "documentCount": 3,
        "assignments": {
            "io": "Insp. G. Senthil Nathan (TN-POL-4921)",
            "forensic": "Dr. R. Ramanathan (TN-FSL-8840)",
            "prosecution": "Adv. S. Meenakshi (TN-PROS-3301)",
            "court": "Hon. Justice P. Subramanian (TN-JUD-5512)",
            "legal": "Adv. K. Ramanathan (TN-LEG-6601)"
        }
    },
    {
        "caseId": "CASE-2026-1024",
        "firNumber": "FIR-2026-CBE-1024",
        "caseTitle": "Cyber Fraud Syndicate Infiltration",
        "investigationStatus": "READY_FOR_PROSECUTION",
        "lastActivity": datetime.now(timezone.utc).isoformat(),
        "documentCount": 5,
        "assignments": {
            "io": "Insp. G. Senthil Nathan (TN-POL-4921)",
            "forensic": "Dr. R. Ramanathan (TN-FSL-8840)",
            "prosecution": "Adv. S. Meenakshi (TN-PROS-3301)",
            "court": "Hon. Justice P. Subramanian (TN-JUD-5512)",
            "legal": "Adv. K. Ramanathan (TN-LEG-6601)"
        }
    },
    {
        "caseId": "CASE-2026-501",
        "firNumber": "FIR-2026-CBE-0501",
        "caseTitle": "Homicide and Forensic DNA Evidentiary Trail",
        "investigationStatus": "READY_FOR_PROSECUTION",
        "lastActivity": datetime.now(timezone.utc).isoformat(),
        "documentCount": 4,
        "assignments": {
            "io": "Insp. G. Senthil Nathan (TN-POL-4921)",
            "forensic": "Dr. R. Ramanathan (TN-FSL-8840)",
            "prosecution": "Adv. S. Meenakshi (TN-PROS-3301)",
            "court": "Hon. Justice P. Subramanian (TN-JUD-5512)",
            "legal": "Adv. K. Ramanathan (TN-LEG-6601)"
        }
    }
]

@router.get("/metrics")
async def get_admin_metrics(current_user: TokenData = Depends(allow_admin)):
    pending_count = await officers_collection.count_documents({"status": "PENDING_APPROVAL"})
    registered_count = await officers_collection.count_documents({})
    total_users = 248 + registered_count
    active_users = total_users - pending_count
    active_cases = 86
    pending_requests = 12 + pending_count
    system_alerts = 3
    return {
        "summary": {
            "totalUsers": total_users,
            "activeUsers": active_users,
            "pendingUserApprovals": pending_count,
            "activeCases": active_cases,
            "accessRequests": pending_requests,
            "systemAlerts": system_alerts
        },
        "distribution": {
            "police": 124,
            "forensics": 16,
            "prosecution": 26,
            "court": 10,
            "legal": 14,
            "auditors": 5
        }
    }

@router.get("/users")
async def get_admin_users(current_user: TokenData = Depends(allow_admin)):
    from app.api.auth import SEEDED_USERS
    users = []
    for k, v in SEEDED_USERS.items():
        users.append({
            "badgeNumber": v["badgeNumber"],
            "username": v.get("username", v["badgeNumber"].lower()),
            "fullName": v["fullName"],
            "role": v["role"],
            "organization": v.get("organization", "Tamil Nadu Police / Judiciary"),
            "orgId": v.get("orgId", "ORG-TN-01"),
            "status": v.get("status", "ACTIVE"),
            "lastLogin": "Active Today, 10:45 AM",
            "isSeeded": True
        })
    cursor = officers_collection.find({})
    async for u in cursor:
        users.append({
            "badgeNumber": u.get("badgeNumber"),
            "username": u.get("username", u.get("badgeNumber")),
            "fullName": u.get("fullName"),
            "role": u.get("role"),
            "organization": u.get("organization", "Registered Department"),
            "orgId": u.get("orgId", "ORG-DMS"),
            "status": u.get("status", "PENDING_APPROVAL"),
            "lastLogin": u.get("registeredAt", "Never"),
            "isSeeded": False
        })
    return users

@router.post("/users/approve")
async def approve_user_registration(req: UserApproveRequest, current_user: TokenData = Depends(allow_admin)):
    result = await officers_collection.update_one(
        {"badgeNumber": req.badgeNumber},
        {"$set": {
            "status": req.status,
            "role": req.assignedRole,
            "organization": req.organization or "Approved Organization",
            "approvedBy": current_user.fullName,
            "approvedAt": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")
    await audit_logs_collection.insert_one({
        "action": "ADMIN_USER_APPROVAL",
        "targetUser": req.badgeNumber,
        "assignedRole": req.assignedRole,
        "admin": current_user.fullName,
        "timestamp": datetime.now(timezone.utc)
    })
    return {"status": "APPROVED", "badgeNumber": req.badgeNumber, "assignedRole": req.assignedRole}

@router.post("/users/create")
async def create_user_direct(req: UserCreateRequest, current_user: TokenData = Depends(allow_admin)):
    generated_badge = f"ADM-{req.username.upper()[:8]}"
    doc = {
        "badgeNumber": generated_badge,
        "fullName": req.fullName,
        "email": req.email,
        "mobile": req.mobile,
        "username": req.username,
        "password": req.password,
        "organization": req.organization,
        "orgId": req.organizationId,
        "role": req.role,
        "state": "Tamil Nadu",
        "district": "Coimbatore City",
        "stationOrCourt": req.stationOrCourt or req.organization,
        "status": "ACTIVE",
        "contactVerified": True,
        "registeredAt": datetime.now(timezone.utc).isoformat(),
        "createdBy": current_user.fullName
    }
    await officers_collection.insert_one(doc)
    return {"status": "USER_CREATED", "badgeNumber": generated_badge, "fullName": req.fullName}

@router.get("/cases")
async def get_admin_cases(current_user: TokenData = Depends(allow_admin)):
    cursor = cases_collection.find({})
    db_cases = []
    async for c in cursor:
        db_cases.append({
            "caseId": c.get("caseId"),
            "firNumber": c.get("firNumber"),
            "caseTitle": c.get("caseTitle"),
            "investigationStatus": c.get("investigationStatus", "ACTIVE"),
            "lastActivity": c.get("lastActivity", datetime.now(timezone.utc).isoformat()),
            "documentCount": c.get("documentCount", 1),
            "assignments": c.get("assignments", {})
        })
    return SEEDED_CASES + db_cases

@router.post("/cases/assign")
async def assign_case_stakeholders(req: CaseAssignRequest, current_user: TokenData = Depends(allow_admin)):
    update_fields = {}
    if req.investigatingOfficer:
        update_fields["assignments.io"] = req.investigatingOfficer
    if req.forensicOfficer:
        update_fields["assignments.forensic"] = req.forensicOfficer
    if req.prosecutionLawyer:
        update_fields["assignments.prosecution"] = req.prosecutionLawyer
    if req.courtUser:
        update_fields["assignments.court"] = req.courtUser

    await cases_collection.update_one(
        {"caseId": req.caseId},
        {"$set": update_fields},
        upsert=True
    )
    await audit_logs_collection.insert_one({
        "action": "ADMIN_CASE_ASSIGNMENT",
        "caseId": req.caseId,
        "assignments": update_fields,
        "admin": current_user.fullName,
        "timestamp": datetime.now(timezone.utc)
    })
    return {"status": "ASSIGNED_SUCCESSFULLY", "caseId": req.caseId, "assignments": update_fields}

@router.post("/cases/revoke")
async def revoke_case_access(req: CaseRevokeRequest, current_user: TokenData = Depends(allow_admin)):
    role_key = req.stakeholderRole.lower()
    await cases_collection.update_one(
        {"caseId": req.caseId},
        {"$unset": {f"assignments.{role_key}": ""}}
    )
    return {"status": "REVOKED", "caseId": req.caseId, "revokedRole": req.stakeholderRole}

@router.get("/pending-actions")
async def get_pending_admin_actions(current_user: TokenData = Depends(allow_admin)):
    pending_users = []
    cursor = officers_collection.find({"status": "PENDING_APPROVAL"})
    async for u in cursor:
        pending_users.append({
            "type": "NEW_USER_REGISTRATION",
            "title": f"Registration: {u.get('fullName')}",
            "identifier": u.get("badgeNumber"),
            "details": f"Requested Role: {u.get('requestedRole')} | Org: {u.get('organization')}",
            "requestedAt": u.get("registeredAt", "Recently")
        })
    mock_requests = [
        {
            "type": "ROLE_ASSIGNMENT",
            "title": "Role Upgrade Request",
            "identifier": "TN-POL-4921",
            "details": "Investigating Officer requesting Station Supervisory clearance",
            "requestedAt": "10 mins ago"
        },
        {
            "type": "CASE_ASSIGNMENT",
            "title": "Case Intake Assignment",
            "identifier": "CASE-2026-CBE-1024",
            "details": "Coimbatore Cyber Crime Cell requesting forensic examiner assignment",
            "requestedAt": "25 mins ago"
        },
        {
            "type": "ACCESS_REQUEST",
            "title": "Emergency Evidence Access",
            "identifier": "CASE-2026-9042",
            "details": "Adv. S. Meenakshi requesting trial brief authorization",
            "requestedAt": "1 hour ago"
        }
    ]
    return pending_users + mock_requests
