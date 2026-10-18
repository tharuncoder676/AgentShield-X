"""
AgentShield-X Gateway Service FastAPI Entrypoint
Exposes authenticated HTTP endpoints for agent tool interception,
verifying API keys, rate limits, schema validation, WebSocket streaming,
and mounts the SaaS Control Plane API routers.
"""

from __future__ import annotations

import asyncio
import os
from typing import Optional
from fastapi import FastAPI, Header, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware

from shield_core.models import Decision, ToolCallEvent
from gateway.auth import Authenticator
from gateway.ratelimit import TokenBucketRateLimiter
from gateway.service import GatewayService

# Import control plane routers
from control_api.routes.auth import router as auth_router
from control_api.routes.orgs import router as orgs_router
from control_api.routes.analytics import router as analytics_router
from control_api.routes.onboarding import router as onboarding_router
from control_api.routes.incidents import router as incidents_router
from control_api.routes.agents import router as agents_router
from control_api.routes.sessions import router as sessions_router
from control_api.routes.policies import router as policies_router
from control_api.routes.approvals import router as approvals_router
from control_api.routes.models import router as models_router
from control_api.routes.honeytools import router as honeytools_router
from control_api.routes.audit import router as audit_router
from control_api.routes.billing import router as billing_router
from control_api.routes.architecture import router as architecture_router
from control_api.routes.shieldwing import router as shieldwing_router
from control_api.routes.scanner import router as scanner_router

app = FastAPI(
    title="AgentShield-X Gateway & Control API",
    version="1.0.0",
    description="High-throughput ingress gateway and SaaS control plane for agent tool interception",
)

# Enable CORS for browser frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Control Plane routers
app.include_router(auth_router)
app.include_router(orgs_router)
app.include_router(analytics_router)
app.include_router(onboarding_router)
app.include_router(incidents_router)
app.include_router(agents_router)
app.include_router(sessions_router)
app.include_router(policies_router)
app.include_router(approvals_router)
app.include_router(models_router)
app.include_router(honeytools_router)
app.include_router(audit_router)
app.include_router(billing_router)
app.include_router(architecture_router)
app.include_router(shieldwing_router)
app.include_router(scanner_router)


authenticator = Authenticator()
rate_limiter = TokenBucketRateLimiter(capacity=1000.0, refill_rate_per_sec=500.0)
decision_url = os.getenv("DECISION_SERVICE_URL", "http://localhost:8001")
gateway_service = GatewayService(decision_service_url=decision_url)
app.state.gateway_service = gateway_service


@app.get("/health")
async def health():
    return {"status": "ok", "service": "gateway", "version": "1.0.0"}


@app.post("/v1/events/tool-call", response_model=Decision)
async def intercept_tool_call(
    event: ToolCallEvent,
    x_shield_api_key: Optional[str] = Header(None, alias="X-Shield-API-Key"),
) -> Decision:
    # 1. Authenticate API Key
    auth_context = authenticator.authenticate_key(x_shield_api_key)
    if not auth_context:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Shield-API-Key header",
        )

    # 2. Enforce Tenant ID matching or resolution
    if event.tenant_id and not auth_context.matches(event.tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supplied tenant_id does not match authenticated API key context",
        )
    tenant_id = auth_context.tenant_id
    if not event.tenant_id:
        event.tenant_id = tenant_id
    if auth_context.project_id:
        event.metadata["project_id"] = auth_context.project_id

    # 3. Rate Limiting
    if not rate_limiter.is_allowed(tenant_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Tenant rate limit exceeded",
        )

    # 3.5 Check Agent Kill-Switch
    if event.agent_id:
        try:
            from control_api.db import Database
            agent_rec = Database.get_instance().get_agent_by_id(event.agent_id)
            if agent_rec and agent_rec.get("status") == "suspended":
                from shield_core.models import ShieldAction, Reason
                suspended_decision = Decision(
                    event_id=event.event_id,
                    action=ShieldAction.BLOCK,
                    risk=1.0,
                    reasons=[
                        Reason(
                            code="AGENT_SUSPENDED_BY_KILL_SWITCH",
                            evidence=f"Agent '{event.agent_id}' execution is suspended via emergency kill-switch.",
                            detector="kill_switch",
                        )
                    ],
                    degraded=False,
                    latency_ms=0.1,
                )
                return suspended_decision
        except Exception:
            pass

    # 4. Process event
    return await gateway_service.process_tool_call(event)


@app.websocket("/v1/ws/decisions")
async def ws_decisions(websocket: WebSocket):
    """
    WebSocket endpoint streaming live decisions from the internal EventBus
    to connected browser dashboards with heartbeat support.
    """
    await websocket.accept()
    queue: asyncio.Queue = asyncio.Queue()

    async def event_handler(record: dict):
        await queue.put(record)

    subscriber_id = f"ws_{id(websocket)}"
    await gateway_service.event_bus.subscribe(
        topic="agent_events",
        group="console_live_feed",
        consumer=subscriber_id,
        handler=event_handler,
    )

    async def send_loop():
        try:
            while True:
                item = await queue.get()
                ev = item.get("event", {})
                dec = item.get("decision", {})
                await websocket.send_json({
                    "type": "decision_event",
                    "event_id": ev.get("event_id"),
                    "session_id": ev.get("session_id"),
                    "agent_id": ev.get("agent_id"),
                    "step": ev.get("step", 0),
                    "tool_name": ev.get("tool", {}).get("name") if isinstance(ev.get("tool"), dict) else str(ev.get("tool")),
                    "action": dec.get("action", "allow"),
                    "risk": dec.get("risk", 0.0),
                    "reasons": dec.get("reasons", []),
                    "latency_ms": dec.get("latency_ms", 0.0),
                    "timestamp": ev.get("timestamp"),
                })
        except Exception:
            pass

    send_task = asyncio.create_task(send_loop())

    try:
        while True:
            data = await websocket.receive_text()
            if "ping" in data.lower():
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    finally:
        send_task.cancel()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
