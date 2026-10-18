# AgentShield-X Decision Service

Stateless, latency-critical decision engine that orchestrates parallel security detectors:
- **Rules Detector**: Deterministic prompt injection, jailbreak phrases, delimiter breakout, command chaining, and exfiltration checks.
- **PII & Secrets Detector**: AWS/OpenAI keys, JWT tokens, Shannon entropy evaluation, and credit card/SSN discovery.
- **Honey Detector**: Traps touches on decoy tools (`export_all_customers`) and honeydata tokens.

## Endpoints
- `GET /health`: Health status.
- `POST /v1/decisions/evaluate`: Evaluates a `ToolCallEvent` and returns a `Decision` payload with action, risk breakdown, and evidence citations.
