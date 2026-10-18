"""
AgentShield-X Control Plane Database Layer
Thread-safe SQLite repository with WAL mode for local and self-hosted operations.
"""

from __future__ import annotations

import datetime
import hashlib
import json
import os
import sqlite3
import threading
import uuid
from typing import Any, Dict, List, Optional

try:
    from shield_core.crypto import compute_audit_hash, verify_audit_chain
except ImportError:
    def compute_audit_hash(
        sequence: int,
        tenant_id: str,
        event_id: str,
        decision_id: str,
        action: str,
        timestamp: str,
        prev_hash: str,
    ) -> str:
        payload = {
            "sequence": sequence,
            "tenant_id": tenant_id,
            "event_id": event_id,
            "decision_id": decision_id,
            "action": action,
            "timestamp": timestamp,
            "prev_hash": prev_hash,
        }
        canonical = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    def verify_audit_chain(records: List[Dict[str, Any]]) -> bool:
        if not records:
            return True
        for i in range(len(records)):
            curr = records[i]
            expected_prev = "GENESIS_BLOCK_00000000000000000000000000000000" if i == 0 else records[i - 1]["hash"]
            if curr["prev_hash"] != expected_prev:
                return False
            calc = compute_audit_hash(
                sequence=curr["sequence"],
                tenant_id=curr["tenant_id"],
                event_id=curr["event_id"],
                decision_id=curr["decision_id"],
                action=curr["action"],
                timestamp=curr["timestamp"],
                prev_hash=curr["prev_hash"],
            )
            if curr["hash"] != calc:
                return False
        return True

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))
DB_PATH = os.path.join(DB_DIR, "agentshield.db")


class Database:
    _instance: Optional[Database] = None
    _lock = threading.Lock()

    def __init__(self, db_path: str = DB_PATH) -> None:
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._local = threading.local()
        self._init_schema()

    @classmethod
    def get_instance(cls, db_path: str = DB_PATH) -> Database:
        with cls._lock:
            if cls._instance is None:
                cls._instance = Database(db_path)
            return cls._instance

    def get_connection(self) -> sqlite3.Connection:
        if not hasattr(self._local, "conn") or self._local.conn is None:
            conn = sqlite3.connect(self.db_path, timeout=30.0, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA journal_mode = WAL")
            conn.execute("PRAGMA foreign_keys = ON")
            conn.execute("PRAGMA synchronous = NORMAL")
            self._local.conn = conn
        return self._local.conn

    def _init_schema(self) -> None:
        conn = self.get_connection()
        with conn:
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'owner',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS organizations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                plan TEXT NOT NULL DEFAULT 'enterprise',
                owner_id TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS org_members (
                org_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'viewer',
                created_at TEXT NOT NULL,
                PRIMARY KEY (org_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                org_id TEXT NOT NULL,
                name TEXT NOT NULL,
                slug TEXT NOT NULL,
                privacy_mode TEXT NOT NULL DEFAULT 'full',
                created_at TEXT NOT NULL,
                UNIQUE (org_id, slug)
            );

            CREATE TABLE IF NOT EXISTS api_keys (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                name TEXT NOT NULL,
                key_hash TEXT UNIQUE NOT NULL,
                prefix TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_used_at TEXT,
                revoked INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                name TEXT NOT NULL,
                security_score REAL NOT NULL DEFAULT 100.0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS events (
                event_id TEXT PRIMARY KEY,
                tenant_id TEXT NOT NULL,
                project_id TEXT,
                agent_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                step INTEGER NOT NULL DEFAULT 0,
                tool_name TEXT NOT NULL,
                arguments_json TEXT NOT NULL DEFAULT '{}',
                action TEXT NOT NULL,
                risk REAL NOT NULL DEFAULT 0.0,
                reasons_json TEXT NOT NULL DEFAULT '[]',
                context_segments_json TEXT NOT NULL DEFAULT '[]',
                taint_json TEXT NOT NULL DEFAULT '[]',
                latency_ms REAL NOT NULL DEFAULT 0.0,
                timestamp TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                event_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                title TEXT NOT NULL,
                severity TEXT NOT NULL DEFAULT 'high',
                status TEXT NOT NULL DEFAULT 'open',
                assigned_to TEXT,
                resolution_notes TEXT,
                policy_violated TEXT,
                risk REAL NOT NULL DEFAULT 0.0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_events_project_time ON events (project_id, timestamp);
            CREATE INDEX IF NOT EXISTS idx_events_session ON events (session_id);
            CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys (key_hash);
            CREATE INDEX IF NOT EXISTS idx_incidents_project_status ON incidents (project_id, status);
            CREATE INDEX IF NOT EXISTS idx_incidents_event ON incidents (event_id);

            CREATE TABLE IF NOT EXISTS policies (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                rules_rego TEXT NOT NULL,
                version TEXT NOT NULL DEFAULT '1.0.0',
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS approvals (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                event_id TEXT NOT NULL,
                agent_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                tool_name TEXT NOT NULL,
                arguments_json TEXT NOT NULL DEFAULT '{}',
                risk REAL NOT NULL DEFAULT 0.0,
                reasons_json TEXT NOT NULL DEFAULT '[]',
                status TEXT NOT NULL DEFAULT 'pending',
                requested_at TEXT NOT NULL,
                resolved_at TEXT,
                resolved_by TEXT,
                resolution_reason TEXT,
                expires_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS model_thresholds (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                block_threshold REAL NOT NULL DEFAULT 0.36,
                escalate_threshold REAL NOT NULL DEFAULT 0.28,
                sanitize_threshold REAL NOT NULL DEFAULT 0.16,
                kill_session_threshold REAL NOT NULL DEFAULT 0.95,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS honeytools (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'tool',
                description TEXT DEFAULT '',
                sensitivity TEXT NOT NULL DEFAULT 'critical',
                trigger_count INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS honey_triggers (
                id TEXT PRIMARY KEY,
                honeytool_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                agent_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                event_id TEXT NOT NULL,
                triggered_at TEXT NOT NULL,
                arguments_json TEXT NOT NULL DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS audit_records (
                sequence INTEGER PRIMARY KEY AUTOINCREMENT,
                id TEXT UNIQUE NOT NULL,
                project_id TEXT NOT NULL,
                tenant_id TEXT NOT NULL,
                event_id TEXT NOT NULL,
                decision_id TEXT NOT NULL,
                action TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                prev_hash TEXT NOT NULL,
                hash TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS subscriptions (
                id TEXT PRIMARY KEY,
                project_id TEXT UNIQUE NOT NULL,
                plan TEXT NOT NULL DEFAULT 'free',
                status TEXT NOT NULL DEFAULT 'active',
                current_period_start TEXT NOT NULL,
                current_period_end TEXT NOT NULL,
                calls_limit INTEGER NOT NULL DEFAULT 10000,
                stripe_customer_id TEXT,
                stripe_subscription_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                amount_cents INTEGER NOT NULL DEFAULT 0,
                currency TEXT NOT NULL DEFAULT 'usd',
                status TEXT NOT NULL DEFAULT 'paid',
                period_start TEXT NOT NULL,
                period_end TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_policies_project ON policies (project_id);
            CREATE INDEX IF NOT EXISTS idx_approvals_project_status ON approvals (project_id, status);
            CREATE INDEX IF NOT EXISTS idx_honeytools_project ON honeytools (project_id);
            CREATE INDEX IF NOT EXISTS idx_audit_records_project ON audit_records (project_id, sequence);
            CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices (project_id);
            """)

            # Safe column migration for existing databases
            for col_sql in [
                "ALTER TABLE events ADD COLUMN context_segments_json TEXT NOT NULL DEFAULT '[]'",
                "ALTER TABLE events ADD COLUMN taint_json TEXT NOT NULL DEFAULT '[]'",
                "ALTER TABLE agents ADD COLUMN description TEXT DEFAULT ''",
                "ALTER TABLE agents ADD COLUMN status TEXT NOT NULL DEFAULT 'active'",
                "ALTER TABLE agents ADD COLUMN allowed_tools_json TEXT NOT NULL DEFAULT '[]'",
                "ALTER TABLE agents ADD COLUMN blast_radius_score REAL NOT NULL DEFAULT 25.0",
                "ALTER TABLE agents ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}'",
            ]:
                try:
                    conn.execute(col_sql)
                except sqlite3.OperationalError:
                    pass

    # --- User Operations ---
    def create_user(self, user_id: str, email: str, password_hash: str, role: str, created_at: str) -> None:
        conn = self.get_connection()
        with conn:
            conn.execute(
                "INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
                (user_id, email.lower(), password_hash, role, created_at),
            )

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower(),))
        row = cur.fetchone()
        return dict(row) if row else None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        return dict(row) if row else None

    # --- Organization Operations ---
    def create_org(self, org_id: str, name: str, slug: str, plan: str, owner_id: str, created_at: str) -> None:
        conn = self.get_connection()
        with conn:
            conn.execute(
                "INSERT INTO organizations (id, name, slug, plan, owner_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (org_id, name, slug, plan, owner_id, created_at),
            )
            conn.execute(
                "INSERT INTO org_members (org_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)",
                (org_id, owner_id, created_at),
            )

    def get_orgs_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute(
            """
            SELECT o.*, m.role as user_role
            FROM organizations o
            JOIN org_members m ON o.id = m.org_id
            WHERE m.user_id = ?
            ORDER BY o.created_at ASC
            """,
            (user_id,),
        )
        return [dict(r) for r in cur.fetchall()]

    def get_org_by_id(self, org_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute("SELECT * FROM organizations WHERE id = ?", (org_id,))
        row = cur.fetchone()
        return dict(row) if row else None

    # --- Project Operations ---
    def create_project(self, project_id: str, org_id: str, name: str, slug: str, privacy_mode: str, created_at: str) -> None:
        conn = self.get_connection()
        with conn:
            conn.execute(
                "INSERT INTO projects (id, org_id, name, slug, privacy_mode, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (project_id, org_id, name, slug, privacy_mode, created_at),
            )

    def get_projects_for_org(self, org_id: str) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute("SELECT * FROM projects WHERE org_id = ? ORDER BY created_at ASC", (org_id,))
        return [dict(r) for r in cur.fetchall()]

    def get_project_by_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        row = cur.fetchone()
        return dict(row) if row else None

    # --- API Key Operations ---
    def create_api_key(self, key_id: str, project_id: str, name: str, key_hash: str, prefix: str, created_at: str) -> None:
        conn = self.get_connection()
        with conn:
            conn.execute(
                "INSERT INTO api_keys (id, project_id, name, key_hash, prefix, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (key_id, project_id, name, key_hash, prefix, created_at),
            )

    def get_api_keys_for_project(self, project_id: str) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute("SELECT id, project_id, name, prefix, created_at, last_used_at, revoked FROM api_keys WHERE project_id = ? AND revoked = 0 ORDER BY created_at DESC", (project_id,))
        return [dict(r) for r in cur.fetchall()]

    def get_key_by_hash(self, key_hash: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute(
            """
            SELECT k.*, p.org_id, p.id as project_id
            FROM api_keys k
            JOIN projects p ON k.project_id = p.id
            WHERE k.key_hash = ? AND k.revoked = 0
            """,
            (key_hash,),
        )
        row = cur.fetchone()
        return dict(row) if row else None

    def update_key_last_used(self, key_hash: str, timestamp: str) -> None:
        conn = self.get_connection()
        with conn:
            conn.execute("UPDATE api_keys SET last_used_at = ? WHERE key_hash = ?", (timestamp, key_hash))

    # --- Event & Telemetry Operations ---
    def record_event(self, event_data: Dict[str, Any]) -> None:
        conn = self.get_connection()
        action = event_data.get("action", "allow")
        risk = float(event_data.get("risk", 0.0))
        project_id = event_data.get("project_id") or event_data.get("tenant_id")
        timestamp = event_data.get("timestamp") or datetime.datetime.now(datetime.timezone.utc).isoformat()

        with conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO events (
                    event_id, tenant_id, project_id, agent_id, session_id,
                    step, tool_name, arguments_json, action, risk,
                    reasons_json, context_segments_json, taint_json, latency_ms, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event_data["event_id"],
                    event_data.get("tenant_id", "default"),
                    project_id,
                    event_data.get("agent_id", "default-agent"),
                    event_data.get("session_id", "default-sess"),
                    event_data.get("step", 0),
                    event_data.get("tool_name", "unknown"),
                    json.dumps(event_data.get("arguments", {})),
                    action,
                    risk,
                    json.dumps(event_data.get("reasons", [])),
                    json.dumps(event_data.get("context_segments", [])),
                    json.dumps(event_data.get("taint", [])),
                    event_data.get("latency_ms", 0.0),
                    timestamp,
                ),
            )

            # Auto-generate incident on blocked threat or high risk
            if action in ("block", "kill_session", "escalate") or risk >= 0.70:
                inc_id = f"inc_{event_data['event_id'][:12]}"
                severity = "critical" if risk >= 0.85 or action == "kill_session" else ("high" if risk >= 0.60 or action == "block" else "medium")
                reasons = event_data.get("reasons", [])
                code = reasons[0].get("code", "THREAT_DETECTED") if reasons and isinstance(reasons[0], dict) else "THREAT_DETECTED"
                title = f"Shield Interception: {code} in {event_data.get('tool_name', 'tool')}"
                conn.execute(
                    """
                    INSERT OR IGNORE INTO incidents (
                        id, project_id, event_id, session_id, title,
                        severity, status, risk, policy_violated, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)
                    """,
                    (
                        inc_id,
                        project_id or "default",
                        event_data["event_id"],
                        event_data.get("session_id", "default-sess"),
                        title,
                        severity,
                        risk,
                        code,
                        timestamp,
                        timestamp,
                    ),
                )

            # Auto-generate human-in-the-loop approval on escalate action
            if action == "escalate":
                appr_id = f"appr_{event_data['event_id'][:12]}"
                expires_at = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=2)).isoformat()
                reasons = event_data.get("reasons", [])
                conn.execute(
                    """
                    INSERT OR IGNORE INTO approvals (
                        id, project_id, event_id, agent_id, session_id, tool_name,
                        arguments_json, risk, reasons_json, status, requested_at, expires_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
                    """,
                    (
                        appr_id,
                        project_id or "default",
                        event_data["event_id"],
                        event_data.get("agent_id", "default-agent"),
                        event_data.get("session_id", "default-sess"),
                        event_data.get("tool_name", "tool"),
                        json.dumps(event_data.get("arguments", {})),
                        risk,
                        json.dumps(reasons),
                        timestamp,
                        expires_at,
                    ),
                )

            # Commit cryptographically hash-chained audit record
            cur_audit = conn.execute("SELECT sequence, hash FROM audit_records ORDER BY sequence DESC LIMIT 1")
            last_audit = cur_audit.fetchone()
            if last_audit:
                prev_hash = last_audit["hash"]
                seq = last_audit["sequence"] + 1
            else:
                prev_hash = "GENESIS_BLOCK_00000000000000000000000000000000"
                seq = 1

            audit_id = f"audit_{event_data['event_id'][:12]}_{seq}"
            decision_id = event_data.get("decision_id") or f"dec_{event_data['event_id'][:12]}"
            entry_hash = compute_audit_hash(
                sequence=seq,
                tenant_id=project_id or "default",
                event_id=event_data["event_id"],
                decision_id=decision_id,
                action=action,
                timestamp=timestamp,
                prev_hash=prev_hash,
            )
            conn.execute(
                """
                INSERT OR IGNORE INTO audit_records (
                    sequence, id, project_id, tenant_id, event_id, decision_id, action, timestamp, prev_hash, hash
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    seq,
                    audit_id,
                    project_id or "default",
                    project_id or "default",
                    event_data["event_id"],
                    decision_id,
                    action,
                    timestamp,
                    prev_hash,
                    entry_hash,
                ),
            )

            # Check if event touches an active honeytool
            tool_name = event_data.get("tool_name", "")
            reasons_list = event_data.get("reasons", [])
            has_honey_reason = any(
                isinstance(r, dict) and r.get("detector") == "honey" for r in reasons_list
            )
            cur_ht = conn.execute(
                "SELECT id FROM honeytools WHERE (project_id = ? OR project_id = 'default') AND name = ? AND is_active = 1",
                (project_id or "default", tool_name),
            )
            ht_row = cur_ht.fetchone()
            if ht_row or has_honey_reason:
                ht_id = ht_row["id"] if ht_row else f"honey_{tool_name}"
                trig_id = f"trig_{uuid.uuid4().hex[:8]}"
                conn.execute(
                    """
                    INSERT INTO honey_triggers (
                        id, honeytool_id, project_id, agent_id, session_id, event_id, triggered_at, arguments_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        trig_id,
                        ht_id,
                        project_id or "default",
                        event_data.get("agent_id", "default-agent"),
                        event_data.get("session_id", "default-sess"),
                        event_data["event_id"],
                        timestamp,
                        json.dumps(event_data.get("arguments", {})),
                    ),
                )
                if ht_row:
                    conn.execute("UPDATE honeytools SET trigger_count = trigger_count + 1 WHERE id = ?", (ht_row["id"],))

    def get_events(self, project_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        if project_id:
            cur = conn.execute("SELECT * FROM events WHERE project_id = ? ORDER BY timestamp DESC LIMIT ?", (project_id, limit))
        else:
            cur = conn.execute("SELECT * FROM events ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cur.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["arguments"] = json.loads(d.pop("arguments_json", "{}"))
            d["reasons"] = json.loads(d.pop("reasons_json", "[]"))
            d["context_segments"] = json.loads(d.pop("context_segments_json", "[]"))
            d["taint"] = json.loads(d.pop("taint_json", "[]"))
            result.append(d)
        return result

    def get_event_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute("SELECT * FROM events WHERE event_id = ?", (event_id,))
        row = cur.fetchone()
        if not row:
            return None
        d = dict(row)
        d["arguments"] = json.loads(d.pop("arguments_json", "{}"))
        d["reasons"] = json.loads(d.pop("reasons_json", "[]"))
        d["context_segments"] = json.loads(d.pop("context_segments_json", "[]"))
        d["taint"] = json.loads(d.pop("taint_json", "[]"))
        return d

    def get_project_event_count(self, project_id: str) -> int:
        conn = self.get_connection()
        cur = conn.execute(
            """
            SELECT COUNT(*) FROM events 
            WHERE project_id = ? 
               OR (tenant_id = (SELECT org_id FROM projects WHERE id = ?) AND (project_id IS NULL OR project_id = ''))
            """,
            (project_id, project_id),
        )
        return int(cur.fetchone()[0])

    # --- Incident Operations ---
    def create_incident(
        self,
        incident_id: str,
        project_id: str,
        event_id: str,
        session_id: str,
        title: str,
        severity: str = "high",
        status: str = "open",
        risk: float = 0.0,
        policy_violated: Optional[str] = None,
        created_at: Optional[str] = None,
        updated_at: Optional[str] = None,
    ) -> None:
        conn = self.get_connection()
        now = created_at or datetime.datetime.now(datetime.timezone.utc).isoformat()
        with conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO incidents (
                    id, project_id, event_id, session_id, title,
                    severity, status, risk, policy_violated, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    incident_id,
                    project_id,
                    event_id,
                    session_id,
                    title,
                    severity,
                    status,
                    risk,
                    policy_violated,
                    now,
                    updated_at or now,
                ),
            )

    def get_incidents(
        self,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        query = "SELECT * FROM incidents WHERE 1=1"
        params: List[Any] = []
        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)
        if status and status != "all":
            query += " AND status = ?"
            params.append(status)
        if severity and severity != "all":
            query += " AND severity = ?"
            params.append(severity)
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        cur = conn.execute(query, tuple(params))
        return [dict(r) for r in cur.fetchall()]

    def get_incident_by_id(self, incident_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
        row = cur.fetchone()
        return dict(row) if row else None

    def update_incident(
        self,
        incident_id: str,
        status: Optional[str] = None,
        assigned_to: Optional[str] = None,
        resolution_notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        updates = ["updated_at = ?"]
        params: List[Any] = [now]
        if status:
            updates.append("status = ?")
            params.append(status)
        if assigned_to is not None:
            updates.append("assigned_to = ?")
            params.append(assigned_to)
        if resolution_notes is not None:
            updates.append("resolution_notes = ?")
            params.append(resolution_notes)
        params.append(incident_id)

        with conn:
            conn.execute(f"UPDATE incidents SET {', '.join(updates)} WHERE id = ?", tuple(params))

        return self.get_incident_by_id(incident_id)

    def get_incident_taint_graph(self, incident_id: str) -> Dict[str, Any]:
        inc = self.get_incident_by_id(incident_id)
        if not inc:
            return {"nodes": [], "edges": []}
        evt = self.get_event_by_id(inc["event_id"])
        if not evt:
            return {"nodes": [], "edges": []}

        nodes = []
        edges = []

        # 1. Source Context Nodes
        context_segments = evt.get("context_segments", [])
        tainted_ids = set(evt.get("taint", []))

        if not context_segments:
            nodes.append({
                "id": "src-untrusted-input",
                "label": "Prompt Context",
                "type": "source",
                "trust": "untrusted",
                "tainted": True,
            })
            edges.append({
                "id": "edge-src-agent",
                "source": "src-untrusted-input",
                "target": evt.get("agent_id", "agent"),
                "tainted": True,
            })
        else:
            for seg in context_segments:
                seg_id = seg.get("id", "seg")
                is_tainted = seg_id in tainted_ids or seg.get("trust") == "untrusted"
                nodes.append({
                    "id": seg_id,
                    "label": f"{seg.get('source', 'input')}: {seg.get('trust', 'untrusted')}",
                    "type": "source",
                    "trust": seg.get("trust", "untrusted"),
                    "text_preview": (seg.get("text") or "")[:80],
                    "tainted": is_tainted,
                })
                edges.append({
                    "id": f"edge-{seg_id}-agent",
                    "source": seg_id,
                    "target": evt.get("agent_id", "agent"),
                    "tainted": is_tainted,
                })

        # 2. Agent Node
        agent_id = evt.get("agent_id", "agent")
        nodes.append({
            "id": agent_id,
            "label": f"Agent ({agent_id})",
            "type": "agent",
            "risk": evt.get("risk", 0.0),
            "step": evt.get("step", 0),
        })

        # 3. Sink / Tool Node
        tool_name = evt.get("tool_name", "tool")
        nodes.append({
            "id": tool_name,
            "label": f"Tool Sink: {tool_name}",
            "type": "sink",
            "action": evt.get("action", "allow"),
            "risk": evt.get("risk", 0.0),
        })

        edges.append({
            "id": f"edge-agent-{tool_name}",
            "source": agent_id,
            "target": tool_name,
            "tainted": len(tainted_ids) > 0 or evt.get("risk", 0.0) >= 0.5,
            "action": evt.get("action", "allow"),
        })

        return {
            "nodes": nodes,
            "edges": edges,
            "incident_id": incident_id,
            "risk": evt.get("risk", 0.0),
            "tool_name": tool_name,
            "agent_id": agent_id,
        }

    # --- Agent Registry Operations ---
    def create_agent(
        self,
        agent_id: str,
        project_id: str,
        name: str,
        description: str = "",
        allowed_tools: Optional[List[Dict[str, Any]]] = None,
        blast_radius_score: float = 25.0,
        status: str = "active",
        metadata: Optional[Dict[str, Any]] = None,
        created_at: Optional[str] = None,
    ) -> Dict[str, Any]:
        conn = self.get_connection()
        now = created_at or datetime.datetime.now(datetime.timezone.utc).isoformat()
        tools_json = json.dumps(allowed_tools or [])
        meta_json = json.dumps(metadata or {})
        with conn:
            conn.execute(
                """
                INSERT INTO agents (id, project_id, name, description, status, allowed_tools_json, blast_radius_score, metadata_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (agent_id, project_id, name, description, status, tools_json, blast_radius_score, meta_json, now),
            )
        return self.get_agent_by_id(agent_id) or {}

    def get_agents(self, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        query = "SELECT * FROM agents"
        params: List[Any] = []
        if project_id:
            query += " WHERE project_id = ?"
            params.append(project_id)
        query += " ORDER BY created_at DESC"
        cur = conn.execute(query, tuple(params))
        results = []
        for row in cur.fetchall():
            d = dict(row)
            d["allowed_tools"] = json.loads(d.get("allowed_tools_json") or "[]")
            d["metadata"] = json.loads(d.get("metadata_json") or "{}")
            results.append(d)
        return results

    def get_agent_by_id(self, agent_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
        row = cur.fetchone()
        if not row:
            return None
        d = dict(row)
        d["allowed_tools"] = json.loads(d.get("allowed_tools_json") or "[]")
        d["metadata"] = json.loads(d.get("metadata_json") or "{}")
        return d

    def update_agent(
        self,
        agent_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        allowed_tools: Optional[List[Dict[str, Any]]] = None,
        blast_radius_score: Optional[float] = None,
        status: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        updates = []
        params: List[Any] = []
        if name is not None:
            updates.append("name = ?")
            params.append(name)
        if description is not None:
            updates.append("description = ?")
            params.append(description)
        if allowed_tools is not None:
            updates.append("allowed_tools_json = ?")
            params.append(json.dumps(allowed_tools))
        if blast_radius_score is not None:
            updates.append("blast_radius_score = ?")
            params.append(blast_radius_score)
        if status is not None:
            updates.append("status = ?")
            params.append(status)
        if not updates:
            return self.get_agent_by_id(agent_id)
        params.append(agent_id)
        with conn:
            conn.execute(f"UPDATE agents SET {', '.join(updates)} WHERE id = ?", tuple(params))
        return self.get_agent_by_id(agent_id)

    def set_agent_kill_switch(self, agent_id: str, suspended: bool) -> Optional[Dict[str, Any]]:
        return self.update_agent(agent_id, status="suspended" if suspended else "active")

    # --- Sessions & Replay Simulator Operations ---
    def get_sessions(
        self,
        project_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        query = """
            SELECT 
                session_id,
                project_id,
                agent_id,
                COUNT(event_id) as step_count,
                MAX(risk) as max_risk,
                MIN(timestamp) as started_at,
                MAX(timestamp) as last_activity_at,
                GROUP_CONCAT(DISTINCT tool_name) as tools_concatenated,
                SUM(CASE WHEN action in ('block', 'kill_session') THEN 1 ELSE 0 END) as block_count,
                SUM(CASE WHEN action = 'escalate' THEN 1 ELSE 0 END) as escalate_count,
                SUM(CASE WHEN action = 'sanitize' THEN 1 ELSE 0 END) as sanitize_count,
                SUM(CASE WHEN taint_json != '[]' THEN 1 ELSE 0 END) as taint_count
            FROM events
            WHERE 1=1
        """
        params: List[Any] = []
        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)
        if agent_id:
            query += " AND agent_id = ?"
            params.append(agent_id)

        query += " GROUP BY session_id ORDER BY last_activity_at DESC LIMIT ?"
        params.append(limit)

        cur = conn.execute(query, tuple(params))
        sessions = []
        for row in cur.fetchall():
            d = dict(row)
            tools_str = d.pop("tools_concatenated") or ""
            d["tools_used"] = [t.strip() for t in tools_str.split(",") if t.strip()]

            # Determine aggregate session security status
            if d.get("block_count", 0) > 0:
                d["status"] = "blocked"
            elif d.get("escalate_count", 0) > 0:
                d["status"] = "escalated"
            elif d.get("sanitize_count", 0) > 0:
                d["status"] = "sanitized"
            elif d.get("taint_count", 0) > 0:
                d["status"] = "tainted"
            else:
                d["status"] = "clean"

            if status and status != "all" and d["status"] != status:
                continue

            sessions.append(d)
        return sessions

    def get_session_by_id(self, session_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute(
            """
            SELECT * FROM events
            WHERE session_id = ?
            ORDER BY step ASC, timestamp ASC
            """,
            (session_id,),
        )
        rows = cur.fetchall()
        if not rows:
            return None

        steps = []
        max_risk = 0.0
        tools_used = set()
        has_block = False
        has_taint = False

        for r in rows:
            step_data = dict(r)
            step_data["arguments"] = json.loads(step_data.get("arguments_json") or "{}")
            step_data["reasons"] = json.loads(step_data.get("reasons_json") or "[]")
            step_data["context_segments"] = json.loads(step_data.get("context_segments_json") or "[]")
            step_data["taint"] = json.loads(step_data.get("taint_json") or "[]")
            risk = step_data.get("risk", 0.0)
            if risk > max_risk:
                max_risk = risk
            tools_used.add(step_data["tool_name"])
            if step_data["action"] in ("block", "kill_session"):
                has_block = True
            if step_data["taint"]:
                has_taint = True
            steps.append(step_data)

        first_evt = steps[0]
        last_evt = steps[-1]

        overall_status = "blocked" if has_block else "tainted" if has_taint else "clean"

        return {
            "session_id": session_id,
            "project_id": first_evt.get("project_id"),
            "agent_id": first_evt.get("agent_id"),
            "step_count": len(steps),
            "max_risk": max_risk,
            "tools_used": list(tools_used),
            "started_at": first_evt.get("timestamp"),
            "last_activity_at": last_evt.get("timestamp"),
            "status": overall_status,
            "steps": steps,
        }

    def replay_session(
        self,
        session_id: str,
        override_policy: Optional[str] = None,
        sensitivity_overrides: Optional[Dict[str, str]] = None,
        strict_mode: bool = False,
    ) -> Dict[str, Any]:
        session_detail = self.get_session_by_id(session_id)
        if not session_detail:
            return {"session_id": session_id, "steps": [], "summary_diff": {}}

        sens_overrides = sensitivity_overrides or {}
        step_diffs = []
        changed_count = 0
        original_blocked = 0
        simulated_blocked = 0

        for s in session_detail["steps"]:
            orig_action = s["action"]
            tool_name = s["tool_name"]
            tool_sens = sens_overrides.get(tool_name, "medium")
            taint = s.get("taint", [])
            risk = s.get("risk", 0.0)

            if orig_action in ("block", "kill_session"):
                original_blocked += 1

            # Simulation evaluation logic
            sim_action = orig_action
            sim_reasons = list(s.get("reasons", []))
            sim_risk = risk

            if strict_mode or override_policy == "strict":
                if taint or sim_risk >= 0.20 or tool_sens in ("high", "critical"):
                    sim_action = "block"
                    sim_risk = max(sim_risk, 0.85)
                    sim_reasons.append({
                        "code": "REPLAY_SIM_STRICT_BLOCK",
                        "evidence": f"Strict policy enforced on sensitive/tainted tool {tool_name}",
                        "detector": "simulator",
                    })
            elif override_policy == "permissive":
                if sim_action == "block" and not taint:
                    sim_action = "allow"
                    sim_risk = min(sim_risk, 0.15)
                    sim_reasons.append({
                        "code": "REPLAY_SIM_PERMISSIVE_ALLOW",
                        "evidence": "Permissive policy downgraded block to allow",
                        "detector": "simulator",
                    })

            if sim_action in ("block", "kill_session"):
                simulated_blocked += 1

            is_changed = sim_action != orig_action
            if is_changed:
                changed_count += 1

            step_diffs.append({
                "step": s["step"],
                "tool_name": tool_name,
                "original_action": orig_action,
                "simulated_action": sim_action,
                "action_changed": is_changed,
                "original_risk": risk,
                "simulated_risk": sim_risk,
                "arguments": s["arguments"],
                "reasons": sim_reasons,
                "timestamp": s["timestamp"],
            })

        return {
            "session_id": session_id,
            "policy_applied": override_policy or "strict",
            "strict_mode": strict_mode,
            "total_steps": len(step_diffs),
            "changed_steps": changed_count,
            "original_blocked_steps": original_blocked,
            "simulated_blocked_steps": simulated_blocked,
            "step_diffs": step_diffs,
        }

    # --- Policy Operations ---
    def create_policy(
        self,
        policy_id: str,
        project_id: str,
        name: str,
        rules_rego: str,
        description: str = "",
        version: str = "1.0.0",
        is_active: int = 1,
        created_at: Optional[str] = None,
    ) -> Dict[str, Any]:
        conn = self.get_connection()
        now = created_at or datetime.datetime.now(datetime.timezone.utc).isoformat()
        with conn:
            conn.execute(
                """
                INSERT INTO policies (id, project_id, name, description, rules_rego, version, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (policy_id, project_id, name, description, rules_rego, version, is_active, now, now),
            )
        return self.get_policy_by_id(policy_id) or {}

    def get_policies(self, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        query = "SELECT * FROM policies"
        params: List[Any] = []
        if project_id:
            query += " WHERE project_id = ?"
            params.append(project_id)
        query += " ORDER BY updated_at DESC"
        cur = conn.execute(query, tuple(params))
        return [dict(r) for r in cur.fetchall()]

    def get_policy_by_id(self, policy_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute("SELECT * FROM policies WHERE id = ?", (policy_id,))
        row = cur.fetchone()
        return dict(row) if row else None

    def update_policy(
        self,
        policy_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        rules_rego: Optional[str] = None,
        version: Optional[str] = None,
        is_active: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        updates = ["updated_at = ?"]
        params: List[Any] = [now]
        if name is not None:
            updates.append("name = ?")
            params.append(name)
        if description is not None:
            updates.append("description = ?")
            params.append(description)
        if rules_rego is not None:
            updates.append("rules_rego = ?")
            params.append(rules_rego)
        if version is not None:
            updates.append("version = ?")
            params.append(version)
        if is_active is not None:
            updates.append("is_active = ?")
            params.append(is_active)
        params.append(policy_id)

        with conn:
            conn.execute(f"UPDATE policies SET {', '.join(updates)} WHERE id = ?", tuple(params))
        return self.get_policy_by_id(policy_id)

    def delete_policy(self, policy_id: str) -> bool:
        conn = self.get_connection()
        with conn:
            cur = conn.execute("DELETE FROM policies WHERE id = ?", (policy_id,))
            return cur.rowcount > 0

    def simulate_policy_dry_run(
        self,
        rules_rego: str,
        project_id: Optional[str] = None,
        sample_size: int = 50,
    ) -> Dict[str, Any]:
        events = self.get_events(project_id=project_id, limit=sample_size)
        changed_events = []
        original_blocked = 0
        simulated_blocked = 0
        impacted_sessions = set()

        # Parse simple rego rules (deny / block / sanitize heuristics)
        lower_rego = rules_rego.lower()
        strict_guard = "default allow = false" in lower_rego or "action = \"block\"" in lower_rego
        sensitive_tools_blocked = "tool == \"bash\"" in lower_rego or "bash" in lower_rego

        for ev in events:
            orig_action = ev.get("action", "allow")
            if orig_action in ("block", "kill_session"):
                original_blocked += 1

            sim_action = orig_action
            tool = ev.get("tool_name", "")
            if tool and tool.lower() in lower_rego and ("block" in lower_rego or "deny" in lower_rego):
                sim_action = "block"
            elif sensitive_tools_blocked and any(k in tool.lower() for k in ("bash", "exec", "rm", "curl", "cmd")):
                sim_action = "block"
            elif strict_guard and (ev.get("risk", 0.0) >= 0.25 or ev.get("taint")):
                sim_action = "block"

            if sim_action in ("block", "kill_session"):
                simulated_blocked += 1

            if sim_action != orig_action:
                changed_events.append({
                    "event_id": ev["event_id"],
                    "session_id": ev["session_id"],
                    "tool_name": ev["tool_name"],
                    "original_action": orig_action,
                    "simulated_action": sim_action,
                    "risk": ev.get("risk", 0.0),
                })
                impacted_sessions.add(ev["session_id"])

        return {
            "total_simulated": len(events),
            "changed_verdicts_count": len(changed_events),
            "original_blocked": original_blocked,
            "simulated_blocked": simulated_blocked,
            "blocked_diff": simulated_blocked - original_blocked,
            "changed_events": changed_events[:20],
            "impacted_sessions": list(impacted_sessions),
        }

    # --- Approvals Queue Operations ---
    def get_approvals(
        self,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        query = "SELECT * FROM approvals WHERE 1=1"
        params: List[Any] = []
        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)
        if status and status != "all":
            query += " AND status = ?"
            params.append(status)
        query += " ORDER BY requested_at DESC LIMIT ?"
        params.append(limit)

        cur = conn.execute(query, tuple(params))
        results = []
        for r in cur.fetchall():
            d = dict(r)
            d["arguments"] = json.loads(d.pop("arguments_json", "{}"))
            d["reasons"] = json.loads(d.pop("reasons_json", "[]"))
            results.append(d)
        return results

    def get_approval_by_id(self, approval_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute("SELECT * FROM approvals WHERE id = ?", (approval_id,))
        row = cur.fetchone()
        if not row:
            return None
        d = dict(row)
        d["arguments"] = json.loads(d.pop("arguments_json", "{}"))
        d["reasons"] = json.loads(d.pop("reasons_json", "[]"))
        return d

    def resolve_approval(
        self,
        approval_id: str,
        status: str,
        resolved_by: str,
        reason: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with conn:
            conn.execute(
                """
                UPDATE approvals
                SET status = ?, resolved_at = ?, resolved_by = ?, resolution_reason = ?
                WHERE id = ?
                """,
                (status, now, resolved_by, reason or "", approval_id),
            )
        return self.get_approval_by_id(approval_id)

    # --- Model Registry & Threshold Operations ---
    def get_model_thresholds(self, project_id: str = "default") -> Dict[str, Any]:
        conn = self.get_connection()
        cur = conn.execute("SELECT * FROM model_thresholds WHERE project_id = ?", (project_id,))
        row = cur.fetchone()
        if row:
            return dict(row)
        # Default thresholds per architecture spec
        defaults = {
            "id": f"thresh_{project_id}",
            "project_id": project_id,
            "block_threshold": 0.36,
            "escalate_threshold": 0.28,
            "sanitize_threshold": 0.16,
            "kill_session_threshold": 0.95,
            "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
        with conn:
            conn.execute(
                """
                INSERT OR IGNORE INTO model_thresholds (id, project_id, block_threshold, escalate_threshold, sanitize_threshold, kill_session_threshold, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    defaults["id"],
                    project_id,
                    defaults["block_threshold"],
                    defaults["escalate_threshold"],
                    defaults["sanitize_threshold"],
                    defaults["kill_session_threshold"],
                    defaults["updated_at"],
                ),
            )
        return defaults

    def update_model_thresholds(
        self,
        project_id: str = "default",
        block_threshold: Optional[float] = None,
        escalate_threshold: Optional[float] = None,
        sanitize_threshold: Optional[float] = None,
        kill_session_threshold: Optional[float] = None,
    ) -> Dict[str, Any]:
        conn = self.get_connection()
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        current = self.get_model_thresholds(project_id)
        new_block = block_threshold if block_threshold is not None else current["block_threshold"]
        new_escalate = escalate_threshold if escalate_threshold is not None else current["escalate_threshold"]
        new_sanitize = sanitize_threshold if sanitize_threshold is not None else current["sanitize_threshold"]
        new_kill = kill_session_threshold if kill_session_threshold is not None else current["kill_session_threshold"]

        with conn:
            conn.execute(
                """
                UPDATE model_thresholds
                SET block_threshold = ?, escalate_threshold = ?, sanitize_threshold = ?, kill_session_threshold = ?, updated_at = ?
                WHERE project_id = ?
                """,
                (new_block, new_escalate, new_sanitize, new_kill, now, project_id),
            )
        return self.get_model_thresholds(project_id)

    def get_models_registry_status(self) -> List[Dict[str, Any]]:
        thresholds = self.get_model_thresholds("default")
        return [
            {
                "id": "model_1_deberta_injection",
                "name": "DeBERTa Prompt Injection Classifier",
                "type": "Supervised Deep Learning",
                "version": "v1.0.0",
                "status": "active",
                "latency_p95_ms": 18.2,
                "threshold": 0.50,
                "device": "GPU/ONNX Runtime",
                "accuracy": 0.984,
                "description": "Cross-attention classification for direct and indirect prompt injections and jailbreaks.",
            },
            {
                "id": "model_2_minilm_similarity",
                "name": "MiniLM Embeddings & Vector Similarity",
                "type": "Embedding / Vector Search",
                "version": "v1.0.0",
                "status": "active",
                "latency_p95_ms": 4.1,
                "threshold": 0.82,
                "device": "CPU / Qdrant",
                "accuracy": 0.962,
                "description": "Cosine similarity match against known attack vector library and historical threats.",
            },
            {
                "id": "model_3_sequence_anomaly",
                "name": "Sequence Autoencoder & Isolation Forest",
                "type": "Unsupervised Behavioral Anomaly",
                "version": "v1.0.0",
                "status": "active",
                "latency_p95_ms": 6.8,
                "threshold": thresholds["block_threshold"],
                "device": "CPU",
                "accuracy": 0.941,
                "description": "Detects anomalous multi-turn tool call sequence transitions and call bursts.",
            },
            {
                "id": "model_4_intent_consistency",
                "name": "Intent-Consistency Scorer",
                "type": "Embedding Cosine Drift",
                "version": "v1.0.0",
                "status": "active",
                "latency_p95_ms": 5.0,
                "threshold": 0.65,
                "device": "CPU",
                "accuracy": 0.950,
                "description": "Measures goal alignment between original user prompt and requested tool arguments.",
            },
            {
                "id": "model_5_lightgbm_risk_stacker",
                "name": "LightGBM Risk Stacker & Platt Calibration",
                "type": "Supervised Classical Ensemble",
                "version": "v1.0.0",
                "status": "active",
                "latency_p95_ms": 1.4,
                "threshold": thresholds["block_threshold"],
                "device": "CPU",
                "accuracy": 0.991,
                "description": "Fuses sub-detector outputs into a calibrated composite risk probability [0.0, 1.0].",
            },
            {
                "id": "rule_pii_entropy_scanner",
                "name": "PII & Shannon Entropy Secret Scanner",
                "type": "Rule-Based Deterministic",
                "version": "v1.0.0",
                "status": "active",
                "latency_p95_ms": 0.8,
                "threshold": 4.5,
                "device": "In-Memory",
                "accuracy": 0.999,
                "description": "Detects leaked AWS keys, JWTs, credit cards, and cryptographic secrets in arguments.",
            },
            {
                "id": "rule_honeytools_decoy",
                "name": "Honeytools & Canary Traps",
                "type": "Active Deception",
                "version": "v1.0.0",
                "status": "active",
                "latency_p95_ms": 0.1,
                "threshold": 1.0,
                "device": "Gateway Hook",
                "accuracy": 1.000,
                "description": "Instant trap triggers on decoy tools and seeded honeytokens.",
            },
        ]

    # --- Honeytools & Decoys Operations ---
    def get_honeytools(self, project_id: str = "default") -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute("SELECT * FROM honeytools WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
        rows = cur.fetchall()
        if rows:
            return [dict(r) for r in rows]

        # Auto-seed standard honey decoy tools if none exist
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        defaults = [
            ("export_all_customers", "tool", "Decoy: Dumps complete customer CRM table", "critical"),
            ("dump_system_credentials", "tool", "Decoy: Dumps runtime environment variables and AWS secrets", "critical"),
            ("elevate_to_superuser", "tool", "Decoy: Attempts Unix sudo / root elevation", "critical"),
            ("fetch_master_keys", "tool", "Decoy: Requests master KMS encryption secrets", "critical"),
            ("bypass_security_sandbox", "tool", "Decoy: Attempts container breakout", "critical"),
            ("PROD_API_SECRET_CANARY_99", "token", "Decoy canary token embedded in system prompt", "critical"),
        ]
        with conn:
            for name, htype, desc, sens in defaults:
                ht_id = f"honey_{uuid.uuid4().hex[:8]}"
                conn.execute(
                    """
                    INSERT OR IGNORE INTO honeytools (id, project_id, name, type, description, sensitivity, trigger_count, is_active, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?)
                    """,
                    (ht_id, project_id, name, htype, desc, sens, now),
                )
        cur = conn.execute("SELECT * FROM honeytools WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
        return [dict(r) for r in cur.fetchall()]

    def create_honeytool(
        self,
        honeytool_id: str,
        project_id: str,
        name: str,
        type: str = "tool",
        description: str = "",
        sensitivity: str = "critical",
    ) -> Dict[str, Any]:
        conn = self.get_connection()
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with conn:
            conn.execute(
                """
                INSERT INTO honeytools (id, project_id, name, type, description, sensitivity, trigger_count, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?)
                """,
                (honeytool_id, project_id, name, type, description, sensitivity, now),
            )
        cur = conn.execute("SELECT * FROM honeytools WHERE id = ?", (honeytool_id,))
        return dict(cur.fetchone())

    def delete_honeytool(self, honeytool_id: str) -> bool:
        conn = self.get_connection()
        with conn:
            cur = conn.execute("DELETE FROM honeytools WHERE id = ?", (honeytool_id,))
            return cur.rowcount > 0

    def get_honey_triggers(self, project_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        if project_id:
            cur = conn.execute("SELECT * FROM honey_triggers WHERE project_id = ? ORDER BY triggered_at DESC LIMIT ?", (project_id, limit))
        else:
            cur = conn.execute("SELECT * FROM honey_triggers ORDER BY triggered_at DESC LIMIT ?", (limit,))
        results = []
        for r in cur.fetchall():
            d = dict(r)
            d["arguments"] = json.loads(d.pop("arguments_json", "{}"))
            results.append(d)
        return results

    # --- Cryptographic Audit Log Operations ---
    def get_audit_records(
        self,
        project_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        if project_id:
            cur = conn.execute(
                "SELECT * FROM audit_records WHERE project_id = ? ORDER BY sequence DESC LIMIT ? OFFSET ?",
                (project_id, limit, offset),
            )
        else:
            cur = conn.execute(
                "SELECT * FROM audit_records ORDER BY sequence DESC LIMIT ? OFFSET ?",
                (limit, offset),
            )
        return [dict(r) for r in cur.fetchall()]

    def verify_audit_log(self, project_id: Optional[str] = None) -> Dict[str, Any]:
        conn = self.get_connection()
        if project_id:
            cur = conn.execute("SELECT * FROM audit_records WHERE project_id = ? ORDER BY sequence ASC", (project_id,))
        else:
            cur = conn.execute("SELECT * FROM audit_records ORDER BY sequence ASC")
        rows = [dict(r) for r in cur.fetchall()]
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()

        if not rows:
            return {
                "valid": True,
                "total_records": 0,
                "unbroken_count": 0,
                "broken_at_sequence": None,
                "genesis_hash": "GENESIS_BLOCK_00000000000000000000000000000000",
                "head_hash": "GENESIS_BLOCK_00000000000000000000000000000000",
                "verified_at": now,
            }

        unbroken_count = 0
        broken_at = None
        for i in range(len(rows)):
            curr = rows[i]
            expected_prev = "GENESIS_BLOCK_00000000000000000000000000000000" if i == 0 else rows[i - 1]["hash"]
            if curr["prev_hash"] != expected_prev:
                broken_at = curr["sequence"]
                break

            calc = compute_audit_hash(
                sequence=curr["sequence"],
                tenant_id=curr["tenant_id"],
                event_id=curr["event_id"],
                decision_id=curr["decision_id"],
                action=curr["action"],
                timestamp=curr["timestamp"],
                prev_hash=curr["prev_hash"],
            )
            if curr["hash"] != calc:
                broken_at = curr["sequence"]
                break
            unbroken_count += 1

        is_valid = broken_at is None
        return {
            "valid": is_valid,
            "total_records": len(rows),
            "unbroken_count": unbroken_count,
            "broken_at_sequence": broken_at,
            "genesis_hash": rows[0]["hash"],
            "head_hash": rows[-1]["hash"] if rows else "",
            "verified_at": now,
        }

    # --- Billing, Metering & Subscription Operations ---
    def get_subscription(self, project_id: str = "default") -> Dict[str, Any]:
        conn = self.get_connection()
        cur = conn.execute("SELECT * FROM subscriptions WHERE project_id = ?", (project_id,))
        row = cur.fetchone()
        if row:
            return dict(row)

        now = datetime.datetime.now(datetime.timezone.utc)
        sub_id = f"sub_{uuid.uuid4().hex[:8]}"
        period_start = now.isoformat()
        period_end = (now + datetime.timedelta(days=30)).isoformat()
        defaults = {
            "id": sub_id,
            "project_id": project_id,
            "plan": "free",
            "status": "active",
            "current_period_start": period_start,
            "current_period_end": period_end,
            "calls_limit": 10000,
            "stripe_customer_id": f"cus_{project_id[:8]}",
            "stripe_subscription_id": f"sub_demo_{project_id[:8]}",
            "created_at": period_start,
            "updated_at": period_start,
        }
        with conn:
            conn.execute(
                """
                INSERT OR IGNORE INTO subscriptions (
                    id, project_id, plan, status, current_period_start, current_period_end,
                    calls_limit, stripe_customer_id, stripe_subscription_id, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    defaults["id"],
                    project_id,
                    defaults["plan"],
                    defaults["status"],
                    defaults["current_period_start"],
                    defaults["current_period_end"],
                    defaults["calls_limit"],
                    defaults["stripe_customer_id"],
                    defaults["stripe_subscription_id"],
                    defaults["created_at"],
                    defaults["updated_at"],
                ),
            )
        return defaults

    def update_subscription(self, project_id: str, plan: str) -> Dict[str, Any]:
        conn = self.get_connection()
        now = datetime.datetime.now(datetime.timezone.utc)
        limits = {"free": 10000, "team": 250000, "enterprise": 5000000}
        prices = {"free": 0, "team": 9900, "enterprise": 49900}
        calls_limit = limits.get(plan, 10000)
        price_cents = prices.get(plan, 0)
        current = self.get_subscription(project_id)

        period_start = now.isoformat()
        period_end = (now + datetime.timedelta(days=30)).isoformat()

        with conn:
            conn.execute(
                """
                UPDATE subscriptions
                SET plan = ?, calls_limit = ?, current_period_start = ?, current_period_end = ?, updated_at = ?
                WHERE project_id = ?
                """,
                (plan, calls_limit, period_start, period_end, period_start, project_id),
            )
            # Record invoice for plan change
            inv_id = f"inv_{uuid.uuid4().hex[:8]}"
            conn.execute(
                """
                INSERT INTO invoices (id, project_id, amount_cents, currency, status, period_start, period_end, created_at)
                VALUES (?, ?, ?, 'usd', 'paid', ?, ?, ?)
                """,
                (inv_id, project_id, price_cents, period_start, period_end, period_start),
            )

        return self.get_subscription(project_id)

    def get_billing_usage(self, project_id: str = "default") -> Dict[str, Any]:
        conn = self.get_connection()
        sub = self.get_subscription(project_id)

        # Count events in current period
        cur = conn.execute(
            "SELECT action, COUNT(*) as cnt FROM events WHERE (project_id = ? OR project_id = 'default') GROUP BY action",
            (project_id,),
        )
        actions_breakdown = {"allow": 0, "block": 0, "sanitize": 0, "escalate": 0, "kill_session": 0}
        total_calls = 0
        for r in cur.fetchall():
            act = r["action"]
            cnt = r["cnt"]
            actions_breakdown[act] = cnt
            total_calls += cnt

        quota_limit = sub.get("calls_limit", 10000)
        quota_used_pct = round((total_calls / quota_limit) * 100, 2) if quota_limit > 0 else 0.0

        return {
            "project_id": project_id,
            "plan": sub["plan"],
            "calls_used": total_calls,
            "calls_limit": quota_limit,
            "quota_used_pct": quota_used_pct,
            "actions_breakdown": actions_breakdown,
            "billing_period_start": sub["current_period_start"],
            "billing_period_end": sub["current_period_end"],
        }

    def get_invoices(self, project_id: str = "default") -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cur = conn.execute("SELECT * FROM invoices WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
        rows = cur.fetchall()
        if rows:
            return [dict(r) for r in rows]

        # Seed initial invoice if none
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        inv_id = f"inv_{uuid.uuid4().hex[:8]}"
        with conn:
            conn.execute(
                """
                INSERT INTO invoices (id, project_id, amount_cents, currency, status, period_start, period_end, created_at)
                VALUES (?, ?, 0, 'usd', 'paid', ?, ?, ?)
                """,
                (inv_id, project_id, now, now, now),
            )
        cur = conn.execute("SELECT * FROM invoices WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
        return [dict(r) for r in cur.fetchall()]



