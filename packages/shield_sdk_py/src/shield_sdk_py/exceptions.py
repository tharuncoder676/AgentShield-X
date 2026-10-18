"""
AgentShield-X SDK Exceptions
Custom security exceptions raised when actions are blocked or sessions killed.
"""

from typing import Optional
from shield_core.models import Decision


class ShieldException(Exception):
    """Base exception for all AgentShield errors."""
    pass


class ShieldBlockedException(ShieldException):
    """Raised when an agent tool invocation is blocked by AgentShield."""

    def __init__(self, message: str, decision: Optional[Decision] = None) -> None:
        super().__init__(message)
        self.decision = decision


class ShieldSessionKilledException(ShieldBlockedException):
    """Raised when a session is terminated due to critical threat or honeypot engagement."""
    pass
