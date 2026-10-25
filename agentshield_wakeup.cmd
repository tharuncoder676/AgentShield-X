@echo off
cd /d "%~dp0"
python -m shield_core.cli wakeup %*
