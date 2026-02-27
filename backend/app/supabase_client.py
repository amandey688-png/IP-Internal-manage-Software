# Patch storage3 import to avoid pyroaring dependency
import sys
import os

from dotenv import load_dotenv
load_dotenv()

# Try to import storage3 normally first
try:
    import storage3
except (ImportError, ModuleNotFoundError):
    # If storage3 fails (due to missing pyiceberg/pyroaring), create a mock
    from unittest.mock import MagicMock
    storage3_mock = MagicMock()
    storage3_mock.utils = MagicMock()
    storage3_mock.utils.StorageException = Exception
    sys.modules['storage3'] = storage3_mock
    sys.modules['storage3.utils'] = storage3_mock.utils

import httpx
from supabase import create_client, Client, ClientOptions

# 🔐 Supabase credentials (from .env) - ensure backend/.env is loaded even when run from project root
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_env_file = os.path.join(_backend_dir, ".env")
if os.path.exists(_env_file):
    load_dotenv(_env_file)

SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").strip() or "https://geqcgxassdkrymzsjpoj.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
SUPABASE_ANON_KEY = (os.getenv("SUPABASE_ANON_KEY") or "").strip()

# Keys must be JWTs (eyJ...) for auth to work; sb_secret_... will not work for login
def _key_ok(key: str) -> bool:
    if not key or len(key) < 50:
        return False
    return key.strip().startswith("eyJ")

# Longer timeout (60s) to avoid login timeout on slow networks or local dev
_supabase_timeout = 60.0
_http_client = httpx.Client(timeout=_supabase_timeout)

# Backend options - no session persistence for server-side
_backend_opts = ClientOptions(
    auto_refresh_token=False,
    persist_session=False,
    postgrest_client_timeout=_supabase_timeout,
    httpx_client=_http_client,
)

# Main client: SERVICE_ROLE for admin ops (create_user, list_users, etc)
SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY, options=_backend_opts)

# Auth client: ANON_KEY for sign_in/sign_up (SERVICE_ROLE can fail these)
_auth_key = SUPABASE_ANON_KEY or SUPABASE_KEY
supabase_auth: Client = create_client(SUPABASE_URL, _auth_key, options=_backend_opts)

# Startup check: warn if keys are missing or wrong format (so login doesn't fail silently)
if not SUPABASE_SERVICE_ROLE_KEY:
    print("⚠️  SUPABASE_SERVICE_ROLE_KEY is missing in backend/.env — add the service_role JWT (starts with eyJ)")
elif not _key_ok(SUPABASE_SERVICE_ROLE_KEY):
    print("⚠️  SUPABASE_SERVICE_ROLE_KEY should be a JWT starting with eyJ — not sb_secret_... (copy from Supabase → API)")
if not SUPABASE_ANON_KEY:
    print("⚠️  SUPABASE_ANON_KEY is missing in backend/.env — add the anon public JWT (starts with eyJ)")
elif not _key_ok(SUPABASE_ANON_KEY):
    print("⚠️  SUPABASE_ANON_KEY should be a full JWT starting with eyJ — re-copy from Supabase → API")

# Optional: connectivity check on startup with retries (paused projects often wake up after 10–60s).
# Run in a background thread so the server starts immediately and can accept requests; check runs without blocking.
def _startup_supabase_check():
    import time
    url = SUPABASE_URL.rstrip("/")
    project_ref = ""
    if ".supabase.co" in url:
        try:
            project_ref = url.replace("https://", "").replace("http://", "").split(".supabase.co")[0].strip()
        except Exception:
            pass
    unpause_msg = f" Unpause: https://supabase.com/dashboard/project/{project_ref}/settings/general" if project_ref else ""
    delays = [0, 5, 15, 30]
    last_e = None
    for attempt, delay in enumerate(delays):
        if delay > 0:
            time.sleep(delay)
        try:
            r = httpx.get(f"{url}/rest/v1/", timeout=20.0)
            if r.status_code in (200, 301, 302, 401, 404):
                print("✓ Supabase reachable — login should work if keys are correct.")
                return
            last_e = f"HTTP {r.status_code}"
        except Exception as e:
            last_e = e
            if attempt < len(delays) - 1:
                print(f"⚠️  Supabase not reachable (attempt {attempt + 1}/{len(delays)}). Retrying in {delays[attempt + 1]}s...")
            else:
                print(f"⚠️  Supabase not reachable after {len(delays)} attempts: {type(e).__name__}.{unpause_msg}")
                print("   Fix .env or network, then restart. Or open GET /health/supabase in browser for details.")
    if last_e:
        print(f"⚠️  Supabase returned {last_e}.{unpause_msg}")


def _run_startup_check_in_background():
    import threading
    t = threading.Thread(target=_startup_supabase_check, daemon=True)
    t.start()


_run_startup_check_in_background()
