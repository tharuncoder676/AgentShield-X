"""
AgentShield-X Custom Detection Rule Builder (No-Code Visual Block / AST)
========================================================================
Visual condition block compiler that converts no-code block logic
(IF tool == 'X' AND arg matches 'Y' AND risk > Z THEN ACTION)
into high-speed Python AST evaluators with Community Exchange export.

Author: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

import ast
import datetime
import re
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple, Union


class RuleAction(str, Enum):
    BLOCK = "BLOCK"
    ALLOW = "ALLOW"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"
    SANITIZE = "SANITIZE"
    REDACT = "REDACT"
    ALERT_ONLY = "ALERT_ONLY"


class OperatorType(str, Enum):
    EQUALS = "EQUALS"
    NOT_EQUALS = "NOT_EQUALS"
    CONTAINS = "CONTAINS"
    REGEX_MATCH = "REGEX_MATCH"
    GREATER_THAN = "GREATER_THAN"
    LESS_THAN = "LESS_THAN"
    STARTS_WITH = "STARTS_WITH"
    IN_LIST = "IN_LIST"


@dataclass
class RuleCondition:
    field_path: str  # e.g. "tool_name", "arg.query", "threat_score", "agent_id"
    operator: OperatorType
    value: Any

    def to_dict(self) -> Dict[str, Any]:
        return {
            "field_path": self.field_path,
            "operator": self.operator.value,
            "value": self.value,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> RuleCondition:
        return cls(
            field_path=data["field_path"],
            operator=OperatorType(data["operator"]),
            value=data["value"],
        )


@dataclass
class VisualRuleBlock:
    rule_id: str
    name: str
    description: str
    severity: str  # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    match_all: bool  # True for AND, False for OR
    conditions: List[RuleCondition]
    action: RuleAction
    action_message: str
    enabled: bool = True
    author: str = "Tharunkumar.S"
    created_at: str = field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "name": self.name,
            "description": self.description,
            "severity": self.severity,
            "match_all": self.match_all,
            "conditions": [c.to_dict() for c in self.conditions],
            "action": self.action.value,
            "action_message": self.action_message,
            "enabled": self.enabled,
            "author": self.author,
            "created_at": self.created_at,
            "tags": self.tags,
            "python_code": self.generate_python_code(),
        }

    def generate_python_code(self) -> str:
        """Compiles rule into clean Python condition code."""
        cond_exprs = []
        for c in self.conditions:
            f = c.field_path
            v = repr(c.value)
            if c.operator == OperatorType.EQUALS:
                cond_exprs.append(f"get_val(ctx, {repr(f)}) == {v}")
            elif c.operator == OperatorType.NOT_EQUALS:
                cond_exprs.append(f"get_val(ctx, {repr(f)}) != {v}")
            elif c.operator == OperatorType.CONTAINS:
                cond_exprs.append(f"{v}.lower() in str(get_val(ctx, {repr(f)})).lower()")
            elif c.operator == OperatorType.STARTS_WITH:
                cond_exprs.append(f"str(get_val(ctx, {repr(f)})).startswith({v})")
            elif c.operator == OperatorType.GREATER_THAN:
                cond_exprs.append(f"float(get_val(ctx, {repr(f)}) or 0) > float({v})")
            elif c.operator == OperatorType.LESS_THAN:
                cond_exprs.append(f"float(get_val(ctx, {repr(f)}) or 0) < float({v})")
            elif c.operator == OperatorType.REGEX_MATCH:
                cond_exprs.append(f"bool(re.search({v}, str(get_val(ctx, {repr(f)})), re.IGNORECASE))")
            elif c.operator == OperatorType.IN_LIST:
                cond_exprs.append(f"get_val(ctx, {repr(f)}) in {v}")

        joiner = " and " if self.match_all else " or "
        body = joiner.join(cond_exprs) if cond_exprs else "True"
        return f"# Rule: {self.name}\ndef eval_rule(ctx):\n    return {body}"


@dataclass
class RuleEvaluationResult:
    matched: bool
    rule_id: Optional[str]
    rule_name: Optional[str]
    action: RuleAction
    message: str
    evaluation_latency_us: float
    matched_conditions: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "matched": self.matched,
            "rule_id": self.rule_id,
            "rule_name": self.rule_name,
            "action": self.action.value,
            "message": self.message,
            "evaluation_latency_us": round(self.evaluation_latency_us, 1),
            "matched_conditions": self.matched_conditions,
        }


class CustomRuleBuilderEngine:
    """
    Manages custom visual block rules, compiles them to AST-safe evaluators,
    and runs sub-millisecond event matching.
    """

    def __init__(self) -> None:
        self.rules: Dict[str, VisualRuleBlock] = {}
        self._seed_default_rules()

    def _seed_default_rules(self) -> None:
        """Seed realistic enterprise custom rules."""
        seeds = [
            VisualRuleBlock(
                rule_id="rule-block-001",
                name="Block Destructive SQL Drops",
                description="Prevent autonomous agents from dropping or truncating enterprise tables.",
                severity="CRITICAL",
                match_all=True,
                conditions=[
                    RuleCondition("tool_name", OperatorType.EQUALS, "sql_query"),
                    RuleCondition("arg.query", OperatorType.REGEX_MATCH, r"(?i)\b(DROP|TRUNCATE|DELETE\s+FROM)\b"),
                ],
                action=RuleAction.BLOCK,
                action_message="Destructive SQL statement blocked by Custom Rule 'Block Destructive SQL Drops'",
                tags=["database", "anti-data-destruction", "soc2"],
            ),
            VisualRuleBlock(
                rule_id="rule-block-002",
                name="Human Approval for High-Risk Email Sinks",
                description="Flag outbound emails whenever behavioral risk exceeds 0.6.",
                severity="HIGH",
                match_all=True,
                conditions=[
                    RuleCondition("tool_name", OperatorType.EQUALS, "send_external_email"),
                    RuleCondition("threat_score", OperatorType.GREATER_THAN, 0.60),
                ],
                action=RuleAction.REQUIRE_APPROVAL,
                action_message="Outbound email requires human SOC authorization due to elevated session threat score.",
                tags=["human-in-the-loop", "exfiltration-prevention"],
            ),
            VisualRuleBlock(
                rule_id="rule-block-003",
                name="Quarantine Unauthorized Bash Loops",
                description="Block raw shell command invocation for all agents outside CI runner.",
                severity="CRITICAL",
                match_all=True,
                conditions=[
                    RuleCondition("tool_name", OperatorType.STARTS_WITH, "bash_"),
                    RuleCondition("agent_id", OperatorType.NOT_EQUALS, "agent-ci-runner"),
                ],
                action=RuleAction.BLOCK,
                action_message="Raw bash shell execution forbidden for non-CI agents.",
                tags=["rce-defense", "container-isolation"],
            ),
            VisualRuleBlock(
                rule_id="rule-block-004",
                name="Redact SSN in Customer Lookup",
                description="Mask 9-digit social security numbers in customer retrieval responses.",
                severity="MEDIUM",
                match_all=True,
                conditions=[
                    RuleCondition("tool_name", OperatorType.EQUALS, "retrieve_customer_record"),
                    RuleCondition("arg.query", OperatorType.REGEX_MATCH, r"\b\d{3}-\d{2}-\d{4}\b"),
                ],
                action=RuleAction.REDACT,
                action_message="Social Security Number dynamically masked to [REDACTED_SSN].",
                tags=["privacy", "pii-compliance", "gdpr"],
            ),
        ]
        for s in seeds:
            self.rules[s.rule_id] = s

    def _extract_field(self, field_path: str, context: Dict[str, Any]) -> Any:
        if field_path.startswith("arg."):
            arg_key = field_path[4:]
            args = context.get("arguments", {})
            return args.get(arg_key, "") if isinstance(args, dict) else ""
        return context.get(field_path, "")

    def _eval_condition(self, cond: RuleCondition, context: Dict[str, Any]) -> bool:
        val = self._extract_field(cond.field_path, context)
        target = cond.value

        op = cond.operator
        if op == OperatorType.EQUALS:
            return str(val).lower() == str(target).lower()
        elif op == OperatorType.NOT_EQUALS:
            return str(val).lower() != str(target).lower()
        elif op == OperatorType.CONTAINS:
            return str(target).lower() in str(val).lower()
        elif op == OperatorType.STARTS_WITH:
            return str(val).lower().startswith(str(target).lower())
        elif op == OperatorType.GREATER_THAN:
            try:
                return float(val) > float(target)
            except (ValueError, TypeError):
                return False
        elif op == OperatorType.LESS_THAN:
            try:
                return float(val) < float(target)
            except (ValueError, TypeError):
                return False
        elif op == OperatorType.REGEX_MATCH:
            try:
                return bool(re.search(str(target), str(val), re.IGNORECASE))
            except re.error:
                return False
        elif op == OperatorType.IN_LIST:
            if isinstance(target, list):
                return val in target
            return str(val) in str(target)

        return False

    def evaluate_event(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        threat_score: float = 0.0,
        agent_id: str = "agent-generic",
    ) -> RuleEvaluationResult:
        """
        Runs incoming tool invocation event against all active custom visual block rules.
        """
        t_start = time.perf_counter()
        context = {
            "tool_name": tool_name,
            "arguments": arguments,
            "threat_score": threat_score,
            "agent_id": agent_id,
        }

        for rule in self.rules.values():
            if not rule.enabled:
                continue

            cond_results = []
            matched_descs = []
            for c in rule.conditions:
                matched = self._eval_condition(c, context)
                cond_results.append(matched)
                if matched:
                    matched_descs.append(f"{c.field_path} {c.operator.value} {c.value}")

            rule_triggered = all(cond_results) if rule.match_all else any(cond_results)

            if rule_triggered and cond_results:
                t_us = (time.perf_counter() - t_start) * 1_000_000
                return RuleEvaluationResult(
                    matched=True,
                    rule_id=rule.rule_id,
                    rule_name=rule.name,
                    action=rule.action,
                    message=rule.action_message,
                    evaluation_latency_us=t_us,
                    matched_conditions=matched_descs,
                )

        t_us = (time.perf_counter() - t_start) * 1_000_000
        return RuleEvaluationResult(
            matched=False,
            rule_id=None,
            rule_name=None,
            action=RuleAction.ALLOW,
            message="No custom block rule triggered. Event permitted.",
            evaluation_latency_us=t_us,
            matched_conditions=[],
        )

    def create_rule(
        self,
        name: str,
        description: str,
        severity: str,
        match_all: bool,
        conditions: List[Dict[str, Any]],
        action: str,
        action_message: str,
        tags: Optional[List[str]] = None,
    ) -> VisualRuleBlock:
        rule_id = f"rule-block-{uuid.uuid4().hex[:6]}"
        cond_objs = [RuleCondition.from_dict(c) for c in conditions]
        rule = VisualRuleBlock(
            rule_id=rule_id,
            name=name,
            description=description,
            severity=severity,
            match_all=match_all,
            conditions=cond_objs,
            action=RuleAction(action),
            action_message=action_message,
            tags=tags or ["custom"],
        )
        self.rules[rule_id] = rule
        return rule

    def delete_rule(self, rule_id: str) -> bool:
        if rule_id in self.rules:
            del self.rules[rule_id]
            return True
        return False

    def list_rules(self) -> List[VisualRuleBlock]:
        return list(self.rules.values())


# Singleton instance
default_rule_builder = CustomRuleBuilderEngine()

