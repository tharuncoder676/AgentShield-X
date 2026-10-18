# AgentShield-X Gateway

High-throughput API gateway for AgentShield-X:
- **Authentication**: API keys validated against cryptographically hashed secrets.
- **Rate Limiting**: Token-bucket algorithm per tenant.
- **Interception**: Validates `ToolCallEvent` payloads and proxies to Decision Service.
- **Asynchronous Event Publishing**: Emits raw events and verdicts to Redis Streams / EventBus.

## Endpoints
- `GET /health`: Health status.
- `POST /v1/events/tool-call`: Intercepts proposed tool executions from client SDKs.
