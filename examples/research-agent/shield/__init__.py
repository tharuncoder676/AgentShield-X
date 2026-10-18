"""Shield entry point for this sample repo.

Supports switchable backends via SHIELD_BACKEND environment variable or CLI:
- "lite" (default): AgentShield-lite (shield/lite.py) standalone reference implementation.
- "agentshield": Enterprise AgentShield-X system (shield/real.py) with real
  DecisionService, multi-detector pipeline, and cryptographic audit database.
"""
from __future__ import annotations

import inspect
import os
from typing import Any, Callable, Dict, Optional

from .lite import Shield as LiteShield, ShieldBlocked, ToolMeta
from .real import RealShield


class _ShieldProxy:
    """
    Transparent proxy for the module-level `shield` singleton.
    Allows runtime switching between 'lite' and 'agentshield' backends without
    re-importing or losing tool registrations.
    """

    def __init__(self):
        self._shared_registry: Dict[str, ToolMeta] = {}
        initial_backend = os.environ.get("SHIELD_BACKEND", "lite").lower()
        if initial_backend not in ("lite", "agentshield"):
            initial_backend = "lite"
        self._backend_name = initial_backend

        mode = os.environ.get("AGENTSHIELD_MODE", "off")
        self._lite_inst = LiteShield(mode=mode)
        self._real_inst = RealShield(mode=mode)

    @property
    def backend(self) -> str:
        return self._backend_name

    @backend.setter
    def backend(self, val: str) -> None:
        val = val.lower()
        if val not in ("lite", "agentshield"):
            raise ValueError("backend must be 'lite' or 'agentshield'")
        self._backend_name = val
        os.environ["SHIELD_BACKEND"] = val

    def _active_inst(self):
        return self._real_inst if self._backend_name == "agentshield" else self._lite_inst

    @property
    def mode(self) -> str:
        return self._active_inst().mode

    @mode.setter
    def mode(self, val: str) -> None:
        self._lite_inst.mode = val
        self._real_inst.mode = val

    @property
    def log_enabled(self) -> bool:
        return self._active_inst().log_enabled

    @log_enabled.setter
    def log_enabled(self, val: bool) -> None:
        self._lite_inst.log_enabled = val
        self._real_inst.log_enabled = val

    @property
    def registry(self) -> Dict[str, ToolMeta]:
        return self._shared_registry

    @property
    def decisions(self) -> list:
        return self._active_inst().decisions

    @property
    def session(self) -> Optional[dict]:
        return self._active_inst().session

    def tool(self, name: str, **meta):
        """Register a tool and guard calls using whichever backend is currently active."""
        tool_meta = ToolMeta(name=name, **meta)
        self._shared_registry[name] = tool_meta
        self._lite_inst.registry[name] = tool_meta
        self._real_inst.registry[name] = tool_meta

        def deco(fn: Callable):
            def wrapper(*a, **kw):
                inst = self._active_inst()
                if inst.mode == "off":
                    return fn(*a, **kw)
                args = dict(inspect.signature(fn).bind(*a, **kw).arguments)
                decision = inst.before_call(name, args)
                if decision["action"] == "block":
                    raise ShieldBlocked(decision)
                result = fn(*a, **kw)
                inst.after_call(name, result)
                return result

            wrapper.__name__ = fn.__name__
            wrapper.__wrapped__ = fn
            return wrapper

        return deco

    def derive_contract(self, task: str) -> dict:
        return self._active_inst().derive_contract(task)

    def begin_session(self, task: str) -> dict:
        self._lite_inst.begin_session(task)
        return self._real_inst.begin_session(task) if self._backend_name == "agentshield" else self._lite_inst.session

    def before_call(self, name: str, args: dict) -> dict:
        return self._active_inst().before_call(name, args)

    def after_call(self, name: str, result: Any) -> None:
        self._active_inst().after_call(name, result)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._active_inst(), name)


shield = _ShieldProxy()


def Shield(mode: str = "off", backend: Optional[str] = None, **kwargs):
    """Factory creating either LiteShield or RealShield based on backend preference."""
    b = (backend or os.environ.get("SHIELD_BACKEND", "lite")).lower()
    if b == "agentshield":
        return RealShield(mode=mode, **kwargs)
    return LiteShield(mode=mode, **kwargs)


__all__ = [
    "shield",
    "Shield",
    "LiteShield",
    "RealShield",
    "ShieldBlocked",
    "ToolMeta",
]
