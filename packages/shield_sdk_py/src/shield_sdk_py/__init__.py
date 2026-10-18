"""AgentShield-X Python SDK"""

from shield_sdk_py.client import AgentShield
from shield_sdk_py.exceptions import (
    ShieldBlockedException,
    ShieldException,
    ShieldSessionKilledException,
)
from shield_sdk_py.wrappers import wrap_agent

# Default singleton instance for quick usage
shield = AgentShield()

__all__ = [
    "AgentShield",
    "shield",
    "wrap_agent",
    "ShieldException",
    "ShieldBlockedException",
    "ShieldSessionKilledException",
]
