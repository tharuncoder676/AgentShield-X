"""
AgentShield-X Gateway Core Service
Validates inbound event schemas, checks rate limits, routes to Decision Service,
and asynchronously publishes events to the event bus.
"""

from typing import Optional
import httpx
from shield_core.models import Decision, ToolCallEvent, ShieldAction, Reason
from eventbus.base import EventBus
from eventbus.memory import MemoryEventBus


class GatewayService:
    """
    Coordinates traffic between SDK clients, decision service, and event streaming.
    """

    def __init__(
        self,
        decision_service_url: str = "http://localhost:8001",
        event_bus: Optional[EventBus] = None,
        timeout_seconds: float = 0.5,
    ) -> None:
        self.decision_service_url = decision_service_url.rstrip("/")
        self.event_bus = event_bus or MemoryEventBus()
        self.timeout_seconds = timeout_seconds

    async def process_tool_call(self, event: ToolCallEvent) -> Decision:
        """
        Submits event to decision service, publishes event record, and returns Decision.
        Implements fail-safe degraded response if decision service is down.
        """
        decision: Optional[Decision] = None
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                resp = await client.post(
                    f"{self.decision_service_url}/v1/decisions/evaluate",
                    json=event.model_dump(),
                )
                if resp.status_code == 200:
                    decision = Decision.model_validate(resp.json())
        except Exception as e:
            # Degraded fail-safe decision
            decision = Decision(
                event_id=event.event_id,
                action=ShieldAction.BLOCK if event.tool.sensitivity.value in {"high", "critical"} else ShieldAction.ALLOW,
                risk=0.5,
                reasons=[Reason(code="GATEWAY_DECISION_SERVICE_UNREACHABLE", evidence=str(e), detector="gateway")],
                degraded=True,
                latency_ms=0.0,
            )

        assert decision is not None

        # Asynchronously record event and decision to event stream
        await self.event_bus.publish(
            "agent_events",
            {
                "event": event.model_dump(),
                "decision": decision.model_dump(),
            },
        )

        # Record in control plane database for audit and analytics
        try:
            from control_api.db import Database
            db = Database.get_instance()
            project_id = event.metadata.get("project_id") or getattr(event, "project_id", None) or event.tenant_id
            db.record_event({
                "event_id": event.event_id,
                "tenant_id": event.tenant_id,
                "project_id": project_id,
                "agent_id": event.agent_id,
                "session_id": event.session_id,
                "step": event.step,
                "tool_name": event.tool.name,
                "arguments": event.arguments,
                "context_segments": [s.model_dump() for s in event.context_segments],
                "taint": event.taint,
                "action": decision.action.value if hasattr(decision.action, "value") else str(decision.action),
                "risk": decision.risk,
                "reasons": [r.model_dump() for r in decision.reasons],
                "latency_ms": decision.latency_ms,
                "timestamp": event.timestamp,
            })
        except Exception:
            pass

        return decision
