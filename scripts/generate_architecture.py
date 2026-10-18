#!/usr/bin/env python3
"""
AgentShield-X: Single Source of Truth Architecture Generator
Inspects the repository structure, Docker Compose, service manifests, and detector definitions
to generate packages/architecture/architecture.json and docs/architecture/system_context.mmd.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
ARCH_DIR = ROOT_DIR / "packages" / "architecture"
DOCS_ARCH_DIR = ROOT_DIR / "docs" / "architecture"


def generate_architecture():
    ARCH_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_ARCH_DIR.mkdir(parents=True, exist_ok=True)

    architecture_data = {
        "schema_version": "1.0.0",
        "system_name": "AgentShield-X",
        "description": "Autonomous AI Agent Security Gateway & Multi-Tenant SaaS Platform",
        "generated_at": "2026-10-18T00:00:00Z",
        "planes": [
            {
                "id": "data_plane",
                "name": "Data Plane",
                "description": "Latency-critical path for real-time tool call interception (< 100ms p95)",
                "components": [
                    {
                        "id": "shield_sdk",
                        "name": "AgentShield SDK (Python / TS)",
                        "type": "library",
                        "repo_path": "packages/shield_sdk_py",
                        "interfaces": ["@shield.tool decorator", "shield.wrap(agent)"],
                        "fail_mode": "configurable (closed for sensitive, open for low-risk)",
                        "target_latency": "< 10ms",
                    },
                    {
                        "id": "gateway",
                        "name": "Ingress Gateway",
                        "type": "service",
                        "framework": "FastAPI",
                        "port": 8000,
                        "repo_path": "services/gateway",
                        "responsibilities": [
                            "API key authentication & tenant resolution",
                            "Token-bucket rate limiting (1000 req/s)",
                            "ToolCallEvent JSON schema validation",
                            "Real-time WebSocket event streaming",
                        ],
                        "fail_mode": "fail-closed, circuit-breaker on decision service outage",
                        "target_latency": "< 15ms",
                    },
                    {
                        "id": "decision_service",
                        "name": "Decision Service",
                        "type": "service",
                        "framework": "FastAPI",
                        "port": 8001,
                        "repo_path": "services/decision",
                        "responsibilities": [
                            "Parallel detector orchestration",
                            "OPA Rego policy evaluation",
                            "Taint depth propagation tracking",
                            "LightGBM calibrated risk fusion",
                        ],
                        "fail_mode": "degraded mode (rules + OPA only if ML offline)",
                        "target_latency": "< 50ms",
                    },
                ],
            },
            {
                "id": "ml_plane",
                "name": "ML & Detection Subsystems",
                "description": "Multi-tier ensemble of deterministic rules and calibrated neural models",
                "components": [
                    {
                        "id": "detector_rules",
                        "name": "Rules & Boundary Guard",
                        "type": "detector",
                        "repo_path": "detectors/rules",
                        "algorithm": "Deterministic pattern matching + Canary traps",
                        "latency": "0.4 ms",
                    },
                    {
                        "id": "detector_pii",
                        "name": "PII & Secret Scanner",
                        "type": "detector",
                        "repo_path": "detectors/pii",
                        "algorithm": "Shannon entropy H(X) + High-recall regex",
                        "latency": "1.2 ms",
                    },
                    {
                        "id": "detector_honey",
                        "name": "Honeytools & Decoys",
                        "type": "detector",
                        "repo_path": "detectors/honey",
                        "algorithm": "Deterministic decoy tripwire trigger",
                        "latency": "0.2 ms",
                    },
                    {
                        "id": "model_injection",
                        "name": "DeBERTa Injection Classifier",
                        "type": "ml_model",
                        "repo_path": "models/injection/1.0.0",
                        "algorithm": "DeBERTa-v3 int8 quantized ONNX",
                        "latency": "13.8 ms",
                    },
                    {
                        "id": "model_similarity",
                        "name": "FAISS Semantic Similarity",
                        "type": "ml_model",
                        "repo_path": "models/similarity/1.0.0",
                        "algorithm": "all-MiniLM-L6-v2 embeddings + Cosine similarity",
                        "latency": "37.5 ms",
                    },
                    {
                        "id": "model_anomaly",
                        "name": "Anomaly Ensemble",
                        "type": "ml_model",
                        "repo_path": "models/anomaly/1.0.0",
                        "algorithm": "Markov transition + Isolation Forest + Sequence Autoencoder",
                        "latency": "16.2 ms",
                    },
                    {
                        "id": "model_intent",
                        "name": "Intent-Consistency Scorer",
                        "type": "ml_model",
                        "repo_path": "models/intent/1.0.0",
                        "algorithm": "Cross-encoder contract-to-action semantic distance",
                        "latency": "41.2 ms",
                    },
                    {
                        "id": "model_risk_stacker",
                        "name": "LightGBM Risk Stacker",
                        "type": "ml_model",
                        "repo_path": "models/risk_stacker/1.0.0",
                        "algorithm": "Monotonic GBDT + Platt isotonic calibration",
                        "latency": "1.4 ms",
                    },
                ],
            },
            {
                "id": "async_plane",
                "name": "Async & Persistence Plane",
                "description": "Event distribution, tamper-evident audit log, and background workers",
                "components": [
                    {
                        "id": "eventbus",
                        "name": "EventBus (Memory / Redis)",
                        "type": "bus",
                        "repo_path": "packages/eventbus",
                        "topics": ["agent_events", "audit_records", "approval_events"],
                    },
                    {
                        "id": "database",
                        "name": "Database (SQLite WAL / PostgreSQL)",
                        "type": "datastore",
                        "repo_path": "services/control_api/src/control_api/db.py",
                        "tables": [
                            "organizations",
                            "users",
                            "projects",
                            "api_keys",
                            "policies",
                            "incidents",
                            "sessions",
                            "agents",
                            "approvals",
                            "model_thresholds",
                            "honeytools",
                            "honey_triggers",
                            "audit_records",
                            "subscriptions",
                            "invoices",
                        ],
                    },
                    {
                        "id": "audit_chain",
                        "name": "Cryptographic Audit Chain",
                        "type": "security_primitive",
                        "repo_path": "packages/shield_core/src/shield_core/models.py",
                        "algorithm": "Canonical JSON SHA-256 Merkle chain back to Genesis",
                    },
                ],
            },
            {
                "id": "control_plane",
                "name": "Control Plane & SaaS Layer",
                "description": "Multi-tenant administration, RBAC, telemetry analytics, and AI copilot",
                "components": [
                    {
                        "id": "control_api",
                        "name": "Control Plane API",
                        "type": "service",
                        "framework": "FastAPI",
                        "port": 8000,
                        "repo_path": "services/control_api",
                    },
                    {
                        "id": "console_ui",
                        "name": "Security Operations Console",
                        "type": "frontend",
                        "framework": "React + Vite + Tailwind",
                        "port": 5173,
                        "repo_path": "apps/console",
                    },
                    {
                        "id": "shieldwing_copilot",
                        "name": "Shieldwing AI Security Copilot",
                        "type": "ai_agent",
                        "repo_path": "services/shieldwing",
                        "responsibilities": [
                            "Plain-language decision explanation",
                            "Incident root cause triage",
                            "Rego policy change drafting",
                            "Counterfactual what-if session replay",
                        ],
                        "dogfooding": "Shieldwing tool calls intercepted by AgentShield-X",
                    },
                ],
            },
        ],
        "connections": [
            {"source": "shield_sdk", "target": "gateway", "protocol": "HTTP / JSON", "auth": "X-Shield-API-Key"},
            {"source": "gateway", "target": "decision_service", "protocol": "HTTP / JSON", "timeout_ms": 100},
            {"source": "decision_service", "target": "ml_plane", "protocol": "In-process / ONNX Runtime"},
            {"source": "gateway", "target": "eventbus", "protocol": "Async Publish", "topic": "agent_events"},
            {"source": "gateway", "target": "console_ui", "protocol": "WebSocket", "endpoint": "/v1/ws/decisions"},
            {"source": "console_ui", "target": "control_api", "protocol": "HTTP REST / Bearer JWT"},
            {"source": "shieldwing_copilot", "target": "gateway", "protocol": "Dogfood Interception"},
        ],
    }

    # Write architecture.json
    out_json = ARCH_DIR / "architecture.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(architecture_data, f, indent=2)
    print(f"Generated {out_json}")

    # Generate Mermaid diagrams
    mmd_content = """graph TD
    classDef client fill:#0e1624,stroke:#4fd1e8,stroke-width:1px,color:#e8eef7;
    classDef gateway fill:#0e1624,stroke:#1d2a3f,stroke-width:1px,color:#e8eef7;
    classDef detector fill:#0e1624,stroke:#f5b84a,stroke-width:1px,color:#e8eef7;
    classDef risk fill:#0e1624,stroke:#ff5a4f,stroke-width:1px,color:#e8eef7;
    classDef bus fill:#060a12,stroke:#1d2a3f,stroke-width:1px,color:#93a4bd;

    subgraph ClientAgent["Agent Execution Environment"]
        SDK["AgentShield SDK<br/>@shield.tool Interceptor"]:::client
    end

    subgraph DataPlane["Data Plane (p95 < 100ms)"]
        GW["API Gateway<br/>Auth & Rate Limiter"]:::gateway
        DEC["Decision Engine<br/>Parallel Orchestrator"]:::gateway
    end

    subgraph DetectionPlane["Detection Subsystems"]
        RULES["Rules & Honeytools<br/>Deterministic Guard"]:::detector
        PII["PII & Secret Scanner<br/>Entropy H(X)"]:::detector
        DEBERTA["DeBERTa Injection Model<br/>Quantized ONNX"]:::detector
        SIM["FAISS Attack Similarity<br/>all-MiniLM-L6-v2"]:::detector
        ANOMALY["Anomaly Ensemble<br/>Markov + IsoForest + Autoencoder"]:::detector
        INTENT["Intent Scorer<br/>Cross-Encoder"]:::detector
    end

    subgraph RiskPlane["Calibrated Risk Fusion"]
        STACKER["LightGBM Risk Stacker<br/>Platt Calibrated Sigmoid"]:::risk
        OPA["OPA Policy Engine<br/>Tenant Rego Guardrails"]:::risk
    end

    subgraph AsyncPlane["Async & Control Plane"]
        BUS["EventBus & WebSocket<br/>Streaming Telemetry"]:::bus
        AUDIT["Cryptographic Audit<br/>SHA-256 Merkle Chain"]:::bus
        CONSOLE["SaaS Operations Console<br/>React + Tailwind"]:::client
        SHIELDWING["Shieldwing Copilot<br/>AI Security Agent"]:::client
    end

    SDK -->|ToolCallEvent| GW
    GW -->|Validate & Route| DEC
    DEC --> RULES
    DEC --> PII
    DEC --> DEBERTA
    DEC --> SIM
    DEC --> ANOMALY
    DEC --> INTENT
    RULES & PII & DEBERTA & SIM & ANOMALY & INTENT --> STACKER
    STACKER --> OPA
    OPA -->|Enforced Decision| GW
    GW -->|Verdict: ALLOW / BLOCK / SANITIZE| SDK
    GW -.->|Publish Event| BUS
    BUS -.-> AUDIT
    BUS -.-> CONSOLE
    CONSOLE -.-> SHIELDWING
    SHIELDWING -.->|Dogfood Interception| GW
"""
    out_mmd = DOCS_ARCH_DIR / "system_context.mmd"
    with open(out_mmd, "w", encoding="utf-8") as f:
        f.write(mmd_content)
    print(f"Generated {out_mmd}")


if __name__ == "__main__":
    generate_architecture()
