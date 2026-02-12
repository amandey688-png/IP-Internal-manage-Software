# Checklist Reminder: Fix "Sent 0" and Deploy to Live

## What Was Fixed

**Problem:** API returns `sent: 0` even when `tasks=4 by_user=1 already_sent=0` — emails never arrive.

**Root cause:** `user_profiles.email` may be empty if:
- Migration `USER_PROFILES_EMAIL_FOR_REMINDERS.sql` was never run in production
- Or backfill did not complete

**Fix applied:** Auth fallback — when `user_profiles` has no email for a doer, we now fetch it from Supabase `auth.admin.list_users()`. Reminders will work even without the migration (but running the migration is still recommended).

---

## Step 1: Run Migration in Production Supabase

1. Open **Supabase** → **SQL Editor**
2. Open and run **entire** file: `database/USER_PROFILES_EMAIL_FOR_REMINDERS.sql`

3. Verify:
```sql
SELECT id, full_name, email FROM public.user_profiles LIMIT 10;
```
Ensure `email` column exists and is populated for users who have checklist tasks.

---

## Step 2: Set Environment Variables on Render

1. Go to **Render** → your backend service **ip-internal-manage-software** → **Environment**
2. Add or update:

| Variable | Value |
|----------|-------|
| `CHECKLIST_CRON_SECRET` | `mysecret123` (same as cron) |
| `SMTP_HOST` | `smtp.postmarkapp.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Postmark server token |
| `SMTP_PASSWORD` | Same as SMTP_USER |
| `SMTP_FROM_EMAIL` | e.g. `aman@industryprime.com` |
| `SMTP_POSTMARK_STREAM` | `outbound` (optional) |

3. **Save** → Render will auto-redeploy.

---

## Step 3: Deploy Latest Code to Render

1. Commit and push the latest code (includes auth fallback fix):

```powershell
cd "c:\Support FMS to APPLICATION"
git add .
git commit -m "fix: checklist reminder auth fallback when user_profiles email is empty"
git push origin main
```

2. If Render is connected to GitHub, it will auto-deploy. Otherwise, go to Render → **Manual Deploy** → **Deploy latest commit**.

3. Wait for deployment to finish (check **Logs**).

---

## Step 4: Test the Endpoint

### Clear today's reminders (optional, for re-testing)

In Supabase SQL Editor:
```sql
DELETE FROM public.checklist_reminder_sent WHERE reminder_date = CURRENT_DATE;
```

### Call the API

In browser or PowerShell:
```
https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=mysecret123&debug=1
```

**Expected:** `{"sent": 1, "message": "Sent 1 reminder(s) for 2026-02-12 | ..."}`

**If still sent=0**, check the debug message:
- `no_email=1` → User has no email in auth; add email in Supabase Auth → Users
- `send_failed=1` → SMTP error; verify Render env vars and Postmark setup
- `already_sent=1` → Normal; reminders were sent earlier today

---

## Step 5: Cron Job (cron-job.org)

1. Go to [cron-job.org](https://cron-job.org)
2. **Create cronjob**:
   - **URL**: `https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders`
   - **Method**: POST or GET
   - **Headers**: `X-Cron-Secret` = `mysecret123`
   - **Schedule**: Every day at 8:15 AM, Timezone: Asia/Kolkata

3. Use **TEST RUN** to verify.

---

## Checklist

- [ ] `USER_PROFILES_EMAIL_FOR_REMINDERS.sql` run in production Supabase
- [ ] Render env vars set (SMTP + CHECKLIST_CRON_SECRET)
- [ ] Latest code pushed and deployed on Render
- [ ] Test URL with `?secret=mysecret123&debug=1` returns sent ≥ 1 (when tasks exist)
- [ ] cron-job.org configured and tested
