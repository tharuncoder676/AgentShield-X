"""
AgentShield-X Cryptographic and Hashing Utilities
Provides SHA-256 hash chaining for tamper-evident audit logs,
canary token generation, and secret hashing.
"""

import hashlib
import json
import secrets
from typing import Any, Dict, List


def sha256_hex(data: str) -> str:
    """Compute standard SHA-256 hex digest of string data."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def compute_audit_hash(
    sequence: int,
    tenant_id: str,
    event_id: str,
    decision_id: str,
    action: str,
    timestamp: str,
    prev_hash: str,
) -> str:
    """
    Computes deterministic SHA-256 hash of an audit entry linked to prev_hash.
    Ensures any modification to a past row breaks all subsequent hashes.
    """
    payload = {
        "sequence": sequence,
        "tenant_id": tenant_id,
        "event_id": event_id,
        "decision_id": decision_id,
        "action": action,
        "timestamp": timestamp,
        "prev_hash": prev_hash,
    }
    canonical = json.dumps(payload, sort_keys=True)
    return sha256_hex(canonical)


def verify_audit_chain(records: List[Dict[str, Any]]) -> bool:
    """
    Validates the cryptographic integrity of a sequence of audit records.
    Returns True if unbroken, False if tampered with.
    """
    if not records:
        return True

    for i in range(len(records)):
        curr = records[i]
        expected_prev = "GENESIS_BLOCK_00000000000000000000000000000000" if i == 0 else records[i - 1]["hash"]
        if curr["prev_hash"] != expected_prev:
            return False

        calculated_hash = compute_audit_hash(
            sequence=curr["sequence"],
            tenant_id=curr["tenant_id"],
            event_id=curr["event_id"],
            decision_id=curr["decision_id"],
            action=curr["action"],
            timestamp=curr["timestamp"],
            prev_hash=curr["prev_hash"],
        )
        if curr["hash"] != calculated_hash:
            return False

    return True


def generate_canary_token(prefix: str = "SHIELD_CANARY") -> str:
    """Generates an unguessable per-session canary token."""
    entropy = secrets.token_hex(16)
    return f"{prefix}_{entropy}"
