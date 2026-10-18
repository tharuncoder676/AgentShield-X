"""
AgentShield-X Task/Action Pair Generator
Generates (task_text, tool, arguments) pairs labeled consistent=1 or hijacked=0.
Each task template has >= 5 distinct phrasing paraphrases.
Section 5.3 requirements.
"""

from __future__ import annotations

import hashlib
import random
from typing import Any, Dict, List, Tuple
from ml.data.generators.trace_simulator import BENIGN_TASK_TEMPLATES, ALL_TOOLS

# Paraphrase bank: at least 5 distinct paraphrases for every template
TEMPLATE_PARAPHRASES: Dict[str, List[str]] = {
    "summarize_page": [
        "Fetch and summarize an external news or doc page",
        "Read the specified website article and provide an executive summary",
        "Load the webpage content and extract the key takeaways",
        "Browse the documentation URL and outline main points for the user",
        "Summarize the external knowledge article from the given link",
        "Retrieve the target web page and write a short briefing document",
    ],
    "customer_email_reply": [
        "Read an incoming support email and draft a reply to the customer",
        "Review customer ticket inquiry email, lookup details, and send answer",
        "Check support inbox message, search customer CRM record, and send email response",
        "Process inbound client message and write a professional email response",
        "Examine client complaint in email and reply with resolution details",
    ],
    "weekly_kpi_report": [
        "Query database metrics and write a weekly executive summary report",
        "Execute KPI queries on the reporting database and save weekly operations file",
        "Pull performance statistics via SQL and compile weekly summary document",
        "Generate the weekly executive dashboard by querying metrics and saving report",
        "Collect database KPI numbers and format them into the weekly status text file",
    ],
    "kb_search_and_faq": [
        "Read PDF guide and answer customer FAQ",
        "Search through corporate PDF policy guide to answer frequently asked questions",
        "Review user guide PDF manual and resolve FAQ inquiry",
        "Inspect product documentation PDF to formulate answers for customer",
        "Locate answers in the knowledge base PDF document and respond to client",
    ],
    "vendor_invoice_audit": [
        "Read PDF invoice, check customer table, and record verification status",
        "Audit incoming vendor billing PDF against database records and save verification",
        "Verify supplier invoice PDF details by querying customer accounts in SQL",
        "Inspect invoice document in PDF format, match against CRM, and log audit status",
        "Perform compliance reconciliation on vendor PDF invoice and update database",
    ],
    "incident_triage_log": [
        "Read alert email and write an incident triage report file",
        "Check urgent alert message from monitoring and create incident triage record",
        "Review system outage alert email and log forensic triage notes to disk",
        "Inspect triage email notification and write root-cause notes to incident file",
        "Parse alert notification email and generate local incident documentation",
    ],
    "lead_qualification": [
        "Search customers, query CRM database, and notify sales rep",
        "Qualify prospective sales lead by searching customer profile and emailing account rep",
        "Look up prospective lead in customer directory, check SQL database, and send notification",
        "Search customer contacts, check transaction history in SQL, and alert sales team",
        "Verify lead eligibility in customer database and forward details to sales manager",
    ],
    "product_catalog_sync": [
        "Read external product supplier webpage and update database",
        "Scrape supplier catalog web page and synchronize product items in SQL",
        "Fetch external vendor prices online and update inventory database records",
        "Read supplier catalog URL and execute database sync queries",
        "Refresh product listings by browsing supplier webpage and updating SQL tables",
    ],
    "meeting_action_items": [
        "Read email transcript and write meeting action items document",
        "Extract key action items from meeting transcript email and save notes file",
        "Review executive meeting minutes in email and write out assigned deliverables",
        "Parse discussion thread in email and compile meeting decisions file",
        "Read meeting summary email and generate action item checklist on disk",
    ],
    "compliance_checklist": [
        "Read policy PDF and write internal compliance checklist audit file",
        "Review regulatory compliance PDF document and create checklist file",
        "Audit regulatory guideline PDF and record compliance verification checklist",
        "Inspect corporate policy PDF manual and save security compliance review file",
        "Evaluate legal PDF requirements and output audited compliance checklist",
    ],
    "ticket_sentiment_analysis": [
        "Read customer support email, check profile, and log sentiment metric",
        "Analyze customer sentiment from feedback email, lookup profile, and save score",
        "Evaluate incoming support message tone, check customer account, and log metric",
        "Review customer inquiry email for satisfaction markers and record in SQL",
        "Read support ticket email, cross-reference customer history, and update sentiment database",
    ],
    "employee_onboarding_check": [
        "Read welcome document and send onboarding introduction email",
        "Review new hire guide PDF and email onboarding welcome instructions",
        "Inspect onboarding instructions PDF and send setup guidance email to employee",
        "Parse employee handbook PDF and send introductory email to new team member",
        "Read department orientation PDF and deliver welcome briefing email",
    ],
    # Held out templates
    "held_out_expense_reconciliation": [
        "Audit employee expense receipt PDF and query expense database",
        "Reconcile expense receipt PDF against corporate finance SQL records",
        "Check scanned receipt PDF and verify expense line items in database",
        "Audit submitted travel expense PDF against SQL reimbursement ledger",
        "Verify receipt amounts in PDF file and compare with expense database entries",
    ],
    "held_out_it_asset_inventory": [
        "Check IT hardware inventory list webpage and write asset log",
        "Inspect workstation asset inventory webpage and output hardware log file",
        "Browse internal IT hardware inventory URL and record asset audit document",
        "Review enterprise equipment list on web portal and save updated IT inventory",
        "Audit server inventory webpage and write out IT asset status report",
    ],
    "held_out_customer_churn_predictor": [
        "Search customer activity history and send churn risk alert email",
        "Look up customer account metrics and email account manager regarding churn risk",
        "Search customer engagement logs and send early warning churn alert email",
        "Review customer usage history and dispatch churn prevention notification",
        "Evaluate customer profile for attrition signals and email customer success lead",
    ],
}


def generate_task_action_pairs(
    benign_sessions: List[List[Dict[str, Any]]],
    attack_sessions: List[List[Dict[str, Any]]],
    seed: int = 42,
) -> List[Dict[str, Any]]:
    """
    Constructs labeled (task_text, tool, arguments) pairs.
    consistent=1 for benign task-aligned tool actions.
    hijacked=0 for hijacked/inappropriate tool actions.
    """
    rng = random.Random(seed + 300)
    pairs: List[Dict[str, Any]] = []

    # 1. Consistent pairs from benign sessions with paraphrased task text
    for session in benign_sessions:
        for event in session:
            tmpl = event.get("task_template", "")
            paraphrases = TEMPLATE_PARAPHRASES.get(tmpl, [event["task_text"]])
            task_phrasing = rng.choice(paraphrases)

            pair_id = hashlib.sha256(f"pair_pos_{event['session_id']}_{event['step']}".encode()).hexdigest()[:16]
            pairs.append({
                "pair_id": pair_id,
                "session_id": event["session_id"],
                "step": event["step"],
                "task_template": tmpl,
                "task_text": task_phrasing,
                "tool": event["tool"],
                "arguments": event["arguments"],
                "sensitivity": event["sensitivity"],
                "taint": event.get("taint", []),
                "consistent": 1,
                "label": 1,  # Intent consistent
                "is_hijacked": 0,
            })

    # 2. Hijacked pairs from attack sessions (specifically malicious steps)
    for session in attack_sessions:
        for event in session:
            if event["is_malicious_step"]:
                tmpl = event.get("task_template", "")
                paraphrases = TEMPLATE_PARAPHRASES.get(tmpl, [event["task_text"]])
                task_phrasing = rng.choice(paraphrases)

                pair_id = hashlib.sha256(f"pair_neg_{event['session_id']}_{event['step']}".encode()).hexdigest()[:16]
                pairs.append({
                    "pair_id": pair_id,
                    "session_id": event["session_id"],
                    "step": event["step"],
                    "task_template": tmpl,
                    "task_text": task_phrasing,
                    "tool": event["tool"],
                    "arguments": event["arguments"],
                    "sensitivity": event["sensitivity"],
                    "taint": event.get("taint", []),
                    "consistent": 0,
                    "label": 0,  # Intent hijacked
                    "is_hijacked": 1,
                })

    return pairs
