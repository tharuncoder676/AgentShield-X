"""Runtime registry for connector capabilities that have server-side adapters."""

from dataclasses import dataclass
from typing import Literal


Support = Literal["live", "alpha", "catalog"]


@dataclass(frozen=True)
class ConnectorManifest:
    id: str
    name: str
    support: Support
    auth_method: str | None
    permissions: tuple[str, ...]
    actions: tuple[str, ...]
    approval_mode: str


MANIFESTS: dict[str, ConnectorManifest] = {
    "github": ConnectorManifest(
        id="github", name="GitHub", support="live", auth_method="fine_grained_token",
        permissions=("repository.pull_requests:read",),
        actions=("list_pull_requests",), approval_mode="allow_once",
    ),
    "gmail": ConnectorManifest(
        id="gmail", name="Gmail", support="alpha", auth_method="oauth2_pkce",
        permissions=("https://www.googleapis.com/auth/gmail.metadata",),
        actions=("list_unread_messages",), approval_mode="explicit_user_request",
    ),
    "gcal": ConnectorManifest(
        id="gcal", name="Google Calendar", support="alpha", auth_method="oauth2_pkce",
        permissions=("https://www.googleapis.com/auth/calendar.events.owned.readonly",),
        actions=("list_upcoming_events",), approval_mode="explicit_user_request",
    ),
}


def get_live_connectors() -> list[ConnectorManifest]:
    return [manifest for manifest in MANIFESTS.values() if manifest.support == "live"]


def list_manifests() -> list[dict]:
    return [
        {
            "id": manifest.id,
            "name": manifest.name,
            "support": manifest.support,
            "auth_method": manifest.auth_method,
            "permissions": list(manifest.permissions),
            "actions": list(manifest.actions),
            "approval_mode": manifest.approval_mode,
        }
        for manifest in MANIFESTS.values()
    ]
