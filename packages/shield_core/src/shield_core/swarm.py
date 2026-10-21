"""
AgentShield-X Multi-Agent Swarm Defense & A2A Attenuation Engine
Enforces taint propagation and capability attenuation across multi-agent swarms
(e.g., LangGraph supervisors, CrewAI crews, AutoGen chats, custom hierarchical agents).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from shield_core.compat import BaseModel, Field
from shield_core.models import ToolSensitivity, TrustLevel


class SwarmAgent(BaseModel):
    agent_id: str
    name: str
    role: str
    allowed_tools: List[str] = Field(default_factory=list)
    max_sensitivity: ToolSensitivity = Field(default=ToolSensitivity.MEDIUM)
    can_delegate: bool = Field(default=True)
    delegation_depth_limit: int = Field(default=3)


class AttenuationRule(BaseModel):
    parent_agent_id: str
    child_agent_id: str
    restricted_tools: List[str] = Field(default_factory=list)
    max_child_sensitivity: ToolSensitivity = Field(default=ToolSensitivity.LOW)
    block_external_sinks: bool = Field(default=True)


class SwarmDelegation(BaseModel):
    delegation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    parent_agent_id: str
    child_agent_id: str
    task_instructions: str
    tainted_keys: List[str] = Field(default_factory=list)
    context_trust: TrustLevel = Field(default=TrustLevel.USER)
    step: int = 0
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class DelegationVerdict(BaseModel):
    allowed: bool
    reason: str
    attenuated_tools: List[str]
    inherited_taint: List[str]
    violation_code: Optional[str] = None


class SwarmTrace(BaseModel):
    trace_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    swarm_name: str
    root_agent_id: str
    delegations: List[SwarmDelegation] = Field(default_factory=list)
    active_taint_sources: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SwarmDefenseEngine:
    """
    Evaluates multi-agent delegations, tracks taint flow across agent boundaries,
    and enforces capability attenuation.
    """

    def __init__(self, agents: Optional[List[SwarmAgent]] = None, rules: Optional[List[AttenuationRule]] = None):
        self.agents: Dict[str, SwarmAgent] = {a.agent_id: a for a in (agents or [])}
        self.rules: List[AttenuationRule] = rules or []
        self._traces: List[SwarmTrace] = []

    def register_agent(self, agent: SwarmAgent) -> None:
        self.agents[agent.agent_id] = agent

    def add_attenuation_rule(self, rule: AttenuationRule) -> None:
        self.rules.append(rule)

    def evaluate_delegation(
        self,
        parent_agent_id: str,
        child_agent_id: str,
        task_instructions: str,
        current_taint: List[str],
        depth: int = 1,
    ) -> DelegationVerdict:
        """
        Validates whether parent can delegate to child, whether child has sufficient attenuation,
        and propagates taint labels.
        """
        parent = self.agents.get(parent_agent_id)
        child = self.agents.get(child_agent_id)

        if not parent:
            parent = SwarmAgent(agent_id=parent_agent_id, name=parent_agent_id, role="Supervisor")
            self.register_agent(parent)

        if not child:
            child = SwarmAgent(agent_id=child_agent_id, name=child_agent_id, role="Worker")
            self.register_agent(child)

        # Check recursion / depth limit
        if depth > parent.delegation_depth_limit:
            return DelegationVerdict(
                allowed=False,
                reason=f"Delegation depth {depth} exceeds limit {parent.delegation_depth_limit} for {parent_agent_id}",
                attenuated_tools=[],
                inherited_taint=current_taint,
                violation_code="SWARM_MAX_DEPTH_EXCEEDED",
            )

        # Check whether parent is permitted to delegate
        if not parent.can_delegate:
            return DelegationVerdict(
                allowed=False,
                reason=f"Agent {parent_agent_id} does not have delegation permissions",
                attenuated_tools=[],
                inherited_taint=current_taint,
                violation_code="SWARM_DELEGATION_DISALLOWED",
            )

        # Find matching attenuation rules
        applicable_rules = [
            r for r in self.rules
            if (r.parent_agent_id in (parent_agent_id, "*")) and (r.child_agent_id in (child_agent_id, "*"))
        ]

        restricted_tools: List[str] = []
        block_sinks = False
        max_sens = child.max_sensitivity

        for rule in applicable_rules:
            restricted_tools.extend(rule.restricted_tools)
            if rule.block_external_sinks:
                block_sinks = True
            # Downgrade sensitivity to strictest
            if rule.max_child_sensitivity == ToolSensitivity.LOW:
                max_sens = ToolSensitivity.LOW

        # If taint is active, automatically attenuate external sinks
        is_tainted = len(current_taint) > 0
        inherited_taint = list(current_taint)
        if is_tainted and "taint:inherited" not in inherited_taint:
            inherited_taint.append(f"taint:from_{parent_agent_id}")

        allowed_child_tools = [
            t for t in child.allowed_tools
            if t not in restricted_tools
        ]

        if block_sinks or is_tainted:
            sink_keywords = ["email", "send", "post", "upload", "external", "shell", "exec"]
            allowed_child_tools = [
                t for t in allowed_child_tools
                if not any(k in t.lower() for k in sink_keywords)
            ]

        return DelegationVerdict(
            allowed=True,
            reason=f"Delegation approved with capability attenuation ({len(allowed_child_tools)} tools permitted)",
            attenuated_tools=allowed_child_tools,
            inherited_taint=inherited_taint,
            violation_code=None,
        )

    def simulate_swarm(
        self,
        swarm_name: str,
        delegation_steps: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Simulates an entire multi-agent swarm run and returns complete telemetry with taint graph.
        """
        trace_id = str(uuid.uuid4())
        results = []
        current_taint: List[str] = []
        violations_count = 0

        for idx, step in enumerate(delegation_steps):
            parent_id = step.get("parent_agent_id", "supervisor")
            child_id = step.get("child_agent_id", "worker")
            task = step.get("task", "Analyze data")
            taint_input = step.get("taint_input", [])

            if taint_input:
                for t in taint_input:
                    if t not in current_taint:
                        current_taint.append(t)

            verdict = self.evaluate_delegation(
                parent_agent_id=parent_id,
                child_agent_id=child_id,
                task_instructions=task,
                current_taint=current_taint,
                depth=step.get("depth", 1),
            )

            if not verdict.allowed:
                violations_count += 1

            results.append({
                "step": idx + 1,
                "parent_agent_id": parent_id,
                "child_agent_id": child_id,
                "task": task,
                "verdict": verdict.model_dump() if hasattr(verdict, "model_dump") else verdict.dict(),
                "active_taint": list(current_taint),
            })

        return {
            "trace_id": trace_id,
            "swarm_name": swarm_name,
            "total_steps": len(delegation_steps),
            "violations_detected": violations_count,
            "safe": violations_count == 0,
            "steps": results,
            "final_taint_count": len(current_taint),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
