# Support Task Mail (Chores & Bug by Stage) – Setup, Test Locally, Push Live, Verify

This guide covers the **daily pending task email** for Support: **Chores & Bug** (and Feature) **by stage**, who receives it, how to set **9 AM daily**, and how to **setup**, **test locally**, **push live**, and **verify mail is received**.

---

## 1. What This Feature Does

- **Content:** One email per day with:
  - **Checklist** – pending tasks due today (with doer)
  - **Delegation** – pending tasks due today or overdue (with assignee)
  - **Support – Chores & Bug** – pending tickets **by stage** (Stage 1, 2, 3, 4) with assignee
  - **Support – Feature** – pending tickets by stage (Approval, Staging, Live, Live Review) with assignee

- **Who gets the mail:** Only **Level 1 & 2** users:
  - **Level 1:** Admin, Master Admin  
  - **Level 2:** Approver  

  There is no separate “section to click” to subscribe – **recipients are determined by role**. Any user with role **admin**, **master_admin**, or **approver** receives the digest (one email per user per day).

- **When:** You set the time (e.g. **9 AM**) by scheduling a **cron job** that calls the backend once per day.

- **Stage-wise:** Chores & Bug and Feature tickets are grouped by their current stage (e.g. “Stage 1”, “Stage 2”, “Stage 3”, “Stage 4” for Chores/Bug). Only **pending** tickets (not completed) are included.

---

## 2. Prerequisites

- Backend can send email (SMTP, Postmark, or SendGrid – see below).
- Database has:
  - `delegation_tasks` and `pending_reminder_sent` (run `database/DELEGATION_AND_PENDING_REMINDER.sql`).
  - `users_view` with email (from `auth.users`); Level 1 & 2 users must have a valid email in Auth.

---

## 3. Setup

### 3.1 Database (Supabase SQL Editor)

Run in this order if not already done:

```sql
-- Delegation & pending reminder tracking (creates pending_reminder_sent)
-- File: database/DELEGATION_AND_PENDING_REMINDER.sql
```

Optional (for checklist reminders; not required for Support task mail only):

- `database/CHECKLIST_MODULE.sql`
- `database/USER_PROFILES_EMAIL_FOR_REMINDERS.sql` (if you use checklist doer emails)

Verify:

```sql
SELECT * FROM public.pending_reminder_sent LIMIT 1;
SELECT au.email, r.name AS role
FROM auth.users au
JOIN public.user_profiles up ON up.id = au.id
JOIN public.roles r ON r.id = up.role_id
WHERE r.name IN ('admin', 'master_admin', 'approver');
```

Ensure at least one row has a non-empty **email** – those users will receive the Support task mail.

### 3.2 Backend environment variables

In `backend/.env` (local) and in your **production** env (e.g. Render):

**Required for sending mail (one of these):**

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | e.g. `smtp.postmarkapp.com` or `smtp.resend.com` |
| `SMTP_PORT` | `587` or `465` |
| `SMTP_USER` | Token/username (e.g. Postmark server token) |
| `SMTP_PASSWORD` | Password (often same as token for Postmark) |
| `SMTP_FROM_EMAIL` | Verified sender email |

**Or Postmark API:**

| Variable | Description |
|----------|-------------|
| `POSTMARK_SERVER_TOKEN` | Postmark server API token |
| `SMTP_FROM_EMAIL` | Sender email |
| `SMTP_HOST` | Can include `postmark` so code uses Postmark API |

**Or SendGrid:**

| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Sender email |

**Cron auth (required for the 9 AM trigger):**

| Variable | Description |
|----------|-------------|
| `PENDING_REMINDER_CRON_SECRET` | Secret for cron (e.g. a long random string) |
| or `CHECKLIST_CRON_SECRET` | Used as fallback if `PENDING_REMINDER_CRON_SECRET` is not set |

The daily job must send this secret in a header or query when calling the endpoint (see below).

---

## 4. Test Locally

### 4.1 Start backend

```powershell
cd backend
uvicorn app.main:app --reload --port 8000
```

Wait until you see the server running (e.g. `http://127.0.0.1:8000`).

### 4.2 (Optional) Allow re-sending today

By default each Level 1 & 2 user gets at most **one** digest per day. To test again the same day, in Supabase SQL Editor run:

```sql
DELETE FROM public.pending_reminder_sent WHERE reminder_date = CURRENT_DATE;
```

### 4.3 Call the pending digest endpoint

Use the same secret you set in `PENDING_REMINDER_CRON_SECRET` or `CHECKLIST_CRON_SECRET` (e.g. `mysecret123`).

**PowerShell (header):**

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/reminders/send-pending-digest" -Method POST -Headers @{"X-Cron-Secret"="mysecret123"} -UseBasicParsing | Select-Object -ExpandProperty Content
```

**PowerShell (query param, useful for cron services):**

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/reminders/send-pending-digest?secret=mysecret123" -Method GET -UseBasicParsing | Select-Object -ExpandProperty Content
```

Replace `mysecret123` with your actual secret and `8000` with your port if different.

### 4.4 Interpret response

- **Success:**  
  `{"sent": 2, "message": "Sent pending digest to 2 Level 1 & 2 user(s) for 2026-02-16"}`  
  → That many users were emailed.
- **No recipients:**  
  `{"sent": 0, "message": "No Level 1 & 2 users found"}`  
  → Fix roles: ensure at least one user has role admin, master_admin, or approver and has email in `auth.users`.
- **Sent 0 but “Level 1 & 2” exists:**  
  Either those users were already sent today (see 4.2) or they have no email in `users_view` (from `auth.users`).

### 4.5 Check inbox

Open the inbox of each Level 1 & 2 user. You should see an email:

- **Subject:** “Pending Task Reminder – Checklist, Delegation & Support”
- **Body:** Sections for Checklist, Delegation, **Support – Chores & Bug (by Stage, Assignee)**, and **Support – Feature (by Stage, Assignee)**.

If you have Chores/Bug tickets pending, they appear under “Support – Chores & Bug” grouped by stage.

---

## 5. Push Live

### 5.1 Deploy backend

Deploy your backend to your host (e.g. Render, Railway) as usual. Ensure the same env vars are set in production:

- SMTP or Postmark or SendGrid (as above)
- `PENDING_REMINDER_CRON_SECRET` or `CHECKLIST_CRON_SECRET`

### 5.2 Schedule 9 AM daily (cron)

Use any cron service that can do HTTP requests daily at 9 AM in your timezone.

**Example: cron-job.org**

1. Log in at [cron-job.org](https://www.cron-job.org).
2. Create a new cron job.
3. **URL:**  
   `https://YOUR-BACKEND-URL/reminders/send-pending-digest`  
   (e.g. `https://ip-internal-manage-software.onrender.com/reminders/send-pending-digest`)
4. **Schedule:** Every day at **9:00 AM** (choose your timezone, e.g. Asia/Kolkata).
5. **Request method:** POST or GET (both work).
6. **Authentication:**
   - **Option A – Header:** In “Advanced” / “Headers”, add:  
     `X-Cron-Secret` = `YOUR_PENDING_REMINDER_CRON_SECRET`
   - **Option B – Query:** Use URL:  
     `https://YOUR-BACKEND-URL/reminders/send-pending-digest?secret=YOUR_SECRET`
7. Save and run **TEST RUN** once. Expect HTTP 200 and JSON like `{"sent": ..., "message": "..."}`.

**If your host (e.g. Render) is asleep:** The first request after idle can take ~30 seconds; cron-job.org may need a long timeout.

---

## 6. Verify Mail Received (Production)

### 6.1 From the API response

- After a **TEST RUN** or the next 9 AM run, check the response body:  
  `{"sent": N, "message": "Sent pending digest to N Level 1 & 2 user(s) for YYYY-MM-DD"}`  
  If `N >= 1`, the backend attempted to send N emails.

### 6.2 In the inbox

- Log in to the email account of each Level 1 & 2 user (admin, master_admin, approver).
- Look for: **Subject** “Pending Task Reminder – Checklist, Delegation & Support” and **date** matching the run date.
- **Spam:** If not in Inbox, check Spam/Junk and mark “Not spam” so future mails land in Inbox.

### 6.3 Content check

- Open the email and confirm:
  - **Support – Chores & Bug (by Stage, Assignee)** lists your pending Chores/Bug tickets by stage (Stage 1, 2, 3, 4).
  - **Support – Feature (by Stage, Assignee)** lists pending Feature tickets by stage.
  - Assignee names appear next to each ticket.

### 6.4 If no mail is received

| Check | Action |
|-------|--------|
| Response `sent: 0` | Ensure at least one user has role admin/master_admin/approver and email in Auth; run the SQL in 3.1 to verify. |
| Response `sent: 1` but no email | Check spam; verify SMTP/Postmark/SendGrid env vars in production; check provider dashboard for bounces or errors. |
| 401 on cron | Secret mismatch: cron must send the same value as `PENDING_REMINDER_CRON_SECRET` or `CHECKLIST_CRON_SECRET`. |
| 404 on cron | Wrong URL or backend not deployed; use exact path `/reminders/send-pending-digest`. |

---

## 7. Quick Reference

| What | Where |
|------|--------|
| Endpoint | `GET` or `POST` `/reminders/send-pending-digest` |
| Auth | Header `X-Cron-Secret: <secret>` or query `?secret=<secret>` |
| Recipients | All users with role **admin**, **master_admin**, or **approver** (Level 1 & 2) |
| Content | Checklist + Delegation + **Chores & Bug by stage** + Feature by stage |
| Frequency | Once per day (you set 9 AM via cron) |
| One email per user per day | Tracked in `pending_reminder_sent` |

---

## 8. Related files

- **Backend:** `backend/app/main.py` – `send_pending_digest`, `_send_pending_digest_email`, `_get_level1_level2_user_ids`
- **Stage logic:** `backend/app/reminder_utils.py` – `get_chores_bugs_stage`, `is_chores_bug_pending`, `get_staging_feature_stage`, `is_feature_pending`
- **DB:** `database/DELEGATION_AND_PENDING_REMINDER.sql` (creates `pending_reminder_sent`)
- **More detail:** `PENDING_REMINDER_TEST_STEPS.md` (checklist + pending digest steps and troubleshooting)
