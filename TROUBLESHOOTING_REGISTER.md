# Troubleshooting: Register Button Not Hitting Backend

## Issues Fixed

### 1. **PasswordInput Component** ✅
**Problem**: The component was using local state (`useState`) which conflicted with Ant Design Form's controlled component pattern, preventing form submission.

**Fix**: Rewrote `PasswordInput` to properly integrate with Ant Design Form using `Form.Item` with `dependencies` to watch the password value for validation rules display.

### 2. **Form Validation** ✅
**Problem**: Form validation errors were preventing submission silently.

**Fix**: Added `onFinishFailed` handler to catch and log validation errors.

### 3. **Debugging & Logging** ✅
**Problem**: No visibility into what was happening when clicking Register.

**Fix**: Added comprehensive logging:
- Request logging in axios interceptor
- Response logging in Register component
- Error logging with full details
- Network error detection

## How to Test

### Step 1: Check Backend is Running
```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify backend is accessible:
- Open http://127.0.0.1:8000/docs (Swagger UI)
- Try GET /health endpoint

### Step 2: Check Frontend Environment
```bash
cd fms-frontend
cat .env
```

Should show:
```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Step 3: Start Frontend
```bash
npm run dev
```

### Step 4: Test Registration

1. **Open Browser Console** (F12 → Console tab)
2. **Go to** http://localhost:3000/register
3. **Fill the form**:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "Test123!@#" (must include special character)
4. **Click Register**

### Step 5: Check Console Logs

You should see:
```
🔗 API Base URL: http://127.0.0.1:8000
🔥 Register form submit triggered
📝 Form values: {full_name: "...", email: "...", password: "..."}
📤 Sending registration request to backend...
📤 API Request: {method: "POST", url: "/auth/register", ...}
📥 Received response: {...}
```

### Step 6: Check Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Click Register
4. Look for request to `/auth/register`
5. Check:
   - **Status**: Should be 200 (success) or 400 (error)
   - **Request URL**: `http://127.0.0.1:8000/auth/register`
   - **Request Method**: POST
   - **Request Payload**: Should show form data

## Common Issues & Solutions

### Issue 1: "Form validation failed" in console
**Cause**: Password doesn't meet requirements
**Solution**: 
- Password must be at least 8 characters
- Must include: uppercase, lowercase, number, special character (@$!%*?&)
- Example: `Test123!@#`

### Issue 2: "Network error: backend not reachable"
**Cause**: Backend not running or wrong URL
**Solution**:
1. Check backend is running: `curl http://127.0.0.1:8000/health`
2. Check `.env` file has correct `VITE_API_BASE_URL`
3. Restart frontend after changing `.env`

### Issue 3: CORS Error
**Cause**: Backend CORS not allowing frontend origin
**Solution**: Backend already configured to allow `http://localhost:3000`

### Issue 4: Request shows "pending" then fails
**Cause**: Backend not responding or timeout
**Solution**:
1. Check backend logs for errors
2. Check Supabase connection in backend
3. Verify Supabase credentials in `backend/.env`

### Issue 5: 400 Bad Request
**Cause**: Validation error or Supabase error
**Solution**: Check response body in Network tab for error details

## Debug Checklist

- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 3000
- [ ] `.env` file has correct `VITE_API_BASE_URL`
- [ ] Browser console shows API request logs
- [ ] Network tab shows POST request to `/auth/register`
- [ ] Password meets all requirements (8+ chars, upper, lower, number, special)
- [ ] No CORS errors in console
- [ ] Backend logs show incoming request

## Expected Success Flow

1. User fills form with valid data
2. Clicks Register
3. Console shows: "🔥 Register form submit triggered"
4. Console shows: "📤 API Request: POST /auth/register"
5. Network tab shows: POST request with 200 status
6. Console shows: "✅ Registration successful"
7. Success message appears
8. Success screen shows
9. Auto-redirects to login after 5 seconds

## Next Steps After Fix

Once Register works:
1. Check Supabase Auth dashboard for new user
2. Check email for confirmation link
3. Test login flow
4. Test OTP verification
