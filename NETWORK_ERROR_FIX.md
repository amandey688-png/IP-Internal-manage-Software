# Network Error Fix - Complete Guide

## Issues Fixed

### 1. **CORS Configuration** ✅
**Problem**: Backend CORS only allowed port 3000, but frontend is running on port 3001.

**Fix**: Updated `backend/app/main.py` to allow both ports:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`

### 2. **Network Error Handling** ✅
**Problem**: Generic "Network Error" message didn't help debug the issue.

**Fix**: 
- Added specific network error detection in `auth.ts`
- Shows helpful message: "Cannot connect to backend server. Please make sure the backend is running on http://127.0.0.1:8000"
- Better error logging in console

### 3. **Error Message Display** ✅
**Problem**: Network errors weren't clearly displayed to user.

**Fix**: Updated Register page to show network errors with longer duration (8 seconds) so user can read the message.

## Quick Fix Steps

### Step 1: Verify Backend is Running

Open a new terminal and run:
```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Step 2: Test Backend Health Endpoint

Open browser and go to:
```
http://127.0.0.1:8000/health
```

Should return:
```json
{"status": "ok"}
```

### Step 3: Test Backend from Frontend

Open browser console (F12) and run:
```javascript
fetch('http://127.0.0.1:8000/health')
  .then(r => r.json())
  .then(console.log)
```

Should return: `{status: "ok"}`

### Step 4: Restart Frontend

After updating CORS, restart the frontend:
```bash
cd fms-frontend
# Stop current server (Ctrl+C)
npm run dev
```

### Step 5: Try Register Again

1. Go to http://localhost:3001/register
2. Fill the form
3. Click Register
4. Check browser console for detailed logs

## Common Network Error Causes

### Cause 1: Backend Not Running
**Solution**: Start backend with command above

### Cause 2: Wrong Port
**Solution**: 
- Backend should be on port 8000
- Frontend can be on 3000 or 3001 (both are now allowed)

### Cause 3: CORS Blocked
**Solution**: Already fixed - CORS now allows port 3001

### Cause 4: Firewall/Antivirus
**Solution**: 
- Check if firewall is blocking port 8000
- Temporarily disable antivirus to test

### Cause 5: Wrong API URL
**Solution**: Check `.env` file has:
```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Debug Checklist

- [ ] Backend is running (check terminal)
- [ ] Backend responds to http://127.0.0.1:8000/health
- [ ] Frontend `.env` has correct `VITE_API_BASE_URL`
- [ ] Browser console shows API request logs
- [ ] Network tab shows request attempt
- [ ] No CORS errors in console
- [ ] Backend logs show incoming request

## Expected Behavior After Fix

1. User clicks Register
2. Console shows: "📤 API Request: POST /auth/register"
3. Network tab shows: POST request to `http://127.0.0.1:8000/auth/register`
4. **If backend is running**: Request succeeds, user registered
5. **If backend is NOT running**: Clear error message: "Network Error: Cannot connect to backend server..."

## Files Modified

1. ✅ `backend/app/main.py` - Added port 3001 to CORS
2. ✅ `fms-frontend/src/api/auth.ts` - Better network error handling
3. ✅ `fms-frontend/src/pages/auth/Register.tsx` - Better error display

## Next Steps

After fixing network error:
1. Verify backend is running
2. Try registration again
3. Check Supabase dashboard for new user
4. Check email for confirmation link
