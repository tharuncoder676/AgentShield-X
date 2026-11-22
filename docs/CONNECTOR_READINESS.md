# AgentShield-X Connector Readiness Audit

**Audit date:** 2026-11-18  
**Scope:** Repository connector catalog, console connection flows, and Control API connector routes.  
**Standard:** A connector is live only when it has provider authorization, server-side credential handling, an actual provider health check, executable tools, workspace isolation, and honest connection/revocation state.

## Strict score

**Connector platform: 2/10.** The repo now has one live-code adapter and two alpha read-only service adapters, but it does not yet provide the advertised universal connector platform.

- The catalog has **49 connector records**. The previous “312 available” figures were hard-coded claims, not implemented integrations.
- **One provider, GitHub, has a complete server-side read-only path** in this repository: workspace-scoped credential save, provider verification, encrypted persistence, pull request listing, and a read-only model tool call.
- Gmail and Calendar now have a workspace-scoped PKCE OAuth adapter, encrypted server-side token storage, refresh/revoke handling, and bounded read-only endpoints. They remain **alpha** until configured with AgentShield's Google OAuth app and verified against real accounts.
- The legacy generic connector toggle only changed an in-memory boolean. It did not authorize a provider or execute tools. It is retired with an explicit `410` response.
- Several catalog records were initialized as connected, including providers with no adapter. Those defaults and the client-side “instant connect” path have been removed from the connector hub.
- `verified: true` and action lists in the catalog are descriptive metadata; they are not evidence that a provider integration or those actions exist.

## Requested provider status

| Provider | Catalog entry | Real authorization | Provider-backed check | Tool execution | Current status |
|---|---:|---:|---:|---:|---|
| GitHub | Yes | Fine-grained token | Yes | Read-only PR list and bounded chat tool | Implemented, subject to deployment configuration and live verification |
| Gmail | Yes | OAuth 2.0 authorization code + PKCE, user selects Gmail | Encrypted workspace credential storage; refresh/revoke path | Bounded unread message headers | Alpha; requires Google app setup and real-account verification |
| Google Calendar | Yes (`gcal`) | OAuth 2.0 authorization code + PKCE, user selects Calendar | Encrypted workspace credential storage; refresh/revoke path | Bounded upcoming event list | Alpha; requires Google app setup and real-account verification |
| Twitter/X | Yes | No complete flow found | No | No | Catalog only |
| Instagram | No | No | No | No | Not present |
| VS Code | No | No | No | No | Not present; likely needs a local extension/agent bridge, not a cloud OAuth connector |

The broader catalog entries (Slack, Discord, Jira, AWS, Supabase, and others) must each be audited individually before being described as supported. A key field or webhook URL alone does not make a connector functional.

## Changes made in this audit

- Connector hub count now comes from the actual 49-entry catalog.
- Browser-local legacy connection flags are ignored; provider state is queried from the authenticated workspace GitHub endpoint.
- GitHub authorization submits the repository and token to the server, verifies the token against GitHub, and relies on encrypted server-side storage. The browser no longer persists the GitHub token.
- The API requires explicit repository read authorization, records the granted adapter capability and authorization time, and reports that grant to the user.
- GitHub disconnect and health check use provider-backed endpoints.
- Model-proposed pull request reads now pause for a short-lived, workspace/user-scoped **Allow once / Deny** decision. Denial does not call GitHub; approvals are single use and expire after five minutes.
- Added `scripts/setup_local_connectors.py` and [LOCAL_CONNECTOR_SETUP.md](LOCAL_CONNECTOR_SETUP.md) for ignored local `.env` setup and documented the localhost data boundary.
- Added Gmail and Google Calendar manifests, provider-specific scopes, PKCE authorization with session-bound state, encrypted refresh/access token persistence, scope reconciliation, disconnect/revoke handling, and read-only API operations. Removed the prior simulated Gmail/Calendar responses and legacy client-supplied access-token routes.
- Other entries are shown as previews and fail with an explicit “not implemented” status instead of showing success.
- Removed instant “connect 10 tools” and random/fake latency behavior.
- Control API metadata reports the actual catalog size and implemented connector IDs. Flag-only toggles now return `410 Gone`.

## Target connector architecture

Build one integration platform with provider adapters, rather than hundreds of one-off UI branches.

1. **Connector manifest registry** — stable provider ID/version, display name, auth scheme, scopes, capabilities, action schemas, risk class, regions, and support tier. The registry is the source of truth for API and UI.
2. **Authorization broker** — OAuth 2.1 Authorization Code + PKCE for user providers; signed, one-use `state`; exact redirect URI allowlists; CSRF protection; least-privilege scopes; token refresh/revocation. API keys and local credentials use separate setup paths. Never send provider secrets to browser local storage.
3. **Tenant credential vault** — envelope encryption backed by a KMS in production, with workspace/user/provider ownership, rotation metadata, revocation, and access audit. Do not place user credentials in process globals or `.env` files.
4. **Connector runtime** — typed provider adapters behind a common interface: `connect`, `health_check`, `list_tools`, `invoke`, `disconnect`. Enforce timeouts, rate limits, pagination limits, egress allowlists, response-size caps, and provider error mapping.
5. **Tool registry and execution gateway** — derive callable tools from adapter manifests; validate JSON Schema server-side; bind every call to the authenticated workspace and granted scopes; treat provider content as untrusted; run Shield policy checks before and after tool execution.
6. **Approval and idempotency layer** — classify actions as read, reversible write, or consequential write. Require approval for sensitive actions; use idempotency keys and bounded retries; never let the model choose authorization scope.
7. **Durable connection state** — `available`, `authorization_pending`, `connected`, `degraded`, `revoked`, and `disconnected` states persisted by workspace. The UI must never infer state from a click or local flag.
8. **Audit and health** — record actor, workspace, provider, action, policy verdict, approval, request ID, and outcome without logging secrets. Probe health through a harmless provider operation and show last success/failure and scope status.
9. **Compatibility layer** — support MCP servers and local IDE bridges as adapter types, with explicit trust boundaries, signed manifests, sandboxed execution, and administrator allowlists. A local VS Code integration should use an extension/companion process with user-visible permissions; it cannot be represented as a cloud connector alone.
10. **Conformance suite** — every adapter must pass shared authorization, tenant-isolation, schema-validation, timeout, retry, revocation, secret-redaction, prompt-injection, and read/write approval tests before its support tier changes to live.

## Delivery sequence

1. Complete GitHub's OAuth consent option (in addition to the current fine-grained-token flow), validate revocation handling, and deployment-verify against a real account.
2. Configure and production-verify the Google OAuth app, then add Gmail and Calendar tool calls to ShieldWing chat with action-level approvals. Keep message bodies and write actions disabled until scopes, verification, and approval flows are explicitly implemented.
3. Add Slack as a second adapter using OAuth, scoped read tools, and approval-gated message writes.
4. Add the IDE bridge (VS Code) as a local connector runtime with explicit local permissions and signed requests.
5. Add social providers only after confirming permitted API use, supported scopes, and app review status; X/Twitter and Instagram access depends on developer-account approval and provider product access.
6. Expand provider-by-provider through the manifest and conformance suite. Publish counts by support tier: catalog, alpha, live, and verified in production. Never combine catalog records with working integrations.

## Release gate

Do not label a connector “live” until a clean environment can authorize it, reconnect after restart, execute its declared tools against the real provider, isolate another workspace, reject revoked credentials, and produce an auditable result. The local GitHub implementation still requires configured persistent storage/key material, valid user/workspace credentials, and an end-to-end provider run before production readiness can be claimed.
