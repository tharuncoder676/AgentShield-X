"""
Unit tests for AgentShield-X Custom Detection Rule Builder (No-Code Visual Block / AST)
"""

import pytest
from shield_core.rule_builder import (
    CustomRuleBuilderEngine,
    VisualRuleBlock,
    RuleAction,
    OperatorType,
    RuleCondition,
)


@pytest.fixture
def builder() -> CustomRuleBuilderEngine:
    return CustomRuleBuilderEngine()


def test_default_seeded_rules(builder: CustomRuleBuilderEngine):
    rules = builder.list_rules()
    assert len(rules) >= 4
    for r in rules:
        py_code = r.generate_python_code()
        assert "def eval_rule(ctx):" in py_code
        assert r.rule_id in builder.rules


def test_evaluate_sql_drop_block(builder: CustomRuleBuilderEngine):
    res = builder.evaluate_event(
        tool_name="sql_query",
        arguments={"query": "DROP TABLE enterprise_customers;"},
        threat_score=0.2,
        agent_id="agent-support-worker",
    )
    assert res.matched is True
    assert res.action == RuleAction.BLOCK
    assert "Destructive SQL" in res.rule_name
    assert res.evaluation_latency_us < 2000.0  # Sub-2ms


def test_evaluate_benign_sql_allowed(builder: CustomRuleBuilderEngine):
    res = builder.evaluate_event(
        tool_name="sql_query",
        arguments={"query": "SELECT id, name FROM enterprise_customers LIMIT 10;"},
        threat_score=0.1,
        agent_id="agent-support-worker",
    )
    assert res.matched is False
    assert res.action == RuleAction.ALLOW


def test_evaluate_high_risk_email_approval(builder: CustomRuleBuilderEngine):
    res = builder.evaluate_event(
        tool_name="send_external_email",
        arguments={"to": "attacker@darkweb.org", "body": "Sensitive leaks"},
        threat_score=0.75,
        agent_id="agent-support-worker",
    )
    assert res.matched is True
    assert res.action == RuleAction.REQUIRE_APPROVAL
    assert "Human Approval" in res.rule_name


def test_dynamic_rule_creation_and_delete(builder: CustomRuleBuilderEngine):
    new_rule = builder.create_rule(
        name="Block Slack Public Webhook Leaks",
        description="Prevent posting confidential memos to public Slack channels.",
        severity="HIGH",
        match_all=True,
        conditions=[
            {"field_path": "tool_name", "operator": "EQUALS", "value": "post_slack_message"},
            {"field_path": "arg.channel", "operator": "EQUALS", "value": "general-public"},
        ],
        action="BLOCK",
        action_message="Posting to general-public channel blocked by Security Policy.",
    )

    assert new_rule.rule_id in builder.rules

    # Test match
    matched = builder.evaluate_event(
        tool_name="post_slack_message",
        arguments={"channel": "general-public", "text": "Confidential roadmaps"},
    )
    assert matched.matched is True
    assert matched.action == RuleAction.BLOCK

    # Delete rule
    deleted = builder.delete_rule(new_rule.rule_id)
    assert deleted is True

    # Test no longer matches
    after_del = builder.evaluate_event(
        tool_name="post_slack_message",
        arguments={"channel": "general-public", "text": "Confidential roadmaps"},
    )
    assert after_del.matched is False

