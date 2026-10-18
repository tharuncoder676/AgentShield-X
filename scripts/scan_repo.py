"""CLI Script: Bring-Your-Own-Repo Static Scanner

Usage:
  python scripts/scan_repo.py --repo examples/research-agent
  python scripts/scan_repo.py --repo examples/research-agent --mode enforce
  python scripts/scan_repo.py --repo examples/research-agent --json
  python scripts/scan_repo.py --repo examples/research-agent --fail-on high
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Add core packages to sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "packages" / "shield_core" / "src"))

from shield_core.scanner import RepoScanner


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        prog="python scripts/scan_repo.py",
        description="AgentShield-X Universal Static Agent Scanner",
    )
    parser.add_argument(
        "target",
        nargs="?",
        default=None,
        help="Path to the agent repository to scan (optional, or use --repo)",
    )
    parser.add_argument(
        "--repo",
        default=None,
        help="Path to the agent repository to scan",
    )
    parser.add_argument(
        "--mode",
        choices=["off", "observe", "enforce"],
        default="off",
        help="Simulated shield mode for policy verification (default: off)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results in JSON format",
    )
    parser.add_argument(
        "--fail-on",
        choices=["high", "medium", "info"],
        default=None,
        help="Exit with code 1 if an open finding at or above this severity is discovered",
    )

    args = parser.parse_args(argv)

    target_dir = args.target or args.repo or str(REPO_ROOT / "examples" / "research-agent")
    try:
        scanner = RepoScanner(target_dir)
        report = scanner.scan(mode=args.mode)
    except Exception as e:
        print(f"Error scanning repository: {e}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(scanner.render_text(report))

    return scanner.calculate_exit_code(report, fail_on=args.fail_on)


if __name__ == "__main__":
    sys.exit(main())
