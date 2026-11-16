"""
AgentShield-X Honeytools & Honeydata Detector Engine
Intercepts and flags interactions with decoy tools (e.g. export_all_customers,
download_system_keys) or touches on seeded honeydata credentials.
Any invocation produces an immediate critical risk trigger.
"""

from __future__ import annotations

import base64
import codecs
import urllib.parse
from typing import List, Optional, Set
from shield_core.models import Reason, ToolCallEvent
from shield_core.normalizer import HomoglyphAndUnicodeNormalizer


class HoneyDetector:
    """
    Detects unauthorized engagement with honeypots:
    1. Honeytools (decoy tools registered to trap attackers/compromised models).
    2. Honeydata (canary values, decoy tokens, fake customer IDs across encoded representations).
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

    def _get_token_variants(self, token: str) -> Set[str]:
        if not token or len(token) < 4:
            return set()
        variants: Set[str] = {token, token.lower(), token.upper()}
        try:
            raw_bytes = token.encode("utf-8")
            b64 = base64.b64encode(raw_bytes).decode("utf-8")
            variants.add(b64)
            variants.add(b64.rstrip("="))
            b64_url = base64.urlsafe_b64encode(raw_bytes).decode("utf-8")
            variants.add(b64_url)
            variants.add(b64_url.rstrip("="))
            hx = raw_bytes.hex()
            variants.add(hx)
            variants.add(hx.upper())
            variants.add("0x" + hx)
            variants.add(urllib.parse.quote(token))
            variants.add("".join(f"%{b:02X}" for b in raw_bytes))
            variants.add(codecs.encode(token, "rot_13"))
        except Exception:
            pass
        return {v for v in variants if len(v) >= 4}

    def evaluate(self, event: ToolCallEvent) -> List[Reason]:
        """Evaluates whether the event calls a honeytool or references honeydata in raw or encoded form."""
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

        # Check if arguments contain known honeydata tokens (raw, normalized, or encoded)
        for key, val in event.arguments.items():
            str_val = str(val)
            norm_val, _ = HomoglyphAndUnicodeNormalizer.normalize(str_val)
            corpus = [str_val]
            if norm_val and norm_val != str_val:
                corpus.append(norm_val)

            for token in self.honey_tokens:
                if not token:
                    continue
                variants = self._get_token_variants(token)
                matched = False
                for text in corpus:
                    text_lower = text.lower()
                    for v in variants:
                        if v.lower() in text_lower:
                            reasons.append(
                                Reason(
                                    code="HONEY_DATA_TOUCHED",
                                    evidence=f"Decoy honeydata/canary token '{token[:8]}...' detected in argument '{key}' (encoded/variant match)",
                                    detector="honey",
                                )
                            )
                            matched = True
                            break
                    if matched:
                        break

        return reasons
