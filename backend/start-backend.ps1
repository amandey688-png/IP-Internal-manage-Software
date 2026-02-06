# Ensure python-multipart (required for /upload) then start backend
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Ensuring python-multipart (for attachment upload)..." -ForegroundColor Cyan
pip install -q python-multipart
if ($LASTEXITCODE -ne 0) { Write-Host "pip install python-multipart failed." -ForegroundColor Red; exit 1 }

$env:PYTHONIOENCODING = "utf-8"
Write-Host "Starting backend on http://127.0.0.1:8000" -ForegroundColor Green
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
