#!/usr/bin/env python3
"""
AgentShield-X: Standalone Demo Data Seeding Script
Generates local development and demonstration database data on-demand.
Does NOT track any production keys or credentials.
Usage:
    python scripts/seed_demo_data.py [--reset]
"""

from __future__ import annotations

import argparse
import datetime
import hashlib
import os
import sys
from pathlib import Path

# Add workspace packages to path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "services" / "control_api" / "src"))
sys.path.insert(0, str(REPO_ROOT / "packages" / "shield_core" / "src"))

from control_api.db import Database, DB_PATH


def hash_password(password: str) -> str:
    """Standard SHA-256 password hash for local demo accounts."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def seed_database(reset: bool = False) -> None:
    db_file = Path(DB_PATH)
    print(f"[*] Initializing AgentShield-X database at: {db_file}")
    db_file.parent.mkdir(parents=True, exist_ok=True)
    db = Database(str(db_file))
    conn = db.get_connection()

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    org_id = "org_demo_enterprise"
    owner_id = "usr_demo_admin"

    # 1. Seed Demo Admin User
    demo_users = [
        (owner_id, "analyst@agentshield.test", "admin", "Admin123!"),
        ("usr_demo_lead", "security-lead@agentshield.test", "lead", "Shield2026!"),
        ("usr_demo_viewer", "demo@agentshield.dev", "viewer", "DemoPass123!"),
    ]
    for uid, email, role, pwd in demo_users:
        cur = conn.execute("SELECT id FROM users WHERE email = ?", (email,))
        if not cur.fetchone():
            pwd_hash = hash_password(pwd)
            conn.execute(
                "INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
                (uid, email, pwd_hash, role, now_iso),
            )
            print(f"  [+] Created demo user: {email} (Role: {role})")

    # 2. Seed Demo Tenant / Organization
    cur = conn.execute("SELECT id FROM organizations WHERE id = ? OR slug = ?", (org_id, "agentshield-labs"))
    row = cur.fetchone()
    if not row:
        conn.execute(
            "INSERT INTO organizations (id, name, slug, plan, owner_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (org_id, "AgentShield Security Labs", "agentshield-labs", "enterprise", owner_id, now_iso),
        )
        print("  [+] Created demo organization: AgentShield Security Labs")
    else:
        org_id = row[0]

    # 3. Seed Org Memberships
    for uid, email, role, _ in demo_users:
        conn.execute(
            "INSERT OR IGNORE INTO org_members (org_id, user_id, role, created_at) VALUES (?, ?, ?, ?)",
            (org_id, uid, role, now_iso),
        )

    # 4. Seed Demo Project
    proj_id = "proj_demo_production"
    cur = conn.execute("SELECT id FROM projects WHERE id = ? OR (org_id = ? AND slug = ?)", (proj_id, org_id, "prod-mesh"))
    row = cur.fetchone()
    if not row:
        conn.execute(
            "INSERT INTO projects (id, org_id, name, slug, privacy_mode, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (proj_id, org_id, "Production Multi-Agent Mesh", "prod-mesh", "full", now_iso),
        )
        print("  [+] Created demo project: Production Multi-Agent Mesh")
    else:
        proj_id = row[0]

    # 5. Seed Demo API Key
    demo_key = "asx_live_demo_test_key_8849"
    key_hash = hashlib.sha256(demo_key.encode("utf-8")).hexdigest()
    cur = conn.execute("SELECT id FROM api_keys WHERE key_hash = ?", (key_hash,))
    if not cur.fetchone():
        conn.execute(
            "INSERT INTO api_keys (id, project_id, name, key_hash, prefix, created_at, revoked) VALUES (?, ?, ?, ?, ?, ?, 0)",
            ("key_demo_live", proj_id, "Demo Runtime Guardrail Key", key_hash, "asx_live_demo_", now_iso),
        )
        print(f"  [+] Created demo API key: {demo_key} (Prefix: asx_live_demo_)")

    # 6. Seed Demo Autonomous Agents
    demo_agents = [
        ("agt_claude_coder", proj_id, "Claude 3.5 Sonnet (Agent Code)", 99.4),
        ("agt_cursor_bot", proj_id, "Cursor Agent (Terminal Exec)", 98.7),
        ("agt_copilot_cli", proj_id, "GitHub Copilot Workspace", 99.1),
        ("agt_gemini_cli", proj_id, "Gemini 1.5 Pro Swarm Node", 99.5),
    ]
    for aid, pid, name, score in demo_agents:
        cur = conn.execute("SELECT id FROM agents WHERE id = ?", (aid,))
        if not cur.fetchone():
            conn.execute(
                "INSERT INTO agents (id, project_id, name, security_score, created_at) VALUES (?, ?, ?, ?, ?)",
                (aid, pid, name, score, now_iso),
            )
            print(f"  [+] Created demo agent: {name}")

    # 7. Seed Baseline Guardrail Policies
    demo_policies = [
        (
            "pol_strict_mcp",
            proj_id,
            "Strict MCP Tool Execution Quota",
            "Enforces bounded <5ms verification and blast-radius checks before tool invocation",
            "package agentshield.mcp\ndefault allow = false\nallow { input.tool != 'destructive_exec' }",
        ),
        (
            "pol_reverse_shell_contain",
            proj_id,
            "Subprocess Reverse Shell & Escape Blocker",
            "Deterministic AST pattern blocker for bash reverse-shells, raw socket exfiltration, and /etc/shadow access",
            "package agentshield.sandbox\ndefault block = true\nblock { regex.match('(nc|dev/tcp)', input.command) }",
        ),
        (
            "pol_rag_firewall",
            proj_id,
            "Semantic RAG Memory Poisoning Firewall",
            "Pre-context inspection for prompt injections, sleeper instruction overrides, and homoglyph attacks",
            "package agentshield.rag\ndefault allow = true\nallow { input.threat_score < 0.35 }",
        ),
    ]
    for pol_id, pid, name, desc, rego in demo_policies:
        cur = conn.execute("SELECT id FROM policies WHERE id = ?", (pol_id,))
        if not cur.fetchone():
            conn.execute(
                "INSERT INTO policies (id, project_id, name, description, rules_rego, version, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, '1.0.0', 1, ?, ?)",
                (pol_id, pid, name, desc, rego, now_iso, now_iso),
            )
            print(f"  [+] Created demo security policy: {name}")

    conn.commit()
    print("\n[v] Demo data generation complete!")
    print(f"    Database location: {db_file}")
    print("    Demo Login: analyst@agentshield.test / Admin123!")
    print("    Demo API Key: asx_live_demo_test_key_8849\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed AgentShield-X local demo database")
    parser.add_argument("--reset", action="store_true", help="Reset existing database before seeding")
    args = parser.parse_args()
    seed_database(reset=args.reset)
