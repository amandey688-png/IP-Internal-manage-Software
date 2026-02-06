# Start FMS Backend + Frontend (Backend uses UTF-8 for Windows 500 fix)
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "fms-frontend"

Write-Host "Starting FMS Backend (with UTF-8)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$backendPath\start-backend.ps1'"

Start-Sleep -Seconds 3

Write-Host "Starting FMS Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host ""
Write-Host "Both servers starting in separate windows." -ForegroundColor Cyan
Write-Host "- Backend:  http://127.0.0.1:8000"
Write-Host "- Frontend: http://localhost:3001"
Write-Host "- Register: http://localhost:3001/register"
