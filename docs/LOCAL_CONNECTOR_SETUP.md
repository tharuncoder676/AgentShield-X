# Local connector setup and permission flow

This release has a real GitHub read-only connector and an alpha Google Workspace OAuth connector. Other catalog entries remain previews until they have their own provider authorization and executable tools.

## Start local GitHub storage

From the repository root, run:

```powershell
python scripts/setup_local_connectors.py
```

The helper creates or updates the ignored `.env` file with an absolute SQLite database path under `services/data`, a generated Fernet key, and localhost Google callback/console URLs. It preserves valid existing connector keys and Google OAuth settings and does not print secrets. Restart the Control API after setup so it loads `.env`.

To use ShieldWing chat and model-generated action proposals, also configure a valid `NVIDIA_API_KEY` and optional `SHIELDWING_CHAT_MODEL` in `.env`; provider authorization and direct read operations do not depend on the model key.

Back up the key separately from the database. If the key is lost, saved provider credentials cannot be decrypted. The local helper is for development only. For production, put the key in a secret manager/KMS, use persistent database storage with backups, TLS, and a managed key rotation process.

## Configure Google OAuth for localhost

1. Create a Google Cloud OAuth **Web application** client and enable Gmail API and Google Calendar API for that project.
2. Register this exact redirect URI: `http://localhost:8000/v1/shieldwing/google/callback`.
3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `CONSOLE_BASE_URL` in the ignored `.env`. Local defaults are `http://localhost:8000/v1/shieldwing/google/callback` and `http://localhost:3000`.
4. Restart the Control API. In the console, open Connected tools and connect Gmail or Calendar separately. Google displays its consent screen; the connector checks returned scopes before saving encrypted tokens.

The Google adapter requests `gmail.metadata` and the narrower `calendar.events.owned.readonly` only for selected services. It exposes headers for unread messages and bounded upcoming events on the primary calendar. It does not read email bodies, send email, or edit events. Gmail metadata access is a restricted scope. Public launch requires Google OAuth verification and may require an independent security assessment if restricted data is transmitted or stored by the service. Check Google's current [Gmail scope requirements](https://developers.google.com/workspace/gmail/api/auth/scopes) and [restricted-scope verification requirements](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification). Until Google approves the production OAuth app, keep it in testing with allowlisted test users.

## Connect GitHub

1. Sign in and open **Connected tools**.
2. Choose one repository and create a GitHub fine-grained personal access token restricted to that repository. Grant **Pull requests: Read-only**.
3. Review the in-app access summary and confirm: AgentShield may read pull request metadata from this repository. The API independently enforces that confirmation.
4. AgentShield verifies the token with GitHub and stores it encrypted on the server. The browser does not retain it.
5. Review the recorded permission on the connection page. Disconnect deletes the saved credential.

The current GitHub adapter can read up to 20 pull requests (open, closed, or all). It cannot write comments, merge, change settings, or read unrelated repositories through the adapter.

## Approve data access in chat

When ShieldWing proposes a pull request read, it displays the repository, requested state, item limit, read-only nature, and expiry. **Allow once** authorizes only that pending action. **Deny** records the denial without contacting GitHub. Requests are workspace/user scoped, expire after five minutes, and can be decided once. A later chat action requires a new approval.

Provider account authorization and per-action approval are separate controls. Revoking or disconnecting the provider credential stops future access; denying one chat action does not disconnect the account.

## Local boundaries

“Localhost” means the AgentShield console and API are running on the user’s machine. GitHub API requests still go to GitHub over HTTPS, and model summaries go to the configured model provider. A provider integration cannot access data unless its provider credential and granted permissions allow it. This connector is not a universal filesystem or account-wide data bridge.

## Current limitations

- GitHub connection currently uses a user-created fine-grained token, not a GitHub-hosted OAuth consent screen. This keeps repository selection explicit but requires the user to create and manage the token.
- The adapter supports only PR metadata reads and model-assisted summaries.
- Gmail and Calendar are alpha and still require a configured Google OAuth app and real-account verification. Twitter/X is catalog-only; Instagram and VS Code are not yet in the catalog.
- Production deployment still requires external secret management, persistent storage, deployment TLS, provider app review where applicable, and a real end-to-end run against provider accounts.
