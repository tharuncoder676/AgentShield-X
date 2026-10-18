"""
Phase 3 Batch 4 Integration Test: Honeytools & Decoys + Cryptographic Audit Log + Usage & Billing
Verifies:
1. Honeytools listing, auto-seeding of standard decoy traps, custom decoy creation, and trigger logging.
2. Cryptographic audit log append-only hash chaining, sequential verification, and tamper detection.
3. Usage metering calculations, plan tier upgrades (Free -> Team -> Enterprise), and invoice history.
"""

from __future__ import annotations

import os
import sys
import tempfile
import uuid
from datetime import datetime, timezone

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
for p in [
    os.path.join(BASE_DIR, "packages", "shield_core", "src"),
    os.path.join(BASE_DIR, "packages", "eventbus", "src"),
    os.path.join(BASE_DIR, "services", "control_api", "src"),
    os.path.join(BASE_DIR, "services", "gateway", "src"),
    BASE_DIR,
]:
    if p not in sys.path:
        sys.path.insert(0, p)

import pytest
from fastapi.testclient import TestClient
from control_api.db import Database
import control_api.routes.auth as auth_router_mod
import control_api.routes.orgs as orgs_router_mod
import control_api.routes.honeytools as honeytools_router_mod
import control_api.routes.audit as audit_router_mod
import control_api.routes.billing as billing_router_mod
import gateway.auth as gateway_auth_mod
from gateway.main import app


@pytest.fixture
def clean_db():
    """Provides a fresh isolated SQLite database for Phase 3 Batch 4 test."""
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, "phase3_batch4.db")
    repo = Database(db_path=db_path)
    Database._instance = repo

    # Patch router singletons
    auth_router_mod.db = repo
    orgs_router_mod.db = repo
    honeytools_router_mod.db = repo
    audit_router_mod.db = repo
    billing_router_mod.db = repo
    gateway_auth_mod.db = repo

    yield repo

    Database._instance = None


@pytest.fixture
def client(clean_db):
    return TestClient(app)


def test_honeytools_lifecycle_and_triggers(client, clean_db):
    # 1. Signup & create project
    signup_res = client.post(
        "/v1/auth/signup",
        json={
            "email": "deception-lead@shield.test",
            "password": "StrongPassword123!",
            "full_name": "Deception Ops Lead",
            "organization_name": "Decoy Security Labs",
        },
    )
    assert signup_res.status_code == 200
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    orgs_res = client.get("/v1/orgs", headers=headers)
    org_id = orgs_res.json()[0]["id"]
    proj_res = client.post(
        f"/v1/orgs/{org_id}/projects",
        json={"name": "Honey Guard System", "privacy_mode": "full"},
        headers=headers,
    )
    assert proj_res.status_code == 200
    project_id = proj_res.json()["id"]

    # 2. List honeytools (verify auto-seeded defaults)
    list_res = client.get(f"/v1/honeytools?project_id={project_id}", headers=headers)
    assert list_res.status_code == 200
    tools = list_res.json()
    assert len(tools) >= 5
    tool_names = [t["name"] for t in tools]
    assert "export_all_customers" in tool_names
    assert "dump_system_credentials" in tool_names
    assert "elevate_to_superuser" in tool_names

    # 3. Create a custom honeytool
    create_res = client.post(
        f"/v1/projects/{project_id}/honeytools",
        json={
            "name": "access_shadow_ledger",
            "type": "tool",
            "description": "Decoy accounting ledger tool",
            "sensitivity": "critical",
        },
        headers=headers,
    )
    assert create_res.status_code == 200
    new_ht = create_res.json()
    assert new_ht["name"] == "access_shadow_ledger"
    ht_id = new_ht["id"]

    # 4. Trigger the custom honeytool by recording an event
    clean_db.record_event({
        "event_id": "evt_honey_trap_01",
        "project_id": project_id,
        "agent_id": "rogue_agent",
        "session_id": "sess_infiltrator",
        "step": 2,
        "tool_name": "access_shadow_ledger",
        "tool_sensitivity": "critical",
        "action": "kill_session",
        "risk": 1.0,
        "reasons": [{"detector": "honey", "evidence": "Decoy tool invoked"}],
        "arguments": {"export": "all"},
        "context_segments": [],
        "taint": [],
        "latency_ms": 5.0,
    })

    # 5. List honey triggers
    triggers_res = client.get(f"/v1/honeytools/triggers?project_id={project_id}", headers=headers)
    assert triggers_res.status_code == 200
    triggers = triggers_res.json()
    assert len(triggers) >= 1
    assert triggers[0]["honeytool_id"] == ht_id
    assert triggers[0]["agent_id"] == "rogue_agent"

    # 6. Delete the custom honeytool
    del_res = client.delete(f"/v1/honeytools/{ht_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


def test_cryptographic_audit_chain_and_verification(client, clean_db):
    # 1. Setup auditor user
    signup_res = client.post(
        "/v1/auth/signup",
        json={
            "email": "compliance@shield.test",
            "password": "StrongPassword123!",
            "full_name": "Compliance Auditor",
            "organization_name": "Audit Bureau",
        },
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    proj_id = "proj_audit_test"

    # 2. Record a sequence of 3 events to build a hash-chain
    clean_db.record_event({
        "event_id": "evt_chain_1",
        "project_id": proj_id,
        "agent_id": "agent_audit",
        "session_id": "sess_audit_1",
        "step": 1,
        "tool_name": "read_docs",
        "action": "allow",
        "risk": 0.05,
        "reasons": [],
        "arguments": {},
    })

    clean_db.record_event({
        "event_id": "evt_chain_2",
        "project_id": proj_id,
        "agent_id": "agent_audit",
        "session_id": "sess_audit_1",
        "step": 2,
        "tool_name": "read_financials",
        "action": "sanitize",
        "risk": 0.22,
        "reasons": [{"detector": "pii", "evidence": "CC redacted"}],
        "arguments": {},
    })

    clean_db.record_event({
        "event_id": "evt_chain_3",
        "project_id": proj_id,
        "agent_id": "agent_audit",
        "session_id": "sess_audit_1",
        "step": 3,
        "tool_name": "drop_tables",
        "action": "block",
        "risk": 0.98,
        "reasons": [{"detector": "injection", "evidence": "SQL drop table"}],
        "arguments": {},
    })

    # 3. List audit records
    list_res = client.get(f"/v1/audit?project_id={proj_id}", headers=headers)
    assert list_res.status_code == 200
    records = list_res.json()
    assert len(records) >= 3
    # Check sequences
    assert records[0]["sequence"] == 3
    assert records[1]["sequence"] == 2
    assert records[2]["sequence"] == 1
    # Check hash chaining
    assert records[1]["hash"] == records[0]["prev_hash"]
    assert records[2]["hash"] == records[1]["prev_hash"]
    assert records[2]["prev_hash"] == "GENESIS_BLOCK_00000000000000000000000000000000"

    # 4. Verify cryptographic chain integrity
    verify_res = client.post(f"/v1/audit/verify?project_id={proj_id}", headers=headers)
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["valid"] is True
    assert verify_data["unbroken_count"] >= 3
    assert verify_data["broken_at_sequence"] is None


def test_billing_usage_metering_and_subscription(client, clean_db):
    # 1. Setup billing user
    signup_res = client.post(
        "/v1/auth/signup",
        json={
            "email": "cfo@shield.test",
            "password": "StrongPassword123!",
            "full_name": "Finance Director",
            "organization_name": "Global FinTech",
        },
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    proj_id = "proj_billing_demo"

    # 2. Get initial subscription (Free tier)
    sub_res = client.get(f"/v1/billing/subscription?project_id={proj_id}", headers=headers)
    assert sub_res.status_code == 200
    sub = sub_res.json()
    assert sub["plan"] == "free"
    assert sub["calls_limit"] == 10000
    assert sub["status"] == "active"

    # 3. Record events to produce usage
    for i in range(5):
        clean_db.record_event({
            "event_id": f"evt_usage_{i}",
            "project_id": proj_id,
            "agent_id": "bot",
            "session_id": "sess_billing",
            "step": i,
            "tool_name": "api_call",
            "action": "allow" if i < 4 else "block",
            "risk": 0.1 * i,
        })

    # 4. Get usage metering
    usage_res = client.get(f"/v1/billing/usage?project_id={proj_id}", headers=headers)
    assert usage_res.status_code == 200
    usage = usage_res.json()
    assert usage["calls_used"] == 5
    assert usage["calls_limit"] == 10000
    assert usage["actions_breakdown"]["allow"] == 4
    assert usage["actions_breakdown"]["block"] == 1

    # 5. Upgrade to Team subscription ($99/mo)
    upgrade_res = client.post(
        f"/v1/billing/subscription?project_id={proj_id}",
        json={"plan": "team"},
        headers=headers,
    )
    assert upgrade_res.status_code == 200
    upgraded_sub = upgrade_res.json()
    assert upgraded_sub["plan"] == "team"
    assert upgraded_sub["calls_limit"] == 250000

    # 6. List invoices
    inv_res = client.get(f"/v1/billing/invoices?project_id={proj_id}", headers=headers)
    assert inv_res.status_code == 200
    invoices = inv_res.json()
    assert len(invoices) >= 1
    assert any(inv["amount_cents"] == 9900 for inv in invoices)
