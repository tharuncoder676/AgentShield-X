"""
Control API routes for Custom Detection Rule Builder (No-Code Visual Block / AST)
"""


from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from shield_core.rule_builder import (
    default_rule_builder,
    VisualRuleBlock,
    RuleAction,
    OperatorType,
)

router = APIRouter(prefix="/v1/rule-builder", tags=["rule-builder"])


class ConditionPayload(BaseModel):
    field_path: str = Field(..., description="Target field, e.g. 'tool_name', 'arg.query', 'threat_score'")
    operator: str = Field(..., description="EQUALS, CONTAINS, REGEX_MATCH, GREATER_THAN, STARTS_WITH, etc.")
    value: Any = Field(..., description="Value to match against")


class CreateRuleRequest(BaseModel):
    name: str = Field(..., description="Human-friendly rule title")
    description: str = Field("", description="Detailed purpose of the rule")
    severity: str = Field("HIGH", description="CRITICAL, HIGH, MEDIUM, LOW")
    match_all: bool = Field(True, description="True for AND, False for OR")
    conditions: List[ConditionPayload]
    action: str = Field("BLOCK", description="BLOCK, ALLOW, REQUIRE_APPROVAL, REDACT, SANITIZE")
    action_message: str = Field("Blocked by custom security rule")
    tags: List[str] = Field(default_factory=list)


class EvaluateEventRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    threat_score: float = 0.0
    agent_id: str = "agent-generic"


@router.get("/rules", response_model=Dict[str, Any])
def list_rules():
    """List all custom visual block detection rules and compiled AST representations."""
    rules = default_rule_builder.list_rules()
    return {
        "total": len(rules),
        "rules": [r.to_dict() for r in rules],
    }


@router.post("/rules", response_model=Dict[str, Any])
def create_rule(body: CreateRuleRequest):
    """Create a new no-code visual condition block rule and compile to Python AST."""
    try:
        rule = default_rule_builder.create_rule(
            name=body.name,
            description=body.description,
            severity=body.severity,
            match_all=body.match_all,
            conditions=[c.model_dump() for c in body.conditions],
            action=body.action,
            action_message=body.action_message,
            tags=body.tags,
        )
        return {
            "success": True,
            "rule": rule.to_dict(),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/rules/{rule_id}", response_model=Dict[str, Any])
def delete_rule(rule_id: str):
    """Delete a custom rule by ID."""
    success = default_rule_builder.delete_rule(rule_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Rule '{rule_id}' not found")
    return {"success": True, "message": f"Rule '{rule_id}' deleted."}


@router.post("/evaluate", response_model=Dict[str, Any])
def evaluate_event(event: EvaluateEventRequest):
    """Test an agent tool invocation against the active visual rule AST compiler."""
    res = default_rule_builder.evaluate_event(
        tool_name=event.tool_name,
        arguments=event.arguments,
        threat_score=event.threat_score,
        agent_id=event.agent_id,
    )
    return res.to_dict()

