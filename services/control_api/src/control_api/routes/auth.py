"""
AgentShield-X Auth Router
"""

from __future__ import annotations

import datetime
import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, status

from control_api.auth import create_token, decode_token, hash_password, verify_password
from control_api.db import Database
from control_api.models import AuthResponse, LoginRequest, OrgDTO, SignUpRequest, UserDTO

router = APIRouter(prefix="/v1/auth", tags=["auth"])
db = Database.get_instance()


def get_current_user(authorization: str = Header(None)) -> UserDTO:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Bearer token",
        )
    token = authorization.split(" ", 1)[1]
    claims = decode_token(token)
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token",
        )
    user = db.get_user_by_id(claims["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return UserDTO(
        id=user["id"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
    )


@router.post("/signup", response_model=AuthResponse)
def signup(req: SignUpRequest) -> AuthResponse:
    existing = db.get_user_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    pwd_hash = hash_password(req.password)
    db.create_user(user_id, req.email, pwd_hash, "owner", now)

    # Automatically create default organization
    org_id = f"org_{uuid.uuid4().hex[:12]}"
    org_display_name = req.get_org_name()
    slug = org_display_name.lower().replace(" ", "-") + f"-{secrets_hex(4)}"
    db.create_org(org_id, org_display_name, slug, "enterprise", user_id, now)

    token = create_token(user_id, req.email, "owner")
    return AuthResponse(
        token=token,
        user=UserDTO(id=user_id, email=req.email, role="owner", created_at=now),
        org=OrgDTO(
            id=org_id,
            name=org_display_name,
            slug=slug,
            plan="enterprise",
            user_role="owner",
            owner_id=user_id,
            created_at=now,
        ),
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest) -> AuthResponse:
    user = db.get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    orgs = db.get_orgs_for_user(user["id"])
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    primary_org = orgs[0] if orgs else {"id": "org_default", "name": "Default Org", "slug": "default", "plan": "enterprise", "user_role": "owner", "owner_id": user["id"], "created_at": now}

    token = create_token(user["id"], user["email"], user["role"])
    return AuthResponse(
        token=token,
        user=UserDTO(id=user["id"], email=user["email"], role=user["role"], created_at=user["created_at"]),
        org=OrgDTO(
            id=primary_org["id"],
            name=primary_org["name"],
            slug=primary_org["slug"],
            plan=primary_org["plan"],
            user_role=primary_org.get("user_role", "owner"),
            owner_id=primary_org.get("owner_id") or user["id"],
            created_at=primary_org.get("created_at") or user["created_at"],
        ),
    )


@router.get("/me", response_model=UserDTO)
def me(current_user: UserDTO = Depends(get_current_user)) -> UserDTO:
    return current_user


def secrets_hex(n: int) -> str:
    import secrets
    return secrets.token_hex(n)
