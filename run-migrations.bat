@echo off
REM FMS Database Migration Runner
REM Usage: run-migrations.bat [--fresh | --upgrade | --tickets-only]
cd /d "%~dp0"
python database/run_migrations.py %*
pause
