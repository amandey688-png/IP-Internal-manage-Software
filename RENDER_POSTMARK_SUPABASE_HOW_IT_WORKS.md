# How Postmark + Render + Supabase Work Together

## Flow Overview

```
cron-job.org (daily)
       ↓
   Render Backend  →  reads tasks & user emails from SUPABASE
       ↓
   Postmark HTTP API  →  sends email to user
       ↓
   User receives reminder email
```

---

## What Each Service Does

| Service | Role |
|---------|------|
| **Supabase** | Stores checklist tasks, user profiles (with email). Backend reads from Supabase DB. |
| **Render** | Hosts your backend. Runs the reminder logic, calls Postmark. |
| **Postmark** | Sends the actual email. Render calls Postmark's HTTP API (not SMTP – ports are blocked). |

---

## Add These Variables on Render

You already have `CHECKLIST_CRON_SECRET`. Add these for Postmark:

### Step 1: Click **Edit** (top right of Environment)

### Step 2: Add These Variables

| Key | Value |
|-----|-------|
| `POSTMARK_SERVER_TOKEN` | `025fddbf-90e2-43d5-a642-3fee36bb3acc` |
| `SMTP_FROM_EMAIL` | `aman@industryprime.com` |
| `SMTP_POSTMARK_STREAM` | `outbound` |

**Where to get the token:** [Postmark](https://account.postmarkapp.com) → your Server → API Tokens. Same token as `SMTP_USER` in your local `.env`.

### Step 3: Save

Render will redeploy. Wait 2–5 minutes.

---

## What Supabase Provides

- **Database:** `checklist_tasks`, `user_profiles`, `checklist_reminder_sent`
- **User emails:** After running `USER_PROFILES_EMAIL_FOR_REMINDERS.sql`, the `user_profiles.email` column has each user's email
- **Auth:** Supabase Auth for login; reminder uses `user_profiles` for email lookup

---

## What Postmark Does

- **Receives:** HTTP request from your backend with: To, From, Subject, HTML body
- **Sends:** Email to the recipient
- **No SMTP on Render:** Render blocks SMTP ports, so we use Postmark's **HTTP API** (https://api.postmarkapp.com/email) instead

---

## Supabase Custom SMTP (Separate)

Supabase can use its **own** SMTP for **auth emails** (signup, reset password). That is separate from checklist reminders.

- **Checklist reminders:** Your backend → Postmark API
- **Auth emails (Supabase):** Supabase → your SMTP (can be Postmark SMTP)

To use Postmark for Supabase auth:
- Supabase → Authentication → SMTP
- Host: `smtp.postmarkapp.com`, Port: 587
- Username: `apikey`, Password: your Postmark Server Token

---

## Quick Checklist

- [ ] `POSTMARK_SERVER_TOKEN` added on Render
- [ ] `SMTP_FROM_EMAIL` added on Render  
- [ ] `CHECKLIST_CRON_SECRET` set on Render
- [ ] `USER_PROFILES_EMAIL_FOR_REMINDERS.sql` run in Supabase
- [ ] Test: `.../checklist/send-daily-reminders?secret=mysecret123&debug=1`
