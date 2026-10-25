"""
AgentShield-X Control Plane API Service Entrypoint
"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

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
from control_api.routes.mcp import router as mcp_router
from control_api.routes.swarm import router as swarm_router
from control_api.routes.judge import router as judge_router
from control_api.routes.redteam import router as redteam_router
from control_api.routes.autopolicy import router as autopolicy_router
from control_api.routes.attestation import router as attestation_router
from control_api.routes.honeytokens import router as honeytokens_router
from control_api.routes.sandbox import router as sandbox_router
from control_api.routes.rag import router as rag_router
from control_api.routes.gitops import router as gitops_router
from control_api.routes.immunity import router as immunity_router
from control_api.routes.llm_proxy import router as llm_proxy_router
from control_api.routes.webhooks import router as webhooks_router

app = FastAPI(
    title="AgentShield-X Control API",
    version="1.0.0",
    description="Multi-tenant SaaS Control Plane for AgentShield-X",
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
app.include_router(mcp_router)
app.include_router(swarm_router)
app.include_router(judge_router)
app.include_router(redteam_router)
app.include_router(autopolicy_router)
app.include_router(attestation_router)
app.include_router(honeytokens_router)
app.include_router(sandbox_router)
app.include_router(rag_router)
app.include_router(gitops_router)
app.include_router(immunity_router)
app.include_router(llm_proxy_router)
app.include_router(webhooks_router)


@app.get("/")
def root(request: Request):
    accept = request.headers.get("accept", "")
    if "application/json" in accept and "text/html" not in accept:
        return {
            "service": "AgentShield-X Control API",
            "status": "online",
            "version": "1.0.0",
            "web_console": "http://localhost:3000",
            "docs": "/docs",
            "health": "/health",
        }
    return RedirectResponse(url="http://localhost:3000")


@app.get("/health")
def health():
    return {"status": "ok", "service": "control-api", "version": "1.0.0"}


from pydantic import BaseModel

class DesktopOpenPayload(BaseModel):
    target: str

@app.post("/v1/desktop/open")
def desktop_open(payload: DesktopOpenPayload):
    try:
        from shield_core.wingshield import ComputerAutomation
        success, msg = ComputerAutomation.open_app(payload.target)
        return {"success": success, "message": msg, "target": payload.target}
    except Exception as e:
        return {"success": False, "error": str(e)}

class DesktopCommandPayload(BaseModel):
    command: str

@app.post("/v1/desktop/command")
def desktop_command(payload: DesktopCommandPayload):
    try:
        from shield_core.wingshield import WingshieldCopilotEngine
        copilot = WingshieldCopilotEngine(greeting_recipient="Tharun")
        reply, should_exit = copilot.process_command(payload.command)
        return {"success": True, "reply": reply, "should_exit": should_exit}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
