Write-Host "Installing backend dependencies..." -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Installing core packages..." -ForegroundColor Yellow
pip install fastapi
pip install "uvicorn[standard]"
pip install python-dotenv
pip install "pydantic[email]"

Write-Host ""
Write-Host "Step 2: Installing Supabase Auth packages..." -ForegroundColor Yellow
pip install supabase-auth==2.27.2
pip install httpx
pip install postgrest==2.27.2
pip install gotrue==2.11.0
pip install realtime==2.27.2

Write-Host ""
Write-Host "Step 3: Installing supabase package (may skip storage dependencies)..." -ForegroundColor Yellow
pip install supabase --no-deps
pip install supabase-auth==2.27.2 httpx postgrest==2.27.2 gotrue==2.27.2 realtime==2.27.2

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Test the backend with:" -ForegroundColor Cyan
Write-Host "  uvicorn app.main:app --reload --host 127.0.0.1 --port 8000" -ForegroundColor White
