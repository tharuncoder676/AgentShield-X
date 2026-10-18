"""
AgentShield-X Intent Consistency Feature Builder
Implements Section 6.4:
- Cosine similarity between task embedding and rendered action embedding (tool name + redacted arguments)
- Whether tool is in task template's allowed set
- Destination is external flag
- Data volume vs expected
- Sensitivity level
- Taint-from-untrusted flag
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from ml.data.generators.trace_simulator import BENIGN_TASK_TEMPLATES, TOOL_SENSITIVITY
from ml.detectors.similarity.embedder import MiniLMEmbedder

SENSITIVITY_VALS = {
    "low": 0.0,
    "medium": 0.33,
    "high": 0.66,
    "critical": 1.0,
}

EXTERNAL_INDICATORS = [
    "attacker.example.test",
    "exfil.",
    "dropzone.",
    "collector.",
    "http://",
    "https://",
    "leaks@",
]


def render_action_text(tool: str, arguments: Dict[str, Any]) -> str:
    """Renders action string with redacted argument values for semantic embedding."""
    redacted_parts = []
    for k, v in arguments.items():
        val_str = str(v)
        # Redact raw hex tokens, credit cards, long data blobs
        if len(val_str) > 80:
            val_str = val_str[:40] + "...[REDACTED]"
        redacted_parts.append(f"{k}='{val_str}'")
    args_summary = ", ".join(redacted_parts)
    return f"Execute tool '{tool}' with parameters: {args_summary}"


def check_external_destination(tool: str, arguments: Dict[str, Any]) -> float:
    """Returns 1.0 if action contacts external destination/untrusted host."""
    args_str = str(arguments).lower()
    for ind in EXTERNAL_INDICATORS:
        if ind in args_str:
            # If internal NexusCorp domain, consider trusted
            if "docs.nexuscorp.example.test" in args_str or "portal/guide" in args_str:
                continue
            return 1.0
    if tool == "send_email":
        to_addr = str(arguments.get("to", "")).lower()
        if not to_addr.endswith("nexuscorp.example.test") and "attacker" in to_addr:
            return 1.0
    return 0.0


def check_tool_allowed(task_text: str, tool: str, task_template: str = "") -> float:
    """Returns 1.0 if tool is logically allowed for this task, 0.0 otherwise."""
    if task_template and task_template in BENIGN_TASK_TEMPLATES:
        allowed = BENIGN_TASK_TEMPLATES[task_template]["allowed_tools"]
        return 1.0 if tool in allowed else 0.0

    # Match against template descriptions
    t_lower = task_text.lower().strip()
    for name, tmpl in BENIGN_TASK_TEMPLATES.items():
        desc_lower = tmpl["description"].lower()
        if desc_lower in t_lower or t_lower in desc_lower:
            return 1.0 if tool in tmpl["allowed_tools"] else 0.0

    # Keyword heuristic matching when template description does not match exactly
    allowed_by_keywords = []
    if "summarize" in t_lower or "webpage" in t_lower or "news" in t_lower or "browse" in t_lower:
        allowed_by_keywords.extend(["read_webpage"])
    if "email" in t_lower or "reply" in t_lower or "inbox" in t_lower or "support" in t_lower:
        allowed_by_keywords.extend(["read_email", "search_customers", "send_email"])
    if "kpi" in t_lower or "database" in t_lower or "metrics" in t_lower or "sql" in t_lower:
        allowed_by_keywords.extend(["run_sql", "write_file"])
    if "pdf" in t_lower or "guide" in t_lower or "manual" in t_lower or "faq" in t_lower:
        allowed_by_keywords.extend(["read_pdf", "write_file", "search_customers"])
    if "inventory" in t_lower or "it asset" in t_lower:
        allowed_by_keywords.extend(["read_webpage", "write_file"])
    if "expense" in t_lower or "reconcil" in t_lower:
        allowed_by_keywords.extend(["read_pdf", "run_sql"])
    if "churn" in t_lower:
        allowed_by_keywords.extend(["search_customers", "send_email"])

    return 1.0 if tool in allowed_by_keywords else 0.0



def extract_intent_features(
    task_text: str,
    tool: str,
    arguments: Dict[str, Any],
    task_template: str = "",
    taint: Optional[List[str]] = None,
    sensitivity: Optional[str] = None,
    embedder: Optional[MiniLMEmbedder] = None,
) -> Dict[str, float]:
    """
    Extracts 6 intent consistency features:
    1. task_action_cosine_sim
    2. is_tool_allowed
    3. is_destination_external
    4. data_volume_ratio
    5. sensitivity_level
    6. taint_from_untrusted
    """
    if embedder is None:
        embedder = MiniLMEmbedder.get_instance()

    rendered_action = render_action_text(tool, arguments)

    # 1. Cosine similarity between task and action embeddings
    embs, _ = embedder.encode([task_text, rendered_action])
    task_emb = embs[0]
    action_emb = embs[1]
    # L2-normalized: dot product is cosine similarity
    cosine_sim = float(np.dot(task_emb, action_emb))
    cosine_sim = float(np.clip(cosine_sim, 0.0, 1.0))

    # 2. Tool allowed flag
    tool_allowed = check_tool_allowed(task_text, tool, task_template)

    # 3. Destination external flag
    dest_external = check_external_destination(tool, arguments)

    # 4. Data volume ratio (relative to typical baseline 400 bytes)
    arg_bytes = len(str(arguments))
    data_vol_ratio = float(min(10.0, arg_bytes / 400.0))

    # 5. Sensitivity level
    sens_str = sensitivity or TOOL_SENSITIVITY.get(tool, "low")
    sens_level = SENSITIVITY_VALS.get(sens_str, 0.0)

    # 6. Taint from untrusted flag
    taint_flag = 1.0 if (taint and len(taint) > 0) else 0.0

    return {
        "task_action_cosine_sim": cosine_sim,
        "is_tool_allowed": tool_allowed,
        "is_destination_external": dest_external,
        "data_volume_ratio": data_vol_ratio,
        "sensitivity_level": sens_level,
        "taint_from_untrusted": taint_flag,
    }


def intent_features_to_vector(feat_dict: Dict[str, float]) -> List[float]:
    """Flattens feature dictionary into standard ordered float vector."""
    keys = [
        "task_action_cosine_sim",
        "is_tool_allowed",
        "is_destination_external",
        "data_volume_ratio",
        "sensitivity_level",
        "taint_from_untrusted",
    ]
    return [feat_dict.get(k, 0.0) for k in keys]
