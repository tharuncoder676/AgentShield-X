"""
AgentShield-X User Authentication & Session Security
Implements PBKDF2-HMAC-SHA256 password hashing and JWT claims signing.
"""

from __future__ import annotations

import hashlib
import os
import secrets
import time
from typing import Any, Dict, Optional
import jwt

JWT_SECRET = os.getenv("SHIELD_JWT_SECRET", "agentshield_local_jwt_secret_phase2_uniquekey")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRY_SECONDS = 86400 * 7  # 7 days


def hash_password(password: str) -> str:
    """Generates salted PBKDF2-HMAC-SHA256 hash."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}${key.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """Verifies candidate password against stored salt and hash."""
    try:
        salt, key_hex = hashed.split("$", 1)
        cand_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
        return secrets.compare_digest(cand_key.hex(), key_hex)
    except Exception:
        return False


def create_token(user_id: str, email: str, role: str) -> str:
    """Issues signed JWT token with expiry."""
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_EXPIRY_SECONDS,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates JWT claims."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        return None
