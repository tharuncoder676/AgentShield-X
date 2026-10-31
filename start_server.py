import os, sys
from dotenv import load_dotenv
load_dotenv()
import uvicorn

sys.path.insert(0, os.path.abspath("packages/shield_core/src"))
sys.path.insert(0, os.path.abspath("services/control_api/src"))
sys.path.insert(0, os.path.abspath("detectors/rules/src"))
sys.path.insert(0, os.path.abspath("detectors/intent/src"))
sys.path.insert(0, os.path.abspath("packages/shield_mcp/src"))

from control_api.main import app

if __name__ == "__main__":
    print("Starting AgentShield-X Control API on http://127.0.0.1:8002...", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=8002, log_level="info")

