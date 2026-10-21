"""
AgentShield-X MCP Cryptographic Hasher & Tool Differ
Produces deterministic canonical hashes for MCP tool definitions and schemas,
and generates structural diffs when rug-pull attempts or mutations occur.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List, Optional, Tuple, Union

from shield_mcp.models import MCPToolDefinition, ToolPin, ToolPinStatus


def canonical_json(data: Any) -> str:
    """
    Serializes data to deterministic, canonical JSON with sorted keys,
    compact separators, and ASCII encoding.
    """
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def sha256_hex(text: Union[str, bytes]) -> str:
    """Returns hexadecimal SHA-256 digest of input."""
    if isinstance(text, str):
        text = text.encode("utf-8")
    return hashlib.sha256(text).hexdigest()


def compute_tool_pin(
    tool: Union[Dict[str, Any], MCPToolDefinition],
    notes: Optional[str] = None,
) -> ToolPin:
    """
    Computes a cryptographic ToolPin from an MCP tool definition.
    Calculates composite canonical hash, description hash, and schema hash.
    """
    if isinstance(tool, MCPToolDefinition):
        tool_dict = tool.model_dump() if hasattr(tool, "model_dump") else tool.dict()
    else:
        tool_dict = dict(tool)

    name = tool_dict.get("name", "")
    description = (tool_dict.get("description") or "").strip()
    schema = tool_dict.get("inputSchema") or tool_dict.get("input_schema") or {}

    # Canonical normalized structure
    normalized = {
        "name": name,
        "description": description,
        "inputSchema": schema,
    }

    canonical_str = canonical_json(normalized)
    canonical_hash = sha256_hex(canonical_str)
    desc_hash = sha256_hex(description)
    schema_hash = sha256_hex(canonical_json(schema))

    return ToolPin(
        tool_name=name,
        canonical_hash=canonical_hash,
        description_hash=desc_hash,
        schema_hash=schema_hash,
        description=description,
        input_schema=schema,
        status=ToolPinStatus.PINNED,
        notes=notes,
    )


def diff_tool_definitions(
    pinned: ToolPin,
    observed: Union[Dict[str, Any], MCPToolDefinition],
) -> Tuple[bool, str]:
    """
    Compares a pinned tool definition with an observed definition.
    Returns (is_mutated: bool, diff_summary: str).
    """
    obs_pin = compute_tool_pin(observed)

    if pinned.canonical_hash == obs_pin.canonical_hash:
        return False, "Definitions are identical (hash match)."

    diff_lines: List[str] = []

    # 1. Description diff
    if pinned.description_hash != obs_pin.description_hash:
        diff_lines.append(
            f"Description mutated (pinned hash: {pinned.description_hash[:8]}..., "
            f"observed hash: {obs_pin.description_hash[:8]}...)"
        )
        # Check for length or instruction additions
        if len(obs_pin.description) > len(pinned.description):
            added_chars = len(obs_pin.description) - len(pinned.description)
            diff_lines.append(f"  -> Added {added_chars} characters to tool description.")

    # 2. Schema diff
    if pinned.schema_hash != obs_pin.schema_hash:
        diff_lines.append(
            f"InputSchema mutated (pinned hash: {pinned.schema_hash[:8]}..., "
            f"observed hash: {obs_pin.schema_hash[:8]}...)"
        )

        pinned_props = set((pinned.input_schema.get("properties") or {}).keys())
        obs_props = set((obs_pin.input_schema.get("properties") or {}).keys())

        added_props = obs_props - pinned_props
        removed_props = pinned_props - obs_props

        if added_props:
            diff_lines.append(f"  -> New properties added: {', '.join(sorted(added_props))}")
        if removed_props:
            diff_lines.append(f"  -> Properties removed: {', '.join(sorted(removed_props))}")

    summary = "; ".join(diff_lines) if diff_lines else "Canonical definition hash mismatch."
    return True, summary
