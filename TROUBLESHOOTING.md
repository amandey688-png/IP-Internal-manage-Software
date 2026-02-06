# FMS Troubleshooting Guide

## When Registration Returns 500 Error

### 1. Check Terminal Output

When you click **Register**, the backend terminal should show:

```
--> POST /auth/register
📝 REGISTER START: your@email.com
📤 Trying create_user...
✅ create_user OK: <user-id>
✅ REGISTER SUCCESS: <user-id>
<-- POST /auth/register -> 200
```

If you see an error instead, that's the cause.

### 2. Check Log File

If the terminal shows nothing, check the log file:

- **Location:** `backend/backend_errors.log`
- Open it after trying to register
- Look for lines starting with `[timestamp]` – they contain the error

### 3. Common Fixes

| Error | Fix |
|-------|-----|
| `create_user failed` + `sign_up failed` | Run `database/FRESH_SETUP.sql` in Supabase SQL Editor |
| `This email is already registered` | Use a different email, or delete the user in Supabase → Authentication → Users |
| `Database not set up` | Run `database/FRESH_SETUP.sql` in Supabase SQL Editor |
| `Invalid API key` / `401` | Check `backend/.env` – ensure `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY` are correct |
| No output at all | Verify the request reaches the backend – check Vite proxy and that backend is running |

### 4. Verify Backend is Running

```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Visit http://127.0.0.1:8000/health – you should see `{"status":"ok"}`.

### 5. Test Registration Directly

```bash
curl -X POST http://127.0.0.1:8000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"full_name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"Test123!@#\"}"
```

Check the backend terminal for output.
