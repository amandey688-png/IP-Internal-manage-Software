# Ensure python-multipart (required for /upload) then start backend
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$port = 8020
if ($env:BACKEND_PORT) { $port = [int]$env:BACKEND_PORT }

Write-Host "Stopping any process listening on port $port..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object {
    $procId = $_.OwningProcess
    if ($procId) {
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      Write-Host "  Stopped PID $procId" -ForegroundColor DarkGray
    }
  }
Start-Sleep -Seconds 2

Write-Host "Ensuring python-multipart (for attachment upload)..." -ForegroundColor Cyan
pip install -q python-multipart
if ($LASTEXITCODE -ne 0) { Write-Host "pip install python-multipart failed." -ForegroundColor Red; exit 1 }

$env:PYTHONIOENCODING = "utf-8"
Write-Host "Starting backend on http://127.0.0.1:$port" -ForegroundColor Green
Write-Host "  Ping: http://127.0.0.1:$port/api/feature-approval-reminders/ping (expect routes=feature-approval-reminders-v1)" -ForegroundColor DarkGray
uvicorn app.main:app --reload --host 127.0.0.1 --port $port
