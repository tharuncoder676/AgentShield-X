"""
AgentShield-X MCP Transport Layer
Handles serialization, deserialization, and async stream framing for JSON-RPC 2.0 messages.
"""

from __future__ import annotations

import json
from typing import Optional

from shield_mcp.models import JSONRPCMessage


def parse_message(raw: str) -> Optional[JSONRPCMessage]:
    """Parses a raw JSON-RPC string into a typed JSONRPCMessage."""
    trimmed = raw.strip()
    if not trimmed:
        return None

    try:
        data = json.loads(trimmed)
        if isinstance(data, dict):
            return JSONRPCMessage(**data)
        return None
    except Exception:
        return None


def serialize_message(msg: JSONRPCMessage) -> str:
    """Serializes a JSONRPCMessage into a compact JSON string with a newline."""
    data = msg.model_dump(exclude_none=True) if hasattr(msg, "model_dump") else msg.dict(exclude_none=True)
    return json.dumps(data, ensure_ascii=False) + "\n"
