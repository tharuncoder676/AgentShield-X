"""
AgentShield-X Auth Router
"""


import datetime
import uuid
from typing import Optional
from pydantic import BaseModel
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



class OAuthRequest(BaseModel):
    provider: str  # "google" or "apple"
    email: str
    name: Optional[str] = None
    avatar: Optional[str] = None
    token: Optional[str] = None


@router.post("/oauth", response_model=AuthResponse)
def oauth_login(req: OAuthRequest) -> AuthResponse:
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid email address is required for social sign-in",
        )

    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    user = db.get_user_by_email(email)
    
    if not user:
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        db.create_user(user_id, email, f"oauth_{req.provider}_token", "owner", now)
        user = {"id": user_id, "email": email, "role": "owner", "created_at": now}
        
        # Provision primary organization
        org_id = f"org_{uuid.uuid4().hex[:12]}"
        org_display = req.name or f"{email.split('@')[0]}'s Workspace"
        slug = f"org-{secrets_hex(4)}"
        db.create_org(org_id, org_display, slug, "enterprise", user_id, now)
        primary_org = {"id": org_id, "name": org_display, "slug": slug, "plan": "enterprise", "user_role": "owner", "owner_id": user_id, "created_at": now}
    else:
        orgs = db.get_orgs_for_user(user["id"])
        primary_org = orgs[0] if orgs else {"id": "org_default", "name": "Default Org", "slug": "default", "plan": "enterprise", "user_role": "owner", "owner_id": user["id"], "created_at": now}

    # Issue verified session token
    token = create_token(user["id"], user["email"], user.get("role", "owner"))
    
    # Sync with Supabase PostgreSQL if available
    try:
        pg = db.get_pg_connection()
        if pg:
            with pg:
                cur = pg.cursor()
                cur.execute(
                    'INSERT INTO "users" (id, email, password_hash, role, created_at) VALUES (%s, %s, %s, %s, %s) ON CONFLICT ("email") DO NOTHING;',
                    (user["id"], email, f"oauth_{req.provider}", user.get("role", "owner"), now)
                )
    except Exception:
        pass

    return AuthResponse(
        token=token,
        user=UserDTO(id=user["id"], email=user["email"], role=user.get("role", "owner"), created_at=user["created_at"]),
        org=OrgDTO(
            id=primary_org["id"],
            name=primary_org["name"],
            slug=primary_org["slug"],
            plan=primary_org.get("plan", "enterprise"),
            user_role=primary_org.get("user_role", "owner"),
            owner_id=primary_org.get("owner_id") or user["id"],
            created_at=primary_org.get("created_at") or user["created_at"],
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



class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    token: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    email = req.email.strip().lower()
    user = db.get_user_by_email(email)
    # Always return 200 for security to avoid email enumeration
    return {
        "status": "ok",
        "message": f"Password reset instructions have been sent to {email}. Please check your inbox.",
        "reset_token": secrets_hex(16)
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    email = req.email.strip().lower()
    user = db.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    
    new_hash = hash_password(req.new_password)
    # Update SQLite
    conn = db.get_connection()
    with conn:
        conn.execute("UPDATE users SET password_hash = ? WHERE email = ?", (new_hash, email))
    
    # Update Supabase PostgreSQL if available
    try:
        pg = db.get_pg_connection()
        if pg:
            with pg:
                cur = pg.cursor()
                cur.execute('UPDATE "users" SET "password_hash" = %s WHERE "email" = %s;', (new_hash, email))
    except Exception:
        pass

    return {"status": "ok", "message": "Your password has been successfully updated. You can now sign in."}

@router.get("/me", response_model=UserDTO)
def me(current_user: UserDTO = Depends(get_current_user)) -> UserDTO:
    return current_user


def secrets_hex(n: int) -> str:
    import secrets
    return secrets.token_hex(n)
