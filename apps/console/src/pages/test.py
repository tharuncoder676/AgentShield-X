#!/usr/bin/env python3
"""
AgentShield-X Live Gateway Verification Script
Uses ONLY Python standard library (no pip packages or httpx required).
Windows cp1252 / UTF-8 safe ASCII output.
"""
import urllib.request
import json
import uuid
import sys
from datetime import datetime, timezone

# 1. Gateway endpoint and authentic API Key
GATEWAY_URL = "http://127.0.0.1:8000/v1/events/tool-call"
API_KEY = "shield_live_custoercare_secret_key_101"
PROJECT_ID = "proj_9b78b149b033"

# Allow CLI override: python test.py <API_KEY> <PROJECT_ID>
if len(sys.argv) > 1:
    API_KEY = sys.argv[1]
if len(sys.argv) > 2:
    PROJECT_ID = sys.argv[2]

# 2. Authentic tool-call telemetry payload
payload = {
    "event_id": str(uuid.uuid4()),
    "schema_version": "1.0",
    "agent_id": "agent-custoer-care",
    "session_id": f"sess-{uuid.uuid4().hex[:8]}",
    "step": 1,
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "tool": {
        "name": "read_customer_database",
        "sensitivity": "medium"
    },
    "arguments": {
        "customer_id": "cust_1009",
        "query": "SELECT balance, email FROM customers WHERE id = 'cust_1009'"
    },
    "context_segments": [
        {
            "id": f"seg-{uuid.uuid4().hex[:8]}",
            "trust": "user",
            "source": "customer_support_chat",
            "text_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "text": "Please fetch the current balance and email for customer cust_1009"
        }
    ],
    "taint": [],
    "metadata": {
        "project_id": PROJECT_ID
    }
}

print("=" * 65)
print("[AgentShield-X] Live Ingress Gateway Verification")
print("=" * 65)
print(f"Target Gateway: {GATEWAY_URL}")
print(f"Project ID:     {PROJECT_ID}")
print(f"API Key:        {API_KEY[:16]}...{API_KEY[-4:]}")
print(f"Proposed Tool:  {payload['tool']['name']} (Sensitivity: {payload['tool']['sensitivity'].upper()})")
print("-" * 65)
print("Sending authentic ToolCallEvent through Gateway...")

req = urllib.request.Request(
    GATEWAY_URL,
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Content-Type": "application/json",
        "X-Shield-API-Key": API_KEY,
    },
    method="POST",
)

try:
    with urllib.request.urlopen(req) as resp:
        status_code = resp.status
        data = json.loads(resp.read().decode("utf-8"))
        print("\n[OK] Gateway Response Received [HTTP 200 OK]")
        print("=" * 65)
        print(f"  Shield Decision: {data.get('action', '').upper()}")
        print(f"  Risk Score:      {data.get('risk', 0.0)}")
        print(f"  Gateway Latency: {data.get('latency_ms', 0.0)}ms")
        print(f"  Reasons:         {data.get('reasons', [])}")
        print("=" * 65)
        print("[SUCCESS] Real test event successfully recorded in AgentShield-X database!")
        print("          Step 4 in your browser Onboarding will now complete automatically.")
except urllib.error.HTTPError as e:
    err_body = e.read().decode("utf-8")
    print(f"\n[ERROR] Gateway Error [HTTP {e.code}]: {err_body}")
except Exception as e:
    print(f"\n[ERROR] Connection Error: {e}")
    print("Ensure Gateway is running on http://127.0.0.1:8000")
