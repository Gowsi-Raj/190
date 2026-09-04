from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from app.core.security import (
    create_access_token,
    get_current_user,
    UserRole,
    TokenData
)
from database import officers_collection

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])

SEEDED_USERS = {
    "TN-POL-4921": {
        "badgeNumber": "TN-POL-4921",
        "fullName": "Insp. G. Senthil Nathan",
        "role": "INVESTIGATING_OFFICER",
        "state": "Tamil Nadu",
        "district": "Coimbatore City",
        "stationOrCourt": "B-1 Bazaar Police Station"
    },
    "TN-SHO-1002": {
        "badgeNumber": "TN-SHO-1002",
        "fullName": "ACP K. Rajendran",
        "role": "STATION_HOUSE_OFFICER",
        "state": "Tamil Nadu",
        "district": "Coimbatore City",
        "stationOrCourt": "Coimbatore Central Sub-Division"
    },
    "MH-POL-7719": {
        "badgeNumber": "MH-POL-7719",
        "fullName": "Sub-Insp. Aarav Deshmukh",
        "role": "INVESTIGATING_OFFICER",
        "state": "Maharashtra",
        "district": "Mumbai City",
        "stationOrCourt": "Azad Maidan Police Station"
    },
    "TN-FSL-8840": {
        "badgeNumber": "TN-FSL-8840",
        "fullName": "Dr. R. Ramanathan (Director)",
        "role": "FORENSIC_EXAMINER",
        "state": "Tamil Nadu",
        "district": "Chennai HQ",
        "stationOrCourt": "State Forensic Science Laboratory (SFSL)"
    },
    "TN-PROS-3301": {
        "badgeNumber": "TN-PROS-3301",
        "fullName": "Adv. S. Meenakshi",
        "role": "PUBLIC_PROSECUTOR",
        "state": "Tamil Nadu",
        "district": "Coimbatore",
        "stationOrCourt": "District Court Prosecution Wing"
    },
    "TN-JUD-5512": {
        "badgeNumber": "TN-JUD-5512",
        "fullName": "Hon. Justice P. Subramanian",
        "role": "JUDICIAL_OFFICER",
        "state": "Tamil Nadu",
        "district": "Coimbatore",
        "stationOrCourt": "Principal Sessions Court Registry"
    },
    "KA-POL-6104": {
        "badgeNumber": "KA-POL-6104",
        "fullName": "Insp. Ramesh Gowda",
        "role": "INVESTIGATING_OFFICER",
        "state": "Karnataka",
        "district": "Bengaluru City",
        "stationOrCourt": "Koramangala Police Station"
    },
    "DL-AUDIT-9900": {
        "badgeNumber": "DL-AUDIT-9900",
        "fullName": "National Cyber Auditor",
        "role": "SYSTEM_AUDITOR",
        "state": "New Delhi",
        "district": "Central Delhi",
        "stationOrCourt": "National Cyber Crime Coordination Centre (I4C)"
    }
}


class OfficerRegisterRequest(BaseModel):
    badgeNumber: str = Field(..., description="Unique Government Police/Court PIN or Service ID")
    fullName: str = Field(..., description="Full Name of Officer/Official")
    password: str = Field(..., min_length=1)
    role: UserRole
    state: str = Field("Tamil Nadu")
    district: str = Field("Coimbatore City")
    stationOrCourt: str = Field("B-1 Bazaar Police Station")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    badgeNumber: str
    fullName: str
    role: str
    state: str
    district: str
    stationOrCourt: str


@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    badge = form_data.username.strip()

    # 1. Match seeded accounts
    if badge in SEEDED_USERS:
        user_data = SEEDED_USERS[badge]
    else:
        # 2. Match dynamically registered MongoDB accounts
        user_data = await officers_collection.find_one({"badgeNumber": badge})

    # 3. If unknown custom badge entered, auto-create dynamic officer record on the fly
    if not user_data:
        user_data = {
            "badgeNumber": badge,
            "fullName": f"Officer {badge}",
            "role": "INVESTIGATING_OFFICER",
            "state": "Tamil Nadu",
            "district": "Coimbatore City",
            "stationOrCourt": "Central Police Station"
        }

    role_val = user_data["role"].value if isinstance(user_data["role"], UserRole) else user_data["role"]

    token_payload = {
        "sub": user_data["badgeNumber"],
        "name": user_data.get("fullName", f"Officer {badge}"),
        "role": role_val,
        "state": user_data.get("state", "Tamil Nadu"),
        "district": user_data.get("district", "Coimbatore City"),
        "unit": user_data.get("stationOrCourt", "Police Station")
    }

    access_token = create_access_token(data=token_payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "badgeNumber": user_data["badgeNumber"],
        "fullName": user_data.get("fullName", f"Officer {badge}"),
        "role": role_val,
        "state": user_data.get("state", "Tamil Nadu"),
        "district": user_data.get("district", "Coimbatore City"),
        "stationOrCourt": user_data.get("stationOrCourt", "Police Station")
    }


@router.post("/register-officer")
async def register_new_officer(req: OfficerRegisterRequest):
    existing = await officers_collection.find_one({"badgeNumber": req.badgeNumber})
    if existing or req.badgeNumber in SEEDED_USERS:
        raise HTTPException(status_code=409, detail="Officer with this Service/Badge ID already enrolled.")

    doc = {
        "badgeNumber": req.badgeNumber,
        "fullName": req.fullName,
        "role": req.role.value,
        "state": req.state,
        "district": req.district,
        "stationOrCourt": req.stationOrCourt
    }

    await officers_collection.insert_one(doc)
    return {"status": "ENROLLED_SUCCESSFULLY", "badgeNumber": req.badgeNumber, "fullName": req.fullName}


@router.get("/officers-list")
async def get_all_officers_directory():
    seeded_list = [
        {
            "badgeNumber": v["badgeNumber"],
            "fullName": v["fullName"],
            "role": v["role"],
            "state": v["state"],
            "district": v["district"],
            "stationOrCourt": v["stationOrCourt"]
        }
        for v in SEEDED_USERS.values()
    ]

    cursor = officers_collection.find({})
    db_users = []
    async for u in cursor:
        db_users.append({
            "badgeNumber": u["badgeNumber"],
            "fullName": u["fullName"],
            "role": u["role"],
            "state": u.get("state", "Tamil Nadu"),
            "district": u.get("district", "Coimbatore City"),
            "stationOrCourt": u.get("stationOrCourt", "Police Department")
        })

    return seeded_list + db_users


@router.get("/me", response_model=TokenData)
async def get_authenticated_profile(current_user: TokenData = Depends(get_current_user)):
    return current_user