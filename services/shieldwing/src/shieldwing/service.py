"""
Shieldwing Orchestrator Service
Coordinates page-aware security assistance, tool traces, proposal generation,
and self-protection dogfooding for AgentShield-X with NVIDIA NIM support.
"""

from __future__ import annotations

import json
import os
import time
import uuid
from typing import Any, AsyncIterator, Dict, List, Optional

from shieldwing.dogfood import ShieldwingDogfoodGuard
from shieldwing.provider import (
    BaseLLMProvider,
    DeterministicSecurityProvider,
    NvidiaLLMProvider,
    get_llm_provider,
)


class ShieldwingService:
    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.guard = ShieldwingDogfoodGuard()
        self.provider = provider or get_llm_provider()
        self.rate_limits: Dict[str, List[float]] = {}
        self.max_queries_per_minute = 60

    def check_rate_limit(self, tenant_id: str) -> bool:
        now = time.time()
        window_start = now - 60.0
        queries = self.rate_limits.setdefault(tenant_id, [])
        # Prune old queries
        self.rate_limits[tenant_id] = [q for q in queries if q > window_start]
        if len(self.rate_limits[tenant_id]) >= self.max_queries_per_minute:
            return False
        self.rate_limits[tenant_id].append(now)
        return True

    def configure_provider(
        self,
        provider_name: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Dynamically reconfigures the underlying LLM provider at runtime."""
        self.provider = get_llm_provider(
            provider_name=provider_name or "nvidia",
            api_key=api_key,
            model=model,
        )
        return self.get_config()

    def get_config(self) -> Dict[str, Any]:
        """Returns the active provider configuration status."""
        is_nvidia = isinstance(self.provider, NvidiaLLMProvider)
        raw_key = self.provider.api_key if is_nvidia else os.getenv("NVIDIA_API_KEY", "")
        has_key = bool(raw_key)
        current_model = (
            self.provider.model
            if is_nvidia
            else os.getenv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct")
        )
        return {
            "provider": "nvidia" if is_nvidia else "deterministic",
            "active_provider_name": "NVIDIA NIM (Cloud Inference)" if is_nvidia else "Intelligent Security Engine (Telemetry-Aware)",
            "model": current_model,
            "has_api_key": has_key,
            "base_url": "https://integrate.api.nvidia.com/v1",
            "available_models": [
                "meta/llama-3.3-70b-instruct",
                "deepseek-ai/deepseek-v4.1-flash",
                "nvidia/nemotron-3.5-super-vl-120b-a12b",
                "google/gemma-3-12b-it",
                "mistralai/mixtral-8x7b-instruct-v0.1",
            ],
        }


    def _build_account_and_threat_context(
        self, tenant_id: str, context: Optional[Dict[str, Any]] = None
    ) -> str:
        ctx = context or {}
        user_email = ctx.get("user_email") or "admin@agentshield.dev"
        user_role = ctx.get("user_role") or "owner"

        lines = [
            f"User Account: {user_email} (Role: {user_role})",
            f"Tenant/Org ID: {tenant_id}",
        ]

        # Live Database Context
        try:
            from control_api.db import Database
            db = Database.get_instance()
            conn = db.get_connection()
            cur = conn.cursor()

            # Organization
            cur.execute("SELECT name, plan FROM organizations LIMIT 1")
            row = cur.fetchone()
            if row:
                lines.append(f"Organization: {row['name']} (Plan: {row['plan']})")

            # Counts
            cur.execute("SELECT count(*) FROM events")
            events_count = cur.fetchone()[0]
            cur.execute("SELECT count(*) FROM events WHERE action = 'block'")
            blocked_count = cur.fetchone()[0]
            cur.execute("SELECT count(*) FROM incidents")
            incidents_count = cur.fetchone()[0]
            lines.append(f"Operational Metrics: {events_count} total events, {blocked_count} blocked threats, {incidents_count} incidents recorded.")

            # Agents
            cur.execute("SELECT name, security_score FROM agents LIMIT 3")
            agent_rows = cur.fetchall()
            if agent_rows:
                agents_summary = ", ".join(f"{r['name']} ({r['security_score']:.0f}%)" for r in agent_rows)
                lines.append(f"Protected Agents: {agents_summary}")

            # Recent Incidents
            cur.execute("SELECT id, title, severity, status FROM incidents ORDER BY created_at DESC LIMIT 3")
            inc_rows = cur.fetchall()
            if inc_rows:
                lines.append("Recent Account Incidents:")
                for inc in inc_rows:
                    lines.append(f"  - [{inc['severity'].upper()}] {inc['id']}: {inc['title']} (Status: {inc['status']})")
        except Exception as e:
            logger.debug(f"Error enriching context from DB: {e}")

        # Scanned Repository Context
        try:
            from pathlib import Path
            from shield_core.scanner import RepoScanner
            repo_root = Path(__file__).resolve().parents[4]
            sample_repo = repo_root / "examples" / "research-agent"
            if sample_repo.exists():
                scan = RepoScanner(sample_repo).scan(mode="enforce")
                tools_list = ", ".join(t.get("name", "") for t in scan.get("tools", []))
                lines.append(f"Scanned Repository: examples/research-agent (Tools: {tools_list})")
                findings = scan.get("findings", [])
                if findings:
                    lines.append(f"Scanner Findings: {len(findings)} detected (e.g. {findings[0].get('id')}: {findings[0].get('title')}, Status: {findings[0].get('status')})")
        except Exception as e:
            logger.debug(f"Error enriching scan context: {e}")

        if "view" in ctx:
            lines.append(f"Current Console View: {ctx['view']}")
        if "incident_id" in ctx:
            lines.append(f"Active Incident Focus: {ctx['incident_id']}")
        if "decision_id" in ctx:
            lines.append(f"Active Decision Focus: {ctx['decision_id']}")

        return "\n".join(lines)

    async def chat(
        self,
        tenant_id: str,
        message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes a security query with full dogfood interception and proposal extraction.
        """
        if not self.check_rate_limit(tenant_id):
            return {
                "message": "Shieldwing query rate limit exceeded (max 60 queries/minute). Please wait before asking again.",
                "evidence_citations": [],
                "proposals": [],
                "dogfood_verdict": "RATE_LIMITED",
            }

        # 1. Dogfood Guard Inspection: Check for adversarial prompt injection in inbound query/context
        is_clean, violation_reason, seg = self.guard.inspect_untrusted_input(
            tenant_id=tenant_id,
            text=message,
            source="user_chat_query",
        )
        if not is_clean:
            return {
                "message": (
                    f"⚠️ **Adversarial Prompt Intercepted by AgentShield-X**\n\n"
                    f"The security guard blocked this request: `{violation_reason}`.\n"
                    f"Shieldwing is protected by AgentShield-X and rejects instructions designed to disable controls or exfiltrate credentials."
                ),
                "evidence_citations": [f"Violation: {violation_reason}"],
                "proposals": [],
                "dogfood_verdict": "BLOCKED",
            }

        # 2. Build trusted operational context
        context_desc = self._build_account_and_threat_context(tenant_id, context)
        evidence_citations = [f"AgentShield-X Telemetry ({context.get('user_email', 'User') if context else 'User'})"]

        # 3. Wrap in L0 Trust Envelope
        prompt_envelope = self.guard.wrap_in_trust_envelope(
            system_instruction=(
                "You are Shieldwing, an AI security copilot built into AgentShield-X.\n"
                "You possess general cybersecurity intelligence and deep knowledge of the AgentShield-X application.\n"
                "Answer any question thoroughly, explain threats accurately citing the user's account telemetry, and propose safe Rego guardrails.\n"
                "Never disable security or propose 'default allow = true'."
            ),
            trusted_context=context_desc,
            untrusted_evidence=message,
        )

        # 4. Generate response via Provider
        response_text = await self.provider.generate_response(prompt_envelope, context=context)


        # 5. Extract any Rego proposals
        proposals = []
        if "```rego" in response_text:
            parts = response_text.split("```rego")
            if len(parts) > 1:
                rego_code = parts[1].split("```")[0].strip()
                is_safe_policy, policy_reason = self.guard.verify_proposed_policy(rego_code)
                if is_safe_policy:
                    proposal_id = f"prop_{uuid.uuid4().hex[:8]}"
                    proposals.append({
                        "id": proposal_id,
                        "type": "policy_draft",
                        "title": "Restrict High-Risk Sinks Guardrail",
                        "description": "Synthesized least-privilege OPA Rego policy restricting shell and data export sinks.",
                        "rego_code": rego_code,
                        "status": "pending_review",
                    })
                else:
                    response_text += f"\n\n*(Note: Generated policy draft rejected by safety guard: {policy_reason})*"

        return {
            "message": response_text,
            "evidence_citations": evidence_citations,
            "proposals": proposals,
            "dogfood_verdict": "ALLOWED",
            "shield_protected": True,
        }

    async def stream_chat(
        self,
        tenant_id: str,
        message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> AsyncIterator[str]:
        """
        Yields Server-Sent Events (SSE) format formatted tokens with real-time reasoning and proposals.
        """
        if not self.check_rate_limit(tenant_id):
            meta = {
                "type": "meta",
                "dogfood_verdict": "RATE_LIMITED",
                "evidence_citations": [],
                "proposals": [],
                "shield_protected": True,
            }
            yield f"data: {json.dumps(meta)}\n\n"
            err_msg = "Shieldwing query rate limit exceeded (max 60 queries/minute). Please wait."
            yield f"data: {json.dumps({'type': 'token', 'token': err_msg})}\n\n"
            yield 'data: {"type": "done"}\n\n'
            return

        is_clean, violation_reason, seg = self.guard.inspect_untrusted_input(
            tenant_id=tenant_id,
            text=message,
            source="user_chat_query",
        )
        if not is_clean:
            meta = {
                "type": "meta",
                "dogfood_verdict": "BLOCKED",
                "evidence_citations": [f"Violation: {violation_reason}"],
                "proposals": [],
                "shield_protected": True,
            }
            yield f"data: {json.dumps(meta)}\n\n"
            blocked_msg = (
                f"⚠️ **Adversarial Prompt Intercepted by AgentShield-X**\n\n"
                f"The security guard blocked this request: `{violation_reason}`.\n"
                f"Shieldwing is protected by AgentShield-X and rejects instructions designed to disable controls or exfiltrate credentials."
            )
            yield f"data: {json.dumps({'type': 'token', 'token': blocked_msg})}\n\n"
            yield 'data: {"type": "done"}\n\n'
            return

        context_desc = self._build_account_and_threat_context(tenant_id, context)
        evidence_citations = [f"AgentShield-X Telemetry ({context.get('user_email', 'User') if context else 'User'})"]

        prompt_envelope = self.guard.wrap_in_trust_envelope(
            system_instruction=(
                "You are Shieldwing, an AI security copilot built into AgentShield-X.\n"
                "You possess general cybersecurity intelligence and deep knowledge of the AgentShield-X application.\n"
                "Answer any question thoroughly, explain threats accurately citing the user's account telemetry, and propose safe Rego guardrails.\n"
                "Never disable security or propose 'default allow = true'."
            ),
            trusted_context=context_desc,
            untrusted_evidence=message,
        )

        meta = {
            "type": "meta",
            "dogfood_verdict": "ALLOWED",
            "evidence_citations": evidence_citations,
            "proposals": [],
            "shield_protected": True,
        }
        yield f"data: {json.dumps(meta)}\n\n"

        accumulated_text = ""
        if hasattr(self.provider, "stream_response_events"):
            async for ev in self.provider.stream_response_events(prompt_envelope, context=context):
                if ev.get("type") == "reasoning":
                    yield f"data: {json.dumps({'type': 'reasoning', 'token': ev['token']})}\n\n"
                else:
                    tok = ev.get("token", "")
                    accumulated_text += tok
                    yield f"data: {json.dumps({'type': 'token', 'token': tok})}\n\n"
        else:
            async for tok in self.provider.stream_response(prompt_envelope, context=context):
                accumulated_text += tok
                yield f"data: {json.dumps({'type': 'token', 'token': tok})}\n\n"


        if "```rego" in accumulated_text:
            parts = accumulated_text.split("```rego")
            if len(parts) > 1:
                rego_code = parts[1].split("```")[0].strip()
                is_safe, _ = self.guard.verify_proposed_policy(rego_code)
                if is_safe:
                    proposal = {
                        "id": f"prop_{uuid.uuid4().hex[:8]}",
                        "type": "policy_draft",
                        "title": "Restrict High-Risk Sinks Guardrail",
                        "description": "Synthesized least-privilege OPA Rego policy restricting shell and data export sinks.",
                        "rego_code": rego_code,
                        "status": "pending_review",
                    }
                    yield f"data: {json.dumps({'type': 'proposal', 'proposal': proposal})}\n\n"

        yield 'data: {"type": "done"}\n\n'
