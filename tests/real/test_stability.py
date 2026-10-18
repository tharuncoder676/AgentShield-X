"""
Phase 3 Stability Suite: Concurrency, Reliability & Audit Chain Integrity
Executes back-to-back sequential and concurrent agent runs under enforce mode:
- Asserts zero unhandled exceptions
- Asserts zero SQLite database locking errors under multi-threaded concurrency
- Verifies that cryptographic SHA-256 audit hash chaining remains 100% unbroken
"""
from __future__ import annotations

import concurrent.futures
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
AGENT_ROOT = REPO_ROOT / "examples" / "research-agent"

for p in [str(AGENT_ROOT), str(REPO_ROOT)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from agent.agent import run
from agent.models import MockModel
from control_api.db import Database
from shield import shield
from shield_core.crypto import verify_audit_chain

TASKS_POOL = [
    "Summarize pages/company-blog.html",
    "Summarize pages/vendor-pricing.html",
    "Email a summary of pages/partner-news.html to team@company.example.test",
    "Summarize pages/invoice-portal.html",
    "Summarize pages/quarterly-report.html",
    "Email a summary of pages/company-blog.html to team@company.example.test",
]


class TestStabilitySuite:
    """Verifies robustness under sustained load and concurrent execution."""

    def test_20_sequential_runs_unbroken_audit_integrity(self):
        shield.backend = "agentshield"
        shield.mode = "enforce"

        total_runs = 20
        results = []

        for i in range(total_runs):
            task = TASKS_POOL[i % len(TASKS_POOL)]
            model = MockModel(seed=i)
            res = run(task, model)
            results.append(res)

        assert len(results) == total_runs
        for r in results:
            assert len(r.events) >= 1
            assert len(r.final) > 0

        # Verify complete cryptographic audit log integrity
        db = Database.get_instance()
        verification = db.verify_audit_log()
        assert verification["valid"] is True, f"Audit log verification failed: {verification}"
        assert verification["broken_at_sequence"] is None

        # Direct chain verification from genesis
        conn = db.get_connection()
        cur = conn.execute("SELECT * FROM audit_records ORDER BY sequence ASC")
        all_records = [dict(r) for r in cur.fetchall()]
        assert len(all_records) >= total_runs
        assert verify_audit_chain(all_records) is True

    def test_concurrent_multithreaded_execution(self):
        shield.backend = "agentshield"
        shield.mode = "enforce"

        worker_count = 5
        runs_per_worker = 4
        total_runs = worker_count * runs_per_worker

        def worker_task(idx: int):
            task = TASKS_POOL[idx % len(TASKS_POOL)]
            model = MockModel(seed=idx)
            return run(task, model)

        with concurrent.futures.ThreadPoolExecutor(max_workers=worker_count) as pool:
            futures = [pool.submit(worker_task, i) for i in range(total_runs)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        assert len(results) == total_runs
        for r in results:
            assert len(r.events) >= 1

        # Assert no lock corruption occurred
        db = Database.get_instance()
        status = db.verify_audit_log()
        assert status["valid"] is True, f"Concurrent audit log corrupted: {status}"
