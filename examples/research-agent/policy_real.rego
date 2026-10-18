package agentshield.research_agent

# Default posture: deny-by-default with baseline risk
default allow = false
default action = "block"
default risk = 0.05

# -------------------------------------------------------------
# 1. Honeytool / Decoy Protection
# -------------------------------------------------------------
is_decoy_tool {
    input.tool.name == "export_all_customers"
}

is_decoy_tool {
    input.tool.honeytool == true
}

# -------------------------------------------------------------
# 2. Contract Extraction & Tool Whitelist
# -------------------------------------------------------------
matches_task(terms) {
    some term in terms
    contains(lower(input.task), lower(term))
}

allowed_by_task_contract {
    matches_task(["email", "send", "forward"])
    input.tool.name in ["read_webpage", "send_email"]
}

allowed_by_task_contract {
    matches_task(["notes", "meeting"])
    input.tool.name in ["read_notes"]
}

allowed_by_task_contract {
    matches_task(["summarize", "summary", "research", "read"])
    input.tool.name in ["read_webpage"]
}

# Fallback default contract for generic tasks
allowed_by_task_contract {
    not matches_task(["email", "send", "forward"])
    not matches_task(["notes", "meeting"])
    not matches_task(["summarize", "summary", "research", "read"])
    input.tool.name in ["read_webpage"]
}

# -------------------------------------------------------------
# 3. Recipient Authorization for External Sinks
# -------------------------------------------------------------
is_allowed_recipient {
    input.tool.name == "send_email"
    endswith(lower(input.arguments.to), "@company.example.test")
}

is_allowed_recipient {
    input.tool.name != "send_email"
}

# -------------------------------------------------------------
# 4. Taint Tracking and Exfiltration Prevention
# -------------------------------------------------------------
is_tainted_sink_leak {
    input.tainted == true
    input.tool.sink == "external"
    not is_allowed_recipient
}

# -------------------------------------------------------------
# 5. Policy Decision Rules & Reasons
# -------------------------------------------------------------
reasons[reason] {
    is_decoy_tool
    reason := "decoy tool touched: no legitimate task uses it"
}

reasons[reason] {
    not is_decoy_tool
    not allowed_by_task_contract
    reason := sprintf("'%v' is outside the task contract", [input.tool.name])
}

reasons[reason] {
    input.tool.name == "send_email"
    not is_allowed_recipient
    reason := sprintf("recipient '%v' is not allowed by the contract", [input.arguments.to])
}

reasons[reason] {
    is_tainted_sink_leak
    reason := "data influenced by untrusted content is heading to an external destination"
}

# Calculate final risk score
calculated_risk = 1.0 {
    is_decoy_tool
} else = 0.95 {
    is_tainted_sink_leak
} else = 0.60 {
    count(reasons) > 0
} else = 0.05

# Final authorization
allow {
    count(reasons) == 0
}

decision = {
    "allow": allow,
    "action": "allow" if allow else "block",
    "risk": calculated_risk,
    "reasons": reasons,
    "tool": input.tool.name,
    "task": input.task
}
