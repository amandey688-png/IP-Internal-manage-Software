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

from supabase import create_client, Client, ClientOptions

# 🔐 Supabase credentials (from .env)
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://geqcgxassdkrymzsjpoj.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Backend options - no session persistence for server-side
_backend_opts = ClientOptions(auto_refresh_token=False, persist_session=False)

# Main client: SERVICE_ROLE for admin ops (create_user, list_users, etc)
SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY, options=_backend_opts)

# Auth client: ANON_KEY for sign_in/sign_up (SERVICE_ROLE can fail these)
_auth_key = SUPABASE_ANON_KEY or SUPABASE_KEY
supabase_auth: Client = create_client(SUPABASE_URL, _auth_key, options=_backend_opts)

if not SUPABASE_SERVICE_ROLE_KEY:
    print("⚠️  Set SUPABASE_SERVICE_ROLE_KEY in .env (Supabase → Settings → API → service_role)")
if not SUPABASE_ANON_KEY:
    print("⚠️  Set SUPABASE_ANON_KEY in .env (Supabase → Settings → API → anon public)")
