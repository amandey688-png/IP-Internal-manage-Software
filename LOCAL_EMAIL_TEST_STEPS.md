# Test Email Sending on Local Server

Step-by-step guide to test checklist reminder emails locally before deploying.

---

## Step 1: Run Supabase Migration (one-time)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Open **SQL Editor** → **New query**
3. Open `database/USER_PROFILES_EMAIL_FOR_REMINDERS.sql` in your project
4. Copy all contents → paste into Supabase SQL Editor → **Run**
5. Verify:
```sql
SELECT id, full_name, email FROM public.user_profiles LIMIT 5;
```
   Ensure `email` column exists and has values.

---

## Step 2: Check Local .env

Your `backend/.env` should have:

| Variable | Example value |
|----------|---------------|
| `SMTP_HOST` | `smtp.postmarkapp.com` |
| `SMTP_USER` | Your Postmark Server Token |
| `SMTP_PASSWORD` | Same as SMTP_USER |
| `SMTP_FROM_EMAIL` | `aman@industryprime.com` |
| `SMTP_POSTMARK_STREAM` | `outbound` |
| `CHECKLIST_CRON_SECRET` | `mysecret123` |

---

## Step 3: Start the Backend (REQUIRED – keep this terminal open)

**Open a new PowerShell/terminal** and run:

```powershell
cd "c:\Support FMS to APPLICATION\backend"
uvicorn app.main:app --reload --port 8000
```

**Leave this running.** Wait until you see: `Uvicorn running on http://127.0.0.1:8000`

**Then** open a second terminal for Step 6 (the `Invoke-WebRequest` command).  
If you see "Unable to connect", the backend is not running—go back to Step 3.

---

## Step 4: Ensure You Have a Task Due Today

In Supabase, check checklist tasks:

```sql
-- See tasks and their doers
SELECT id, task_name, doer_id, start_date, frequency FROM public.checklist_tasks;

-- See user emails (doer must have email)
SELECT id, full_name, email FROM public.user_profiles;
```

- At least one task must have `start_date` on or before today
- The task's `doer_id` must match a user in `user_profiles` who has an `email`
- The task must not be completed for today (no row in `checklist_completions` for today)

---

## Step 5: Clear Today's Reminders (for re-testing)

If you already ran the reminder today, clear it to test again:

```sql
DELETE FROM public.checklist_reminder_sent WHERE reminder_date = CURRENT_DATE;
```

---

## Step 6: Trigger the Reminder

**Option A – Browser**

Open:
```
http://127.0.0.1:8000/checklist/send-daily-reminders?secret=mysecret123&debug=1
```

**Option B – PowerShell**

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/checklist/send-daily-reminders?secret=mysecret123&debug=1" -Method GET -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## Step 7: Check the Result

**Expected response:**
```json
{"sent": 1, "message": "Sent 1 reminder(s) for 2026-02-XX | ..."}
```

**Check inbox:** The user assigned to the task should receive the reminder email.

---

## If You Get `sent: 0`

Add `?debug=1` to the URL. The message will show:
- `tasks=0` → No checklist tasks in DB
- `by_user=0` → No tasks due today, or all completed
- `already_sent=1` → Run Step 5 (delete from checklist_reminder_sent)
- `no_email=1` → User has no email in `user_profiles` (run migration or add email in auth)

---

## Quick Checklist

- [ ] Migration `USER_PROFILES_EMAIL_FOR_REMINDERS.sql` run in Supabase
- [ ] `user_profiles` has email for the task doer
- [ ] At least one task due today with a valid doer
- [ ] Backend running on port 8000
- [ ] Call `http://127.0.0.1:8000/checklist/send-daily-reminders?secret=mysecret123&debug=1`
- [ ] Email received in inbox
