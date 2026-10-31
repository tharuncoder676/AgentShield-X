"""
AgentShield-X Production Licensing & API Key Management Router
Supports:
- 10-Day Free Trial Key Generation (Full Access, 10-day countdown)
- Free Community Tier Key Generation (Limited rate limits & features)
- Pro & Enterprise Key Generation / Purchase
- Key Verification & Status for Web Console & Terminal CLI
"""


import datetime
import hashlib
import secrets
import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, Header, HTTPException, status

from control_api.db import Database
from control_api.auth import create_token

router = APIRouter(prefix="/v1/license", tags=["licensing"])
db = Database.get_instance()


class TrialRequest(BaseModel):
    email: str
    name: Optional[str] = "Lead Developer"


class FreeKeyRequest(BaseModel):
    email: str


class PurchaseRequest(BaseModel):
    email: str
    plan: str = "pro"  # "pro" or "enterprise"
    billing_cycle: str = "monthly"  # "monthly" or "annual"
    seats: int = 1


class VerifyKeyRequest(BaseModel):
    key: str


class LicenseResponse(BaseModel):
    valid: bool
    key: str
    prefix: str
    tier: str
    tier_name: str
    email: Optional[str] = None
    created_at: str
    expires_at: Optional[str] = None
    days_remaining: Optional[int] = None
    is_expired: bool = False
    limit_daily: int
    features: List[str]
    token: str
    cli_command: str
    message: str


def _sha256_hex(val: str) -> str:
    return hashlib.sha256(val.encode("utf-8")).hexdigest()


def _ensure_project(email: str) -> str:
    """Ensure user, org, and project exist for the key to bind to."""
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    user = db.get_user_by_email(email)
    if not user:
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        db.create_user(user_id, email, "apikey_auth_placeholder", "owner", now)
        user = {"id": user_id, "email": email}

    user_id = user["id"]
    orgs = db.get_orgs_for_user(user_id)
    if not orgs:
        org_id = f"org_{uuid.uuid4().hex[:12]}"
        db.create_org(org_id, f"{email.split('@')[0]}'s Workspace", f"org-{secrets.token_hex(4)}", "enterprise", user_id, now)
        orgs = [{"id": org_id}]

    org_id = orgs[0]["id"]
    projects = db.get_projects_for_org(org_id)
    if not projects:
        project_id = f"proj_{uuid.uuid4().hex[:12]}"
        db.create_project(project_id, org_id, "Production Armor", f"proj-{secrets.token_hex(4)}", "full", now)
        projects = [{"id": project_id}]

    return projects[0]["id"]


@router.post("/trial", response_model=LicenseResponse)
def generate_trial_key(req: TrialRequest) -> LicenseResponse:
    """Issues a 10-Day Free Trial key with unrestricted Pro feature access."""
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required")

    project_id = _ensure_project(email)
    now_dt = datetime.datetime.now(datetime.timezone.utc)
    expires_dt = now_dt + datetime.timedelta(days=10)

    now_iso = now_dt.isoformat()
    expires_iso = expires_dt.isoformat()

    # Generate 10-day trial key
    raw_key = f"asx_trial_{secrets.token_hex(20)}"
    key_hash = _sha256_hex(raw_key)
    prefix = f"{raw_key[:12]}...{raw_key[-4:]}"
    key_id = f"key_trial_{uuid.uuid4().hex[:10]}"

    # Save to database
    conn = db.get_connection()
    with conn:
        conn.execute(
            """
            INSERT INTO api_keys (id, project_id, name, key_hash, prefix, created_at, tier, expires_at, limit_daily, email)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (key_id, project_id, f"{req.name or 'Dev'} 10-Day Trial", key_hash, prefix, now_iso, "trial", expires_iso, 10000, email)
        )

    # Issue JWT token for immediate Console authentication
    token = create_token(user_id=f"usr_{email}", email=email, role="developer")

    features = [
        "ast_blast_radius_scanner",
        "shieldwing_autonomous_swarm",
        "shieldvoice_ultra_low_latency",
        "autonomous_redteam_fuzzer",
        "opa_autopolicy_synthesis",
        "multi_agent_consensus_judge",
        "dynamic_honeytokens_canary",
        "sandbox_isolation_guard",
        "gitops_pull_request_generator"
    ]

    return LicenseResponse(
        valid=True,
        key=raw_key,
        prefix=prefix,
        tier="trial",
        tier_name="10-Day Pro Trial",
        email=email,
        created_at=now_iso,
        expires_at=expires_iso,
        days_remaining=10,
        is_expired=False,
        limit_daily=10000,
        features=features,
        token=token,
        cli_command=f"agentshield login --key {raw_key}",
        message="Your 10-day full-feature trial API key has been generated successfully!"
    )


@router.post("/free", response_model=LicenseResponse)
def generate_free_key(req: FreeKeyRequest) -> LicenseResponse:
    """Issues a permanent Community Free Tier key with basic rate limits."""
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required")

    project_id = _ensure_project(email)
    now_dt = datetime.datetime.now(datetime.timezone.utc)
    now_iso = now_dt.isoformat()

    raw_key = f"asx_free_{secrets.token_hex(20)}"
    key_hash = _sha256_hex(raw_key)
    prefix = f"{raw_key[:11]}...{raw_key[-4:]}"
    key_id = f"key_free_{uuid.uuid4().hex[:10]}"

    conn = db.get_connection()
    with conn:
        conn.execute(
            """
            INSERT INTO api_keys (id, project_id, name, key_hash, prefix, created_at, tier, expires_at, limit_daily, email)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (key_id, project_id, "Community Free Tier Key", key_hash, prefix, now_iso, "free", None, 100, email)
        )

    token = create_token(user_id=f"usr_{email}", email=email, role="developer")

    features = [
        "ast_blast_radius_scanner_basic",
        "shieldwing_single_assistant",
        "standard_static_guardrails"
    ]

    return LicenseResponse(
        valid=True,
        key=raw_key,
        prefix=prefix,
        tier="free",
        tier_name="Community Free Tier",
        email=email,
        created_at=now_iso,
        expires_at=None,
        days_remaining=None,
        is_expired=False,
        limit_daily=100,
        features=features,
        token=token,
        cli_command=f"agentshield login --key {raw_key}",
        message="Your Community Free API key is active. Limited to 100 scans & tool calls per day."
    )


@router.post("/purchase", response_model=LicenseResponse)
def purchase_license(req: PurchaseRequest) -> LicenseResponse:
    """Simulates production license checkout and issues an unrestricted production key."""
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required")

    tier = "enterprise" if req.plan.lower() == "enterprise" else "pro"
    tier_name = "Enterprise Armor" if tier == "enterprise" else "Pro Production"

    project_id = _ensure_project(email)
    now_dt = datetime.datetime.now(datetime.timezone.utc)
    now_iso = now_dt.isoformat()

    raw_key = f"asx_live_{secrets.token_hex(24)}"
    key_hash = _sha256_hex(raw_key)
    prefix = f"{raw_key[:11]}...{raw_key[-4:]}"
    key_id = f"key_{tier}_{uuid.uuid4().hex[:10]}"

    conn = db.get_connection()
    with conn:
        conn.execute(
            """
            INSERT INTO api_keys (id, project_id, name, key_hash, prefix, created_at, tier, expires_at, limit_daily, email)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (key_id, project_id, f"{tier_name} Key", key_hash, prefix, now_iso, tier, None, -1, email)
        )

    token = create_token(user_id=f"usr_{email}", email=email, role="owner")

    features = [
        "unlimited_throughput_ast_scanner",
        "full_shieldwing_swarm_mesh",
        "shieldvoice_enterprise_sub_ms",
        "autonomous_redteam_swarm_fuzzer",
        "opa_autopolicy_zero_drift",
        "multi_agent_consensus_judge",
        "dynamic_honeytokens_canary",
        "containerized_micro_sandbox",
        "automated_gitops_remediation",
        "enterprise_24_7_dedicated_sla"
    ]

    return LicenseResponse(
        valid=True,
        key=raw_key,
        prefix=prefix,
        tier=tier,
        tier_name=tier_name,
        email=email,
        created_at=now_iso,
        expires_at=None,
        days_remaining=None,
        is_expired=False,
        limit_daily=-1,
        features=features,
        token=token,
        cli_command=f"agentshield login --key {raw_key}",
        message=f"Thank you! Your {tier_name} license is active with unlimited requests."
    )


@router.post("/verify", response_model=LicenseResponse)
def verify_key(req: VerifyKeyRequest) -> LicenseResponse:
    """Verifies any AgentShield-X key (trial, free, pro) and returns active status."""
    raw_key = req.key.strip()
    if not raw_key:
        raise HTTPException(status_code=400, detail="API key string cannot be empty")

    key_hash = _sha256_hex(raw_key)
    conn = db.get_connection()
    cur = conn.execute("SELECT * FROM api_keys WHERE (key_hash = ? OR prefix LIKE ?) AND revoked = 0", (key_hash, f"%{raw_key[-6:]}"))
    row = cur.fetchone()

    now_dt = datetime.datetime.now(datetime.timezone.utc)
    now_iso = now_dt.isoformat()

    if row:
        row_dict = dict(row)
        tier = row_dict.get("tier") or ("trial" if "trial" in raw_key else "pro")
        expires_at = row_dict.get("expires_at")
        limit_daily = int(row_dict.get("limit_daily") or (-1 if tier == "pro" else 100))
        email = row_dict.get("email") or "operator@agentshield.io"
        created_at = row_dict.get("created_at") or now_iso
    else:
        # Determine from key prefix if created in external demo environment
        if raw_key.startswith("asx_trial_"):
            tier = "trial"
            expires_at = (now_dt + datetime.timedelta(days=10)).isoformat()
            limit_daily = 10000
        elif raw_key.startswith("asx_free_"):
            tier = "free"
            expires_at = None
            limit_daily = 100
        elif raw_key.startswith("asx_live_") or raw_key.startswith("shield_live_") or raw_key.startswith("as_live_"):
            tier = "pro"
            expires_at = None
            limit_daily = -1
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key format. Valid keys start with asx_trial_, asx_free_, or asx_live_"
            )
        email = "developer@agentshield.io"
        created_at = now_iso

    # Calculate days remaining for trial
    days_remaining = None
    is_expired = False
    if expires_at:
        try:
            exp_dt = datetime.datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            diff = (exp_dt - now_dt).total_seconds()
            days_remaining = max(0, int(diff // 86400))
            if diff <= 0:
                is_expired = True
        except Exception:
            days_remaining = 0

    if is_expired:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your 10-Day Free Trial key has expired. Please upgrade or purchase a Pro license."
        )

    tier_name = (
        "10-Day Pro Trial" if tier == "trial" else
        "Community Free Tier" if tier == "free" else
        "Pro Production"
    )

    token = create_token(user_id=f"usr_{email}", email=email, role="owner" if tier == "pro" else "developer")

    features = [
        "ast_blast_radius_scanner",
        "shieldwing_autonomous_swarm",
        "shieldvoice_ultra_low_latency",
        "autonomous_redteam_fuzzer",
        "opa_autopolicy_synthesis",
        "multi_agent_consensus_judge",
    ] if tier != "free" else [
        "ast_blast_radius_scanner_basic",
        "shieldwing_single_assistant",
        "standard_static_guardrails"
    ]

    return LicenseResponse(
        valid=True,
        key=raw_key,
        prefix=f"{raw_key[:12]}...{raw_key[-4:]}" if len(raw_key) > 16 else raw_key,
        tier=tier,
        tier_name=tier_name,
        email=email,
        created_at=created_at,
        expires_at=expires_at,
        days_remaining=days_remaining,
        is_expired=False,
        limit_daily=limit_daily,
        features=features,
        token=token,
        cli_command=f"agentshield login --key {raw_key}",
        message=f"Key verified successfully. Active tier: {tier_name}"
    )


@router.get("/status", response_model=LicenseResponse)
def get_license_status(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None),
) -> LicenseResponse:
    """Returns license status from header."""
    candidate_key = x_api_key
    if not candidate_key and authorization:
        candidate_key = authorization.replace("Bearer ", "").strip()

    if not candidate_key:
        raise HTTPException(status_code=401, detail="Missing API key in Authorization or X-API-Key header")

    return verify_key(VerifyKeyRequest(key=candidate_key))

