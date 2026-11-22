"""Prepare encrypted local storage for ShieldWing's GitHub connector."""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from cryptography.fernet import Fernet


ROOT = Path(__file__).resolve().parents[1]


def update_env(env_path: Path, db_path: Path) -> None:
    lines = env_path.read_text(encoding="utf-8").splitlines() if env_path.exists() else []
    values: dict[str, str] = {}
    for line in lines:
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()

    configured_key = values.get("SHIELDWING_CONNECTION_KEY", "")
    if not configured_key or configured_key.lower().startswith(("your_", "generate_")):
        configured_key = Fernet.generate_key().decode("ascii")
    else:
        try:
            Fernet(configured_key.encode("ascii"))
        except (ValueError, UnicodeEncodeError) as exc:
            raise SystemExit("SHIELDWING_CONNECTION_KEY is set but invalid; refusing to replace it.") from exc

    replacements = {
        "SHIELDWING_CONNECTION_DB": str(db_path),
        "SHIELDWING_CONNECTION_KEY": configured_key,
        "GOOGLE_CLIENT_ID": values.get("GOOGLE_CLIENT_ID", ""),
        "GOOGLE_CLIENT_SECRET": values.get("GOOGLE_CLIENT_SECRET", ""),
        "GOOGLE_REDIRECT_URI": values.get("GOOGLE_REDIRECT_URI") or "http://localhost:8000/v1/shieldwing/google/callback",
        "CONSOLE_BASE_URL": values.get("CONSOLE_BASE_URL") or "http://localhost:3000",
    }
    seen: set[str] = set()
    output: list[str] = []
    for line in lines:
        if "=" in line and not line.lstrip().startswith("#"):
            key = line.split("=", 1)[0].strip()
            if key in replacements:
                if key not in seen:
                    output.append(f"{key}={replacements[key]}")
                    seen.add(key)
                continue
        output.append(line)
    for key, value in replacements.items():
        if key not in seen:
            output.append(f"{key}={value}")
    env_path.parent.mkdir(parents=True, exist_ok=True)
    env_path.write_text("\n".join(output).rstrip() + "\n", encoding="utf-8")
    try:
        env_path.chmod(0o600)
    except OSError:
        pass


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--env-file", type=Path, default=ROOT / ".env")
    parser.add_argument(
        "--database", type=Path, default=ROOT / "services" / "data" / "shieldwing-connectors.db"
    )
    args = parser.parse_args()
    db_path = args.database if args.database.is_absolute() else ROOT / args.database
    db_path = db_path.resolve()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    update_env(args.env_file.resolve(), db_path)
    print(f"Local connector storage configured: {db_path}")
    print(f"Environment file updated: {args.env_file.resolve()}")
    print("Connector encryption key generated or preserved; key value was not printed.")


if __name__ == "__main__":
    main()
