# Quick Diagnosis - Registration Issues

## Check These First

### 1. Is User Created in auth.users?

Run in Supabase SQL Editor:
```sql
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected**: Should see your registered user

**If empty**: Backend registration is failing - check backend logs

---

### 2. Is User Profile Created?

Run in Supabase SQL Editor:
```sql
SELECT id, full_name, role_id, is_active, created_at 
FROM public.user_profiles 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected**: Should see user profile with matching ID

**If empty**: Database trigger not working - run `FIX_ALL.sql`

---

### 3. Is Email Confirmation Enabled?

Go to **Supabase Dashboard** → **Authentication** → **Settings**

Check:
- ✅ **Enable email confirmations** is checked
- ✅ **Enable email signup** is checked

**If unchecked**: Enable them and save

---

### 4. Are Redirect URLs Configured?

Go to **Supabase Dashboard** → **Authentication** → **Settings** → **URL Configuration**

Check:
- **Site URL**: `http://localhost:3001`
- **Redirect URLs** includes:
  - `http://localhost:3001/confirmation-success`
  - `http://localhost:3001/auth/confirm`

**If missing**: Add them and save

---

### 5. Is Backend Using SERVICE_ROLE_KEY?

Check `backend/.env`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

**If missing**: Add SERVICE_ROLE_KEY from Supabase Dashboard → Settings → API

---

### 6. Check Auth Logs

Go to **Supabase Dashboard** → **Logs** → **Auth Logs**

Look for:
- Registration attempts
- Email sending status
- Errors

---

## Common Fixes

### Fix 1: User Created But No Profile

**Problem**: User in `auth.users` but not in `user_profiles`

**Solution**: Run `FIX_ALL.sql` to create triggers

---

### Fix 2: No Email Sent

**Problem**: User created but no confirmation email

**Solutions**:
1. Enable email confirmations in Auth settings
2. Check email template exists
3. Verify redirect URLs configured
4. Check spam folder

---

### Fix 3: Backend Errors

**Problem**: Registration fails with error

**Solutions**:
1. Check backend logs for detailed error
2. Verify SERVICE_ROLE_KEY is set
3. Check Supabase URL is correct
4. Verify network connectivity

---

## Step-by-Step Fix

1. ✅ Run `FIX_ALL.sql` in Supabase SQL Editor
2. ✅ Enable email confirmations in Supabase Auth settings
3. ✅ Configure redirect URLs
4. ✅ Add SERVICE_ROLE_KEY to `backend/.env`
5. ✅ Restart backend server
6. ✅ Test registration

---

## Still Not Working?

1. Check backend terminal for errors
2. Check browser console for errors
3. Check Supabase Auth Logs
4. Verify all environment variables are set
5. Test with a different email address
