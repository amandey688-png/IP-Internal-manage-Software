# Supabase Email Confirmation Setup Guide

## Problem
No confirmation email is being received after registration.

## Solution: Enable Email Confirmation in Supabase

### Step 1: Enable Email Confirmation

1. Go to **Supabase Dashboard**
2. Click **Authentication** → **Settings**
3. Scroll to **Email Auth** section
4. Ensure these are checked:
   - ✅ **Enable email signup**
   - ✅ **Enable email confirmations**
   - ✅ **Secure email change** (optional but recommended)

### Step 2: Configure Email Redirect URLs

1. Still in **Authentication** → **Settings**
2. Scroll to **URL Configuration**
3. Set:
   - **Site URL**: `http://localhost:3001`
4. Under **Redirect URLs**, add:
   ```
   http://localhost:3001/confirmation-success
   http://localhost:3001/auth/confirm
   http://127.0.0.1:3001/confirmation-success
   http://127.0.0.1:3001/auth/confirm
   ```
5. Click **Save**

### Step 3: Check Email Templates

1. Go to **Authentication** → **Email Templates**
2. Click on **Confirm signup** template
3. Verify it's enabled and has content
4. The default template should include:
   - Subject: "Confirm Your Signup"
   - Body with confirmation link

### Step 4: Test Email Delivery

1. Go to **Authentication** → **Users**
2. Try registering a new user
3. Check **Logs** → **Auth Logs** to see if email was sent
4. Check spam folder if email doesn't arrive

### Step 5: Verify SMTP Settings (If Using Custom SMTP)

If you're using custom SMTP:
1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Verify SMTP configuration is correct
3. Test SMTP connection

---

## Common Issues

### Issue 1: Email Confirmation Disabled
**Symptom**: Users created but no email sent
**Fix**: Enable "Enable email confirmations" in Auth settings

### Issue 2: Wrong Redirect URL
**Symptom**: Email sent but link doesn't work
**Fix**: Add correct redirect URLs in URL Configuration

### Issue 3: Email in Spam
**Symptom**: Email sent but not received
**Fix**: Check spam folder, whitelist Supabase email domain

### Issue 4: SMTP Not Configured
**Symptom**: Email sending fails
**Fix**: Use Supabase's default email service or configure custom SMTP

---

## Verification Checklist

- [ ] Email confirmations enabled in Auth settings
- [ ] Redirect URLs configured correctly
- [ ] Email template exists and is enabled
- [ ] Site URL matches frontend URL
- [ ] Backend uses SERVICE_ROLE_KEY (not ANON_KEY)
- [ ] User appears in `auth.users` table
- [ ] User profile created in `user_profiles` table

---

## Quick Test

After setup, test registration:

1. Register a new user via frontend
2. Check `auth.users` table - should see new user
3. Check `user_profiles` table - should see new profile
4. Check email inbox (and spam)
5. Click confirmation link
6. Should redirect to confirmation success page

---

## Backend Requirements

Make sure backend uses `SERVICE_ROLE_KEY` (not `ANON_KEY`) for:
- User creation
- Email sending
- Admin operations

Update `backend/.env`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```
