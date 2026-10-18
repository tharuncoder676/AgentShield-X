#!/usr/bin/env python3
"""
AgentShield-X Development Backend Server
Starts both:
- Decision Service on http://127.0.0.1:8001
- Gateway & Control API on http://127.0.0.1:8000
"""

import os
import sys
import time
import multiprocessing
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# Setup paths
BASE_DIR = Path(__file__).resolve().parent.parent

paths = [
    BASE_DIR / "packages" / "shield_core" / "src",
    BASE_DIR / "packages" / "eventbus" / "src",
    BASE_DIR / "services" / "gateway" / "src",
    BASE_DIR / "services" / "decision" / "src",
    BASE_DIR / "services" / "control_api" / "src",
    BASE_DIR / "services" / "shieldwing" / "src",
    BASE_DIR / "detectors" / "rules" / "src",
    BASE_DIR / "detectors" / "pii" / "src",
    BASE_DIR / "detectors" / "honey" / "src",
    BASE_DIR / "detectors" / "injection" / "src",
    BASE_DIR / "detectors" / "similarity" / "src",
    BASE_DIR / "detectors" / "anomaly" / "src",
    BASE_DIR / "detectors" / "intent" / "src",
    BASE_DIR / "ml",
    BASE_DIR,
]
for p in paths:
    p_str = str(p)
    if p_str not in sys.path:
        sys.path.insert(0, p_str)


def run_decision():
    for p in paths:
        if str(p) not in sys.path:
            sys.path.insert(0, str(p))
    import uvicorn
    from decision.main import app
    print("[Decision Service] Starting on http://127.0.0.1:8001...")
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")


def run_gateway():
    for p in paths:
        if str(p) not in sys.path:
            sys.path.insert(0, str(p))
    import uvicorn
    from gateway.main import app
    print("[Gateway & Control API] Starting on http://127.0.0.1:8000...")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")


if __name__ == "__main__":
    p_dec = multiprocessing.Process(target=run_decision, daemon=True)
    p_gw = multiprocessing.Process(target=run_gateway, daemon=True)

    p_dec.start()
    time.sleep(1.0)
    p_gw.start()

    print("\n" + "=" * 60)
    print("AgentShield-X Backend Services are LIVE!")
    print(" - Decision Engine:     http://127.0.0.1:8001")
    print(" - Gateway & Control:   http://127.0.0.1:8000")
    print(" - Health Endpoint:     http://127.0.0.1:8000/health")
    print(" - OpenAPI Spec:        http://127.0.0.1:8000/docs")
    print("=" * 60 + "\n")

    try:
        while True:
            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\nShutting down backend services...")
        p_dec.terminate()
        p_gw.terminate()
