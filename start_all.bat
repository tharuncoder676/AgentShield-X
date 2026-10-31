@echo off
title AgentShield-X Services Launcher
echo ======================================================================
echo           Starting AgentShield-X Backend and Frontend Services
echo                 Architect ^& Creator: Tharunkumar.S
echo ======================================================================
echo.

cd /d "%~dp0"

echo [*] Launching Backend API on http://localhost:8002 ...
start "AgentShield-X Control API [8002]" cmd /k "cd services\control_api\src && python -m uvicorn control_api.main:app --host 127.0.0.1 --port 8002"

echo [*] Waiting 3 seconds for backend initialization...
ping 127.0.0.1 -n 4 >nul

echo [*] Launching Frontend Console on http://localhost:3000 ...
start "AgentShield-X Web Console [3000]" cmd /k "npm.cmd run dev --prefix apps/console"

echo [*] Launching Background Voice Wake-Word Listener (Mic Active) ...
start "Wingshield Voice Wake-Word Listener" cmd /k "call listen_wakeup.bat"

echo [*] Launching Wingshield Copilot Wakeup Console ...
start "Wingshield Copilot - AgentShield-X" cmd /k "call wakeup.bat"

echo.
echo ======================================================================
echo [OK] All AgentShield-X Services and Voice Wakeup are now RUNNING!
echo  - Control API: http://localhost:8002 (Health: http://localhost:8002/health)
echo  - Web Console: http://localhost:3000 (Terminal: http://localhost:3000/terminal)
echo  - Microphone : Background Wake-Word Listener Active ("Agentshield wakeup", "open chrome", "open youtube")
echo  - Copilot REPL: Wingshield Wakeup Terminal Ready
echo ======================================================================
echo.
