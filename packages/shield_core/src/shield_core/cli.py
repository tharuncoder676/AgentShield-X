"""
AgentShield-X Developer CLI
Provides the 'agentshield' command for terminal and CI/CD pipelines.

Usage:
  agentshield scan .
  agentshield scan examples/research-agent --mode enforce
  agentshield demo
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from shield_core.scanner import RepoScanner


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        prog="agentshield",
        description="AgentShield-X: Universal AI Agent Security CLI",
    )
    subparsers = parser.add_subparsers(dest="subcommand", help="Available commands")

    # Command: agentshield scan
    scan_parser = subparsers.add_parser("scan", help="Scan an agent repository for dangerous tool combinations & blast radius")
    scan_parser.add_argument(
        "target",
        nargs="?",
        default=".",
        help="Path to the repository or directory to scan (default: current directory .)",
    )
    scan_parser.add_argument(
        "--repo",
        default=None,
        help="Alternative flag to specify repository directory",
    )
    scan_parser.add_argument(
        "--mode",
        choices=["off", "observe", "enforce"],
        default="enforce",
        help="Shield mode verification (default: enforce)",
    )
    scan_parser.add_argument(
        "--json",
        action="store_true",
        help="Output results in machine-readable JSON format",
    )
    scan_parser.add_argument(
        "--fail-on",
        choices=["high", "medium", "info"],
        default=None,
        help="Exit with non-zero code if findings at or above this severity are detected",
    )

    # Command: agentshield demo
    demo_parser = subparsers.add_parser("demo", help="Run the live real-world agent attack containment demo")
    demo_parser.add_argument(
        "--lite",
        action="store_true",
        help="Run the 10-second lightweight ASCII demo",
    )

    # Parse arguments
    args = parser.parse_args(argv)

    if not args.subcommand:
        # Default to scan if no subcommand was given or if user ran `agentshield .`
        parser.print_help()
        return 0

    if args.subcommand == "scan":
        target_path = args.repo or args.target or "."
        resolved_path = Path(target_path).resolve()

        if not resolved_path.exists():
            print(f"Error: Directory '{target_path}' does not exist.", file=sys.stderr)
            return 2

        try:
            scanner = RepoScanner(resolved_path)
            report = scanner.scan(mode=args.mode)
        except Exception as e:
            print(f"Error scanning repository '{target_path}': {e}", file=sys.stderr)
            return 2

        if args.json:
            print(json.dumps(report, indent=2))
            return 0

        # Human-readable CLI output
        print(RepoScanner.render_text(report))

        br = report.get("blast_radius", {})
        print("Blast Radius Analysis:")
        print(f"  [+] Untrusted Entry Points:  {', '.join(br.get('entry_points', [])) or 'None'}")
        print(f"  [+] Private Data Reads:      {', '.join(br.get('private_data_reachable', [])) or 'None'}")
        print(f"  [+] Outbound Sinks:          {', '.join(br.get('outbound_channels_reachable', [])) or 'None'}")
        print(f"  [+] Decoy Tripwires:         {', '.join(br.get('decoy_tools', [])) or 'None'}")
        print("=" * 70)

        if args.fail_on:
            sev_levels = {"info": 0, "medium": 1, "high": 2}
            threshold = sev_levels.get(args.fail_on, 2)
            has_blocking_finding = any(
                sev_levels.get(f.get("severity", "info"), 0) >= threshold
                and f.get("status") == "open"
                for f in findings
            )
            if has_blocking_finding:
                print(f"\n[CI FAILURE] Open finding at or above severity '{args.fail_on}' detected.", file=sys.stderr)
                return 1

        return 0

    if args.subcommand == "demo":
        repo_root = Path(__file__).resolve().parents[4]
        if args.lite:
            script_path = repo_root / "scripts" / "demo_lite.py"
        else:
            script_path = repo_root / "scripts" / "demo_real.py"

        if script_path.exists():
            import subprocess
            return subprocess.call([sys.executable, str(script_path)])
        else:
            print(f"Demo script not found at {script_path}", file=sys.stderr)
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
