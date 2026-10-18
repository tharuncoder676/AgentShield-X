"""
AgentShield-X Detectors, Model Registry & Thresholds Router
Provides health, latency benchmarks, and threshold tuning for all 5 ML models and rule detectors.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, status

from control_api.db import Database
from control_api.models import (
    ModelStatusDTO,
    ModelThresholdsDTO,
    UpdateModelThresholdsRequest,
    UserDTO,
)
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1/models", tags=["models"])
db = Database.get_instance()


@router.get("/status", response_model=List[ModelStatusDTO])
def get_models_status(
    current_user: UserDTO = Depends(get_current_user),
) -> List[ModelStatusDTO]:
    models = db.get_models_registry_status()
    return [ModelStatusDTO(**m) for m in models]


@router.get("/thresholds", response_model=ModelThresholdsDTO)
def get_thresholds(
    project_id: Optional[str] = "default",
    current_user: UserDTO = Depends(get_current_user),
) -> ModelThresholdsDTO:
    t = db.get_model_thresholds(project_id or "default")
    return ModelThresholdsDTO(**t)


@router.patch("/thresholds", response_model=ModelThresholdsDTO)
def update_thresholds(
    req: UpdateModelThresholdsRequest,
    project_id: Optional[str] = "default",
    current_user: UserDTO = Depends(get_current_user),
) -> ModelThresholdsDTO:
    updated = db.update_model_thresholds(
        project_id=project_id or "default",
        block_threshold=req.block_threshold,
        escalate_threshold=req.escalate_threshold,
        sanitize_threshold=req.sanitize_threshold,
        kill_session_threshold=req.kill_session_threshold,
    )
    return ModelThresholdsDTO(**updated)
