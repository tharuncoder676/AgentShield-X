"""Authentication and workspace ownership checks for connector APIs."""

from typing import Annotated

from fastapi import Depends, HTTPException

from control_api.db import Database
from control_api.models import UserDTO
from control_api.routes.auth import get_current_user


Principal = Annotated[UserDTO, Depends(get_current_user)]


def connection_owner(workspace_id: str, user: Principal) -> tuple[str, str]:
    if not any(org["id"] == workspace_id for org in Database.get_instance().get_orgs_for_user(user.id)):
        raise HTTPException(404, "Workspace not found.")
    return workspace_id, user.id


Owner = Annotated[tuple[str, str], Depends(connection_owner)]
