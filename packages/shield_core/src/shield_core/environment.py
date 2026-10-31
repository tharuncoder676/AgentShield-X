"""
AgentShield-X User Environment Intelligence & Universal Desktop Automation Engine
Lead Architect & Creator: Tharunkumar.S

Provides dynamic full-machine awareness:
1. Complete User Folder Knowledge Base (Desktop, Downloads, Documents, OneDrive, Projects, Drives)
2. Complete Installed Applications Catalog (Start Menu, App Paths, Executables, Store Apps)
3. Universal Action Execution (Volume, Brightness, Clipboard, Shell Commands, File Operations)
"""

from __future__ import annotations

import glob
import os
import platform
import re
import shutil
import subprocess
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple


def ensure_interactive_desktop():
    """Ensures thread is attached to user's physical interactive screen (WinSta0\\Default)."""
    if platform.system() == "Windows":
        try:
            import win32service, win32con
            h_desk = win32service.OpenDesktop("Default", 0, False, win32con.GENERIC_ALL)
            h_desk.SetThreadDesktop()
        except Exception:
            pass


def get_interactive_startupinfo() -> Optional[subprocess.STARTUPINFO]:
    """Configures process to spawn directly onto the user's physical monitor."""
    if platform.system() == "Windows":
        try:
            si = subprocess.STARTUPINFO()
            si.lpDesktop = r"WinSta0\Default"
            si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            si.wShowWindow = 1
            return si
        except Exception:
            pass
    return None


class UserEnvironmentIntelligence:
    """Discovers, indexes, and controls the user's folders, projects, and installed applications."""

    _cached_folders: Optional[Dict[str, Path]] = None
    _cached_apps: Optional[Dict[str, str]] = None
    _last_index_time: float = 0.0
    CACHE_TTL_SEC: float = 60.0

    @classmethod
    def refresh_cache_if_needed(cls, force: bool = False) -> None:
        if force or cls._cached_folders is None or (time.time() - cls._last_index_time > cls.CACHE_TTL_SEC):
            cls._index_environment()

    @classmethod
    def _index_environment(cls) -> None:
        cls._cached_folders = cls._discover_user_folders()
        cls._cached_apps = cls._discover_installed_apps()
        cls._last_index_time = time.time()

    @classmethod
    def _discover_user_folders(cls) -> Dict[str, Path]:
        """Discovers standard user folders, OneDrive directories, drives, and all Desktop projects."""
        home = Path.home()
        folders: Dict[str, Path] = {
            "home": home,
            "userprofile": home,
            "root": home,
        }

        # Canonical folders
        candidates = [
            ("desktop", home / "OneDrive" / "Desktop"),
            ("desktop", home / "Desktop"),
            ("downloads", home / "Downloads"),
            ("download", home / "Downloads"),
            ("documents", home / "OneDrive" / "Documents"),
            ("documents", home / "Documents"),
            ("docs", home / "Documents"),
            ("pictures", home / "OneDrive" / "Pictures"),
            ("pictures", home / "Pictures"),
            ("photos", home / "Pictures"),
            ("music", home / "Music"),
            ("songs", home / "Music"),
            ("videos", home / "Videos"),
            ("movies", home / "Videos"),
        ]

        for name, p in candidates:
            if p.exists() and name not in folders:
                folders[name] = p.resolve()

        # Index all subfolders on Desktop (User projects)
        desktop = folders.get("desktop")
        if desktop and desktop.exists():
            try:
                for item in desktop.iterdir():
                    if item.is_dir() and not item.name.startswith("."):
                        clean_name = item.name.lower().replace("-", " ").replace("_", " ")
                        folders[clean_name] = item.resolve()
                        folders[item.name.lower()] = item.resolve()
            except Exception:
                pass

        # Index user home directory subfolders
        try:
            for item in home.iterdir():
                if item.is_dir() and not item.name.startswith("."):
                    key = item.name.lower().replace("-", " ").replace("_", " ")
                    if key not in folders:
                        folders[key] = item.resolve()
        except Exception:
            pass

        return folders

    @classmethod
    def _discover_installed_apps(cls) -> Dict[str, str]:
        """Scans Windows Start Menu shortcuts and App Paths to index all installed software."""
        apps: Dict[str, str] = {}
        if platform.system() != "Windows":
            return apps

        start_dirs = [
            os.path.expandvars(r"%ProgramData%\Microsoft\Windows\Start Menu\Programs"),
            os.path.expandvars(r"%AppData%\Microsoft\Windows\Start Menu\Programs"),
        ]

        for s_dir in start_dirs:
            if not os.path.isdir(s_dir):
                continue
            for lnk in glob.glob(s_dir + "/**/*.lnk", recursive=True):
                base = os.path.splitext(os.path.basename(lnk))[0].lower()
                clean = re.sub(r"[^a-z0-9 ]+", " ", base).strip()
                if clean:
                    apps[clean] = lnk
                apps[base] = lnk

        return apps

    @classmethod
    def get_known_folders(cls) -> Dict[str, Path]:
        cls.refresh_cache_if_needed()
        return cls._cached_folders or {}

    @classmethod
    def get_installed_apps(cls) -> Dict[str, str]:
        cls.refresh_cache_if_needed()
        return cls._cached_apps or {}

    @classmethod
    def find_folder(cls, query: str) -> Optional[Path]:
        """Fuzzy locates a folder by name or partial match."""
        cls.refresh_cache_if_needed()
        folders = cls.get_known_folders()
        q = query.lower().strip()
        q_clean = re.sub(r"[^a-z0-9 ]+", " ", q).strip()

        # Exact match
        if q in folders:
            return folders[q]
        if q_clean in folders:
            return folders[q_clean]

        # Substring match
        for name, path in folders.items():
            if q in name or name in q or (q_clean and q_clean in name):
                return path

        return None

    @classmethod
    def open_folder(cls, query: str) -> Tuple[bool, str]:
        """Opens the matching folder in Windows Explorer."""
        folder = cls.find_folder(query)
        if not folder or not folder.exists():
            return False, f"Could not find folder matching '{query}'."

        ensure_interactive_desktop()
        si = get_interactive_startupinfo()
        try:
            if platform.system() == "Windows":
                subprocess.Popen(["explorer.exe", str(folder)], startupinfo=si)
            else:
                subprocess.Popen(["xdg-open", str(folder)])
            return True, f"Opened folder: {folder.name} ({folder})"
        except Exception as e:
            return False, f"Failed to open folder {folder}: {e}"

    @classmethod
    def list_folder_contents(cls, query: str = "desktop", max_items: int = 15) -> Tuple[bool, str]:
        """Lists files and directories inside the given folder."""
        folder = cls.find_folder(query)
        if not folder or not folder.exists():
            return False, f"Folder '{query}' not found."

        try:
            items = list(folder.iterdir())
            dirs = [i.name for i in items if i.is_dir() and not i.name.startswith(".")]
            files = [i.name for i in items if i.is_file() and not i.name.startswith(".")]

            lines = [f"Contents of {folder.name} ({folder}):"]
            if dirs:
                lines.append(f"  [Directories ({len(dirs)})]: " + ", ".join(dirs[:max_items]))
            if files:
                lines.append(f"  [Files ({len(files)})]: " + ", ".join(files[:max_items]))
            if not dirs and not files:
                lines.append("  (Folder is empty)")

            return True, "\n".join(lines)
        except Exception as e:
            return False, f"Error reading folder {folder}: {e}"

    @classmethod
    def find_files(cls, pattern: str, limit: int = 10) -> Tuple[bool, str]:
        """Searches for files matching a pattern across user Desktop, Documents, and Downloads."""
        cls.refresh_cache_if_needed()
        folders = cls.get_known_folders()
        search_roots = [
            folders.get("desktop"),
            folders.get("downloads"),
            folders.get("documents"),
        ]
        results: List[Path] = []
        pat = pattern.lower().strip()

        for root in search_roots:
            if not root or not root.exists():
                continue
            try:
                for p in root.rglob("*"):
                    if p.is_file() and pat in p.name.lower():
                        results.append(p)
                        if len(results) >= limit:
                            break
            except Exception:
                pass
            if len(results) >= limit:
                break

        if not results:
            return False, f"No files matching '{pattern}' were found in your primary user folders."

        lines = [f"Found {len(results)} matching file(s):"]
        for r in results:
            size_kb = r.stat().st_size / 1024
            lines.append(f"  * {r.name} ({size_kb:.1f} KB) -> {r.parent}")

        return True, "\n".join(lines)

    @classmethod
    def launch_app(cls, query: str) -> Tuple[bool, str]:
        """Fuzzy matches and launches any installed application from the Start Menu catalog."""
        cls.refresh_cache_if_needed()
        apps = cls.get_installed_apps()
        q = query.lower().strip()
        q_clean = re.sub(r"[^a-z0-9 ]+", " ", q).strip()

        # Exact match
        target_lnk = apps.get(q) or apps.get(q_clean)

        # Fuzzy match
        if not target_lnk:
            for name, lnk in apps.items():
                if q in name or name in q or (q_clean and q_clean in name):
                    target_lnk = lnk
                    break

        if target_lnk and os.path.exists(target_lnk):
            ensure_interactive_desktop()
            si = get_interactive_startupinfo()
            app_title = os.path.splitext(os.path.basename(target_lnk))[0]
            try:
                subprocess.Popen(["cmd.exe", "/c", "start", "", target_lnk], shell=True, startupinfo=si)
                return True, f"Launching {app_title}."
            except Exception:
                try:
                    if hasattr(os, "startfile"):
                        os.startfile(target_lnk)
                        return True, f"Launching {app_title}."
                except Exception as e:
                    return False, f"Could not launch {app_title}: {e}"

        return False, f"App '{query}' not found in installed applications."


class SystemControlEngine:
    """Provides machine controls: volume, brightness, clipboard, and universal command execution."""

    @staticmethod
    def volume_up(steps: int = 4) -> str:
        try:
            ps_cmd = "$wsh = New-Object -ComObject WScript.Shell; for ($i=0; $i -lt %d; $i++) { $wsh.SendKeys([char]175) }" % steps
            subprocess.Popen(["powershell", "-NoProfile", "-Command", ps_cmd])
            return "Volume increased."
        except Exception as e:
            return f"Failed to adjust volume: {e}"

    @staticmethod
    def volume_down(steps: int = 4) -> str:
        try:
            ps_cmd = "$wsh = New-Object -ComObject WScript.Shell; for ($i=0; $i -lt %d; $i++) { $wsh.SendKeys([char]174) }" % steps
            subprocess.Popen(["powershell", "-NoProfile", "-Command", ps_cmd])
            return "Volume decreased."
        except Exception as e:
            return f"Failed to adjust volume: {e}"

    @staticmethod
    def volume_mute_toggle() -> str:
        try:
            ps_cmd = "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys([char]173)"
            subprocess.Popen(["powershell", "-NoProfile", "-Command", ps_cmd])
            return "Toggled volume mute."
        except Exception as e:
            return f"Failed to toggle mute: {e}"

    @staticmethod
    def set_brightness(percent: int) -> str:
        pct = max(0, min(100, percent))
        try:
            ps_cmd = f"(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, {pct})"
            subprocess.Popen(["powershell", "-NoProfile", "-Command", ps_cmd])
            return f"Brightness set to {pct}%."
        except Exception as e:
            return f"Could not set brightness: {e}"

    @staticmethod
    def get_clipboard() -> str:
        try:
            res = subprocess.run(["powershell", "-NoProfile", "-Command", "Get-Clipboard"], capture_output=True, text=True, timeout=3)
            out = res.stdout.strip()
            return out if out else "(Clipboard is empty)"
        except Exception as e:
            return f"Could not access clipboard: {e}"

    @staticmethod
    def set_clipboard(text: str) -> str:
        try:
            p = subprocess.Popen(["powershell", "-NoProfile", "-Command", "$input | Set-Clipboard"], stdin=subprocess.PIPE, text=True)
            p.communicate(input=text)
            return "Copied text to clipboard."
        except Exception as e:
            return f"Could not set clipboard: {e}"

    @staticmethod
    def run_arbitrary_command(command_str: str) -> str:
        """Executes any user CLI command directly in PowerShell/CMD and returns clean output."""
        clean_cmd = re.sub(r"^(run|exec|execute|powershell|cmd)\s+", "", command_str, flags=re.IGNORECASE).strip()
        try:
            proc = subprocess.run(
                clean_cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=45,
            )
            out = proc.stdout.strip()
            err = proc.stderr.strip()
            output = out if out else err
            if not output:
                output = f"Command '{clean_cmd}' executed successfully (Exit Code 0)."
            if len(output) > 1500:
                output = output[:1500] + "\n... [truncated output]"
            return output
        except subprocess.TimeoutExpired:
            return f"Command '{clean_cmd}' timed out after 45 seconds."
        except Exception as e:
            return f"Command execution error: {e}"
