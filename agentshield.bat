@echo off
title AgentShield-X Security CLI
color 0A
cls
echo ======================================================================
echo   Launching AgentShield-X Security CLI Matrix...
echo   Lead Architect: Tharunkumar.S
echo   Wingshield Copilot: Integrated & Online
echo ======================================================================
cd /d "%~dp0"
python -m shield_core.cli
pause
