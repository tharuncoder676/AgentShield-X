"""
AgentShield-X Desktop & CLI Launcher
Standalone executable entrypoint for Windows (.exe), macOS, and Linux.
"""
import os
import sys
import webbrowser

# Ensure UTF-8 console output
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Add package source paths for bundled runtime
base_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(base_dir, "packages", "shield_core", "src"))
sys.path.insert(0, os.path.join(base_dir, "detectors", "rules", "src"))
sys.path.insert(0, os.path.join(base_dir, "detectors", "intent", "src"))
sys.path.insert(0, os.path.join(base_dir, "packages", "shield_mcp", "src"))

from shield_core.cli import main

if __name__ == "__main__":
    if len(sys.argv) == 1:
        # Launched via double-click on Desktop
        print("=================================================================", flush=True)
        print("   AgentShield-X Enterprise Runtime v1.0.0", flush=True)
        print("   Launching Web Console at http://localhost:3000 ...", flush=True)
        print("=================================================================", flush=True)
        try:
            webbrowser.open("http://localhost:3000")
        except Exception:
            pass
    sys.exit(main())

