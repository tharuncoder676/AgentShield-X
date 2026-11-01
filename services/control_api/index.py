import sys
from pathlib import Path

# Add local service and monorepo package paths to sys.path
root = Path(__file__).resolve().parent
src = root / "src"
monorepo = root.parent.parent

for p in [
    src,
    monorepo / "packages" / "shield_core" / "src",
    monorepo / "packages" / "eventbus" / "src",
    monorepo / "packages" / "shield_mcp" / "src",
    monorepo / "services" / "control_api" / "src",
    monorepo / "services" / "gateway" / "src",
    monorepo / "services" / "decision" / "src",
    monorepo / "detectors" / "rules" / "src",
    monorepo / "detectors" / "pii" / "src",
    monorepo / "detectors" / "honey" / "src",
    monorepo / "detectors" / "injection" / "src",
    monorepo / "detectors" / "intent" / "src",
    monorepo / "detectors" / "anomaly" / "src",
    monorepo / "detectors" / "similarity" / "src",
]:
    if p.exists() and str(p) not in sys.path:
        sys.path.insert(0, str(p))

from control_api.main import app

