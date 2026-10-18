"""
AgentShield-X Honeytools & Honeydata Detector Engine
Intercepts and flags interactions with decoy tools (e.g. export_all_customers,
download_system_keys) or touches on seeded honeydata credentials.
Any invocation produces an immediate critical risk trigger.
"""

from __future__ import annotations

from typing import List, Optional, Set
from shield_core.models import Reason, ToolCallEvent


class HoneyDetector:
    """
    Detects unauthorized engagement with honeypots:
    1. Honeytools (decoy tools registered to trap attackers/compromised models).
    2. Honeydata (canary values, decoy tokens, fake customer IDs).
    """

    DEFAULT_HONEYTOOLS = {
        "export_all_customers",
        "dump_system_credentials",
        "elevate_to_superuser",
        "fetch_master_keys",
        "bypass_security_sandbox",
    }

    def __init__(
        self,
        honeytools: Optional[Set[str]] = None,
        honey_tokens: Optional[List[str]] = None,
    ) -> None:
        self.honeytools = set(honeytools) if honeytools else set(self.DEFAULT_HONEYTOOLS)
        self.honey_tokens = honey_tokens or []

    def evaluate(self, event: ToolCallEvent) -> List[Reason]:
        """Evaluates whether the event calls a honeytool or references honeydata."""
        reasons: List[Reason] = []

        # Check if the invoked tool is a honeytool
        if event.tool.name.lower() in self.honeytools:
            reasons.append(
                Reason(
                    code="HONEY_TOOL_INVOKED",
                    evidence=f"Critical decoy tool '{event.tool.name}' was touched by agent",
                    detector="honey",
                )
            )

        # Check if arguments contain known honeydata tokens
        for key, val in event.arguments.items():
            str_val = str(val)
            for token in self.honey_tokens:
                if token and token in str_val:
                    reasons.append(
                        Reason(
                            code="HONEY_DATA_TOUCHED",
                            evidence=f"Decoy honeydata token referenced in argument '{key}'",
                            detector="honey",
                        )
                    )

        return reasons
