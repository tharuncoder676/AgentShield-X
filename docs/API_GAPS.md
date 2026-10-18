# AgentShield-X: API Gaps & Integration Contract Specification

Date: 2026-10-18  
Status: **Phase 0 Draft — Baseline for Contract-First Integration**

---

## 1. Overview & Integration Philosophy

Per **Non-Negotiable Rule 2 (Contract-First Integration)**:
> *"The frontend talks to the backend only through a typed client generated from the OpenAPI spec and a typed WebSocket event schema. Never invent an endpoint silently. If a needed endpoint is missing, add the smallest correct backend change with tests and OpenAPI updates, and record it in `docs/API_GAPS.md`."*

This document catalogs every API gap between the existing backend (`gateway`, `decision`) and the 14 required Console pages and web features. It defines the exact endpoint signatures, request/response models, and planned backend additions.

---

## 2. Inventory of API Gaps by Console Subsystem

### 2.1 Overview & Analytics (`/overview`)
- **Required Capability**: Aggregated risk trend, total decisions (blocked vs allowed vs sanitized), top attack families, usage this billing cycle.
- **Missing Endpoints**:
  - `GET /v1/analytics/overview?time_range=24h|7d|30d`
    - **Response**:
      ```json
      {
        "total_events": 14250,
        "blocked_events": 342,
        "sanitized_events": 118,
        "escalated_events": 45,
        "allowed_events": 13745,
        "mean_latency_ms": 18.4,
        "p95_latency_ms": 38.2,
        "risk_trend": [
          {"timestamp": "2026-10-18T00:00:00Z", "total": 600, "blocked": 14, "avg_risk": 0.08}
        ],
        "top_attack_families": [
          {"family": "override_instructions", "count": 142},
          {"family": "data_exfil_request", "count": 89},
          {"family": "honeytool_touch", "count": 51}
        ]
      }
      ```

### 2.2 Live Feed & Streaming (`/live`)
- **Required Capability**: Real-time decision stream with pause, filter by agent, session, action, and risk.
- **Missing Endpoints**:
  - `GET /v1/decisions?limit=50&cursor=<str>&action=<str>&agent_id=<str>&min_risk=<float>`
    - Paginated historical decisions.
  - `WebSocket /v1/ws/decisions?token=<api_key_or_jwt>&agent_id=<str>&min_risk=<float>`
    - Full-duplex WebSocket stream publishing events from `EventBus` topic `"agent_events"`:
    - Message format:
      ```json
      {
        "type": "decision_event",
        "event_id": "uuid",
        "timestamp": "iso8601",
        "agent_id": "str",
        "session_id": "str",
        "step": 0,
        "tool_name": "str",
        "action": "allow|sanitize|block|escalate|kill_session",
        "risk": 0.85,
        "reasons": [{"code": "str", "evidence": "str", "detector": "str"}],
        "taint": ["segment_id"],
        "latency_ms": 14.2
      }
      ```
    - Heartbeat: `{"type": "ping"}` $\leftrightarrow$ `{"type": "pong"}` every 30s.

### 2.3 Incidents & Triage (`/incidents`)
- **Required Capability**: Filter, assign, resolve incidents; detail view with timeline, taint graph, and policy diff.
- **Missing Endpoints**:
  - `GET /v1/incidents?status=open|resolved|assigned&severity=low|medium|high|critical`
  - `GET /v1/incidents/{incident_id}`
  - `PATCH /v1/incidents/{incident_id}`
    - **Request**: `{"status": "resolved", "assigned_to": "analyst@example.com", "resolution_notes": "..."}`
  - `GET /v1/incidents/{incident_id}/taint-graph`
    - Nodes and edges showing untrusted source context flowing to sensitive tools.

### 2.4 Sessions & Replay Simulator (`/sessions`)
- **Required Capability**: Step through multi-turn session, replay with different policies or shield toggles.
- **Missing Endpoints**:
  - `GET /v1/sessions?agent_id=<str>&limit=25`
  - `GET /v1/sessions/{session_id}` (all chronological steps, tool calls, decisions, and context segments).
  - `POST /v1/sessions/{session_id}/replay`
    - **Request**: `{"override_policy_id": "str", "shield_enabled": true}`
    - **Response**: Step-by-step diff of decisions under proposed policy vs original policy.

### 2.5 Agents & Permissions (`/agents`)
- **Required Capability**: List registered agents, inspect tool permissions, security health score, honeytool status.
- **Missing Endpoints**:
  - `GET /v1/agents`
  - `GET /v1/agents/{agent_id}`
  - `POST /v1/agents` (Register new agent)
  - `GET /v1/agents/{agent_id}/security-score`
    - Computes composite score: canary leak resistance, least-privilege compliance, untrusted taint ratio.

### 2.6 Policies & Dry-Run Simulator (`/policies`)
- **Required Capability**: Monaco editor for Rego policies, validation, dry-run diff against recent traffic, rollback.
- **Missing Endpoints**:
  - `GET /v1/policies`
  - `GET /v1/policies/{policy_id}`
  - `POST /v1/policies`
  - `POST /v1/policies/validate` (Syntax and schema check on Rego code)
  - `POST /v1/policies/simulate`
    - **Request**: `{"rules_rego": "...", "sample_size": 200}`
    - **Response**: `{"blocked_diff": +5, "allowed_diff": -5, "impacted_sessions": ["sess_123"]}`

### 2.7 Approvals Queue (`/approvals`)
- **Required Capability**: Escalate queue for human-in-the-loop decisions (approve or deny proposed actions).
- **Missing Endpoints**:
  - `GET /v1/approvals?status=pending|approved|rejected`
  - `POST /v1/approvals/{approval_id}/resolve`
    - **Request**: `{"status": "approved|rejected", "reason": "Authorized by SecOps"}`

### 2.8 Detectors, Models & Drift (`/models`)
- **Required Capability**: Inspect active versions, thresholds, shadow status, eval links.
- **Missing Endpoints**:
  - `GET /v1/models/status`
    - Queries `models/` directory for manifests, thresholds, and active model versions (Similarity v1.0.0, Anomaly v1.0.0, Intent v1.0.0, Risk v1.0.0, Baseline v1.0.0, Injection DeBERTa status).

### 2.9 Honeytools & Canaries (`/honeytools`)
- **Required Capability**: View active decoy tools (`export_all_customers`), fake credentials, and touch alerts.
- **Missing Endpoints**:
  - `GET /v1/honeytools`
  - `GET /v1/honeytools/events`

### 2.10 Audit Log & Hash-Chain Verification (`/audit`)
- **Required Capability**: Searchable audit log with cryptographic hash verification and "Verify Now" action.
- **Missing Endpoints**:
  - `GET /v1/audit?limit=50&cursor=<str>`
  - `POST /v1/audit/verify`
    - Validates cryptographic chain: `hash == sha256(prev_hash + record_data)`.
    - **Response**: `{"valid": true, "records_checked": 1250, "last_anchor_hash": "..."}`

### 2.11 Usage, Metering & Billing (`/billing`)
- **Required Capability**: Usage counters, plan tiers (Free, Team, Enterprise), Stripe test mode checkout.
- **Missing Endpoints**:
  - `GET /v1/billing/usage`
  - `POST /v1/billing/checkout` (Stripe test-mode session URL generation)
  - `POST /v1/billing/webhooks` (Stripe idempotent webhook processor)

### 2.12 Settings, Organizations & API Keys (`/settings`)
- **Required Capability**: Org/team management, RBAC, scoped API keys (shown once, stored hashed), privacy modes.
- **Missing Endpoints**:
  - `GET /v1/org/current`
  - `GET /v1/org/members` & `POST /v1/org/invitations`
  - `GET /v1/api-keys` & `POST /v1/api-keys` (returns raw key once, saves `sha256_hex(key)`)
  - `DELETE /v1/api-keys/{key_id}`
  - `GET/PUT /v1/projects/{project_id}/privacy` (full, hashed, or local)

### 2.13 Shieldwing Security Copilot (`/shieldwing`)
- **Required Capability**: Streaming SSE chat panel with context awareness, tool traces, and proposal diffs.
- **Missing Endpoints**:
  - `POST /v1/Shieldwing/chat`
    - **Headers**: `Accept: text/event-stream`
    - **Request**: `{"message": "str", "context": {"view": "incident", "incident_id": "str"}}`
    - **Stream**: Token-by-token SSE stream with tool traces, evidence citations, and proposal blocks.

### 2.14 Architecture Explorer (`/architecture`)
- **Required Capability**: Topology graph with live health and latency metrics.
- **Missing Endpoints**:
  - `GET /v1/architecture/topology`
    - Returns `architecture.json` (nodes, edges, planes, containers).
  - `GET /v1/architecture/health`
    - Aggregated status, queue depth, and latencies across all components.

---

## 3. Implementation Plan for Missing Endpoints

To maintain zero bloat and high execution speed:
1. **Control API Subsystem**:
   - Implement `services/control_api` using FastAPI, with SQLite for local development and PostgreSQL for production.
   - Leverage `shield_core.models` directly to prevent schema duplication.
   - Provide full unit tests in `services/control_api/tests/`.
2. **WebSocket & Live Streaming Ingress**:
   - Add `/v1/ws/decisions` on `services/gateway` subscribing to `EventBus` (`MemoryEventBus` / `RedisEventBus`).
3. **OpenAPI Spec Export**:
   - Unified script `scripts/export_openapi.py` combining Gateway, Control API, and Decision endpoints into `docs/openapi.json`.
4. **Typed Client Generation**:
   - In `packages/api-client`, generate TypeScript client using `openapi-typescript` or `orval` with Zod runtime validation.
