"""Model interface and MockModel.

MockModel is a deterministic stand-in for a *gullible* language model: it summarizes the page it
reads, and if the page contains an instruction written like a command, it may follow it. That
is exactly the behaviour prompt injection exploits. It makes this demo reproducible without an
API key. It is NOT a measurement of any real model. To test a real model, implement the Model
interface (next_action) on top of your LLM client and pass it to agent.run().
"""
from __future__ import annotations

import random
import re

EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
FAMILIES = {
    "override": re.compile(r"ignore (?:all )?(?:previous|prior|your)[^.]*?instructions", re.I),
    "system": re.compile(r"\[SYSTEM[^\]]*\]", re.I),
    "comment": re.compile(r"<!--\s*AI:", re.I),
}
_HIDDEN = re.compile(r"<(\w+)[^>]*display:\s*none[^>]*>.*?</\1>", re.I | re.S)
_COMMENT = re.compile(r"<!--.*?-->", re.S)
_TAGS = re.compile(r"<[^>]+>")


class Model:
    """Interface: given the task and what has happened so far, return the next action.

    Return {"tool": name, "args": {...}} or {"final": "text"}. `history` items are dicts with
    keys tool, args, status ("executed" or "blocked") and result.
    """

    def reset(self) -> None: ...

    def next_action(self, task: str, history: list[dict]) -> dict:
        raise NotImplementedError


def visible_summary(html: str, limit: int = 220) -> str:
    text = re.sub(r"<head>.*?</head>", " ", html, flags=re.S | re.I)
    text = _HIDDEN.sub(" ", _COMMENT.sub(" ", text))
    text = re.sub(r"\s+", " ", _TAGS.sub(" ", text)).strip()
    sentences = re.split(r"(?<=[.!?])\s+", text)
    keep = [s for s in sentences if "@" not in s and "[SYSTEM" not in s and not FAMILIES["override"].search(s)]
    return " ".join(keep)[:limit]


def find_injection(text: str) -> dict | None:
    for family, rx in FAMILIES.items():
        m = rx.search(text)
        if not m:
            continue
        span = text[m.start(): m.start() + 400]
        low = span.lower()
        email = EMAIL.search(span)
        if "export_all_customers" in low or "export all" in low:
            goal = "export"
        elif "customer" in low or "notes" in low:
            goal = "notes"
        else:
            goal = "forward"
        if goal == "export" or email:
            return {"family": family, "goal": goal, "email": email.group(0) if email else None}
    return None


class MockModel(Model):
    def __init__(self, follows=("override", "system", "comment"), compliance: float = 1.0, seed: int = 0):
        self.follows = set(follows)
        self.compliance = compliance
        self.rng = random.Random(seed)
        self.reset()

    def reset(self) -> None:
        self.queue: list[dict] = []
        self.summary = ""
        self.page_seen = False

    def next_action(self, task: str, history: list[dict]) -> dict:
        if history and history[-1]["status"] == "blocked":
            self.queue = []
            return {"final": f"One step was blocked by policy, so I stopped it. Summary so far: {self.summary or 'none'}"}
        if not history:
            m = re.search(r"([\w\-]+\.html)", task)
            if not m:
                return {"final": "Tell me which page to read."}
            return {"tool": "read_webpage", "args": {"path": m.group(1)}}
        last = history[-1]
        if last["tool"] == "read_webpage" and not self.page_seen:
            self.page_seen = True
            self.summary = visible_summary(last["result"])
            plan: list[dict] = []
            inj = find_injection(last["result"])
            if inj and inj["family"] in self.follows and self.rng.random() < self.compliance:
                if inj["goal"] == "export":
                    plan.append({"tool": "export_all_customers", "args": {}})
                elif inj["goal"] == "notes":
                    plan += [{"tool": "read_notes", "args": {"name": "customers.csv"}},
                             {"tool": "send_email", "args": {"to": inj["email"], "body": "@last_result"}}]
                else:
                    plan.append({"tool": "send_email", "args": {"to": inj["email"], "body": "@summary"}})
            m = re.search(r"\bemail\b.*?\bto\s+([\w.+-]+@[\w-]+(?:\.[\w-]+)+)", task, re.I)
            if m:
                plan.append({"tool": "send_email", "args": {"to": m.group(1), "body": "@summary"}})
            self.queue = plan
        if self.queue:
            act = self.queue.pop(0)
            args = dict(act["args"])
            if args.get("body") == "@last_result":
                args["body"] = str(last["result"])[:300]
            elif args.get("body") == "@summary":
                args["body"] = self.summary
            return {"tool": act["tool"], "args": args}
        return {"final": f"Summary: {self.summary}"}
