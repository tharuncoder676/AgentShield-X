# AgentShield-X: Real Test Audit and Parity Plan (Phase 0)

This audit documents the mapping between the standalone reference implementation (`AgentShield-lite` in `examples/research-agent/`) and the full enterprise `AgentShield-X` platform. It inventories existing vs. missing developer-upgrade features, provides the formal policy translation plan, evaluates execution runtime strategies, and identifies the exact minimal hooks needed for seamless parity.

---

## 1. Mapping of Lite Concepts to Full AgentShield-X Components

| Security Concept | AgentShield-lite (`shield/lite.py`) | AgentShield-X Platform Equivalent | Mapping Strategy & Fidelity |
|---|---|---|---|
| **Decorator & Wrapper API** | `@shield.tool(name, source, reads, sink, sensitivity, honeytool)` | `@shield.tool(name, sensitivity)` in `packages/shield_sdk_py` and `wrap_agent(...)` in `wrappers.py` | Full parity. The real adapter preserves the identical `@shield.tool(...)` keyword signature by mapping `source`, `reads`, `sink`, and `honeytool` into `ToolDefinition`, `ContextSegment`, and `ToolCallEvent.metadata`. |
| **Task Contracts** | Keyword matching on task strings in `policy.json` (`tasks: [{"name": ..., "match": [...], "allow_tools": [...]}]`) | `TaskContract` Pydantic model (`shield_core.models.TaskContract`) bound to `agent_id` and `session_id`, evaluated by `RulesDetector` and Rego policies | Full parity. Task contracts in AgentShield-X bind `allowed_tools`, `allowed_data_scopes`, and `forbidden_effects` to session state and enforce strict boundary evaluation. |
| **Taint Tracking & Provenance** | Boolean flag `session["tainted"] = True` set on any tool return where `source == "untrusted"` | Multi-segment cryptographically-hashed lineage (`ContextSegment` with `trust: TrustLevel.UNTRUSTED`, `text_hash`, `source`, and `ToolCallEvent.taint: List[str]`) | High fidelity upgrade. AgentShield-X tracks individual segment IDs and taint lineage from external ingress down to tool call sinks. |
| **Honeytools (Decoy Traps)** | `ToolMeta.honeytool = True`. Any call appends a decoy reason and sets `risk = 1.0`. | `detectors/honey/src/detectors_honey/engine.py` (`HoneyDetector`), `ToolSensitivity.CRITICAL`, and `control_api/routes/honeytools.py` | Full parity. Triggers `HONEYTOOL_TRIPWIRE_TRIGGERED` reason, trips incident alerts, and returns immediate `BLOCK` or `KILL_SESSION`. |
| **Policy Engine Format** | Flat JSON dictionary in `policy.json` (`taint_blocks_sinks: bool`, `default: allow_tools`, `tasks: [...]`) | OPA Rego policies (`Policy.rules_rego` in `shield_core.models`) and calibrated LightGBM Platt risk stacker | Full parity. Replaced heuristic addition with deterministic Rego rules and multi-detector calibrated risk thresholds. |
| **Decision Output & Exceptions** | Python dict `{"ts", "session", "step", "tool", "args", "action", "risk", "reasons", "mode", "tainted"}` and `ShieldBlocked(decision)` | `shield_core.models.Decision` (`decision_id`, `event_id`, `action: ShieldAction`, `risk: float`, `risk_breakdown`, `reasons: List[Reason]`) and `ShieldBlockedException` | Full parity. The adapter adapts `Decision` into the dict format expected by the sample CLI and ensures `ShieldBlocked` exceptions remain catchable by existing agent loops. |
| **Audit Log** | Local newline-delimited JSON log `logs/decisions.jsonl` | Append-only SHA-256 Merkle hash-chained log (`shield_core.models.AuditRecord`, `compute_audit_hash`, `verify_audit_chain` in SQLite/PostgreSQL) | High fidelity upgrade. All events are recorded in SQLite and verified using cryptographic chaining. |
| **Security Console** | CLI output `python -m shield watch` | Enterprise React / Vite dashboard (`apps/console`), WebSocket live stream (`/v1/ws/decisions`), and Shieldwing SOC Copilot | High fidelity upgrade. Real-time telemetry streaming and UI inspection. |

---

## 2. Developer Upgrade Features Status Inventory

| Upgrade Feature | Current Status in Repo | How It Is Invoked / Implemented | Missing Components & Plan |
|---|---|---|---|
| **`scan`** (Static Configuration & Dangerous Path Checker) | **EXISTS** | Present in `examples/research-agent/shield/scan.py` (`python -m shield scan`). Checks tool combinations (untrusted source + private reads + external sinks), unconstrained recipient allowlists, and missing honeytools. | Needs expansion in Phase 6 to scan arbitrary third-party repositories via `agentshield scan <path>` reading agent manifests and tool definitions. |
| **`poison`** (Poison-Diff Canary Evaluator) | **EXISTS** | Present in `examples/research-agent/shield/poison.py` (`python -m shield poison`). Plants harmless canary payloads (system notices, HTML comments, overrides, base64) into pages and measures execution rates with 95% Wilson confidence intervals. | Currently uses `MockModel`. Needs model adapter hook in Phase 2 to evaluate real models (Ollama, NVIDIA NIM, OpenAI-compatible). |
| **`recorder`** (Session & Event Recording) | **EXISTS** | Present in AgentShield-X core: Gateway `GatewayService.process_tool_call` records all events to EventBus and SQLite (`control_api.db.Database.record_event`), creating cryptographic `AuditRecord`s. | Fully implemented. To support standalone replay testing without running external databases, export session traces to `demo/recorded/*.json`. |
| **`replay`** (Counterfactual Policy Replay Simulator) | **EXISTS** | Present in AgentShield-X: `POST /v1/sessions/{session_id}/replay` and `Database.replay_session`. Simulates counterfactual policy overrides (e.g. strict vs permissive) and produces step-by-step diffs. | Fully implemented. |
| **`influence tracing`** (Attribution & Lineage Graph) | **PARTIAL / MISSING GRAPH RANKER** | Taint tracking exists (`ContextSegment.id` stored in `ToolCallEvent.taint` and cited by Shieldwing), but an automated causal attribution ranker (ranking the true causal segment first among distractors) is **MISSING**. | Reported as missing in evaluation; taint segment lineage is used as the underlying telemetry. |
| **`autopolicy`** (Automated Trace-to-Policy Synthesizer) | **PARTIAL** | Shieldwing provides LLM-based policy synthesis (`/v1/shieldwing/draft-policy`), but an automated offline synthesizer that learns strict Rego contracts directly from benign execution traces is **MISSING**. | Reported as missing in evaluation; Shieldwing copilot synthesis is used for policy proposals. |
| **`secret broker`** (Credential Proxying & Shadow Vault) | **PARTIAL / MISSING PROXY BROKER** | `PIIDetector` (`detectors_pii`) detects and sanitizes leaked keys/tokens in tool arguments; however, an active Secret Broker (where agents only receive opaque tokens `$VAULT_KEY` and the proxy replaces them on outbound calls) is **MISSING**. | Reported as missing in evaluation; PII and credential entropy detection is used for leakage prevention. |
| **`tool lockfile`** (Schema & Description Drift Guard) | **MISSING** | No schema hash lockfile (`agentshield.lock`) or runtime drift detection against modified tool descriptions currently exists in the codebase. | Reported as missing in evaluation. |

---

## 3. Policy Translation: `policy.json` to Real AgentShield-X Format

### The Lite Policy (`policy.json`):
```json
{
  "taint_blocks_sinks": true,
  "default": {"name": "default", "allow_tools": ["read_webpage"]},
  "tasks": [
    {"name": "email-summary", "match": ["email", "send", "forward"],
     "allow_tools": ["read_webpage", "send_email"],
     "allowed_recipients": ["*@company.example.test"]},
    {"name": "notes", "match": ["notes", "meeting"], "allow_tools": ["read_notes"]},
    {"name": "read-summarize", "match": ["summarize", "summary", "research", "read"],
     "allow_tools": ["read_webpage"]}
  ]
}
```

### The Real AgentShield-X Policy Translation:
AgentShield-X separates policy into **Task Contracts** (what a specific task is authorized to touch) and **Rego Rules** (authorization and safety guardrails).

#### 1. Task Contract Mapping:
When `shield.begin_session(task)` is called, the task prompt is evaluated against contract rules:
- `email-summary` task: binds `TaskContract(allowed_tools=["read_webpage", "send_email"], allowed_data_scopes=["*@company.example.test"])`.
- `notes` task: binds `TaskContract(allowed_tools=["read_notes"], allowed_data_scopes=["internal_notes"])`.
- `read-summarize` task: binds `TaskContract(allowed_tools=["read_webpage"])`.
- Default: binds `TaskContract(allowed_tools=["read_webpage"])`.

#### 2. Open Policy Agent (OPA) Rego Translation:
```rego
package agentshield.authz

default allow = false

# Allow tool if authorized by task contract and not blocked by taint rules
allow {
    is_allowed_by_contract(input.tool.name)
    not is_unauthorized_external_sink(input)
    not is_decoy_honeytool(input.tool.name)
    input.risk < 0.70
}

is_allowed_by_contract(tool_name) {
    input.contract.allowed_tools[_] == tool_name
}

# Block if tainted data flows to an external destination
is_unauthorized_external_sink(input) {
    input.tool.name == "send_email"
    count(input.taint) > 0
    not is_allowed_recipient(input.arguments.to)
}

is_allowed_recipient(recipient) {
    endswith(lower(recipient), "@company.example.test")
}

is_decoy_honeytool(tool_name) {
    tool_name == "export_all_customers"
}
```

#### Rules That Cannot Be Expressed in Basic OPA:
- Pure wildcards with arbitrary shell-style glob patterns (e.g. `*@*.company.example.test`) without custom Rego built-in extensions. In AgentShield-X, recipient allowlisting is evaluated via `fnmatch` inside the `RulesDetector` engine and verified before Rego evaluation.

---

## 4. Running the Real Shield: Architecture Evaluation

We evaluated two runtime strategies:

1. **Option A: In-Process Library Evaluation (`agentshield-inproc`)**:
   - The agent process directly imports `DecisionService` and executes the detector pipeline in-memory.
   - *Advantages*: Zero network overhead (<2ms latency), zero port conflicts, immune to background daemon failures, fully offline, and ideal for CI pipelines and automated testing suites.
2. **Option B: Local Gateway through HTTP/Docker (`agentshield-gateway`)**:
   - The agent SDK connects over HTTP (`http://127.0.0.1:8000/v1/events/tool-call`) to Gateway and Decision services.
   - *Advantages*: Full end-to-end integration exercising rate limiting, WebSocket streaming, and SQLite/PostgreSQL audit logging.

### Recommendation:
**Dual-Mode Backend with In-Process by Default**:
- Implement a unified adapter in `shield/` supporting `SHIELD_BACKEND=lite|agentshield`.
- For `SHIELD_BACKEND=agentshield`:
  - Default to **In-Process** mode (`SHIELD_MODE=inproc`) for fast, deterministic, reproducible benchmark execution and CI.
  - Automatically switch to **Gateway** mode (`SHIELD_MODE=gateway`) if `SHIELD_ENDPOINT` is explicitly provided or when presenting the live console dashboard.
- This ensures test suites run reliably in any environment while still supporting live control plane demonstration.

---

## 5. Gap List and Minimal Set of Hooks

To connect the sample research agent to AgentShield-X with zero architecture changes:

1. **Backend Switch in `examples/research-agent/shield/__init__.py`**:
   - Add `SHIELD_BACKEND` support (`lite` vs `agentshield`), retaining `from shield import shield` and `@shield.tool(...)`.
2. **Real Shield Adapter (`examples/research-agent/shield/real.py`)**:
   - Wraps AgentShield-X's `AgentShield` / `DecisionService`, translating `ToolMeta` keyword attributes (`source`, `reads`, `sink`, `honeytool`) into `ToolCallEvent`s.
   - Adapts the returned `Decision` into the event format expected by `demo.py`, `watch`, and test assertions.
   - Emits `ShieldBlocked` on blocks to preserve compatibility with `except ShieldBlocked:`.
3. **Decisions Logger Hook**:
   - Ensure the real backend writes each decision to `logs/decisions.jsonl` so `python -m shield watch` displays real AgentShield-X decisions in real-time.
4. **Documentation Tracker**:
   - Maintain `docs/UPGRADE_CHANGES.md` recording all changes made across the repository.

---
*End of Phase 0 Audit. Awaiting user confirmation to proceed to Phase 1.*
