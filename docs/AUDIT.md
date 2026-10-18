# AgentShield-X: Comprehensive System & Architecture Audit (Phase 0)

Date: 2026-10-18  
Commit: `574e067`  
Auditor: Principal Full-Stack Engineer & ML Security Architect  
Status: **Phase 0 Audit Complete — Pending User Confirmation Gate**

---

## 1. Executive Summary

This document establishes the ground-truth baseline of the AgentShield-X repository before implementing the web product (Console, Marketing Site, Architecture Explorer, SaaS Layer, and Shieldwing AI Security Copilot).

- **Current State**: The repository contains a fully functioning, tested core security engine:
  - Gateway service (FastAPI ingress for tool calls)
  - Decision service (parallel security detector orchestration & risk evaluation)
  - Complete ML pipeline with 5 trained and versioned models (`models/`)
  - 57 passing tests across unit, integration, and ML verification suites
  - Deterministic rules, PII scanners, honeytools, and cryptographic audit hash chains
- **Primary Gaps Identified**:
  - The **Control Plane** (`control-api`) does not exist yet. There are currently no REST endpoints for managing tenants, organizations, projects, API keys, policies, incidents, audit queries, approvals, or billing.
  - The **WebSocket Stream** on Gateway does not exist yet. Gateway publishes to `MemoryEventBus` / `RedisEventBus`, but has no `/v1/events/stream` or `/v1/ws/decisions` endpoint.
  - The **Shieldwing Copilot Service** (`services/Shieldwing`) does not exist yet.
  - The **Web Applications** (`apps/console`, `apps/site`, `packages/ui`, `packages/api-client`, `packages/architecture`) need to be created.

---

## 2. Services Inventory & Execution Status

| Service | Path | Framework | Port | Start Status | Current Capabilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gateway** | `services/gateway/` | FastAPI / Uvicorn | 8000 | **Verified Running** | Authenticates API keys, enforces token bucket rate limiting, validates `ToolCallEvent` schema, routes to Decision Service, publishes to EventBus, returns `Decision`. |
| **Decision Service** | `services/decision/` | FastAPI / Uvicorn | 8001 | **Verified Running** | Concurrently runs 7 detectors (Rules, PII, Honey, Injection, Similarity, Anomaly, Intent), executes fallback degraded modes, and returns calibrated `Decision`. |
| **Control API** | `services/control_api/` | *Missing* | — | **Not Implemented** | Target: Tenants, projects, users, RBAC, API keys, policies, incidents, audit logs, usage metering. |
| **Shieldwing Copilot** | `services/Shieldwing/` | *Missing* | — | **Not Implemented** | Target: AI Security Agent with tool dogfooding, SSE streaming, and human-in-the-loop proposals. |
| **Async Workers** | `services/workers/` | *Missing* | — | **Not Implemented** | Target: Feature builders, audit writers, response orchestrators, LLM judges. |
| **Demo Runner** | `demo/` | Python CLI / LangGraph | — | **Verified Operational** | Compares `vulnerable_agent` (compromised) against `protected_agent` (attack blocked). |

### Service Startup Verification Logs
- `gateway.main:app`: Loaded successfully in Python 3.12 without errors.
- `decision.main:app`: Loaded successfully with all 7 detectors registered without errors.

---

## 3. OpenAPI Endpoints & Schemas

### 3.1 Existing Gateway Endpoints (`services/gateway`)
Generated from OpenAPI (`/openapi.json`):

1. **`GET /health`**
   - **Response**: `{"status": "ok", "service": "gateway", "version": "1.0.0"}`
2. **`POST /v1/events/tool-call`**
   - **Headers**: `X-Shield-API-Key: <str>` (Required)
   - **Request Body**: `ToolCallEvent`
   - **Response Body**: `Decision` (HTTP 200)
   - **Error Codes**: `401 Unauthorized` (invalid/missing key), `403 Forbidden` (tenant mismatch), `429 Too Many Requests` (rate limit exceeded), `500 Internal Error`

### 3.2 Existing Decision Service Endpoints (`services/decision`)
Generated from OpenAPI (`/openapi.json`):

1. **`GET /health`**
   - **Response**: `{"status": "ok", "service": "decision-service", "version": "1.0.0"}`
2. **`POST /v1/decisions/evaluate`**
   - **Request Body**: `ToolCallEvent`
   - **Response Body**: `Decision` (HTTP 200)

### 3.3 Streaming & WebSocket Schemas
- **Current Backend Bus**: `packages/eventbus` emits events to topic `"agent_events"`:
  ```json
  {
    "_id": "<uuid>",
    "event": { /* ToolCallEvent serialized */ },
    "decision": { /* Decision serialized */ }
  }
  ```
- **Gateway Gap**: No WebSocket or SSE ingress endpoint is currently mounted on FastAPI (`/v1/ws/decisions` or `/v1/events/stream`).

---

## 4. SDK Entry Points (`packages/shield_sdk_py`)

The Python SDK exposes:
- **`AgentShield(endpoint, api_key, fail_mode, timeout_s, cache_size)`**: Primary client class.
  - `evaluate_sync(tool_name, arguments, sensitivity, context_segments, taint) -> Decision`
  - `evaluate_async(...) -> Coroutine[Decision]`
  - `@shield.tool(name, sensitivity)`: Tool decorator intercepting invocations before execution.
  - `shield.wrap(agent)`: Interceptor wrapper for LangGraph and generic agent runtimes.
- **Exceptions**:
  - `ShieldBlockedException`: Raised when action is `BLOCK` or `SANITIZE` in fail-closed mode.
  - `ShieldSessionKilledException`: Raised when action is `KILL_SESSION`.
  - `ShieldException`: Base exception.

---

## 5. Existing Authentication & Tenant Resolution

- **Mechanisms**: Inbound SDK requests authenticate using HTTP Header `X-Shield-API-Key`.
- **Implementation** (`services/gateway/src/gateway/auth.py`):
  - SHA-256 hashed lookup against an in-memory `_key_store`.
  - Seeded keys:
    - `shield_test_key_phase1` $\rightarrow$ Tenant `tenant_default_001` (Plan: `enterprise`)
    - `shield_demo_key` $\rightarrow$ Tenant `tenant_demo_enterprise` (Plan: `enterprise`)
- **Missing Auth Components**:
  - User accounts (sign-up, login, password reset, email verification, sessions, JWT/cookies).
  - RBAC (Owner, Admin, Analyst, Viewer roles).
  - Database-backed API key storage with scoping, revocation, and last-used timestamp tracking.

---

## 6. Test Suite & Verification Status

Total Tests: **57 passed out of 57 tests** (100% pass rate).

### 6.1 Core System & Integration Tests (`tests/`)
Command: `pytest tests/ -v`  
Result: **28 passed in 1.07s**
- `test_end_to_end_shield.py`: End-to-end acceptance gate (indirect injection blocked, clean calls allowed).
- `test_honey_detector.py`: Honeytool touches (`export_all_customers`) and canary token traps.
- `test_ml_detectors.py`: Contract tests for all 5 ML models and monotonicity constraints.
- `test_models.py`: Cryptographic hash-chain audit log tamper detection and model serialization.
- `test_pii_detector.py`: High-entropy regex scanners (AWS keys, OpenAI tokens, credit cards, JWTs).
- `test_rules_detector.py`: Deterministic shell chaining, fake system messages, and canary leakage.
- `test_sdk.py`: SDK fail-closed policies, local LRU cache hits, and tool decorator syntax.

### 6.2 ML Pipeline Tests (`ml/tests/`)
Command: `pytest ml/tests/ -v`  
Result: **29 passed in 25.95s**
- `test_no_leakage.py`: Proves strict partition disjointness across Partitions A, B, V, and Test.
- `test_reproducibility.py`: Deterministic seeded generation and inference score reproducibility.
- `test_inference_smoke.py`: 200-sample live inference smoke test, degraded mode, and hard overrides.
- `test_similarity.py`, `test_anomaly.py`, `test_intent.py`, `test_calibration.py`, `test_thresholds.py`, `test_interfaces.py`.

---

## 7. Machine Learning Artifacts & Real Metrics

All models are versioned in `models/<subsystem>/1.0.0/` with complete `manifest.json`, `thresholds.json`, and `model_card.md`.

*Real Measured Metrics (from `ml/eval/reports/eval_20261017_234148.json`):*
1. **Similarity Detector (MiniLM + FAISS)**:
   - Recall on seen attack families (FPR $\le$ 2%): **98.5%** (Target: $\ge$ 85% — **PASSED**)
   - Search latency p95: **0.18 ms**; Embedding latency p95: **10.66 ms**
2. **Anomaly Ensemble (Markov + Isolation Forest + Autoencoder)**:
   - Recall at 1% FPR: **86.5%** (Target: $\ge$ 80% — **PASSED**)
   - Isolation Forest ROC-AUC: **0.9977**; Sequence Autoencoder ROC-AUC: **0.9226**
3. **Intent-Consistency Scorer**:
   - ROC-AUC on held-out templates: **0.9880** (Target: $\ge$ 0.95 — **PASSED**)
   - Precision: **97.25%**; Recall: **89.08%**; FPR: **0.51%**
4. **Full Stacked System (Monotonic LightGBM + Platt Scaling)**:
   - Step-level recall at FPR $\le$ 2%: **91.7%** (Target: $\ge$ 90% — **PASSED**)
   - Overall recall at tuned threshold: **98.3%**; Step ROC-AUC: **0.9822**
5. **Probability Calibration**:
   - Validation V Expected Calibration Error (ECE): **0.0465** (Target: $\le$ 0.05 — **PASSED on V**)
   - Test Set ECE: **0.1357** (Diagnosed: caused by held-out novel attack families outputting intermediate risk)
6. **Inference Latency**:
   - Single-item CPU latencies: Injection 13.75ms, Similarity 37.53ms, Anomaly 16.18ms, Intent 41.20ms.

---

## 8. Reconciled Frontend-to-Backend Resource Mapping (Section 5)

Below is the line-by-line reconciliation of the prompt's required Console pages against actual backend resources:

| Console Page | Purpose / Functionality | Prompt Expected Resource | Actual Existing Backend Resource | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Overview** | Risk trend, blocked vs allowed, top attacks, health, usage | `decisions aggregates, health, usage` | `GET /health` exists. Aggregates and usage endpoints do NOT exist. | **GAP** |
| **Live feed** | Streaming decisions, filters, pause, drill-in | `WebSocket decision stream, decisions query` | Gateway publishes to internal EventBus, but exposes no WebSocket or query endpoint. | **GAP** |
| **Incidents** | List, filter, assign, resolve; timeline, evidence, taint graph | `incidents, decisions, explanation` | `Incident` model exists in `shield_core`. REST CRUD endpoints do NOT exist. | **GAP** |
| **Sessions & replay**| Step through session, replay with different policies | `sessions, replay or simulate` | Simulator exists in `ml/data/generators`. Replay API does NOT exist. | **GAP** |
| **Agents** | Registered agents, permissions, security score, blast radius | `agents, tools, score` | `ToolCallEvent.agent_id` exists. Agent registry and score API do NOT exist. | **GAP** |
| **Policies** | Editor with validation, dry-run diff, rollback | `policies, policy tests, simulate` | `Policy` model exists in `shield_core`. Policy CRUD & simulate API do NOT exist. | **GAP** |
| **Approvals** | Escalated actions, diff of proposed call, approve/deny | `approvals` | `Approval` model exists in `shield_core`. Approval queue API does NOT exist. | **GAP** |
| **Detectors & models**| Active model versions, thresholds, drift, eval links | `model registry, thresholds, drift` | File artifacts in `models/` and `ml/eval/reports/` exist. Query API does NOT exist. | **GAP** |
| **Honeytools** | Define decoy tools, fake secrets, see touches | `honeytools, events` | `detectors_honey` engine exists. Honeytool configuration API does NOT exist. | **GAP** |
| **Audit log** | Searchable, exportable, hash-chain verification | `audit, verify` | `AuditRecord` & hash verification exist in `shield_core`. REST API does NOT exist. | **GAP** |
| **Usage & billing** | Event counts, plan, limits, invoices, Stripe test mode | `usage, billing` | `UsageRecord` model exists. Stripe integration & billing API do NOT exist. | **GAP** |
| **Settings** | Org, team, roles, API keys, webhooks, privacy mode | `org, members, keys, webhooks, privacy` | In-memory key store in `gateway/auth.py`. Settings APIs do NOT exist. | **GAP** |
| **Shieldwing** | AI security copilot chat panel with context awareness | `Shieldwing service` | Does NOT exist. Service and SSE endpoints need to be built. | **GAP** |
| **Architecture** | Interactive map with live health overlay | `architecture data, health` | `GET /health` exists. `architecture.json` generator and metrics overlay do NOT exist. | **GAP** |

---

## 9. Architectural Strategy & Next Phase Recommendations

To satisfy the **Contract-First Non-Negotiable Rule** without bloated rewrites:
1. **Control API Subsystem (`services/control_api`)**:
   Implement a lightweight, high-performance FastAPI service (or mount as `/v1/control` within gateway) that provides:
   - SQLite / PostgreSQL async persistence for organizations, projects, API keys, policies, incidents, audit records, and approvals.
   - Live WebSocket bridge subscribing to `EventBus` topic `"agent_events"` and multiplexing to authenticated frontend clients.
   - Export an authoritative `openapi.json` from which `packages/api-client` is generated.
2. **Design System & Monorepo Foundation**:
   - Initialize pnpm monorepo with `apps/console`, `apps/site`, `packages/ui`, `packages/api-client`, `packages/architecture`.
   - Implement `packages/ui` using Tailwind CSS driven by the exact design tokens specified in Section 3.
3. **Shieldwing Service (`services/Shieldwing`)**:
   - Build a standalone FastAPI service with tool dogfooding through the shield, SSE streaming, and human-in-the-loop proposal generation.

---

## 10. Open Decisions for User Confirmation (Phase 0 Gate)

Before proceeding to Phase 1, the following project-level decisions require user selection:
1. **Open Source License**: Recommended: `Apache-2.0` or `MIT`.
2. **Production Domain Name**: e.g., `agentshield-x.dev` or `agentshield.io`.
3. **Analytics Provider**: Privacy-first recommendation: None by default, or lightweight self-hosted Plausible.
4. **Error Tracking Provider**: Recommendation: Sentry or None (standard structured JSON logging with OpenTelemetry).
5. **Shieldwing AI Copilot Default LLM Provider**: Anthropic (`claude-3-5-sonnet`), OpenAI (`gpt-4o`), or Local (`ollama`).
