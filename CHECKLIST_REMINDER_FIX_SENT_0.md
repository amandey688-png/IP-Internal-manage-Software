# Fix "Sent 0 reminder(s)" – Production Test Run

## Why Mail Does Not Send

`sent: 0` can mean one of these:

| Cause | Meaning |
|-------|---------|
| **no_email** | Doer has no email in `user_profiles.email` |
| **already_sent** | Reminder already sent today for that user |
| **by_user=0** | No tasks due today (frequency/date logic) |
| **send_failed** | SMTP/send failed (check Render env vars) |
| **tasks=0** | No checklist tasks in DB |

---

## Step 1: Run with Debug to Find the Cause

Call the endpoint with `?debug=1`:

```
https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=YOUR_SECRET&debug=1
```

Example response:
```json
{"sent":0,"message":"Sent 0 reminder(s) for 2026-02-12 | tasks=4 by_user=1 already_sent=0 no_email=1"}
```

Meaning:
- **no_email=1** → Doer has no email in `user_profiles`
- **already_sent=1** → Already sent today
- **by_user=0** → No tasks due today
- **send_failed=1** → SMTP failed

---

## Step 2: Fix Based on Debug

### If no_email=1

1. Open **Supabase** (production) → **SQL Editor**
2. Run:
   ```sql
   -- Run full migration (adds email column and backfills)
   -- Copy contents of: database/USER_PROFILES_EMAIL_FOR_REMINDERS.sql
   ```
   Or run this manually:
   ```sql
   ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
   UPDATE public.user_profiles up
   SET email = COALESCE(au.email, '')
   FROM auth.users au
   WHERE up.id = au.id;
   ```
3. Confirm:
   ```sql
   SELECT id, full_name, email FROM public.user_profiles;
   ```
   Ensure the doer (Aman) has a non-empty email.

### If already_sent=1

To retest on the same day:

```sql
DELETE FROM public.checklist_reminder_sent WHERE reminder_date = CURRENT_DATE;
```

Then run the reminder again.

### If send_failed=1

1. In **Render** → your service → **Environment**
2. Set:
   - `SMTP_HOST` = `smtp.postmarkapp.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = Postmark token
   - `SMTP_PASSWORD` = Postmark token
   - `SMTP_FROM_EMAIL` = verified sender email
3. Save and redeploy

### If by_user=0

- `start_date` must be on or before today
- Today must be an occurrence for the task’s `frequency` (D/W/M/etc.)
- 2026-02-12 is a Thursday; Sunday and India 2026 holidays are excluded

---

## Step 3: Test Production Endpoint

### From PowerShell

```powershell
Invoke-WebRequest -Uri "https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=MY_SECRET&debug=1" -Method GET -UseBasicParsing | Select-Object -ExpandProperty Content
```

Replace `MY_SECRET` with your `CHECKLIST_CRON_SECRET` value.

### From Browser

```
https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=MY_SECRET&debug=1
```

---

## Step 4: cron-job.org Test Run

1. Open **cron-job.org** → your checklist job
2. Set URL to:
   ```
   https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=MY_SECRET&debug=1
   ```
   (temporary, only for debugging)
3. Run **TEST RUN**
4. Use the response message to diagnose the issue

---

## Checklist

- [ ] `USER_PROFILES_EMAIL_FOR_REMINDERS.sql` run on **production** Supabase
- [ ] `user_profiles.email` has email for the doer
- [ ] SMTP vars set in Render environment
- [ ] `CHECKLIST_CRON_SECRET` set in Render and matches cron
- [ ] Cleared `checklist_reminder_sent` for today if retesting
- [ ] Tested with `?debug=1` and checked the message
