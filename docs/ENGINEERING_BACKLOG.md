# AgentShield-X engineering backlog

Baseline: `afee49b`. The master blueprint is the target architecture. A capability is live only when there is an end-to-end test or staging evidence for the actual execution path.

| Area | Repository baseline | Next release gate |
|---|---|---|
| Decision runtime, Python SDK, MCP | Real decision services and detector packages. The SDK now reevaluates each invocation and withholds execution for non-allow decisions. | Verify equivalent enforcement in the MCP proxy and other wrappers; define outage behavior per operation and measure the full request path. |
| Console identity | The email-only social session issuer is disabled. The frontend still has demo identity fallbacks and multiple sign-in sources. | Select one verified session issuer, remove frontend fallback from live mode, require workspace membership, and add cross-workspace denial tests. Plan session invalidation for any deployment that exposed the previous exchange. |
| ShieldWing API | Backend chat and streaming exist; optional identity, shared config and unscoped context remain release blockers. | Resolve verified workspace membership at entry; scope data queries, run history and settings. Move provider credentials out of browser storage and process-wide configuration. |
| Connector hub and Studio | Catalog and channel helpers exist; local flags, process dictionaries and scripted responses are not provider receipts. | One installation-backed, read-only GitHub adapter. Persist consent, repository selection and verified status; handle revocation and explicit disconnect. |
| Copilot | Backend generation and frontend demo are distinct paths. | Connect Studio to the typed chat stream; return evidence identifiers and honest provider/scan failure states. |
| Jobs and approvals | Task and approval demos can report completion without execution receipts. | Durable runs, typed action proposals, exact-action approval, worker rechecks, idempotency and reconciled results. Add scheduling and inbound channels after the manual path passes. |
| RAG, normalizer, canaries, immunity, shadow execution | Components exist; presence is insufficient to prove all live routes enforce equivalent policy or sandbox isolation. | Test provenance through the tool boundary, introduce tenant-scoped detection review and rollback, and validate isolation with harmless fixtures. |
| Audit and operations | Audit and telemetry surfaces exist; durability and isolation claims require deployment evidence. | Verify per-workspace audit access, provenance and chain integrity after restart or restore; establish alerting for failures and degraded policy checks. |
| Packaging and delivery | CLI entry points and a demo Compose stack exist; frontend, wheels and full stack need a shared release gate. | Build and smoke test installed wheels from a clean environment; add frontend/API contract and integration checks to CI. |
| Benchmark | Blueprint reports 26 detections out of 28 malicious records and 20 benign records without false alarms. | Publish reproducible dataset revision, raw outcomes, hardware, confidence intervals, and separate engine vs. end-to-end latency. Do not infer a zero false positive guarantee or competitor ranking from that run. |

## ShieldWing first release

The React studio calls the Control API. The API verifies the workspace, and a connector broker owns provider consent and connection metadata. A server-side secret store holds credentials. One worker executes allowlisted provider operations after the AgentShield policy decision; it writes durable run state and provider receipts. The model can propose actions, but does not hold credentials or execute writes directly.

**Acceptance flow:** Install a GitHub App for a selected repository, verify scope, list actual pull requests, and cite them in Studio. Restart the service and verify state persists. Verify that another workspace, an unselected repository, and a revoked installation cannot be used. Disconnect twice and get the same disabled state.

Then deliver an approved write with an exact target and input, an expiring approval, execution-time authorization, and a durable provider receipt. Add Google Workspace consent, webhook ingestion and recurring tasks using the same contracts. Longer-term work includes deployable RAG provenance, policy simulation from real decision traces, and tenant-scoped drift detection with review and rollback.

Keep live, degraded, demo and planned capabilities visibly distinct. Release individual verified paths; do not advertise the size of the catalog as the number of live integrations.

## Run the live GitHub connector locally

1. Set `SHIELDWING_CONNECTION_DB` to an absolute path in a writable, persistent directory. Set `SHIELDWING_CONNECTION_KEY` to a stable Fernet key. Generate it privately with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` and store it in your local environment or secret manager.
2. From the repository root, run `python start_server.py`. Run `npm run dev` in the console directory and open the Vite URL. Its API proxy uses port 8002.
3. Sign in with an AgentShield email and password and open **Connected tools**. Create a fine-grained GitHub personal access token for just the selected repository with **Pull requests: Read**. Enter the repository and token, then select **Verify and connect**.
4. Open **Chat** and select **List open pull requests**. The response contains up to 20 open PRs and links to GitHub. Every request fetches current provider data.
5. **Disconnect** deletes the saved connection and its encrypted credential. Revoke the token in GitHub if it should be unusable elsewhere.

This release stores individual users' connections within an authorized workspace. It uses SQLite and an operator-supplied encryption key, so run it on a service with a persistent local volume. Use HTTPS when serving the console or API remotely. The GitHub App consent flow, managed credential lifecycle, general chat, and multi-provider orchestration remain separate backlog items.


## Hackathon ShieldWing model demo

ShieldWing Chat now sends user prompts and conversation turns to NVIDIA NIM using `SHIELDWING_CHAT_MODEL` (defaults to `openai/gpt-oss-20b`). The model can request one read-only GitHub tool, `list_pull_requests`, limited to the repository already connected for the signed-in workspace. The server checks the prompt with the ShieldWing injection guard, validates tool arguments, fetches current pull requests, returns them as untrusted tool output to the model, and displays the response with source links. If NIM is not configured or unavailable, the chat reports an error instead of inventing results.

For the demo, configure the Control API with `NVIDIA_API_KEY`, `SHIELDWING_CHAT_MODEL=openai/gpt-oss-20b`, and the connector database/key settings. Connect a GitHub token scoped to one repository with pull-request read permission. Ask ShieldWing to summarize open PRs, then ask a follow-up about the results. The chat supports read-only inspection. Writes and code security scans are not performed by this flow.
