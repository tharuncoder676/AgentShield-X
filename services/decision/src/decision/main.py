"""
AgentShield-X Decision Service FastAPI Entrypoint
Exposes HTTP endpoints for synchronous event evaluation and health checks.
"""

from fastapi import FastAPI, HTTPException
from shield_core.models import Decision, ToolCallEvent
from decision.service import DecisionService

app = FastAPI(
    title="AgentShield-X Decision Service",
    version="1.0.0",
    description="Stateless latency-critical decision engine",
)

decision_service = DecisionService()


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "decision-service", "version": "1.0.0"}


@app.post("/v1/decisions/evaluate", response_model=Decision)
async def evaluate(event: ToolCallEvent) -> Decision:
    try:
        return await decision_service.evaluate_event(event)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decision evaluation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
