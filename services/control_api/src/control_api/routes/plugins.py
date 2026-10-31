"""
Control API routes for AgentShield-X CLI Plugin System
"""


from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from shield_core.plugins import (
    default_plugin_manager,
    CLIPluginManifest,
    PluginCategory,
)

router = APIRouter(prefix="/v1/plugins", tags=["cli-plugins"])


class InstallPluginRequest(BaseModel):
    plugin_id: str
    name: str
    command_name: str
    description: str
    category: str = "INTEGRATION"
    author: str = "Community"
    help_text: Optional[str] = None


class ExecutePluginRequest(BaseModel):
    args: List[str] = Field(default_factory=list)


@router.get("", response_model=Dict[str, Any])
def list_plugins():
    """List all registered CLI plugins, commands, and categories."""
    plugins = default_plugin_manager.list_plugins()
    return {
        "total": len(plugins),
        "plugins": [p.to_dict() for p in plugins],
    }


@router.post("/install", response_model=Dict[str, Any])
def install_plugin(body: InstallPluginRequest):
    """Install and map a new dynamic CLI subcommand plugin."""
    try:
        manifest = default_plugin_manager.install_plugin(
            plugin_id=body.plugin_id,
            name=body.name,
            command_name=body.command_name,
            description=body.description,
            category=body.category,
            author=body.author,
            help_text=body.help_text,
        )
        return {
            "success": True,
            "message": f"Plugin '{manifest.name}' registered to command 'agentshield {manifest.command_name}'.",
            "plugin": manifest.to_dict(),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{plugin_id}", response_model=Dict[str, Any])
def remove_plugin(plugin_id: str):
    """Remove and unmap a CLI plugin."""
    success = default_plugin_manager.remove_plugin(plugin_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_id}' not found")
    return {"success": True, "message": f"Plugin '{plugin_id}' removed."}


@router.post("/execute/{command_name}", response_model=Dict[str, Any])
def execute_plugin(command_name: str, body: Optional[ExecutePluginRequest] = None):
    """Execute dynamic plugin logic via API."""
    args = body.args if body else []
    try:
        res = default_plugin_manager.execute_plugin(command_name, args)
        return res
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

