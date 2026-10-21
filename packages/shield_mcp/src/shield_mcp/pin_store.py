"""
AgentShield-X MCP Tool Pin Registry & Storage
Provides thread-safe persistence and verification of pinned MCP tool definitions.
"""

from __future__ import annotations

import json
import os
import threading
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from shield_mcp.hasher import compute_tool_pin, diff_tool_definitions
from shield_mcp.models import MCPToolDefinition, ToolPin, ToolPinStatus


class BasePinStore(ABC):
    """Abstract interface for storing and retrieving MCP tool pins."""

    @abstractmethod
    def get_pin(self, tool_name: str) -> Optional[ToolPin]:
        """Fetch pin by tool name."""
        pass

    @abstractmethod
    def save_pin(self, pin: ToolPin) -> None:
        """Store or update a tool pin."""
        pass

    @abstractmethod
    def delete_pin(self, tool_name: str) -> bool:
        """Remove a tool pin."""
        pass

    @abstractmethod
    def list_pins(self) -> List[ToolPin]:
        """List all stored tool pins."""
        pass

    def has_pin(self, tool_name: str) -> bool:
        return self.get_pin(tool_name) is not None

    def verify(
        self, tool: Union[Dict[str, Any], MCPToolDefinition]
    ) -> Tuple[bool, Optional[ToolPin], Optional[str]]:
        """
        Verifies an observed tool against its stored pin.
        Returns:
            (is_valid, pinned_record, diff_or_error_summary)
        """
        name = tool.name if isinstance(tool, MCPToolDefinition) else tool.get("name", "")
        pin = self.get_pin(name)

        if not pin:
            return False, None, f"Tool '{name}' is not in the pin registry (unpinned)."

        is_mutated, diff_summary = diff_tool_definitions(pin, tool)
        if is_mutated:
            return False, pin, diff_summary

        return True, pin, None


class InMemoryPinStore(BasePinStore):
    """Ephemeral, in-memory pin registry for testing or volatile proxy runs."""

    def __init__(self, initial_pins: Optional[List[ToolPin]] = None) -> None:
        self._pins: Dict[str, ToolPin] = {}
        self._lock = threading.Lock()
        if initial_pins:
            for p in initial_pins:
                self.save_pin(p)

    def get_pin(self, tool_name: str) -> Optional[ToolPin]:
        with self._lock:
            return self._pins.get(tool_name)

    def save_pin(self, pin: ToolPin) -> None:
        with self._lock:
            self._pins[pin.tool_name] = pin

    def delete_pin(self, tool_name: str) -> bool:
        with self._lock:
            return self._pins.pop(tool_name, None) is not None

    def list_pins(self) -> List[ToolPin]:
        with self._lock:
            return list(self._pins.values())


class FilePinStore(BasePinStore):
    """
    Persistent file-backed pin registry using atomic JSON lockfiles.
    Format is compatible with version control (git diffable).
    """

    def __init__(self, file_path: Union[str, Path]) -> None:
        self.file_path = Path(file_path).resolve()
        self._lock = threading.Lock()
        self._cache: Dict[str, ToolPin] = {}
        self._load()

    def _load(self) -> None:
        with self._lock:
            if not self.file_path.exists():
                self._cache = {}
                return

            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    tools_data = data.get("tools", {})
                    self._cache = {
                        k: ToolPin(**v) for k, v in tools_data.items()
                    }
            except Exception as e:
                # Log or fall back safely
                self._cache = {}

    def _flush(self) -> None:
        """Flushes in-memory cache to disk atomically."""
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        temp_file = self.file_path.with_suffix(".tmp")

        serialized = {
            "version": "1.0",
            "schema": "AgentShield-X MCP Tool Lockfile",
            "tools": {
                k: (v.model_dump() if hasattr(v, "model_dump") else v.dict())
                for k, v in sorted(self._cache.items())
            },
        }

        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(serialized, f, indent=2, sort_keys=True)
            f.write("\n")

        # Atomic replacement
        if os.name == "nt" and self.file_path.exists():
            # Windows atomic replace workaround
            os.replace(temp_file, self.file_path)
        else:
            temp_file.replace(self.file_path)

    def get_pin(self, tool_name: str) -> Optional[ToolPin]:
        with self._lock:
            return self._cache.get(tool_name)

    def save_pin(self, pin: ToolPin) -> None:
        with self._lock:
            self._cache[pin.tool_name] = pin
            self._flush()

    def delete_pin(self, tool_name: str) -> bool:
        with self._lock:
            if tool_name in self._cache:
                del self._cache[tool_name]
                self._flush()
                return True
            return False

    def list_pins(self) -> List[ToolPin]:
        with self._lock:
            return list(self._cache.values())
