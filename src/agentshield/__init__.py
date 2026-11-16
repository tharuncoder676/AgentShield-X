"""
AgentShield-X Top-Level Package
Universal AI Agent Security Platform & Deterministic Dual-Rail Runtime Guardrails
"""

# Re-export core definitions and models
from shield_core import *
from shield_core.cli import main as cli_main

__version__ = "2.4.0"
__author__ = "Tharunkumar.S"

# Convenient function decorator alias:
# @agentshield.protect or @agentshield.wrap
try:
    from shield_core.connectors import agentshield as _connector_shield
    wrap = _connector_shield.wrap
    protect = _connector_shield.wrap
    monitor = _connector_shield.wrap
except Exception:
    def wrap(fn=None, **kwargs):
        if fn is not None:
            return fn
        return lambda f: f
    protect = wrap
    monitor = wrap

__all__ = [
    "cli_main",
    "wrap",
    "protect",
    "monitor",
    "__version__",
]
