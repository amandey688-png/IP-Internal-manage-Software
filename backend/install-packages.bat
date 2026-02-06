@echo off
echo Installing backend dependencies...
echo.

echo Step 1: Installing core packages...
pip install fastapi
pip install "uvicorn[standard]"
pip install python-dotenv
pip install "pydantic[email]"

echo.
echo Step 2: Installing Supabase packages (skipping storage to avoid C++ build tools)...
pip install supabase-auth==2.27.2
pip install httpx
pip install postgrest==2.27.2
pip install gotrue==2.11.0

echo.
echo Step 3: Installing supabase package (may show warnings but should work for auth)...
pip install supabase --no-deps
pip install supabase-auth==2.27.2 httpx postgrest==2.27.2 gotrue==2.11.0 realtime==2.27.2

echo.
echo Installation complete!
echo.
echo Now test the backend with:
echo   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
