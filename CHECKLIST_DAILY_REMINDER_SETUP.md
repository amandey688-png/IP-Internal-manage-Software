# Checklist Daily Reminder Email – Setup Guide

When a checklist task is due **today**, the assigned user receives **one reminder email** per day. The system sends at most one email per user per day (even if they have multiple tasks due).

---

## Step 1: Choose email method

### Option A: SMTP (same as Supabase Custom SMTP) – recommended

Use the same SMTP credentials you configured in Supabase for auth emails.

1. Open **Supabase Dashboard** → **Project Settings** → **Authentication** → **SMTP**
2. Copy your SMTP settings
3. Add to backend `.env`:

```env
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASSWORD=your_password
SMTP_FROM_EMAIL=noreply@yourdomain.com
CHECKLIST_CRON_SECRET=your_random_secret_here
```

**Common providers:**

| Provider  | Host                   | Port |
|----------|------------------------|------|
| Resend   | smtp.resend.com        | 465 or 587 |
| SendGrid | smtp.sendgrid.net      | 587 |
| Brevo    | smtp-relay.brevo.com   | 587 |
| Mailgun  | smtp.mailgun.org       | 587 |

### Option B: Resend API

If you prefer Resend’s HTTP API instead of SMTP:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
CHECKLIST_CRON_SECRET=your_random_secret_here
```

---

## Step 2: Cron job

The reminder logic runs by calling `POST /checklist/send-daily-reminders` once per day (e.g. at 8:00 AM).

### Using a cron service

**cron-job.org**

1. Create account at [cron-job.org](https://cron-job.org)
2. Add job: URL `https://your-backend.onrender.com/checklist/send-daily-reminders`
3. Method: POST
4. Header: `X-Cron-Secret: YOUR_CHECKLIST_CRON_SECRET`
5. Schedule: daily at desired time (e.g. 8:00 AM)

**Render Cron Jobs** (if backend runs on Render)

Add a cron job in your Render service that hits this endpoint with the secret header.

**GitHub Actions**

Create `.github/workflows/checklist-reminder.yml`:

```yaml
name: Checklist Daily Reminder
on:
  schedule:
    - cron: '0 8 * * *'  # 8 AM UTC daily
  workflow_dispatch:
jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger reminders
        run: |
          curl -X POST ${{ secrets.BACKEND_URL }}/checklist/send-daily-reminders \
            -H "X-Cron-Secret: ${{ secrets.CHECKLIST_CRON_SECRET }}"
```

Add `BACKEND_URL` and `CHECKLIST_CRON_SECRET` as GitHub Secrets.

---

## Step 3: Manual test

**As Admin:** Log in to the app → call:

```bash
curl -X POST https://your-backend.onrender.com/checklist/send-daily-reminders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**With cron secret (no login):**

```bash
curl -X POST https://your-backend.onrender.com/checklist/send-daily-reminders \
  -H "X-Cron-Secret: YOUR_CHECKLIST_CRON_SECRET"
```

Successful response example:

```json
{"sent": 2, "message": "Sent 2 reminder(s) for 2026-01-15"}
```

---

## Checklist

- [ ] SMTP credentials or Resend API key set in backend `.env`
- [ ] `CHECKLIST_CRON_SECRET` set
- [ ] Cron job configured to run daily
- [ ] Tested with manual call
