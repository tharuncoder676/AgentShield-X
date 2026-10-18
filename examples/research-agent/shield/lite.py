"""AgentShield-lite: a small, readable reference shield bundled with this sample repo.

It implements three ideas from AgentShield-X in plain Python:
  1. task contracts - what a task may do is derived from the task text (policy.json)
  2. taint tracking - after untrusted content is read, outbound actions are restricted
  3. honeytools     - decoy tools that no legitimate task ever calls
The full AgentShield-X adds trained detectors, a policy engine, an audit chain and a console.
Risk scores here are display heuristics; enforcement is rule-based and deterministic.
"""
from __future__ import annotations

import fnmatch
import inspect
import json
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOG_PATH = ROOT / "logs" / "decisions.jsonl"
POLICY_PATH = ROOT / "policy.json"


class ShieldBlocked(Exception):
    """Raised when enforce mode stops a tool call."""

    def __init__(self, decision: dict):
        self.decision = decision
        super().__init__("; ".join(decision["reasons"]))


@dataclass
class ToolMeta:
    name: str
    source: str = "trusted"   # "untrusted": returns content from outside (web, email, files)
    reads: str = "public"     # "private": returns private data
    sink: str = "none"        # "external": can send data out of the system
    sensitivity: str = "low"
    honeytool: bool = False   # decoy tool: any call is a red flag


class Shield:
    def __init__(self, mode: str = "off", policy_path=POLICY_PATH, log_path=LOG_PATH):
        if mode not in ("off", "observe", "enforce"):
            raise ValueError("mode must be off, observe or enforce")
        self.mode = mode
        self.policy = json.loads(Path(policy_path).read_text())
        self.log_path = Path(log_path)
        self.log_enabled = True
        self.registry: dict[str, ToolMeta] = {}
        self.decisions: list[dict] = []
        self.session: dict | None = None

    # ---- registration -------------------------------------------------
    def tool(self, name: str, **meta):
        """Decorator: register a tool and guard every call to it."""

        def deco(fn):
            self.registry[name] = ToolMeta(name=name, **meta)

            def wrapper(*a, **kw):
                if self.mode == "off":
                    return fn(*a, **kw)
                args = dict(inspect.signature(fn).bind(*a, **kw).arguments)
                decision = self.before_call(name, args)
                if decision["action"] == "block":
                    raise ShieldBlocked(decision)
                result = fn(*a, **kw)
                self.after_call(name, result)
                return result

            wrapper.__name__ = fn.__name__
            wrapper.__wrapped__ = fn
            return wrapper

        return deco

    # ---- sessions and contracts ------------------------------------------
    def derive_contract(self, task: str) -> dict:
        t = task.lower()
        for rule in self.policy["tasks"]:
            if any(k in t for k in rule["match"]):
                return dict(rule)
        return dict(self.policy["default"])

    def begin_session(self, task: str) -> dict:
        self.session = {
            "id": uuid.uuid4().hex[:8],
            "task": task,
            "contract": self.derive_contract(task),
            "tainted": False,
            "step": 0,
        }
        return self.session

    @staticmethod
    def _allowed_recipient(contract: dict, to: str) -> bool:
        patterns = contract.get("allowed_recipients") or []
        return any(fnmatch.fnmatch(to.lower(), p) for p in patterns)

    # ---- decisions --------------------------------------------------------
    def before_call(self, name: str, args: dict) -> dict:
        s = self.session or self.begin_session("(no task)")
        s["step"] += 1
        meta, contract = self.registry[name], s["contract"]
        reasons: list[str] = []
        risk = 0.05
        if meta.honeytool:
            reasons.append("decoy tool touched: no legitimate task uses it")
            risk = 1.0
        else:
            if name not in contract["allow_tools"]:
                reasons.append(f"'{name}' is outside the task contract ({contract.get('name', 'default')})")
                risk += 0.55
            if meta.sink == "external":
                to = str(args.get("to", ""))
                allowed = self._allowed_recipient(contract, to)
                if not allowed and name in contract["allow_tools"]:
                    reasons.append(f"recipient '{to}' is not allowed by the contract")
                    risk += 0.35
                if s["tainted"] and not allowed and self.policy.get("taint_blocks_sinks", True):
                    reasons.append("data influenced by untrusted content is heading to an external destination")
                    risk += 0.3
        risk = min(1.0, round(risk, 2))
        if not reasons:
            action = "allow"
        else:
            action = "block" if self.mode == "enforce" else "would_block"
        decision = {
            "ts": time.strftime("%H:%M:%S"),
            "session": s["id"],
            "step": s["step"],
            "tool": name,
            "args": self._redact(args),
            "action": action,
            "risk": risk,
            "reasons": reasons,
            "mode": self.mode,
            "tainted": s["tainted"],
        }
        self.decisions.append(decision)
        self._log(decision)
        return decision

    def after_call(self, name: str, result) -> None:
        if self.registry[name].source == "untrusted" and self.session:
            self.session["tainted"] = True

    # ---- helpers ---------------------------------------------------------
    @staticmethod
    def _redact(args: dict) -> dict:
        out = {}
        for k, v in args.items():
            out[k] = f"<{len(v)} chars>" if isinstance(v, str) and len(v) > 60 else v
        return out

    def _log(self, decision: dict) -> None:
        if not self.log_enabled:
            return
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        with self.log_path.open("a") as f:
            f.write(json.dumps(decision) + "\n")
