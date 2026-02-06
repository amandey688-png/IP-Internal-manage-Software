# Fix "Not Found" (404) Error

If you see `{"detail":"Not Found"}` from the backend, follow these steps.

## Quick Fixes

### 1. Try the `/api` prefix

The backend now supports **both** URL styles:
- `http://127.0.0.1:8000/users/me` ✅
- `http://127.0.0.1:8000/api/users/me` ✅

**If you get 404**, update your frontend `.env`:

```env
# Option A (default) - no prefix
VITE_API_BASE_URL=http://127.0.0.1:8000

# Option B - with /api prefix
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Restart the frontend after changing `.env`.

### 2. Verify backend is running

```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Test in browser: http://127.0.0.1:8000/health → should return `{"status":"ok"}`

### 3. Check the exact URL being called

Open browser DevTools (F12) → Network tab → find the failing request → check the **full URL**.

- If it shows `http://127.0.0.1:8000/api/users/me` and you get 404, the backend may need a restart.
- If it shows a different port or path, fix your `VITE_API_BASE_URL`.

### 4. Database issues (Profile not found)

If the error is `{"detail":"User profile not found"}` or `{"detail":"Profile not found"}` (not just "Not Found"):

1. Run `database/FIX_USER_PROFILE.sql` in Supabase SQL Editor
2. Or run `database/FRESH_SETUP.sql` for a complete reset

## Fresh Database Setup

To start with a clean database:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run `database/FRESH_SETUP.sql`
3. Re-register or run `FIX_USER_PROFILE.sql` for existing users

## Available Endpoints

| Endpoint | Method | Auth |
|----------|--------|------|
| `/health` | GET | No |
| `/check-user?email=x@y.com` | GET | No |
| `/auth/register` | POST | No |
| `/auth/login` | POST | No |
| `/users/me` or `/me` | GET | Yes |
| `/tickets` | GET, POST | Yes |
| `/tickets/{id}` | GET, PUT, DELETE | Yes |
| `/users` | GET | Yes |
| `/solutions/ticket/{id}` | GET | Yes |
| `/staging/deployments` | GET, POST | Yes |

All above also work with `/api` prefix (e.g. `/api/users/me`).
