"""
Unit tests for AgentShield-X CLI Plugin System
"""

import pytest
from shield_core.plugins import (
    CLIPluginManager,
    CLIPluginManifest,
    PluginCategory,
)


@pytest.fixture
def manager() -> CLIPluginManager:
    return CLIPluginManager()


def test_default_plugins_exist(manager: CLIPluginManager):
    plugins = manager.list_plugins()
    assert len(plugins) >= 3
    cmds = [p.command_name for p in plugins]
    assert "k8s-scan" in cmds
    assert "aws-audit" in cmds
    assert "export-csv" in cmds


def test_install_custom_plugin(manager: CLIPluginManager):
    p = manager.install_plugin(
        plugin_id="plugin-slack-alerts",
        name="Slack Incident Dispatcher",
        command_name="slack-notify",
        description="Dispatches critical SOC alerts to Slack webhook.",
        category="INTEGRATION",
        author="SecOpsDev",
    )
    assert p.command_name == "slack-notify"
    assert "slack-notify" in manager.command_map

    # Test conflict prevention
    with pytest.raises(ValueError):
        manager.install_plugin(
            plugin_id="plugin-slack-alerts-2",
            name="Conflicting Slack Plugin",
            command_name="slack-notify",
            description="Duplicate command name",
        )


def test_execute_plugin(manager: CLIPluginManager):
    res_k8s = manager.execute_plugin("k8s-scan", ["prod-agents"])
    assert res_k8s["status"] == "SUCCESS"
    assert res_k8s["results"]["namespace"] == "prod-agents"
    assert res_k8s["results"]["shadow_agent_containers_detected"] >= 1

    res_aws = manager.execute_plugin("aws-audit")
    assert res_aws["status"] == "SUCCESS"
    assert "roles_audited" in res_aws["results"]


def test_remove_plugin(manager: CLIPluginManager):
    assert "plugin-csv-exporter" in manager.plugins
    assert "export-csv" in manager.command_map

    removed = manager.remove_plugin("plugin-csv-exporter")
    assert removed is True
    assert "plugin-csv-exporter" not in manager.plugins
    assert "export-csv" not in manager.command_map

