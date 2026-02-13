# Checklist Reminder – Step-by-Step: What to Do Now

Follow these steps in order. Check each box as you complete it.

---

## Step 1: Run Database Migration (Supabase Production)

Your production Supabase must have the `email` column in `user_profiles` so the reminder can find the doer's email.

### 1.1 Open Supabase
1. Go to **https://supabase.com/dashboard**
2. Log in and select your project (**FMS to APPLICATION**)
3. Confirm you are in **Production** (check the environment badge)

### 1.2 Open SQL Editor
1. In the left sidebar, click **SQL Editor**
2. Click **New query**

### 1.3 Run the migration
Copy and paste this entire block, then click **Run**:

```sql
-- Add email column to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Copy email from auth.users into user_profiles
UPDATE public.user_profiles up
SET email = COALESCE(au.email, '')
FROM auth.users au
WHERE up.id = au.id;
```

### 1.4 Verify
Run this query and confirm the doer (e.g. Aman) has an email:

```sql
SELECT id, full_name, email FROM public.user_profiles;
```

- If the `email` column is empty or NULL for Aman, the reminder will not send.
- Fix: Ensure Aman has an email in **Authentication → Users** in Supabase, then run the `UPDATE` query again.

---

## Step 2: Set Environment Variables on Render (Production)

The backend on Render must have the same variables as your local `.env`. Local `.env` does not affect production.

### 2.1 Open Render
1. Go to **https://dashboard.render.com**
2. Log in and select your backend service (**ip-internal-manage-software** or similar)

### 2.2 Go to Environment
1. In the left sidebar, click **Environment**
2. You will see a list of environment variables

### 2.3 Add or update these variables

Click **Add Environment Variable** for each of these (or **Edit** if they exist):

| Key | Value | Where to get it |
|-----|-------|-----------------|
| `CHECKLIST_CRON_SECRET` | `mysecret123` | Same value as in cron-job.org header |
| `SMTP_HOST` | `smtp.postmarkapp.com` | From your local .env |
| `SMTP_PORT` | `587` | From your local .env |
| `SMTP_USER` | `025fddbf-90e2-43d5-a642-3fee36bb3acc` | Postmark Server API token |
| `SMTP_PASSWORD` | `025fddbf-90e2-43d5-a642-3fee36bb3acc` | Same as SMTP_USER for Postmark |
| `SMTP_FROM_EMAIL` | `aman@industryprime.com` | Verified sender in Postmark |
| `SMTP_POSTMARK_STREAM` | `outbound` | Optional; from your local .env |

### 2.4 Save
1. After adding/editing, click **Save Changes**
2. Render will redeploy the service (wait a few minutes)

---

## Step 3: Clear Today’s Reminders (For Re-Testing)

If a reminder was already sent today, the backend will skip sending again. To test again on the same day:

### 3.1 Open Supabase SQL Editor
(Same as Step 1.1–1.2)

### 3.2 Run
```sql
DELETE FROM public.checklist_reminder_sent WHERE reminder_date = CURRENT_DATE;
```

This removes today’s “already sent” records so the reminder can run again.

---

## Step 4: Test with Debug (Find the Cause)

### 4.1 Open this URL in your browser
Replace `mysecret123` if your secret is different:

```
https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=mysecret123&debug=1
```

### 4.2 Read the response
You will see JSON like:

```json
{"sent":1,"message":"Sent 1 reminder(s) for 2026-02-12"}
```

Or if still 0:

```json
{"sent":0,"message":"Sent 0 reminder(s) for 2026-02-12 | tasks=4 by_user=1 already_sent=0 no_email=1"}
```

Interpret the debug message:

| Part | Meaning |
|------|---------|
| `tasks=4` | 4 checklist tasks in DB |
| `by_user=1` | 1 user has tasks due today |
| `already_sent=0` | No reminder sent yet today |
| `no_email=1` | That user has no email in `user_profiles` |
| `send_failed=1` | SMTP send failed (check Render env vars) |

### 4.3 If you see `no_email=1`
- Go back to **Step 1** and re-run the migration.
- Check **Authentication → Users** and ensure the user has an email.
- Run the `UPDATE` query again.

### 4.4 If you see `send_failed=1`
- Check **Step 2** and ensure all SMTP variables are set correctly on Render.
- Redeploy and test again.

---

## Step 5: Verify cron-job.org Settings

### 5.1 Open cron-job.org
1. Go to **https://console.cron-job.org**
2. Log in
3. Click **Cronjobs** and open **Daily Checklist Reminder**

### 5.2 Check COMMON tab
- **URL:**  
  `https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders`
- **Enable job:** ON
- **Execution schedule:** Daily at desired time (e.g. 8:15)
- **Time zone:** Asia/Kolkata

### 5.3 Check ADVANCED tab
- **Request method:** POST
- **Headers:** `X-Cron-Secret` = `mysecret123` (must match `CHECKLIST_CRON_SECRET` on Render)
- **Time zone:** Asia/Kolkata

### 5.4 Run Test Run
1. Click **TEST RUN**
2. You should get a 200 response and JSON like: `{"sent":1,"message":"..."}` or similar.
3. If you get 401, the secret does not match.
4. If you get 404, the backend may not be deployed or the URL is wrong.

---

## Step 6: Check Your Email Inbox

After a successful test:
1. Check the inbox of the doer (e.g. Aman).
2. Subject: **Checklist: Tasks due today**
3. Body should list the pending tasks.
4. Check **Spam** if you do not see it in the inbox.

---

## Quick Checklist

- [ ] Step 1: Ran migration in Supabase SQL Editor
- [ ] Step 1.4: `user_profiles` has emails for doers
- [ ] Step 2: All env vars set on Render (including SMTP and `CHECKLIST_CRON_SECRET`)
- [ ] Step 2.4: Render redeploy completed
- [ ] Step 3: Cleared `checklist_reminder_sent` for today (if retesting)
- [ ] Step 4: Test URL with `?debug=1` returns `sent: 1` or higher
- [ ] Step 5: cron-job.org headers and URL correct, Test Run succeeds
- [ ] Step 6: Email received in inbox (or spam)

---

## If It Still Fails

Run the debug URL again and share the full response, for example:

```
https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=mysecret123&debug=1
```

Example to share:
```json
{"sent":0,"message":"Sent 0 reminder(s) for 2026-02-12 | tasks=4 by_user=1 already_sent=0 no_email=1"}
```

That message is enough to identify the remaining issue.
