"""
Control API routes for Infrastructure-as-Code (IaC) Policy Definitions
"""


from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from shield_core.iac_policy import (
    default_iac_engine,
    PolicyLintResult,
    SAMPLE_IAC_POLICY_YAML,
)

router = APIRouter(prefix="/v1/iac", tags=["iac-policies"])


class LintRequest(BaseModel):
    yaml_content: str = Field(..., description="Raw YAML content of agentshield-policy.yaml")


class ApplyRequest(BaseModel):
    yaml_content: str = Field(..., description="Raw YAML content of agentshield-policy.yaml")


@router.get("/policies", response_model=Dict[str, Any])
def list_policies():
    """List all deployed Infrastructure-as-Code policies."""
    policies = default_iac_engine.list_policies()
    return {
        "total": len(policies),
        "policies": policies,
    }


@router.get("/sample", response_model=Dict[str, Any])
def get_sample_policy():
    """Retrieve the standard enterprise starter agentshield-policy.yaml template."""
    lint = default_iac_engine.lint_yaml(SAMPLE_IAC_POLICY_YAML)
    return {
        "sample_yaml": SAMPLE_IAC_POLICY_YAML,
        "lint_analysis": lint.to_dict(),
    }


@router.post("/lint", response_model=Dict[str, Any])
def lint_policy(req: LintRequest):
    """Deep security linting and schema validation for CI/CD pipelines."""
    res = default_iac_engine.lint_yaml(req.yaml_content)
    return res.to_dict()


@router.post("/apply", response_model=Dict[str, Any])
def apply_policy(req: ApplyRequest):
    """Deploy version-controlled declarative policy into runtime enforcement."""
    try:
        deployed = default_iac_engine.apply_policy(req.yaml_content)
        return deployed
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/export/terraform/{policy_name}", response_model=Dict[str, Any])
def export_terraform(policy_name: str):
    """Export HCL Terraform provider resource for GitOps."""
    hcl = default_iac_engine.export_terraform(policy_name)
    return {
        "policy_name": policy_name,
        "format": "hcl",
        "content": hcl,
    }


@router.get("/export/helm/{policy_name}", response_model=Dict[str, Any])
def export_helm(policy_name: str):
    """Export Helm values YAML for Kubernetes deployments."""
    helm = default_iac_engine.export_helm_values(policy_name)
    return {
        "policy_name": policy_name,
        "format": "yaml",
        "content": helm,
    }

