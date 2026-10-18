"""
AgentShield-X Metering, Subscription & Stripe Billing Router
Provides tool-call usage metering, tier limits enforcement, subscription upgrades, and invoices.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from control_api.db import Database
from control_api.models import (
    SubscriptionDTO,
    UpdateSubscriptionRequest,
    BillingUsageDTO,
    InvoiceDTO,
    UserDTO,
)
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1/billing", tags=["billing"])
db = Database.get_instance()


@router.get("/subscription", response_model=SubscriptionDTO)
def get_subscription(
    project_id: Optional[str] = "default",
    current_user: UserDTO = Depends(get_current_user),
) -> SubscriptionDTO:
    sub = db.get_subscription(project_id or "default")
    return SubscriptionDTO(**sub)


@router.post("/subscription", response_model=SubscriptionDTO)
def update_subscription(
    req: UpdateSubscriptionRequest,
    project_id: Optional[str] = "default",
    current_user: UserDTO = Depends(get_current_user),
) -> SubscriptionDTO:
    if req.plan not in ("free", "team", "enterprise"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plan must be 'free', 'team', or 'enterprise'",
        )
    sub = db.update_subscription(project_id=project_id or "default", plan=req.plan)
    return SubscriptionDTO(**sub)


@router.get("/usage", response_model=BillingUsageDTO)
def get_billing_usage(
    project_id: Optional[str] = "default",
    current_user: UserDTO = Depends(get_current_user),
) -> BillingUsageDTO:
    usage = db.get_billing_usage(project_id or "default")
    return BillingUsageDTO(**usage)


@router.get("/invoices", response_model=List[InvoiceDTO])
def get_invoices(
    project_id: Optional[str] = "default",
    current_user: UserDTO = Depends(get_current_user),
) -> List[InvoiceDTO]:
    invoices = db.get_invoices(project_id or "default")
    return [InvoiceDTO(**inv) for inv in invoices]
