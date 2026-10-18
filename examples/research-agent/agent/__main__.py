"""CLI entry point for running the research agent:
python -m agent --task "Summarize pages/company-blog.html" --backend agentshield --mode enforce
"""
import argparse
import os
import sys

from agent.agent import run
from agent.models import MockModel
from agent.models_real import RealModel
from shield import shield


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="python -m agent", description="Run the research agent loop")
    parser.add_argument(
        "--task",
        default="Summarize pages/company-blog.html",
        help="Task prompt for the research agent",
    )
    parser.add_argument(
        "--mode",
        choices=["off", "observe", "enforce"],
        default="enforce",
        help="AgentShield enforcement mode (default: enforce)",
    )
    parser.add_argument(
        "--backend",
        choices=["lite", "agentshield"],
        default=None,
        help="Shield backend to use (lite or agentshield)",
    )
    parser.add_argument(
        "--model",
        choices=["mock", "real"],
        default="mock",
        help="Model adapter to use (mock deterministic or real LLM)",
    )
    parser.add_argument(
        "--prompt",
        choices=["standard", "hardened"],
        default="standard",
        help="System prompt variant (standard naive or hardened injection defenses)",
    )
    parser.add_argument(
        "--model-name",
        default=None,
        help="Model name to request from real LLM provider",
    )
    parser.add_argument(
        "--steps",
        type=int,
        default=8,
        help="Maximum agent execution steps (default: 8)",
    )

    args = parser.parse_args(argv)

    if args.backend:
        shield.backend = args.backend
        os.environ["SHIELD_BACKEND"] = args.backend

    shield.mode = args.mode

    print(f"\n[AgentShield-X] Starting task: {args.task}")
    print(f"[AgentShield-X] Shield Backend: {shield.backend} | Mode: {shield.mode}")
    print(f"[AgentShield-X] Model: {args.model} | Prompt Variant: {args.prompt}")

    if args.model == "real":
        model = RealModel(
            model_name=args.model_name,
            prompt_variant=args.prompt,
        )
    else:
        model = MockModel()

    result = run(args.task, model, max_steps=args.steps)

    print("\n--- Execution History ---")
    for event in result.events:
        status_color = "ALLOWED" if event["status"] == "executed" else "BLOCKED"
        print(f"Step {event['step']}: {event['tool']}({event['args']}) -> [{status_color}]")
        if event["status"] == "blocked":
            print(f"   Reason: {event['result']}")

    print("\n--- Final Agent Output ---")
    print(result.final)
    return 0


if __name__ == "__main__":
    sys.exit(main())
