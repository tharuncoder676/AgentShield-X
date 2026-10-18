"""
AgentShield-X Tests Root Initialization
Ensures all packages and detector directories are discoverable on sys.path.
"""

import os
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

DIRS_TO_ADD = [
    os.path.join(BASE_DIR, "packages", "shield_core", "src"),
    os.path.join(BASE_DIR, "packages", "shield_sdk_py", "src"),
    os.path.join(BASE_DIR, "packages", "eventbus", "src"),
    os.path.join(BASE_DIR, "detectors", "rules", "src"),
    os.path.join(BASE_DIR, "detectors", "pii", "src"),
    os.path.join(BASE_DIR, "detectors", "honey", "src"),
    os.path.join(BASE_DIR, "detectors", "injection", "src"),
    os.path.join(BASE_DIR, "detectors", "similarity", "src"),
    os.path.join(BASE_DIR, "detectors", "anomaly", "src"),
    os.path.join(BASE_DIR, "detectors", "intent", "src"),
    os.path.join(BASE_DIR, "services", "decision", "src"),
    os.path.join(BASE_DIR, "services", "gateway", "src"),
    BASE_DIR,
]

for d in DIRS_TO_ADD:
    if os.path.exists(d) and d not in sys.path:
        sys.path.insert(0, d)
