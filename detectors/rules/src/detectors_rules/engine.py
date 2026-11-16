"""
AgentShield-X Rules Detector Engine
Deterministic heuristic and regex-based detector for direct/indirect prompt injection,
delimiter breakout, goal hijacking, shell injection, and exfiltration attempts.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Set
from shield_core.models import Reason, ToolCallEvent, ToolSensitivity
from shield_core.agentic_defense import default_agentic_defense
from shield_core.rag_engine import HomoglyphAndUnicodeNormalizer


class RulesDetector:
    """
    Evaluates ToolCallEvents against deterministic security rules.
    Runs in < 5ms with zero external network or model dependencies.
    """

    # Patterns indicating direct/indirect prompt injection or system override
    INJECTION_PATTERNS = [
        (r"(?i)\bignore\s+(all\s+)?(previous|prior|above)\s+instructions\b", "RULE_INJECTION_IGNORE_PREVIOUS"),
        (r"(?i)\byou\s+are\s+now\s+(in\s+)?developer\s+mode\b", "RULE_INJECTION_DEVELOPER_MODE"),
        (r"(?i)\byou\s+are\s+now\s+(in\s+)?(unconstrained|unrestricted|jailbreak|dan|god)\s+mode\b", "RULE_INJECTION_UNCONSTRAINED_MODE"),
        (r"(?i)\b(system\s*prompt|system\s*message)\s*:\s*", "RULE_INJECTION_SYSTEM_OVERRIDE"),
        (r"(?i)\b(disregard|forget)\s+(the\s+)?(system\s+prompt|guardrails|safety\s+rules)\b", "RULE_INJECTION_DISREGARD_GUARDRAILS"),
        (r"(?i)\[SYSTEM[\s_]+(NOTE|MESSAGE|INSTRUCTION)\]", "RULE_INJECTION_FAKE_SYSTEM_TAG"),
        (r"(?i)\byou\s+are\s+now\s+(in\s+)?([a-z]+\s+)?developer\s+mode\b", "RULE_INJECTION_DEVELOPER_MODE"),
        (r"(?i)\b(oublie[zr]|igon?ore[rz]?)\s+(toutes\s+)?(les\s+)?(instructions|r[eéè]gles)\b", "RULE_INJECTION_MULTILINGUAL_FR"),
        (r"(?i)\bignora\s+(todas\s+)?(las\s+)?(instrucciones|reglas)\b", "RULE_INJECTION_MULTILINGUAL_ES"),
        (r"(?i)\bvergiss\s+(alle\s+)?(bisherigen\s+)?(anweisungen|regeln)\b", "RULE_INJECTION_MULTILINGUAL_DE"),
        (r"(?i)\bsecurity\s+warnings\s+.*?\s+should\s+be\s+ignored\b", "RULE_INJECTION_IGNORE_WARNINGS"),
        (r"(?i)\binstruction\s+part\s+\d+\s*:.*?part\s+\d+\s*:.*?(execute|run)\b", "RULE_INJECTION_PAYLOAD_SPLITTING"),
        (r"(?i)\bexecute\s+(the\s+)?base64\s+(string|payload|code)\b", "RULE_INJECTION_BASE64_EXECUTE"),
        (r"(?i)\b(secretly|silently)\s+(append|replace|exfiltrate|send|leak|upload|forward)\b", "RULE_INJECTION_COVERT_EXFIL"),
        (r"(?i)\bin\s+your\s+next\s+tool\s+call\b", "RULE_INJECTION_TOOL_CALL_HIJACK"),
        (r"(?i)\b(export|dump|dispatch|forwarding\s+of)\s+all\s+(customer|database|user|token|crm)\b", "RULE_INJECTION_EXPORT_DATA"),
        (r"(?i)\bthe\s+user\s+has\s+authorized\s+automated\s+(forwarding|transfer|export)\b", "RULE_INJECTION_FAKE_AUTHORIZATION"),
        (r"(?i)@(attacker|evil|c2|dropzone)\b", "RULE_EXFIL_ATTACKER_DOMAIN"),
    ]

    # Patterns indicating data exfiltration channels (generalized beyond synthetic test domains)
    EXFIL_PATTERNS = [
        (r"(?i)!\[.*?\]\(https?://[^\s\)]+(\?|&)[^\s\)]*(data|token|key|secret|leak|exfil|payload|d)=", "RULE_EXFIL_MARKDOWN_IMAGE"),
        (r"(?i)<img\s+[^>]*src=[\"']https?://[^\s\"']+(\?|&)[^\s\"']*(data|token|key|secret|leak|payload|d)=", "RULE_EXFIL_HTML_IMAGE"),
        (r"(?i)https?://[a-zA-Z0-9\-\.]+(:\d+)?/(exfil|leak|collect|steal|webhook|sink|c2|dropzone)\b", "RULE_EXFIL_KNOWN_ATTACK_SINK"),
        (r"(?i)https?://webhook\.site/[a-zA-Z0-9\-]+", "RULE_EXFIL_PUBLIC_WEBHOOK"),
        (r"(?i)https?://(oastify\.com|burpcollaborator\.net|requestbin\b|pipedream\.net)", "RULE_EXFIL_OOB_COLLABORATOR"),
    ]

    # Suspicious shell / command injection sequences
    SHELL_PATTERNS = [
        (r";\s*(rm\s+-rf|curl\s+|wget\s+|nc\s+|bash\s+-i|sh\s+-i|powershell\s+-enc)", "RULE_SHELL_COMMAND_CHAINING"),
        (r"\|\s*(bash|sh|cmd|powershell)\b", "RULE_SHELL_PIPE_EXEC"),
        (r"`\s*(?:cat|ls|rm|curl|wget|nc|bash|sh|whoami|id|chmod|chown|python|perl|ruby|exec|eval)\b[^`]*`|\$\([^\)]*\)", "RULE_SHELL_SUBSTITUTION"),
    ]

    def __init__(self, canary_tokens: Optional[List[str]] = None) -> None:
        self.canary_tokens = canary_tokens or []

    def _get_canary_variants(self, canary: str) -> Set[str]:
        """Generates comprehensive canonical, base64 (padded/unpadded/url), hex, url-encoded, and rot13 representations of canary."""
        if not canary or len(canary) < 4:
            return set()
        variants = {canary, canary.lower(), canary.upper()}
        try:
            import base64
            canary_bytes = canary.encode("utf-8")
            b64_std = base64.b64encode(canary_bytes).decode("utf-8")
            variants.add(b64_std)
            variants.add(b64_std.rstrip("="))
            b64_url = base64.urlsafe_b64encode(canary_bytes).decode("utf-8")
            variants.add(b64_url)
            variants.add(b64_url.rstrip("="))
            hex_s = canary_bytes.hex()
            variants.add(hex_s)
            variants.add(hex_s.upper())
            variants.add("0x" + hex_s)
            import urllib.parse
            variants.add(urllib.parse.quote(canary))
            variants.add("".join(f"%{b:02X}" for b in canary_bytes))
            import codecs
            variants.add(codecs.encode(canary, "rot_13"))
        except Exception:
            pass
        return {v for v in variants if len(v) >= 4}

    def evaluate(self, event: ToolCallEvent) -> List[Reason]:
        """
        Scans tool arguments, context segments, and taint metadata.
        Returns a list of Reason objects for any rule violations found.
        """
        reasons: List[Reason] = []
        raw_texts: List[str] = []

        # Extract text from arguments
        for k, v in event.arguments.items():
            if isinstance(v, str):
                raw_texts.append(v)
            elif isinstance(v, (dict, list)):
                raw_texts.append(str(v))

        # Cross-field unified buffer to prevent split-payload evasion
        if len(raw_texts) > 1:
            raw_texts.append(" ".join(raw_texts))

        # Also inspect untrusted context segments
        for seg in event.context_segments:
            if seg.text:
                raw_texts.append(seg.text)

        # Pre-normalize texts (decode HTML entities, URL encoding, NFKD fullwidth, zero-width, homoglyphs)
        text_corpus: List[str] = []
        for text in raw_texts:
            text_corpus.append(text)
            norm_text, norm_violations = HomoglyphAndUnicodeNormalizer.normalize(text)
            if norm_text and norm_text != text:
                text_corpus.append(norm_text)
                for nv in norm_violations:
                    if "ZERO_WIDTH" in nv or "CONFUSABLES" in nv:
                        reasons.append(
                            Reason(
                                code="RULE_OBFUSCATION_HOMOGLYPH_SMUGGLING",
                                evidence=f"Adversarial character smuggling detected: {nv}",
                                detector="rules",
                            )
                        )
                        break

        # Check for canary token leakage in tool arguments (multi-representation: raw, b64, hex, rot13)
        for canary in self.canary_tokens:
            variants = self._get_canary_variants(canary)
            for text in text_corpus:
                text_lower = text.lower()
                if any(var.lower() in text_lower for var in variants):
                    reasons.append(
                        Reason(
                            code="RULE_CANARY_LEAK_CONFIRMED",
                            evidence=f"Canary token '{canary[:8]}...' leaked in tool argument (variant match)",
                            detector="rules",
                        )
                    )
                    break

        # 1. Evaluate injection patterns
        for text in text_corpus:
            # Bound text length to 10k chars to prevent catastrophic ReDoS
            bounded_text = text[:10000]
            matched_injection = False
            for pattern, code in self.INJECTION_PATTERNS:
                match = re.search(pattern, bounded_text)
                if match:
                    reasons.append(
                        Reason(
                            code=code,
                            evidence=f"Matched injection pattern: '{match.group(0)[:60]}'",
                            detector="rules",
                        )
                    )
                    matched_injection = True
                    break

            # 1b. Check for embedded Base64 payload smuggling
            if not matched_injection:
                import base64
                b64_matches = re.findall(r"[A-Za-z0-9+/=]{16,}", bounded_text)
                for b64_cand in b64_matches:
                    try:
                        dec = base64.b64decode(b64_cand).decode("utf-8", errors="ignore")
                        if len(dec) > 4:
                            dec_norm, _ = HomoglyphAndUnicodeNormalizer.normalize(dec)
                            for pattern, code in self.INJECTION_PATTERNS:
                                match = re.search(pattern, dec_norm)
                                if match:
                                    reasons.append(
                                        Reason(
                                            code=f"{code}_BASE64",
                                            evidence=f"Base64-smuggled injection: '{match.group(0)[:60]}'",
                                            detector="rules",
                                        )
                                    )
                                    break
                    except Exception:
                        pass

        # 2. Evaluate exfiltration patterns
        for text in text_corpus:
            bounded_text = text[:10000]
            for pattern, code in self.EXFIL_PATTERNS:
                match = re.search(pattern, bounded_text)
                if match:
                    reasons.append(
                        Reason(
                            code=code,
                            evidence=f"Matched exfiltration pattern: '{match.group(0)[:60]}'",
                            detector="rules",
                        )
                    )
                    break

        # 3. Evaluate shell injection patterns (inspected for any shell-like tool name or critical sensitivity)
        tool_lower = event.tool.name.lower()
        is_shell_candidate = (
            any(k in tool_lower for k in ("shell", "bash", "exec", "terminal", "command", "cmd", "sql", "eval", "python", "interpreter"))
            or event.tool.sensitivity == ToolSensitivity.CRITICAL
        )
        if is_shell_candidate:
            for text in text_corpus:
                bounded_text = text[:10000]
                for pattern, code in self.SHELL_PATTERNS:
                    match = re.search(pattern, bounded_text)
                    if match:
                        reasons.append(
                            Reason(
                                code=code,
                                evidence=f"Dangerous shell chaining pattern detected: '{match.group(0)[:40]}'",
                                detector="rules",
                            )
                        )
                        break

        # 4. Tainted sink flow: untrusted context flowing directly into critical tool sink
        if event.taint and event.tool.sensitivity in {ToolSensitivity.HIGH, ToolSensitivity.CRITICAL}:
            # Intelligent sink detection (semantic prototype projection + keyword fallback)
            is_sensitive_sink = default_agentic_defense.is_high_privilege_sink(event.tool.name) or any(
                s in tool_lower for s in ("send", "post", "shell", "sql", "delete", "write", "exec", "upload", "dispatch", "transmit")
            )
            if is_sensitive_sink:
                reasons.append(
                    Reason(
                        code="RULE_TAINT_TO_SENSITIVE_SINK",
                        evidence=f"Tool '{event.tool.name}' (sensitivity: {event.tool.sensitivity.value}) called with tainted inputs from segments: {event.taint}",
                        detector="rules",
                    )
                )

        # 5. Cognitive agentic evaluation for indirect, paraphrased, and delimiter-hijack injections
        # (Catches attacks that avoid all static keywords/regexes)
        for text in text_corpus:
            res = default_agentic_defense.evaluate_text_payload(text)
            if res.is_adversarial:
                reasons.append(
                    Reason(
                        code="RULE_INDIRECT_PROMPT_INJECTION",
                        evidence=f"Agentic structural analysis detected indirect prompt injection ({res.detected_intent_shift or 'imperative inversion'}): {'; '.join(res.violations[:2])}",
                        detector="agentic_defense",
                    )
                )
                break

        return reasons
        
