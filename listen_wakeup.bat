@echo off
title Wingshield Copilot - Background Wake-Word Listener
color 0A
cls
echo ======================================================================
echo   Wingshield Copilot Voice Wake-Word Listener
echo   Lead Architect: Tharunkumar.S
echo   AgentShield-X Security Matrix
echo ======================================================================
echo Listening on microphone...
echo Speak "Agentshield wakeup" or "Wingshield" to launch Copilot!
echo.
cd /d "%~dp0"
python -u -m shield_core.wingshield --listen
pause
