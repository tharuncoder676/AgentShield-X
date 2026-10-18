"""
Phase 3 Batch 3 Integration Test: Policies & Simulation + Approvals Queue + Model Registry & Thresholds
Verifies:
1. Policy authoring, retrieval, update, deletion, syntax validation, and dry-run traffic simulation.
2. Approvals queue listing, auto-creation on escalated decisions, and human-in-the-loop resolution (approve/reject).
3. Model registry status inspection for 5 ML models and dynamic risk threshold calibration.
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
import control_api.routes.policies as policies_router_mod
import control_api.routes.approvals as approvals_router_mod
import control_api.routes.models as models_router_mod
import gateway.auth as gateway_auth_mod
from gateway.main import app


@pytest.fixture
def clean_db():
    """Provides a fresh isolated SQLite database for Phase 3 Batch 3 test."""
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, "phase3_batch3.db")
    repo = Database(db_path=db_path)
    Database._instance = repo

    # Patch router singletons
    auth_router_mod.db = repo
    orgs_router_mod.db = repo
    policies_router_mod.db = repo
    approvals_router_mod.db = repo
    models_router_mod.db = repo
    gateway_auth_mod.db = repo

    yield repo

    Database._instance = None


@pytest.fixture
def client(clean_db):
    return TestClient(app)


def test_policies_lifecycle_and_simulation(client, clean_db):
    # 1. Signup & create project
    signup_res = client.post(
        "/v1/auth/signup",
        json={
            "email": "secops@shield.test",
            "password": "StrongPassword123!",
            "full_name": "SecOps Engineer",
            "organization_name": "Defense Org",
        },
    )
    assert signup_res.status_code == 200
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    orgs_res = client.get("/v1/orgs", headers=headers)
    org_id = orgs_res.json()[0]["id"]
    proj_res = client.post(
        f"/v1/orgs/{org_id}/projects",
        json={"name": "Defense System", "privacy_mode": "full"},
        headers=headers,
    )
    assert proj_res.status_code == 200
    project_id = proj_res.json()["id"]

    # 2. Validate policy syntax
    val_bad = client.post(
        "/v1/policies/validate",
        json={"rules_rego": "package shield\ndefault allow = false\nrule {"},
    )
    assert val_bad.status_code == 200
    assert val_bad.json()["valid"] is False
    assert len(val_bad.json()["errors"]) > 0

    val_good = client.post(
        "/v1/policies/validate",
        json={
            "rules_rego": (
                "package shield.auth\n"
                "default allow = false\n"
                "allow { input.tool.name == \"safe_read\" }\n"
            )
        },
    )
    assert val_good.status_code == 200
    assert val_good.json()["valid"] is True

    # 3. Create a policy
    create_res = client.post(
        f"/v1/projects/{project_id}/policies",
        json={
            "name": "Production Guardrail Policy",
            "description": "Restricts critical financial and shell tools",
            "rules_rego": (
                "package shield.finance\n"
                "default allow = true\n"
                "block { input.tool.name == \"execute_payment\" }\n"
            ),
            "version": "1.0.0",
            "is_active": True,
        },
        headers=headers,
    )
    assert create_res.status_code == 200
    policy = create_res.json()
    assert policy["id"].startswith("policy_")
    assert policy["name"] == "Production Guardrail Policy"
    assert policy["is_active"] is True
    policy_id = policy["id"]

    # 4. List policies
    list_res = client.get(f"/v1/policies?project_id={project_id}", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
    assert any(p["id"] == policy_id for p in list_res.json())

    # 5. Get policy by ID
    get_res = client.get(f"/v1/policies/{policy_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Production Guardrail Policy"

    # 6. Update policy
    update_res = client.put(
        f"/v1/policies/{policy_id}",
        json={
            "name": "Updated Production Guardrail Policy",
            "version": "1.1.0",
            "is_active": False,
        },
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Production Guardrail Policy"
    assert update_res.json()["version"] == "1.1.0"
    assert update_res.json()["is_active"] is False

    # 7. Record an event into the DB to test dry-run simulation
    clean_db.record_event({
        "event_id": "evt_sim_1",
        "project_id": project_id,
        "agent_id": "agent_alpha",
        "session_id": "sess_sim_100",
        "step": 1,
        "tool_name": "bash_exec",
        "tool_sensitivity": "high",
        "action": "allow",
        "risk": 0.15,
        "reasons": [{"detector": "baseline", "evidence": "clean"}],
        "arguments": {"cmd": "ls"},
        "context_segments": [],
        "taint": [],
        "latency_ms": 10.0,
    })

    # Simulate policy with strict block on bash
    sim_res = client.post(
        f"/v1/policies/simulate?project_id={project_id}",
        json={
            "rules_rego": "package shield\nblock { input.tool.name == \"bash_exec\" }",
            "sample_size": 10,
        },
        headers=headers,
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["total_simulated"] >= 1
    assert sim_data["changed_verdicts_count"] >= 1
    assert sim_data["simulated_blocked"] >= 1

    # 8. Delete policy
    del_res = client.delete(f"/v1/policies/{policy_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Ensure 404 after deletion
    get_after_del = client.get(f"/v1/policies/{policy_id}", headers=headers)
    assert get_after_del.status_code == 404


def test_approvals_queue_and_resolution(client, clean_db):
    # 1. Setup operator user
    signup_res = client.post(
        "/v1/auth/signup",
        json={
            "email": "lead-operator@shield.test",
            "password": "StrongPassword123!",
            "full_name": "Lead Operator",
            "organization_name": "Operations Unit",
        },
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Record an event that escalated
    evt_id = "evt_esc_99"
    proj_id = "proj_test_approvals"
    clean_db.record_event({
        "event_id": evt_id,
        "project_id": proj_id,
        "agent_id": "finance_bot",
        "session_id": "sess_wire_transfer",
        "step": 3,
        "tool_name": "wire_transfer_api",
        "tool_sensitivity": "critical",
        "action": "escalate",
        "risk": 0.78,
        "reasons": [
            {"detector": "intent_tracker", "evidence": "Sensitive financial transfer outside policy"}
        ],
        "arguments": {"amount": 50000, "recipient": "ACME Corp"},
        "context_segments": [],
        "taint": ["user_input"],
        "latency_ms": 45.0,
    })

    # 3. List approvals
    approvals_res = client.get(f"/v1/approvals?project_id={proj_id}", headers=headers)
    assert approvals_res.status_code == 200
    approvals = approvals_res.json()
    assert len(approvals) >= 1
    pending_appr = approvals[0]
    assert pending_appr["event_id"] == evt_id
    assert pending_appr["tool_name"] == "wire_transfer_api"
    assert pending_appr["status"] == "pending"
    assert pending_appr["arguments"]["amount"] == 50000
    appr_id = pending_appr["id"]

    # 4. Get approval by ID
    get_res = client.get(f"/v1/approvals/{appr_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == appr_id

    # 5. Resolve approval: approve
    resolve_res = client.post(
        f"/v1/approvals/{appr_id}/resolve",
        json={"status": "approved", "reason": "Verified with CFO via phone"},
        headers=headers,
    )
    assert resolve_res.status_code == 200
    resolved = resolve_res.json()
    assert resolved["status"] == "approved"
    assert resolved["resolved_by"] == "lead-operator@shield.test"
    assert resolved["resolution_reason"] == "Verified with CFO via phone"
    assert resolved["resolved_at"] is not None


def test_models_status_and_threshold_tuning(client, clean_db):
    # 1. Setup user
    signup_res = client.post(
        "/v1/auth/signup",
        json={
            "email": "ml-engineer@shield.test",
            "password": "StrongPassword123!",
            "full_name": "ML Engineer",
            "organization_name": "AI Safety Lab",
        },
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Models Status
    status_res = client.get("/v1/models/status", headers=headers)
    assert status_res.status_code == 200
    models = status_res.json()
    assert len(models) >= 5
    model_ids = [m["id"] for m in models]
    assert "model_1_deberta_injection" in model_ids
    assert "model_2_minilm_similarity" in model_ids
    assert "model_3_sequence_anomaly" in model_ids
    assert "model_4_intent_consistency" in model_ids
    assert "model_5_lightgbm_risk_stacker" in model_ids

    # 3. Get Default Thresholds
    thresh_res = client.get("/v1/models/thresholds?project_id=proj_ml", headers=headers)
    assert thresh_res.status_code == 200
    thresh = thresh_res.json()
    assert thresh["block_threshold"] == 0.36
    assert thresh["escalate_threshold"] == 0.28
    assert thresh["sanitize_threshold"] == 0.16
    assert thresh["kill_session_threshold"] == 0.95

    # 4. Update Thresholds
    patch_res = client.patch(
        "/v1/models/thresholds?project_id=proj_ml",
        json={
            "block_threshold": 0.45,
            "escalate_threshold": 0.30,
            "sanitize_threshold": 0.20,
        },
        headers=headers,
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["block_threshold"] == 0.45
    assert updated["escalate_threshold"] == 0.30
    assert updated["sanitize_threshold"] == 0.20
    assert updated["kill_session_threshold"] == 0.95

    # Verify persistent get
    verify_res = client.get("/v1/models/thresholds?project_id=proj_ml", headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["block_threshold"] == 0.45
