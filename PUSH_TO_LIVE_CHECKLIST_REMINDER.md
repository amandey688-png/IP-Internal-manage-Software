# Push to Live – Daily Checklist Reminder

## How It Works (Automatic & Daily)

- **Runs daily** via cron (e.g. 8:15 AM Asia/Kolkata).
- **For all users** who have checklist tasks due that day.
- **Per user**: one email listing their pending tasks.
- **Once per day** per user: `checklist_reminder_sent` prevents duplicates.

---

## Step 1: Run Database Migrations (Supabase)

In **Supabase** → **SQL Editor**, run these **in order**:

1. `database/USER_PROFILES_EMAIL_FOR_REMINDERS.sql` (adds email to user_profiles)
2. `database/CHECKLIST_MODULE.sql` (if not already done)
3. `database/CHECKLIST_MODULE_RLS.sql` (if not already done)

Verify:

```sql
SELECT id, full_name, email FROM public.user_profiles LIMIT 5;
```

---

## Step 2: Push Code to GitHub

```powershell
cd "c:\Support FMS to APPLICATION"
git add .
git commit -m "Checklist reminder with user_profiles email"
git push origin main
```

---

## Step 3: Set Environment Variables on Render

In **Render** → your backend service → **Environment**:

| Variable | Value |
|----------|-------|
| `CHECKLIST_CRON_SECRET` | e.g. `mysecret123` (same value you'll use in cron) |
| `SMTP_HOST` | `smtp.postmarkapp.com` (or your SMTP) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Postmark server token |
| `SMTP_PASSWORD` | Same as SMTP_USER for Postmark |
| `SMTP_FROM_EMAIL` | e.g. `aman@industryprime.com` |
| `SMTP_POSTMARK_STREAM` | `outbound` (optional) |

Save and **redeploy** the backend.

---

## Step 4: Set Up Daily Cron (cron-job.org)

1. Go to [cron-job.org](https://cron-job.org) and log in.
2. **Cronjobs** → **Create cronjob**.
3. **COMMON** tab:
   - **Title**: Daily Checklist Reminder
   - **URL**: `https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders`
   - **Enable job**: ON
4. **Execution schedule**: "Every day at 8 : 15" (or your preferred time).
5. **Time zone**: Asia/Kolkata.
6. **ADVANCED** tab:
   - **Request method**: POST (or GET)
   - **Headers** → Add:
     - Key: `X-Cron-Secret`
     - Value: `mysecret123` (must match `CHECKLIST_CRON_SECRET` on Render)
7. Click **CREATE**.
8. Click **TEST RUN** – you should get `{"sent": N, "message": "..."}`.

---

## Step 5: Verify Live

1. **Test URL** (in browser or PowerShell):
   ```
   https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=mysecret123
   ```
   Expected: JSON with `sent` and `message`.

2. **With debug**:
   ```
   https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=mysecret123&debug=1
   ```
   Shows `tasks`, `by_user`, `already_sent` when `sent` is 0.

3. **Check inbox** – users with tasks due today should receive the reminder.

---

## Summary Checklist

- [ ] Supabase: `USER_PROFILES_EMAIL_FOR_REMINDERS.sql` run
- [ ] Supabase: `user_profiles.email` populated for doers
- [ ] GitHub: latest code pushed
- [ ] Render: env vars set (SMTP, `CHECKLIST_CRON_SECRET`)
- [ ] Render: backend redeployed
- [ ] cron-job.org: job created, schedule & timezone set
- [ ] cron-job.org: header `X-Cron-Secret` set
- [ ] Test Run on cron-job.org succeeds

---

## Optional: Pending Digest (Level 1 & 2)

To also send the daily pending digest to admins/approvers, create a second cron job:

- **URL**: `https://ip-internal-manage-software.onrender.com/reminders/send-pending-digest`
- **Schedule**: e.g. 8:30 AM (after checklist)
- **Same header**: `X-Cron-Secret: mysecret123`
