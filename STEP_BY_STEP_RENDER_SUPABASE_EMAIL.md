# Step-by-Step: Render + Supabase Email Setup

Complete guide for checklist reminders and auth emails on production.

---

## Part 1: Code Updates (Already Done)

Your backend now supports these SMTP ports via `SMTP_PORT` env:

| Port | Use |
|------|-----|
| 587  | Default (STARTTLS) |
| 2525 | Alternative when 587 blocked |
| 25   | Traditional SMTP |
| 465  | SSL from start |

---

## Part 2: Render – Step by Step

### Step 2.1: Open Render Dashboard

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Log in
3. Click your **backend service** (e.g. `ip-internal-manage-software`)

---

### Step 2.2: Go to Environment

1. In the left sidebar, click **Environment**
2. You will see a list of environment variables

---

### Step 2.3: Add/Update Variables

**Postmark HTTP API** (recommended – works on Render, no SMTP ports needed):

| Key | Value |
|-----|-------|
| `POSTMARK_SERVER_TOKEN` | Your Postmark Server API token |
| `SMTP_FROM_EMAIL` | `aman@industryprime.com` |
| `SMTP_POSTMARK_STREAM` | `outbound` |
| `CHECKLIST_CRON_SECRET` | `mysecret123` |

Get the token from [Postmark](https://account.postmarkapp.com) → Server → API Tokens (same as SMTP token).

---

### Step 2.4: Save and Redeploy

1. Click **Save Changes**
2. Render will redeploy automatically
3. Wait 2–5 minutes; check **Logs** for “Your service is live”

---

---

## Part 3: Supabase – Step by Step

### Step 3.1: Open Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `geqcgxassdkrymzsjpoj`

---

### Step 3.2: Go to Auth SMTP

1. Click **Authentication** in the left sidebar
2. Click **SMTP Settings** (or **Providers** → **Email** → **SMTP**)
3. Or go directly: `https://supabase.com/dashboard/project/geqcgxassdkrymzsjpoj/auth/smtp`

---

### Step 3.3: Enable Custom SMTP

1. Turn **Enable Custom SMTP** to ON
2. Fill in:

| Field | Value |
|-------|-------|
| **Sender email** | `aman@industryprime.com` |
| **Sender name** | `IP Internal Management` (or your app name) |
| **Host** | `smtp.postmarkapp.com` |
| **Port** | `587` or `2525` |
| **Username** | Your Postmark server token |
| **Password** | Same token |

3. Use the **same port** as Render (`SMTP_PORT`)

---

### Step 3.4: Save

1. Click **Save**
2. Supabase will use this for auth emails (signup, password reset, etc.)

---

### Step 3.5: Optional – Test Auth Email

1. Go to **Authentication** → **Users**
2. Invite a user or trigger password reset
3. Check inbox (and spam) for the email

---

## Part 4: Supabase – Database Migration

### Step 4.1: Open SQL Editor

1. In Supabase, click **SQL Editor** in the left sidebar
2. Click **New query**

---

### Step 4.2: Run Migration

1. Open `database/USER_PROFILES_EMAIL_FOR_REMINDERS.sql`
2. Copy the **entire** contents
3. Paste into the SQL Editor
4. Click **Run**
5. Confirm no errors

---

### Step 4.3: Verify

Run:

```sql
SELECT id, full_name, email FROM public.user_profiles LIMIT 5;
```

Check that the `email` column exists and has values.

---

## Part 5: Test Checklist Reminders

### Step 5.1: Clear Today’s Reminders (Optional)

In Supabase SQL Editor:

```sql
DELETE FROM public.checklist_reminder_sent WHERE reminder_date = CURRENT_DATE;
```

---

### Step 5.2: Call the API

In browser:

```
https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=mysecret123&debug=1
```

Or PowerShell:

```powershell
Invoke-WebRequest -Uri "https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=mysecret123&debug=1" -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

### Step 5.3: Check Result

Example success:

```json
{"sent":1,"message":"Sent 1 reminder(s) for 2026-02-12"}
```

Check the inbox of the user who has tasks due today.

---

## Part 6: Set Up Daily Cron

### Step 6.1: Create Cron Job

1. Go to [https://cron-job.org](https://cron-job.org)
2. Log in or create an account

---

### Step 6.2: New Cronjob

1. Click **Create cronjob**
2. Fill in:

| Field | Value |
|-------|-------|
| **Title** | Daily Checklist Reminder |
| **URL** | `https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders` |
| **Schedule** | Every day at 8:15 (or your time) |
| **Timezone** | Asia/Kolkata |

---

### Step 6.3: Auth Header

1. Open **Advanced** tab
2. **Request method**: POST or GET
3. **Headers** → Add:
   - Key: `X-Cron-Secret`
   - Value: `mysecret123` (same as Render `CHECKLIST_CRON_SECRET`)

---

### Step 6.4: Save and Test

1. Click **Create**
2. Click **Run now** / **Test** to trigger once
3. Confirm `sent` in response and that the email arrives

---

## Part 7: Next Steps Checklist

- [ ] **Render**: `SMTP_PORT` set (587 or 2525)
- [ ] **Render**: All SMTP vars or Resend vars set
- [ ] **Render**: Service redeployed
- [ ] **Supabase**: Custom SMTP configured (same port as Render)
- [ ] **Supabase**: `USER_PROFILES_EMAIL_FOR_REMINDERS.sql` run
- [ ] **Test**: API URL returns `sent` ≥ 1
- [ ] **cron-job.org**: Job created, header set, schedule and timezone set
- [ ] **Verify**: Email received at set time

---

## Troubleshooting

| Issue | Action |
|------|--------|
| `sent: 0` | Check `debug=1` in URL; look for `no_email`, `send_failed` |
| `no_email=1` | Run migration; ensure users have email in auth |
| `send_failed=1` | Try `SMTP_PORT=2525` or switch to Resend |
| Auth emails not sent | Check Supabase SMTP settings, port, credentials |
| 587 blocked | Use Postmark HTTP API (`POSTMARK_SERVER_TOKEN`) |
