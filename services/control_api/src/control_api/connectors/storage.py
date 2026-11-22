"""Encrypted persistence shared by provider connector adapters."""

import os
import sqlite3
from contextlib import closing, contextmanager
from pathlib import Path
from typing import Iterator

from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException


@contextmanager
def connection_store() -> Iterator[tuple[sqlite3.Connection, Fernet]]:
    path = os.environ.get("SHIELDWING_CONNECTION_DB")
    key = os.environ.get("SHIELDWING_CONNECTION_KEY")
    if not path or not key or not Path(path).is_absolute():
        raise HTTPException(503, "Live connector storage has not been configured.")
    try:
        cipher = Fernet(key.encode("ascii"))
        with closing(sqlite3.connect(path)) as conn, conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS github_connections (
                    workspace_id TEXT NOT NULL, user_id TEXT NOT NULL,
                    repository TEXT NOT NULL, credential BLOB NOT NULL,
                    authorized_scopes TEXT NOT NULL DEFAULT '["pull_requests:read"]',
                    authorized_at TEXT NOT NULL DEFAULT '',
                    PRIMARY KEY (workspace_id, user_id)
                )
            """)
            github_columns = {row[1] for row in conn.execute("PRAGMA table_info(github_connections)")}
            if "authorized_scopes" not in github_columns:
                conn.execute("ALTER TABLE github_connections ADD COLUMN authorized_scopes TEXT NOT NULL DEFAULT '[\"pull_requests:read\"]'")
            if "authorized_at" not in github_columns:
                conn.execute("ALTER TABLE github_connections ADD COLUMN authorized_at TEXT NOT NULL DEFAULT ''")
            conn.execute("""
                CREATE TABLE IF NOT EXISTS github_pending_actions (
                    id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, user_id TEXT NOT NULL,
                    repository TEXT NOT NULL, state TEXT NOT NULL, messages_json TEXT NOT NULL,
                    tool_call_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
                    expires_at TEXT NOT NULL, created_at TEXT NOT NULL,
                    action_type TEXT NOT NULL DEFAULT 'read_pull_requests',
                    request_json TEXT NOT NULL DEFAULT '{}'
                )
            """)
            pending_columns = {row[1] for row in conn.execute("PRAGMA table_info(github_pending_actions)")}
            if "action_type" not in pending_columns:
                conn.execute("ALTER TABLE github_pending_actions ADD COLUMN action_type TEXT NOT NULL DEFAULT 'read_pull_requests'")
            if "request_json" not in pending_columns:
                conn.execute("ALTER TABLE github_pending_actions ADD COLUMN request_json TEXT NOT NULL DEFAULT '{}'")
            conn.execute("""
                CREATE TABLE IF NOT EXISTS google_connections (
                    workspace_id TEXT NOT NULL, user_id TEXT NOT NULL,
                    credential BLOB NOT NULL, scopes TEXT NOT NULL,
                    authorized_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'connected',
                    PRIMARY KEY (workspace_id, user_id)
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS google_oauth_pending (
                    state_hash TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, user_id TEXT NOT NULL,
                    verifier BLOB NOT NULL, requested_scopes TEXT NOT NULL,
                    expires_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending'
                )
            """)
            yield conn, cipher
    except (ValueError, sqlite3.Error, InvalidToken) as exc:
        raise HTTPException(503, "Live connector storage is unavailable.") from exc
