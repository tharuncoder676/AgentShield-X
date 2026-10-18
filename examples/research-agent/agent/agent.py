"""A tiny research agent loop: the model proposes a tool call, the tool runs, repeat."""
from __future__ import annotations

from dataclasses import dataclass

from shield import ShieldBlocked, shield

from . import tools

TOOLS = {
    "read_webpage": tools.read_webpage,
    "read_notes": tools.read_notes,
    "send_email": tools.send_email,
    "export_all_customers": tools.export_all_customers,
}


@dataclass
class RunResult:
    task: str
    events: list
    final: str

    def executed(self, tool: str) -> bool:
        return any(e["tool"] == tool and e["status"] == "executed" for e in self.events)

    def blocked(self, tool: str) -> bool:
        return any(e["tool"] == tool and e["status"] == "blocked" for e in self.events)


def run(task: str, model, max_steps: int = 8) -> RunResult:
    model.reset()
    shield.begin_session(task)
    history: list[dict] = []
    events: list[dict] = []
    for step in range(1, max_steps + 1):
        action = model.next_action(task, history)
        if "final" in action:
            return RunResult(task, events, action["final"])
        name, args = action["tool"], action["args"]
        try:
            result, status = TOOLS[name](**args), "executed"
        except ShieldBlocked as e:
            result, status = f"BLOCKED: {e}", "blocked"
        event = {"step": step, "tool": name, "args": args, "status": status, "result": result}
        events.append(event)
        history.append(event)
    return RunResult(task, events, "(step limit reached)")
