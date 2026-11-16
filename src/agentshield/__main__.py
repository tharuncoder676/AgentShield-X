"""
AgentShield-X CLI entrypoint when executed via `python -m agentshield`
"""

import sys
from shield_core.cli import main

if __name__ == "__main__":
    sys.exit(main())
