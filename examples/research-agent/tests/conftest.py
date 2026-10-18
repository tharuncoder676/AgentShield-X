import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agent import tools  # noqa: E402
from shield import shield  # noqa: E402


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setattr(tools, "OUTBOX", tmp_path / "outbox")
    shield.log_enabled = False
    shield.mode = "off"
    tools.PAGE_OVERRIDES.clear()
    tools.SHADOW["on"] = False
    tools.SHADOW["sent"].clear()
    yield
    shield.mode = "off"
