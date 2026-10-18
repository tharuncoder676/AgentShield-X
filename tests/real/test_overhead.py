"""
Phase 3 Overhead Benchmarking Suite
Measures per-tool-call latency between shield OFF and AgentShield-X ENFORCE.
Computes p50, p95, and maximum latency over 50 iterations.
Asserts that security evaluation overhead remains strictly under 50ms.
"""
from __future__ import annotations

import statistics
import sys
import time
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
AGENT_ROOT = REPO_ROOT / "examples" / "research-agent"

for p in [str(AGENT_ROOT), str(REPO_ROOT)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from agent.agent import run
from agent.models import MockModel
from shield import shield


class TestOverheadBenchmarks:
    """Measures microsecond-level and millisecond-level shield enforcement overhead."""

    def test_latency_overhead_percentiles(self):
        iterations = 50
        task = "Summarize pages/company-blog.html"

        # 1. Warm up
        shield.backend = "agentshield"
        shield.mode = "enforce"
        run(task, MockModel())

        # 2. Benchmark Shield OFF baseline
        shield.mode = "off"
        latencies_off = []
        for _ in range(iterations):
            t0 = time.perf_counter()
            run(task, MockModel())
            latencies_off.append((time.perf_counter() - t0) * 1000.0)

        # 3. Benchmark AgentShield-X ENFORCE
        shield.mode = "enforce"
        latencies_enforce = []
        for _ in range(iterations):
            t0 = time.perf_counter()
            run(task, MockModel())
            latencies_enforce.append((time.perf_counter() - t0) * 1000.0)

        # Statistical calculations
        p50_off = statistics.median(latencies_off)
        p95_off = statistics.quantiles(latencies_off, n=20)[18] if len(latencies_off) >= 20 else max(latencies_off)

        p50_enforce = statistics.median(latencies_enforce)
        p95_enforce = statistics.quantiles(latencies_enforce, n=20)[18] if len(latencies_enforce) >= 20 else max(latencies_enforce)
        max_enforce = max(latencies_enforce)

        delta_p50 = max(0.0, p50_enforce - p50_off)
        delta_p95 = max(0.0, p95_enforce - p95_off)

        print("\n" + "=" * 60)
        print(f"AgentShield-X Latency Overhead Benchmark ({iterations} iterations)")
        print("=" * 60)
        print(f"Shield OFF baseline:   p50={p50_off:6.2f} ms | p95={p95_off:6.2f} ms")
        print(f"AgentShield-X ENFORCE: p50={p50_enforce:6.2f} ms | p95={p95_enforce:6.2f} ms | max={max_enforce:6.2f} ms")
        print(f"Added Shield Overhead: p50={delta_p50:6.2f} ms | p95={delta_p95:6.2f} ms")
        print("=" * 60)

        # Assertions: Real DecisionService + WAL audit write overhead must be < 50ms
        assert delta_p50 < 30.0, f"Expected p50 overhead < 30ms, got {delta_p50:.2f}ms"
        assert delta_p95 < 50.0, f"Expected p95 overhead < 50ms, got {delta_p95:.2f}ms"
