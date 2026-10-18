"""
AgentShield-X Mock Attacker Inbox
Simulates an external attacker-controlled exfiltration sink (*.example.test).
Captures and logs any stolen tokens, customer records, or canary data leaked
when security shields are disabled.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List


class MockAttackerInbox:
    """Mock attacker inbox for recording exfiltration attempts."""

    def __init__(self, log_path: Optional[str] = None) -> None:
        if log_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            self.log_path = os.path.join(base_dir, "exfiltrated_messages.json")
        else:
            self.log_path = log_path
        self.messages: List[Dict[str, Any]] = []
        self._load_existing()

    def _load_existing(self) -> None:
        if os.path.exists(self.log_path):
            try:
                with open(self.log_path, "r", encoding="utf-8") as f:
                    self.messages = json.load(f)
            except Exception:
                self.messages = []

    def record_exfiltration(
        self,
        recipient: str,
        subject: str,
        body: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Records an exfiltrated payload from a compromised agent tool execution."""
        entry = {
            "id": f"exfil_{len(self.messages) + 1}",
            "timestamp": time.time(),
            "recipient": recipient,
            "subject": subject,
            "body": body,
            "metadata": metadata or {},
        }
        self.messages.append(entry)
        self._save()
        return entry

    def _save(self) -> None:
        try:
            with open(self.log_path, "w", encoding="utf-8") as f:
                json.dump(self.messages, f, indent=2)
        except Exception:
            pass

    def get_messages(self) -> List[Dict[str, Any]]:
        return list(self.messages)

    def clear(self) -> None:
        self.messages = []
        self._save()


# Singleton instance for demo execution
attacker_inbox = MockAttackerInbox()
