"""
AgentShield-X Cross-Platform Make Runner
Allows running `python ml/make.py <target>` on Windows/Linux/macOS
identical to running GNU `make <target>`.
"""

import subprocess
import sys

TARGETS = {
    "data": "python -m ml.data.generators.generate_all",
    "train-similarity": "python -m ml.detectors.similarity.train",
    "train-anomaly": "python -m ml.detectors.anomaly.train",
    "train-intent": "python -m ml.detectors.intent.train",
    "train-stacker": "python -m ml.risk.train",
    "eval": "python -m ml.eval.harness",
    "export": "python -m ml.export.package_models",
    "test": "pytest ml/tests",
}


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "test"
    if target == "all":
        order = ["data", "train-similarity", "train-anomaly", "train-intent", "train-stacker", "eval", "export", "test"]
        for t in order:
            cmd = TARGETS[t]
            print(f">>> [make.py] Running target: {t} -> {cmd}")
            ret = subprocess.call(cmd, shell=True)
            if ret != 0:
                print(f"Target '{t}' failed with code {ret}")
                sys.exit(ret)
        print(">>> [make.py] All targets completed successfully.")
        return

    if target not in TARGETS:
        print(f"Unknown target '{target}'. Available: {list(TARGETS.keys())} or 'all'")
        sys.exit(1)

    cmd = TARGETS[target]
    print(f">>> [make.py] Running target: {target} -> {cmd}")
    ret = subprocess.call(cmd, shell=True)
    sys.exit(ret)


if __name__ == "__main__":
    main()
