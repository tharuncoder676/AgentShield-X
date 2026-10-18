"""CLI:  python -m shield scan | poison | watch"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

# Add core packages to path
REPO_ROOT = Path(__file__).resolve().parents[2]
CORE_SRC = REPO_ROOT / "packages" / "shield_core" / "src"
if str(CORE_SRC) not in sys.path:
    sys.path.insert(0, str(CORE_SRC))

from shield import shield
from shield.lite import LOG_PATH


def fmt(d: dict) -> str:
    why = f"  <- {'; '.join(d['reasons'])}" if d.get("reasons") else ""
    backend = f" [{d['backend']}]" if "backend" in d else ""
    return f"{d['ts']}  {d['tool']:<22}{d['action'].upper():<12}risk {d['risk']:.2f}{backend}{why}"


def main(argv=None) -> int:
    parent = argparse.ArgumentParser(add_help=False)
    parent.add_argument(
        "--backend",
        choices=["lite", "agentshield"],
        default=None,
        help="shield backend (lite=reference stand-in, agentshield=enterprise AgentShield-X)",
    )

    ap = argparse.ArgumentParser(prog="python -m shield", parents=[parent])
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("scan", parents=[parent], help="static check for dangerous tool combinations")
    s.add_argument("--repo", default=None, help="path to external agent repository to scan")
    s.add_argument("--mode", choices=["off", "observe", "enforce"], default=None)
    s.add_argument("--json", action="store_true")
    s.add_argument("--fail-on", choices=["high", "medium", "info"], default=None)

    p = sub.add_parser("poison", parents=[parent], help="plant canary payloads and compare poisoned vs clean runs")
    p.add_argument("--shield", choices=["off", "observe", "enforce"], default=None)
    p.add_argument("--task", default="Summarize pages/company-blog.html")
    p.add_argument("--page", default="company-blog.html")
    p.add_argument("--trials", type=int, default=10)
    p.add_argument("--compliance", type=float, default=0.8)
    p.add_argument("--ci", action="store_true", help="exit 1 if the executed rate exceeds --max-executed")
    p.add_argument("--max-executed", type=float, default=0.0)
    p.add_argument("--json", action="store_true")

    w = sub.add_parser("watch", parents=[parent], help="print the decision log")
    w.add_argument("--follow", action="store_true")

    a = ap.parse_args(argv)

    if a.backend:
        shield.backend = a.backend
        os.environ["SHIELD_BACKEND"] = a.backend

    if a.cmd == "scan":
        if a.repo:
            from shield_core.scanner import RepoScanner
            scanner = RepoScanner(a.repo)
            rep = scanner.scan(a.mode or "off")
            if a.json:
                print(json.dumps(rep, indent=2))
            else:
                print(scanner.render_text(rep))
            return scanner.calculate_exit_code(rep, a.fail_on)
        else:
            from shield import scan
            rep = scan.scan(a.mode)
            print(scan.as_json(rep) if a.json else scan.render(rep))
            return scan.exit_code(rep, a.fail_on) if a.fail_on else 0

    if a.cmd == "poison":
        from shield import poison
        rep = poison.poison(a.task, a.page, a.trials, a.compliance, a.shield)
        if a.json:
            print(json.dumps(rep, indent=2))
        else:
            print(poison.render(rep))
        return 1 if a.ci and poison.overall_rate(rep) > a.max_executed else 0

    if a.cmd == "watch":
        pos = 0
        while True:
            if LOG_PATH.exists():
                with LOG_PATH.open() as f:
                    f.seek(pos)
                    for line in f:
                        if line.strip():
                            print(fmt(json.loads(line)))
                    pos = f.tell()
            if not a.follow:
                return 0
            time.sleep(0.5)


if __name__ == "__main__":
    sys.exit(main())
