@echo off
REM Start FMS backend with UTF-8 encoding (fixes 500 on Windows)
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
echo Starting backend with UTF-8...
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
