"""FastAPI Routes for Predictive Threat Forecasting Engine."""


from typing import Any, Dict, List
from fastapi import APIRouter

from shield_core.forecasting import default_forecaster

router = APIRouter(prefix="/v1/forecasting", tags=["forecasting"])


@router.get("/summary")
async def get_forecast_summary():
    """Returns rolling 24-hour predictive threat distributions, surge windows, and agent targets."""
    return default_forecaster.get_forecast_summary()


@router.get("/windows")
async def get_high_risk_windows():
    """Returns predicted attack surge windows in the next 24-48 hours."""
    return [w.to_dict() for w in default_forecaster.get_high_risk_windows()]


@router.get("/agents")
async def get_agent_vulnerabilities():
    """Returns predictive vulnerability index scores per agent asset."""
    return [a.to_dict() for a in default_forecaster.get_agent_vulnerability_forecast()]

