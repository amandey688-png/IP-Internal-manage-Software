# Postmark Setup for Render – Step by Step

Use **Postmark HTTP API** on Render (SMTP is blocked). Same Server Token as your local SMTP.

---

## Step 1: Get Your Server Token

1. Log in to [Postmark](https://account.postmarkapp.com)
2. Open your **Server**
3. Go to **API Tokens**
4. Copy the **Server API token** (same as `SMTP_USER` in your local .env)

---

## Step 2: Set Variables on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service (e.g. `ip-internal-manage-software`)
3. Click **Environment** in the left sidebar
4. Add or edit:

| Variable | Value |
|----------|-------|
| `POSTMARK_SERVER_TOKEN` | Your Server API token |
| `SMTP_FROM_EMAIL` | `aman@industryprime.com` |
| `SMTP_POSTMARK_STREAM` | `outbound` |
| `CHECKLIST_CRON_SECRET` | `mysecret123` |

5. Click **Save** – Render will redeploy automatically.

---

## Step 3: Run Supabase Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Open **SQL Editor**
3. Run the contents of `database/USER_PROFILES_EMAIL_FOR_REMINDERS.sql`
4. Verify: `SELECT id, full_name, email FROM public.user_profiles LIMIT 5;`

---

## Step 4: Deploy Code

```powershell
cd "c:\Support FMS to APPLICATION"
git add .
git commit -m "fix: use Postmark API for emails on Render"
git push origin main
```

---

## Step 5: Test

1. (Optional) Clear today: `DELETE FROM checklist_reminder_sent WHERE reminder_date = CURRENT_DATE;`
2. Open in browser:
   ```
   https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=mysecret123&debug=1
   ```
3. You should see `{"sent": 1, ...}` and receive the email.

---

## Step 6: Schedule Daily Cron

1. Go to [cron-job.org](https://cron-job.org)
2. Create cronjob:
   - **URL**: `https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=mysecret123`
   - **Method**: **GET** (not POST – avoids 405)
   - **Headers**: `X-Cron-Secret` = `mysecret123` (optional when secret is in URL)
   - **Schedule**: e.g. 8:15 AM, Asia/Kolkata
3. Use **TEST RUN** to confirm.

---

## Summary

| Env | Method |
|-----|--------|
| **Localhost** | SMTP (your current .env) |
| **Render** | Postmark HTTP API (`POSTMARK_SERVER_TOKEN` + `SMTP_FROM_EMAIL`) |
