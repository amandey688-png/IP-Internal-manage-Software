# Pending Task Reminder – Check & Test Steps

**Support task mail (Chores & Bug by stage, 9 AM daily):** For a single guide on setup, local test, push live, and verifying mail, see **`SUPPORT_TASK_MAIL_SETUP_AND_TEST.md`**.

## Overview

Two reminder systems:

1. **Checklist daily reminder** (`/checklist/send-daily-reminders`) – Sends to **doers** with pending checklist tasks due today.
2. **Pending digest** (`/reminders/send-pending-digest`) – Sends to **Level 1 & 2** (Admin, Approver) only. Content:
   - Checklist & Delegation pending tasks
   - Support – Chores & Bug by stage (with assignee)
   - Support – Feature by stage (with assignee)

---

## 1. Database Setup

Run in **Supabase SQL Editor** (in order):

```sql
-- If checklist tables don't exist:
-- Run database/CHECKLIST_MODULE.sql
-- Run database/CHECKLIST_MODULE_RLS.sql

-- Delegation & pending reminder tracking:
-- Run database/DELEGATION_AND_PENDING_REMINDER.sql
```

Verify:

```sql
SELECT * FROM public.delegation_tasks LIMIT 1;
SELECT * FROM public.pending_reminder_sent LIMIT 1;
```

---

## 2. Environment Variables (Backend)

In `backend/.env` and **Render** dashboard:

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | e.g. `smtp.postmarkapp.com` |
| `SMTP_PORT` | `587` or `465` |
| `SMTP_USER` | Postmark token |
| `SMTP_PASSWORD` | Same as SMTP_USER for Postmark |
| `SMTP_FROM_EMAIL` | Verified sender email |
| `SMTP_POSTMARK_STREAM` | `outbound` (optional) |
| `CHECKLIST_CRON_SECRET` | Secret for cron (e.g. `mysecret123`) |
| `PENDING_REMINDER_CRON_SECRET` | Optional; falls back to `CHECKLIST_CRON_SECRET` |

---

## 3. Verify Level 1 & 2 Users

Level 1 = Admin, Master Admin. Level 2 = Approver. These receive the pending digest.

```sql
SELECT au.email, r.name AS role
FROM auth.users au
JOIN public.user_profiles up ON up.id = au.id
JOIN public.roles r ON r.id = up.role_id
WHERE r.name IN ('admin', 'master_admin', 'approver');
```

Ensure at least one user has email and role admin/master_admin/approver.

---

## 4. Test Checklist Daily Reminder (Doers) – Step-by-Step

### Prerequisites

- Backend running (local or deployed)
- At least one checklist task due today, with a doer who has a valid email
- `CHECKLIST_CRON_SECRET` in `.env` (e.g. `mysecret123`)

### Step 4.1: Ensure you have a task due today

1. Log in to the app.
2. Go to **Task → Checklist**.
3. Create a task with **Frequency** = Daily (or today’s date for other frequencies).
4. Note the **Doer** (your user) must have an email in `auth.users`.

### Step 4.2: Start the backend (if testing locally)

1. Open a terminal in the project root.
2. Run: `cd backend` then `uvicorn app.main:app --reload --port 8000`
3. Wait until you see "Uvicorn running on http://127.0.0.1:8000".

### Step 4.3: Clear previous reminder (optional, for re-testing)

In Supabase SQL Editor:

```sql
DELETE FROM public.checklist_reminder_sent WHERE reminder_date = CURRENT_DATE;
```

### Step 4.4: Run the reminder (Local backend)

1. Open **PowerShell** or **Command Prompt**.
2. Run:

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/checklist/send-daily-reminders" -Method POST -Headers @{"X-Cron-Secret"="mysecret123"} -UseBasicParsing | Select-Object -ExpandProperty Content
```

3. Replace `mysecret123` with your actual `CHECKLIST_CRON_SECRET` if different.
4. If backend uses another port (e.g. 8080), change `8000` accordingly.

### Step 4.5: Interpret the response

- **Success**: `{"sent": 1, "message": "Sent 1 reminder(s) for 2026-02-12"}`
- **No emails sent**: `{"sent": 0, "message": "Sent 0 reminder(s) for ..."}`
  - Add `?debug=1` to see why:  
    `.../send-daily-reminders?debug=1`  
  - Message will include `tasks=N by_user=N already_sent=N`

### Step 4.6: Test via GET (for cron services)

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/checklist/send-daily-reminders?secret=mysecret123" -Method GET -UseBasicParsing | Select-Object -ExpandProperty Content
```

### Step 4.7: Test on production (Render)

1. Replace URL:  
   `https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders`
2. If Render was sleeping, the first call can take ~30 seconds.

---

## 5. Test Pending Digest (Level 1 & 2) – Step-by-Step

### Prerequisites

- At least one user with role admin, master_admin, or approver
- That user has a valid email in `auth.users`

### Step 5.1: Verify Level 1 & 2 users

In Supabase SQL Editor:

```sql
SELECT au.email, r.name AS role
FROM auth.users au
JOIN public.user_profiles up ON up.id = au.id
JOIN public.roles r ON r.id = up.role_id
WHERE r.name IN ('admin', 'master_admin', 'approver');
```

Ensure the result has at least one row with a non-empty email.

### Step 5.2: Clear previous digest (for re-testing)

```sql
DELETE FROM public.pending_reminder_sent WHERE reminder_date = CURRENT_DATE;
```

### Step 5.3: Run the pending digest (Local)

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/reminders/send-pending-digest" -Method POST -Headers @{"X-Cron-Secret"="mysecret123"} -UseBasicParsing | Select-Object -ExpandProperty Content
```

### Step 5.4: Interpret the response

- **Success**: `{"sent": 2, "message": "Sent pending digest to 2 Level 1 & 2 user(s) for 2026-02-12"}`
- **No recipients**: `{"sent": 0, "message": "No Level 1 & 2 users found"}` – fix roles (see Step 5.1)

### Step 5.5: Check your inbox

Check the email inbox of each Level 1 & 2 user for the digest email. It should list Checklist, Delegation, Chores & Bug, and Feature sections with stage and assignee for each item.

---

## 6. Test Delegation – Step-by-Step

### Step 6.1: Run database migration

In Supabase SQL Editor, run `database/DELEGATION_AND_PENDING_REMINDER.sql` if not already done.

### Step 6.2: Log in as Admin or Approver

Use a Level 1 or 2 account (admin, master_admin, or approver).

### Step 6.3: Open Delegation page

1. Go to **Task → Delegation** in the sidebar.

### Step 6.4: Create a delegation task

1. Click **Add Task**.
2. Fill in:
   - **Title**: e.g. "Review Q4 report"
   - **Assignee**: select a user from the dropdown
   - **Due Date**: pick today or a past date
3. Click **Create**.

### Step 6.5: Verify in the list

- The new task appears in the table with Status = Pending.
- Columns: Title, Assignee, Due Date, Status.

### Step 6.6: Verify in the pending digest

1. Clear today’s digest:  
   `DELETE FROM public.pending_reminder_sent WHERE reminder_date = CURRENT_DATE;`
2. Run the pending digest (see Section 5.3).
3. Open the digest email for a Level 1/2 user.
4. Under **Delegation (pending, due today or overdue)**, confirm your task is listed.

---

## 7. Cron Job Setup (cron-job.org) – Step-by-Step

### Job 1: Checklist Reminder

1. Go to [cron-job.org](https://cron-job.org) and log in.
2. Click **Cronjobs** → **Create cronjob**.
3. **COMMON** tab:
   - **Title**: e.g. "Daily Checklist Reminder"
   - **URL**: `https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders`
   - **Enable job**: ON
4. **Execution schedule**: e.g. "Every day at 8:15" (Asia/Kolkata).
5. **ADVANCED** tab:
   - **Headers**: Add `X-Cron-Secret` = `mysecret123`
   - **Request method**: POST (or GET; both work)
6. Click **CREATE**.
7. Click **TEST RUN** – expect 200 OK and a JSON response like `{"sent": ...}`.

### Job 2: Pending Digest

1. Create another cronjob.
2. **COMMON**:
   - **Title**: e.g. "Pending Digest Level 1 & 2"
   - **URL**: `https://ip-internal-manage-software.onrender.com/reminders/send-pending-digest`
   - **Enable job**: ON
3. **Schedule**: e.g. "Every day at 8:30" (after checklist reminder).
4. **ADVANCED**:
   - **Headers**: `X-Cron-Secret` = `mysecret123`
   - **Request method**: POST or GET
5. Click **CREATE** and run **TEST RUN**.

---

## 8. Quick Verification Checklist

- [ ] Database: `delegation_tasks` and `pending_reminder_sent` exist
- [ ] At least one Level 1 or 2 user with valid email
- [ ] SMTP vars set (or Resend) for emails
- [ ] `CHECKLIST_CRON_SECRET` set and matches cron config
- [ ] Checklist reminder returns `{"sent": ...}`
- [ ] Pending digest returns `{"sent": ...}` (only for Level 1 & 2 users)
- [ ] Delegation page: create task, see in list
- [ ] cron-job.org: Test Run succeeds (no 404)

---

## 9. Troubleshooting

| Issue | Fix |
|-------|-----|
| `Sent 0 reminder(s)` | Check: tasks due today, doers have email, `checklist_reminder_sent` not already sent today |
| `No Level 1 & 2 users found` | Ensure `user_profiles.role_id` points to admin/approver role |
| 404 on cron test | Deploy latest code; use GET + `?secret=...`; wait 30s if Render was sleeping |
| `Table delegation_tasks does not exist` | Run `database/DELEGATION_AND_PENDING_REMINDER.sql` |
| Emails not received | Check SMTP/Resend config; check spam; verify sender domain |
