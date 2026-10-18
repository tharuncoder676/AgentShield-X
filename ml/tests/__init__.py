"""
AgentShield-X ML Tests Root Initialization
Ensures ml and packages directories are discoverable on sys.path.
"""

import os
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

DIRS_TO_ADD = [
    os.path.join(BASE_DIR, "packages", "shield_core", "src"),
    os.path.join(BASE_DIR, "ml"),
    BASE_DIR,
]

for d in DIRS_TO_ADD:
    if os.path.exists(d) and d not in sys.path:
        sys.path.insert(0, d)
