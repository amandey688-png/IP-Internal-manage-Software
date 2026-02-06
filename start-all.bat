@echo off
REM Start FMS Backend + Frontend (Backend uses UTF-8 for Windows 500 fix)
cd /d "%~dp0"

echo Starting FMS Backend (with UTF-8)...
start "FMS Backend" cmd /k "cd /d %~dp0backend && set PYTHONIOENCODING=utf-8 && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo Starting FMS Frontend...
start "FMS Frontend" cmd /k "cd /d %~dp0fms-frontend && npm run dev"

echo.
echo Both servers starting in separate windows.
echo - Backend: http://127.0.0.1:8000
echo - Frontend: http://localhost:3001
echo - Register: http://localhost:3001/register
echo.
pause
