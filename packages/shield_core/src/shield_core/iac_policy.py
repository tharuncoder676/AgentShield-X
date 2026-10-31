"""
AgentShield-X Infrastructure-as-Code (IaC) Policy Definitions Engine
====================================================================
Declarative YAML/HCL policy parser, CI/CD security linter, and GitOps rollout manager
with Terraform and Helm export capabilities.

Author: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

import datetime
import hashlib
import json
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple


class EnforcementMode(str, Enum):
    ENFORCE = "enforce"
    OBSERVE = "observe"
    PERMISSIVE = "permissive"


@dataclass
class PolicyLintResult:
    valid: bool
    policy_name: str
    version: str
    errors: List[str]
    warnings: List[str]
    security_score: int
    rule_count: int
    parsed_spec: Optional[Dict[str, Any]] = None
    checksum_sha256: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "valid": self.valid,
            "policy_name": self.policy_name,
            "version": self.version,
            "errors": self.errors,
            "warnings": self.warnings,
            "security_score": self.security_score,
            "rule_count": self.rule_count,
            "parsed_spec": self.parsed_spec,
            "checksum_sha256": self.checksum_sha256,
        }


SAMPLE_IAC_POLICY_YAML = """apiVersion: agentshield.security/v1alpha1
kind: AgentSecurityPolicy
metadata:
  name: enterprise-support-guard
  version: "1.4.0"
  author: Tharunkumar.S
  environment: production
  tags:
    - customer-facing
    - zero-trust
    - pci-dss

spec:
  target_agents:
    - "agent-prod-support-*"
    - "agent-billing-helper"

  enforcement_mode: enforce

  rate_limits:
    max_tool_calls_per_minute: 45
    max_cost_per_session_usd: 1.50

  egress_filters:
    allowed_domains:
      - "api.company.internal"
      - "*.stripe.com"
      - "support.zendesk.com"
    blocked_cidrs:
      - "169.254.169.254/32"  # AWS Metadata service
      - "10.0.0.0/8"

  honeytokens:
    enabled: true
    injection_rate: 0.15
    traps:
      - "fake_aws_key"
      - "decoy_db_pass"

  tool_rules:
    - tool_name: "bash_*"
      action: block
      reason: "Shell command execution forbidden for customer support agents"

    - tool_name: "query_database"
      action: require_approval
      argument_constraints:
        query: "(?i)(drop|delete|truncate|alter)"
      action_on_match: block

    - tool_name: "send_refund_email"
      action: require_approval
      reason: "Financial transactions require Human-in-the-Loop authorization"

    - tool_name: "retrieve_user_profile"
      action: allow
      mask_fields:
        - "ssn"
        - "credit_card"
"""


class IaCPolicyEngine:
    """
    Parses, lints, and deploys declarative Infrastructure-as-Code security policies.
    """

    def __init__(self) -> None:
        self.deployed_policies: Dict[str, Dict[str, Any]] = {}
        self._seed_default_policies()

    def _seed_default_policies(self) -> None:
        lint = self.lint_yaml(SAMPLE_IAC_POLICY_YAML)
        if lint.valid and lint.parsed_spec:
            self.deployed_policies[lint.policy_name] = {
                "name": lint.policy_name,
                "version": lint.version,
                "yaml_content": SAMPLE_IAC_POLICY_YAML,
                "status": "DEPLOYED",
                "security_score": lint.security_score,
                "deployed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "checksum": lint.checksum_sha256,
            }

    def lint_yaml(self, yaml_content: str) -> PolicyLintResult:
        """
        Parses and performs deep security validation on an AgentShield-X policy YAML.
        """
        errors: List[str] = []
        warnings: List[str] = []
        score = 100

        checksum = hashlib.sha256(yaml_content.encode("utf-8")).hexdigest()

        # Simple structured YAML-like parsing (handles standard YAML without heavy dependencies)
        lines = [line.strip() for line in yaml_content.splitlines() if line.strip() and not line.strip().startswith("#")]

        # Check API Version & Kind
        has_api_version = any("apiversion:" in l.lower() for l in lines)
        has_kind = any("kind: agentsecuritypolicy" in l.lower() for l in lines)

        if not has_api_version:
            errors.append("Missing mandatory 'apiVersion: agentshield.security/v1alpha1'")
            score -= 25

        if not has_kind:
            errors.append("Invalid or missing 'kind: AgentSecurityPolicy'")
            score -= 25

        # Extract metadata
        name = "unknown-policy"
        version = "0.1.0"
        for line in lines:
            if line.startswith("name:"):
                name = line.split(":", 1)[1].strip().strip('"\'')
            elif line.startswith("version:"):
                version = line.split(":", 1)[1].strip().strip('"\'')

        if name == "unknown-policy":
            errors.append("Missing 'metadata.name' property")
            score -= 15

        # Security Best Practice Checks
        lowered = yaml_content.lower()

        # Check 1: Unrestricted Bash allow within the same tool block
        tool_blocks = re.split(r'\n\s*-\s*tool_name:', lowered)
        for block in tool_blocks[1:]:
            first_line = block.split("\n")[0]
            if "bash" in first_line and re.search(r'action:\s*["\']?allow', block):
                errors.append("CRITICAL: 'bash_*' tool rule has 'action: allow' without sandbox containment")
                score -= 40

        # Check 2: Enforcement mode
        if "enforcement_mode: permissive" in lowered:
            warnings.append("Policy enforcement is set to 'permissive'. Security violations will only be logged.")
            score -= 15
        elif "enforcement_mode:" not in lowered:
            warnings.append("No explicit 'enforcement_mode' specified; defaults to 'observe'.")
            score -= 10

        # Check 3: Cloud Metadata IP Protection
        if "169.254.169.254" not in lowered:
            warnings.append("Missing recommended egress block for cloud metadata IP '169.254.169.254/32' (SSRF vulnerability risk)")
            score -= 10

        # Check 4: Rate limiting
        if "rate_limits:" not in lowered:
            warnings.append("No rate limits specified; risk of unbounded model token billing")
            score -= 10

        # Count rules
        rule_count = lowered.count("- tool_name:")
        if rule_count == 0:
            warnings.append("Policy specifies zero 'tool_rules'; agent tools will not be governed")
            score -= 20

        score = max(0, min(100, score))
        is_valid = len(errors) == 0

        parsed_spec: Dict[str, Any] = {
            "name": name,
            "version": version,
            "rules_defined": rule_count,
            "checksum": checksum[:16],
            "enforcement": "enforce" if "enforcement_mode: enforce" in lowered else "observe",
        }

        return PolicyLintResult(
            valid=is_valid,
            policy_name=name,
            version=version,
            errors=errors,
            warnings=warnings,
            security_score=score,
            rule_count=rule_count,
            parsed_spec=parsed_spec,
            checksum_sha256=checksum,
        )

    def export_terraform(self, policy_name: str) -> str:
        """Generates HCL Terraform provider block for GitOps IaC repositories."""
        pol = self.deployed_policies.get(policy_name)
        v = pol["version"] if pol else "1.0.0"
        return f"""# AgentShield-X Terraform Resource Definition
# Generated by Lead Architect Tharunkumar.S

resource "agentshield_security_policy" "{policy_name.replace('-', '_')}" {{
  name        = "{policy_name}"
  version     = "{v}"
  enforcement = "enforce"
  environment = "production"

  rate_limits {{
    max_tool_calls_per_minute = 45
    max_cost_per_session_usd  = 1.50
  }}

  honeytokens {{
    enabled        = true
    injection_rate = 0.15
  }}

  egress_filter {{
    blocked_cidrs = ["169.254.169.254/32", "10.0.0.0/8"]
  }}

  lifecycle {{
    prevent_destroy = true
  }}
}}
"""

    def export_helm_values(self, policy_name: str) -> str:
        """Generates Kubernetes Helm values for GitOps ArgoCD / Flux deployment."""
        pol = self.deployed_policies.get(policy_name)
        v = pol["version"] if pol else "1.0.0"
        return f"""# AgentShield-X Helm Values Configuration
# Cloud-Native Kubernetes Operator Policy
agentshield:
  policy:
    name: {policy_name}
    version: "{v}"
    mode: enforce
    replicas: 3
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
    audit:
      enableCryptographicSigning: true
      exportSIEM: true
"""

    def apply_policy(self, yaml_content: str) -> Dict[str, Any]:
        """Applies validated policy to active runtime."""
        lint = self.lint_yaml(yaml_content)
        if not lint.valid:
            raise ValueError(f"Cannot deploy invalid policy: {'; '.join(lint.errors)}")

        record = {
            "name": lint.policy_name,
            "version": lint.version,
            "yaml_content": yaml_content,
            "status": "DEPLOYED",
            "security_score": lint.security_score,
            "deployed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "checksum": lint.checksum_sha256,
        }
        self.deployed_policies[lint.policy_name] = record
        return {
            "success": True,
            "policy_name": lint.policy_name,
            "version": lint.version,
            "security_score": lint.security_score,
            "checksum": lint.checksum_sha256[:12],
            "deployed_at": record["deployed_at"],
        }

    def list_policies(self) -> List[Dict[str, Any]]:
        return list(self.deployed_policies.values())


# Singleton instance
default_iac_engine = IaCPolicyEngine()
