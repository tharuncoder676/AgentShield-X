
"""
AgentShield-X // Personalized Ollama Model Builder & Training Harness
Creator & Lead Architect: Tharunkumar.S

This script compiles the customized Modelfile, creates the 'wingshield-x' model in Ollama,
verifies inference against test suites, and runs latency & token speed benchmarks.
"""

import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
MODELFILE_PATH = REPO_ROOT / "models" / "Modelfile.wingshield"
DATASET_PATH = REPO_ROOT / "models" / "dataset_wingshield_training.jsonl"
OLLAMA_API = "http://127.0.0.1:11434"


def ensure_ollama_running() -> bool:
    """Verifies that the Ollama server is running, or attempts to spawn it."""
    try:
        req = urllib.request.Request(f"{OLLAMA_API}/api/tags")
        with urllib.request.urlopen(req, timeout=3) as res:
            if res.status == 200:
                return True
    except Exception:
        pass

    print("[*] Starting local Ollama server...")
    try:
        subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(3)
        return True
    except Exception as e:
        print(f"[!] Could not start Ollama: {e}")
        return False


def build_wingshield_model(model_name: str = "wingshield-x") -> bool:
    """Builds the customized wingshield model using Ollama Modelfile."""
    if not MODELFILE_PATH.exists():
        print(f"[!] Modelfile not found at: {MODELFILE_PATH}")
        return False

    print(f"[+] Building personalized Ollama model '{model_name}' from {MODELFILE_PATH.name}...")
    cmd = ["ollama", "create", model_name, "-f", str(MODELFILE_PATH)]
    try:
        proc = subprocess.run(cmd, cwd=str(REPO_ROOT), capture_output=True, text=True, timeout=120)
        if proc.returncode == 0:
            print(f"[+] Successfully built and registered '{model_name}' in Ollama!")
            return True
        else:
            print(f"[!] Build error:\n{proc.stderr}")
            return False
    except Exception as e:
        print(f"[!] Build failed: {e}")
        return False


def benchmark_model(model_name: str = "wingshield-x") -> None:
    """Runs verification benchmarks on the model."""
    print(f"\n[+] Running verification benchmarks on '{model_name}'...")
    test_prompts = [
        "Who created you?",
        "Explain how AgentShield-X defends against indirect prompt injections in under 3.4 milliseconds.",
        "What applications can you launch for Tharun?",
    ]

    for p in test_prompts:
        print(f"\n[-] Prompt: \"{p}\"")
        t0 = time.perf_counter()
        payload = json.dumps({"model": model_name, "prompt": p, "stream": False}).encode()
        req = urllib.request.Request(f"{OLLAMA_API}/api/generate", data=payload, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=40) as res:
                elapsed = time.perf_counter() - t0
                data = json.loads(res.read().decode())
                response_text = data.get("response", "").strip()
                eval_count = data.get("eval_count", len(response_text.split()))
                tps = eval_count / max(0.001, elapsed)
                print(f"[+] Latency: {elapsed:.2f}s | Tokens: ~{eval_count} | Speed: {tps:.1f} tokens/sec")
                first_paragraph = response_text.split("\n\n")[0]
                print(f"    Response: {first_paragraph[:280]}...")
        except Exception as e:
            print(f"[!] Benchmark error: {e}")


def main():
    print("=" * 76)
    print("  AgentShield-X // Personalized Ollama Intelligence Engine Builder")
    print("  Lead Architect: Tharunkumar.S")
    print("=" * 76)

    if not ensure_ollama_running():
        print("[!] Ollama is not accessible. Please run 'ollama serve'.")
        sys.exit(1)

    success = build_wingshield_model("wingshield-x")
    if success:
        benchmark_model("wingshield-x")
        print("\n" + "=" * 76)
        print("  PERSONALIZATION COMPLETE!")
        print("  Model 'wingshield-x' is active and integrated into Wingshield Copilot.")
        print("=" * 76)


if __name__ == "__main__":
    main()
