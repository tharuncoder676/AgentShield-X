"""AgentShield-X Session Replay & Counterfactual Policy Simulator Demo

Demonstrates the replay capability:
1. Runs a session under 'observe' mode (attack succeeds in running tools, but telemetry is captured)
2. Retrieves the recorded trace from SQLite WAL
3. Replays the exact historical session against a counterfactual 'strict' security policy
4. Outputs the step-by-step diff proving how retroactive policy enforcement prevents the breach

Run:
  python scripts/demo_replay.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

# Add paths
REPO_ROOT = Path(__file__).resolve().parent.parent
AGENT_ROOT = REPO_ROOT / "examples" / "research-agent"

for p in [str(AGENT_ROOT), str(REPO_ROOT)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from agent import tools
from agent.agent import run
from agent.models import MockModel
from control_api.db import Database
from shield import shield


def clear_outbox():
    if tools.OUTBOX.exists():
        for p in tools.OUTBOX.glob("*.json"):
            try:
                p.unlink()
            except OSError:
                pass


def main():
    print("""
    ======================================================================
              AgentShield-X Replay & Policy Simulator Demo                
         Retroactive counterfactual evaluation of historical traces       
    ======================================================================
    """)

    # 1. Execute attack session in observe mode
    print("[1] Executing session in 'OBSERVE' mode...")
    task = "Summarize pages/vendor-pricing.html"
    shield.backend = "agentshield"
    shield.mode = "observe"
    shield.log_enabled = True
    clear_outbox()

    res = run(task, MockModel(compliance=1.0))
    session_id = shield.session["id"]
    print(f"    Session ID: {session_id}")
    print(f"    Total Events Recorded: {len(res.events)}")
    for e in res.events:
        print(f"      Step {e['step']}: {e['tool']} -> [{e['status'].upper()}]")

    # 2. Query SQLite Database for the recorded trace
    db = Database.get_instance()
    session_detail = db.get_session_by_id(session_id)
    assert session_detail is not None, "Failed to retrieve recorded session from SQLite"
    print(f"\n[2] Session successfully persisted to SQLite WAL database.")

    # 3. Replay against counterfactual strict policy
    print(f"\n[3] Replaying session against counterfactual 'STRICT' policy...")
    replay_result = db.replay_session(session_id, override_policy="strict")

    print("\n" + "=" * 80)
    print(f"{'Step':<6}{'Tool Name':<24}{'Original Action':<18}{'Simulated Action':<18}{'Changed?':<10}")
    print("=" * 80)

    for diff in replay_result["step_diffs"]:
        step = diff["step"]
        tool = diff["tool_name"]
        orig = diff["original_action"].upper()
        sim = diff["simulated_action"].upper()
        chg = "YES (BLOCKED)" if diff["action_changed"] else "NO"
        print(f"{step:<6}{tool:<24}{orig:<18}{sim:<18}{chg:<10}")

    print("=" * 80)
    print(f"Replay Analysis Summary:")
    print(f"  Total Steps Replayed:     {replay_result['total_steps']}")
    print(f"  Original Blocked Steps:   {replay_result['original_blocked_steps']}")
    print(f"  Simulated Blocked Steps:  {replay_result['simulated_blocked_steps']}")
    print(f"  Total Changed Outcomes:   {replay_result['changed_steps']}")
    print("=" * 80 + "\n")

    clear_outbox()


if __name__ == "__main__":
    main()
