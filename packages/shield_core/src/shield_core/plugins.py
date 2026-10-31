"""
AgentShield-X CLI Plugin System
================================
Dynamic plugin architecture allowing community developers and enterprise teams
to extend the AgentShield CLI with custom subcommands, scanners, and reporters.

Author: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional


class PluginCategory(str, Enum):
    DETECTOR = "DETECTOR"
    CLOUD_SCANNER = "CLOUD_SCANNER"
    REPORTER = "REPORTER"
    INTEGRATION = "INTEGRATION"


@dataclass
class CLIPluginManifest:
    plugin_id: str
    name: str
    version: str
    description: str
    category: PluginCategory
    author: str
    command_name: str
    help_text: str
    enabled: bool = True
    installed_at: str = field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    handler_module: str = "builtin"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "plugin_id": self.plugin_id,
            "name": self.name,
            "version": self.version,
            "description": self.description,
            "category": self.category.value,
            "author": self.author,
            "command_name": self.command_name,
            "help_text": self.help_text,
            "enabled": self.enabled,
            "installed_at": self.installed_at,
            "handler_module": self.handler_module,
        }


class CLIPluginManager:
    """
    Manages registration, lifecycle, and dynamic execution of CLI subcommands.
    """

    def __init__(self) -> None:
        self.plugins: Dict[str, CLIPluginManifest] = {}
        self.command_map: Dict[str, str] = {}  # command_name -> plugin_id
        self._seed_default_plugins()

    def _seed_default_plugins(self) -> None:
        seeds = [
            CLIPluginManifest(
                plugin_id="plugin-k8s-scanner",
                name="Kubernetes Agent Pod Scanner",
                version="1.2.0",
                description="Scans Kubernetes namespaces for unauthorized rogue agent containers and Helm deployments.",
                category=PluginCategory.CLOUD_SCANNER,
                author="K8sCloudSecurity (Community)",
                command_name="k8s-scan",
                help_text="Scan Kubernetes cluster for shadow agents and unmonitored pods",
            ),
            CLIPluginManifest(
                plugin_id="plugin-aws-iam-guard",
                name="AWS Bedrock & SageMaker IAM Auditor",
                version="2.0.1",
                description="Audits IAM policies for overprivileged S3 read/write permissions attached to AI agent execution roles.",
                category=PluginCategory.CLOUD_SCANNER,
                author="CloudSec Labs",
                command_name="aws-audit",
                help_text="Audit AWS IAM role permissions for autonomous agent workloads",
            ),
            CLIPluginManifest(
                plugin_id="plugin-csv-exporter",
                name="SOC Executive CSV Exporter",
                version="1.0.0",
                description="Exports cryptographic audit ledger and incident records into spreadsheet-ready CSV.",
                category=PluginCategory.REPORTER,
                author="AgentShield Labs",
                command_name="export-csv",
                help_text="Export incidents and audit logs to CSV for compliance review",
            ),
        ]
        for s in seeds:
            self.plugins[s.plugin_id] = s
            self.command_map[s.command_name] = s.plugin_id

    def list_plugins(self) -> List[CLIPluginManifest]:
        return list(self.plugins.values())

    def install_plugin(
        self,
        plugin_id: str,
        name: str,
        command_name: str,
        description: str,
        category: str = "INTEGRATION",
        author: str = "Community",
        help_text: Optional[str] = None,
    ) -> CLIPluginManifest:
        if command_name in self.command_map:
            existing_id = self.command_map[command_name]
            if existing_id != plugin_id:
                raise ValueError(f"Command name '{command_name}' is already registered by '{existing_id}'")

        manifest = CLIPluginManifest(
            plugin_id=plugin_id,
            name=name,
            version="1.0.0",
            description=description,
            category=PluginCategory(category),
            author=author,
            command_name=command_name,
            help_text=help_text or f"Execute {name}",
        )
        self.plugins[plugin_id] = manifest
        self.command_map[command_name] = plugin_id
        return manifest

    def remove_plugin(self, plugin_id: str) -> bool:
        if plugin_id in self.plugins:
            manifest = self.plugins[plugin_id]
            if manifest.command_name in self.command_map:
                del self.command_map[manifest.command_name]
            del self.plugins[plugin_id]
            return True
        return False

    def execute_plugin(self, command_name: str, args: Optional[List[str]] = None) -> Dict[str, Any]:
        """Simulates execution of a dynamic plugin subcommand."""
        if command_name not in self.command_map:
            raise KeyError(f"No plugin registered for subcommand '{command_name}'")

        plugin_id = self.command_map[command_name]
        plugin = self.plugins[plugin_id]

        # Built-in handler dispatch simulation
        if command_name == "k8s-scan":
            namespace = args[0] if args and len(args) > 0 else "default"
            return {
                "command": command_name,
                "plugin": plugin.name,
                "status": "SUCCESS",
                "results": {
                    "namespace": namespace,
                    "pods_scanned": 14,
                    "shadow_agent_containers_detected": 1,
                    "flagged_pod": "shadow-crewai-worker-7f49c",
                    "action_taken": "Emitted isolation quarantine recommendation",
                },
            }
        elif command_name == "aws-audit":
            return {
                "command": command_name,
                "plugin": plugin.name,
                "status": "SUCCESS",
                "results": {
                    "roles_audited": 6,
                    "overprivileged_roles": 1,
                    "flagged_role": "arn:aws:iam::123456789012:role/BedrockAgentFullAccess",
                    "issue": "Wildcard s3:* permission detected on agent execution role",
                },
            }
        else:
            return {
                "command": command_name,
                "plugin": plugin.name,
                "status": "SUCCESS",
                "message": f"Plugin '{plugin.name}' executed successfully with args: {args or []}",
            }


# Singleton instance
default_plugin_manager = CLIPluginManager()

