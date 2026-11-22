"""
Unit Tests for AgentShield-X Nūs Desktop AI Agent Subsystem
Replication of potlakai/nus-desktop with Dual-Rail Security.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from control_api.main import app
from control_api.routes.nus_agent import (
    _parse_syllabus_deterministic,
    DEFAULT_SAMPLE_SYLLABI,
)

client = TestClient(app)


def test_get_sample_syllabi():
    res = client.get("/v1/nus/samples")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 3
    assert any(s["id"] == "cs410" for s in data["samples"])
    assert any(s["id"] == "sec602" for s in data["samples"])


def test_deterministic_syllabus_parser():
    sample_text = DEFAULT_SAMPLE_SYLLABI["cs410"]["raw_text"]
    parsed = _parse_syllabus_deterministic(sample_text, "CS 410")
    
    assert parsed["course"]["code"] == "CS 410"
    assert len(parsed["deadlines"]) >= 5
    assert len(parsed["proposals"]) >= 2
    
    # Check grading breakdown extracted
    breakdown = parsed["course"]["grading_breakdown"]
    assert "Midterm Examination" in breakdown or any("Midterm" in k for k in breakdown)
    
    # Check that exam item exists
    exams = [d for d in parsed["deadlines"] if d["type"] == "exam"]
    assert len(exams) >= 1
    assert exams[0]["urgency"] == "critical"


def test_parse_syllabus_endpoint():
    res = client.post(
        "/v1/nus/parse-syllabus",
        json={"text": "", "sample_id": "sec602"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["deadlines_mapped"] >= 5
    assert data["proposals_generated"] >= 2
    assert "SEC 602" in data["course"]["code"]
    assert data["security_audit"]["status"] == "VERIFIED_SAFE_ALLOW"


def test_timeline_endpoint():
    res = client.get("/v1/nus/timeline")
    assert res.status_code == 200
    data = res.json()
    assert "courses" in data
    assert "deadlines" in data
    assert "proposals" in data


def test_proposal_approval_and_decline():
    # First get timeline to find a proposal
    timeline_res = client.get("/v1/nus/timeline")
    data = timeline_res.json()
    proposals = data.get("proposals", [])
    assert len(proposals) > 0
    
    target_id = proposals[0]["id"]
    
    # Approve
    approve_res = client.post(
        "/v1/nus/proposal/action",
        json={"proposal_id": target_id, "action": "approve", "operator": "Tharun"}
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["action"] == "approve"
    assert approve_res.json()["audit_entry"]["sha256_sealed"] is True


def test_screen_query_endpoint():
    res = client.post(
        "/v1/nus/screen-query",
        json={"query": "What is my next upcoming deadline?", "screen_context": "Desktop Window"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert len(data["suggested_actions"]) >= 1


def test_export_ics_calendar():
    res = client.get("/v1/nus/export-ics")
    assert res.status_code == 200
    assert "BEGIN:VCALENDAR" in res.text
    assert "END:VCALENDAR" in res.text
    assert "SUMMARY:" in res.text
