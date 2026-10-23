@echo off
title AgentShield-X Services Launcher
echo ======================================================================
echo           Starting AgentShield-X Backend and Frontend Services
echo                 Architect & Creator: Tharunkumar.S
echo ======================================================================
echo.

cd /d "%~dp0"

echo [*] Launching Backend API on http://localhost:8002 ...
start "AgentShield-X Control API [8002]" cmd /k "cd services\control_api\src && python -m uvicorn control_api.main:app --host 0.0.0.0 --port 8002"

echo [*] Waiting 3 seconds for backend initialization...
timeout /t 3 /nobreak >nul

echo [*] Launching Frontend Console on http://localhost:3000 ...
start "AgentShield-X Web Console [3000]" cmd /k "npm run dev --prefix apps/console"

echo.
echo ======================================================================
echo [OK] Both services have been started in dedicated windows!
echo  - Control API: http://localhost:8002 (Health: http://localhost:8002/health)
echo  - Web Console: http://localhost:3000 (Terminal: http://localhost:3000/terminal)
echo ======================================================================
echo.
