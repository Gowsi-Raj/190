import os
import hashlib
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from enum import Enum
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

# Secret configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "LEGAL_DMS_SUPER_SECRET_CRYPTOGRAPHIC_KEY_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


class UserRole(str, Enum):
    INVESTIGATING_OFFICER = "INVESTIGATING_OFFICER"
    STATION_HOUSE_OFFICER = "STATION_HOUSE_OFFICER"
    FORENSIC_EXAMINER = "FORENSIC_EXAMINER"
    PUBLIC_PROSECUTOR = "PUBLIC_PROSECUTOR"
    JUDICIAL_OFFICER = "JUDICIAL_OFFICER"
    SYSTEM_AUDITOR = "SYSTEM_AUDITOR"


class TokenData(BaseModel):
    badgeNumber: str
    fullName: str
    role: UserRole
    state: str
    district: str
    stationOrCourt: str


def hash_password(password: str) -> str:
    """Computes standard salted SHA-256 password hash."""
    salt = "LEGAL_DMS_SALT_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against stored hash."""
    return hash_password(plain_password) == hashed_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        badge: str = payload.get("sub")
        role: str = payload.get("role")
        name: str = payload.get("name")
        state: str = payload.get("state", "Tamil Nadu")
        district: str = payload.get("district", "Coimbatore")
        unit: str = payload.get("unit", "State Police Department")

        if badge is None or role is None:
            raise credentials_exception

        return TokenData(
            badgeNumber=badge,
            fullName=name or "Law Enforcement Officer",
            role=UserRole(role),
            state=state,
            district=district,
            stationOrCourt=unit
        )
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception


class RoleChecker:
    """FastAPI dependency enforcing RBAC permissions on endpoints."""
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Role '{current_user.role.value}' is unauthorized for this evidentiary operation."
            )
        return current_user