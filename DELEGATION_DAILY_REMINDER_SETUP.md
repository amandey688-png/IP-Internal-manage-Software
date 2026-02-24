# Delegation Daily Reminder Email – Setup Guide

Same pattern as **Checklist Mail**. When a delegation task is **pending** or **in progress** and **due today or overdue**, the assignee receives **one reminder email** per day. At most one email per user per day (even if they have multiple tasks).

---

## Step 1: Database migration

Run in **Supabase SQL Editor**:

```sql
-- File: database/DELEGATION_REMINDER_SENT.sql
```

This creates the `delegation_reminder_sent` table to track sent reminders (one per assignee per day).

---

## Step 2: Email configuration (same as Checklist)

Use the same SMTP or Resend settings as for Checklist reminders.

### Option A: SMTP

```env
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASSWORD=your_password
SMTP_FROM_EMAIL=noreply@yourdomain.com
CHECKLIST_CRON_SECRET=your_random_secret_here
```

### Option B: Resend API

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
CHECKLIST_CRON_SECRET=your_random_secret_here
```

**Note:** Delegation reminders use `CHECKLIST_CRON_SECRET` by default. Optionally set `DELEGATION_CRON_SECRET` for a separate secret.

---

## Step 3: User emails

Assignees must have a valid email in `user_profiles.email` or `auth.users.email` (same as Checklist doers). The backend looks up both.

---

## Step 4: Cron job

Call `POST /delegation/send-daily-reminders` once per day (e.g. 8:00 AM or 9:00 AM).

### cron-job.org

1. Add a new cron job
2. **URL:** `https://your-backend.onrender.com/delegation/send-daily-reminders`
3. **Method:** POST (or GET)
4. **Header:** `X-Cron-Secret: YOUR_CHECKLIST_CRON_SECRET`
5. **Schedule:** Daily at desired time

### Using the same secret as Checklist

If you already have a cron for `/checklist/send-daily-reminders`, add a second cron job for `/delegation/send-daily-reminders` with the same secret. You can run both at the same time (e.g. 8:00 AM) or at different times.

---

## Step 5: Manual test

**As Admin (logged in):**

```bash
curl -X POST https://your-backend.onrender.com/delegation/send-daily-reminders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**With cron secret (no login):**

```bash
curl -X POST https://your-backend.onrender.com/delegation/send-daily-reminders \
  -H "X-Cron-Secret: YOUR_CHECKLIST_CRON_SECRET"
```

Or with query param:

```bash
curl -X GET "https://your-backend.onrender.com/delegation/send-daily-reminders?secret=YOUR_SECRET"
```

Response:

```json
{"status": "started", "message": "Delegation reminder job started. Check server logs for result."}
```

The actual send runs in the background. Check server logs for lines like:

```
Delegation reminder sent to user@example.com
Delegation reminder background: sent 2 for 2026-01-XX
```

---

## Re-testing the same day

By default each assignee gets at most one reminder per day. To test again the same day, run in Supabase SQL Editor:

```sql
DELETE FROM public.delegation_reminder_sent WHERE reminder_date = CURRENT_DATE;
```

---

## Checklist

- [ ] Ran `database/DELEGATION_REMINDER_SENT.sql` in Supabase
- [ ] SMTP or Resend configured in backend `.env`
- [ ] `CHECKLIST_CRON_SECRET` (or `DELEGATION_CRON_SECRET`) set
- [ ] Assignees have email in `user_profiles` or `auth.users`
- [ ] Cron job calls `/delegation/send-daily-reminders` daily
- [ ] Tested with manual call

---

## Comparison

| Feature | Checklist Mail | Delegation Mail |
|---------|----------------|-----------------|
| Endpoint | `/checklist/send-daily-reminders` | `/delegation/send-daily-reminders` |
| Recipients | Checklist doers (tasks due today) | Delegation assignees (tasks pending/overdue) |
| Subject | "Checklist: Tasks due today" | "Delegation: Pending tasks due" |
| Tracking table | `checklist_reminder_sent` | `delegation_reminder_sent` |
| Cron secret | `CHECKLIST_CRON_SECRET` | `DELEGATION_CRON_SECRET` or `CHECKLIST_CRON_SECRET` |
