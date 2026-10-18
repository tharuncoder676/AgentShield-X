"""
Unit & Integration Tests for AgentShield-X Control API & Dynamic Ingress
"""

from __future__ import annotations

import os
import sys
import tempfile
import uuid
import pytest
from fastapi.testclient import TestClient

# Path setups
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(BASE_DIR, "services", "gateway", "src"))
sys.path.insert(0, os.path.join(BASE_DIR, "services", "control_api", "src"))
sys.path.insert(0, os.path.join(BASE_DIR, "packages", "shield_core", "src"))
sys.path.insert(0, os.path.join(BASE_DIR, "packages", "eventbus", "src"))

from control_api.db import Database
from gateway.main import app, authenticator


@pytest.fixture(autouse=True)
def setup_test_db():
    temp_dir = tempfile.mkdtemp()
    test_db_path = os.path.join(temp_dir, "test_agentshield.db")
    db = Database(db_path=test_db_path)
    Database._instance = db

    import control_api.routes.auth as auth_mod
    import control_api.routes.orgs as orgs_mod
    import control_api.routes.onboarding as onboarding_mod
    import control_api.routes.analytics as analytics_mod
    auth_mod.db = db
    orgs_mod.db = db
    onboarding_mod.db = db
    analytics_mod.db = db

    yield db
    Database._instance = None


@pytest.fixture
def client():
    return TestClient(app)


class TestControlAPI:
    def test_signup_and_login_flow(self, client):
        # 1. Sign up new tenant owner
        email = f"secops_{uuid.uuid4().hex[:6]}@acme.example.test"
        signup_resp = client.post(
            "/v1/auth/signup",
            json={
                "email": email,
                "password": "SuperSecretPassword123!",
                "org_name": "Acme Cybersecurity",
            },
        )
        assert signup_resp.status_code == 200, signup_resp.text
        data = signup_resp.json()
        assert "token" in data
        assert data["user"]["email"] == email
        assert data["org"]["name"] == "Acme Cybersecurity"
        token = data["token"]
        org_id = data["org"]["id"]

        # 2. Verify /me endpoint
        me_resp = client.get("/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == email

        # 3. Create Project
        proj_resp = client.post(
            f"/v1/orgs/{org_id}/projects",
            json={"name": "Customer Support Agent", "privacy_mode": "full"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert proj_resp.status_code == 200
        proj_data = proj_resp.json()
        project_id = proj_data["id"]
        assert proj_data["name"] == "Customer Support Agent"

        # 4. Create Scoped API Key
        key_resp = client.post(
            f"/v1/projects/{project_id}/api-keys",
            json={"name": "Production Agent Key"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert key_resp.status_code == 200
        key_data = key_resp.json()
        raw_key = key_data["raw_key"]
        assert raw_key.startswith("shield_live_")

        # 5. Verify Gateway Authenticator can authenticate the newly created key dynamically
        auth_ctx = authenticator.authenticate_key(raw_key)
        assert auth_ctx is not None
        assert auth_ctx.tenant_id == org_id

        # 6. Check Onboarding Status before sending any event
        onboard_resp = client.get(
            f"/v1/projects/{project_id}/onboarding-status",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert onboard_resp.status_code == 200
        assert onboard_resp.json()["has_api_key"] is True
        assert onboard_resp.json()["test_event_received"] is False
        assert onboard_resp.json()["completed"] is False

        # 7. Record an event and verify completion updates from real data
        db = Database.get_instance()
        db.record_event({
            "event_id": "ev_test_handshake",
            "tenant_id": org_id,
            "project_id": project_id,
            "agent_id": "test-agent",
            "session_id": "sess_handshake",
            "tool_name": "read_email",
            "action": "allow",
            "risk": 0.02,
            "timestamp": "2026-10-18T00:30:00Z",
        })

        onboard_after = client.get(
            f"/v1/projects/{project_id}/onboarding-status",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert onboard_after.status_code == 200
        assert onboard_after.json()["test_event_received"] is True
        assert onboard_after.json()["completed"] is True

        # 8. Check Analytics Overview
        analytics_resp = client.get(
            f"/v1/analytics/overview?project_id={project_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert analytics_resp.status_code == 200
        assert analytics_resp.json()["total_events"] >= 1
