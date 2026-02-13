# SendGrid Setup & Deploy – Complete Guide

Step-by-step setup for checklist reminders and pending digest emails using SendGrid on Render.

---

## Part 1: SendGrid Setup (Steps)

### Step 1.1: Create SendGrid Account

1. Go to [https://signup.sendgrid.com](https://signup.sendgrid.com)
2. Sign up (free tier: 100 emails/day)
3. Verify your email

---

### Step 1.2: Create API Key

1. Log in to [SendGrid Dashboard](https://app.sendgrid.com)
2. **Settings** → **API Keys** (or use the left menu)
3. **Create API Key**
4. **Name**: e.g. `IP-Internal-Management-Render`
5. **Permissions**: **Full Access** or **Restricted Access** → enable **Mail Send**
6. Click **Create & View**
7. Copy the key (it starts with `SG.`; you can view it only once)

---

### Step 1.3: Verify Sender Identity

1. **Settings** → **Sender Authentication**
2. Choose:
   - **Single Sender**: one email (e.g. `aman@industryprime.com`)
   - **Domain Authentication**: entire domain (recommended)

**Single Sender:**
1. **Create New Sender**
2. Fill: From Name, From Email, Reply To, Company, Address
3. Verify the link sent to the email

**Domain Authentication:**
1. **Authenticate a Domain**
2. Enter domain (e.g. `industryprime.com`)
3. Add the provided DNS records (CNAME) to your domain
4. Click **Verify**

---

### Step 1.4: Note Your Settings

| Item | Value |
|------|-------|
| API Key | `SG.xxxx...` |
| From Email | `aman@industryprime.com` (verified sender) |
| From Name | `IP Internal Management` |

---

## Part 2: Render Configuration (Steps)

### Step 2.1: Open Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Select your backend service (e.g. `ip-internal-manage-software`)

---

### Step 2.2: Add Environment Variables

1. Click **Environment** in the left sidebar
2. **Add Environment Variable** (or edit existing)
3. Add:

| Key | Value |
|-----|-------|
| `SENDGRID_API_KEY` | `SG.xxxx...` (from Step 1.2) |
| `SENDGRID_FROM_EMAIL` | `aman@industryprime.com` |
| `SENDGRID_FROM_NAME` | `IP Internal Management` |
| `CHECKLIST_CRON_SECRET` | `mysecret123` |

4. **Save** – Render will redeploy

---

### Step 2.3: Redeploy (if needed)

1. After saving, deployment usually starts automatically
2. In **Logs**, wait for “Your service is live”
3. Redeploy can take 2–5 minutes

---

## Part 3: Supabase Configuration (Steps)

### Step 3.1: Database Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Open **SQL Editor**
3. Open `database/USER_PROFILES_EMAIL_FOR_REMINDERS.sql`
4. Copy and paste the full contents
5. Click **Run**
6. Check for no errors

**Verify:**
```sql
SELECT id, full_name, email FROM public.user_profiles LIMIT 5;
```

---

### Step 3.2: Supabase Custom SMTP (Auth Emails – Optional)

For auth emails (signup, reset password), Supabase uses its own SMTP. You can use SendGrid SMTP here as well.

1. **Authentication** → **SMTP** (or **Providers**)
2. Turn on **Custom SMTP**
3. Enter:

| Field | Value |
|-------|-------|
| Host | `smtp.sendgrid.net` |
| Port | `587` |
| Username | `apikey` |
| Password | Your SendGrid API Key (same `SG.xxxx...`) |
| Sender email | `aman@industryprime.com` |
| Sender name | `IP Internal Management` |

4. **Save**

---

## Part 4: Deploy Code

### Step 4.1: Commit and Push

```powershell
cd "c:\Support FMS to APPLICATION"
git add .
git commit -m "fix: use SendGrid API for emails on Render"
git push origin main
```

---

### Step 4.2: Confirm Deploy on Render

1. In Render, confirm the latest commit is deployed
2. Check **Logs** for build and start-up success

---

## Part 5: Test Checklist Reminders

### Step 5.1: Clear Today’s Reminders

In Supabase SQL Editor:

```sql
DELETE FROM public.checklist_reminder_sent WHERE reminder_date = CURRENT_DATE;
```

---

### Step 5.2: Call the API

In browser or PowerShell:

```
https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=mysecret123&debug=1
```

**Expected:** `{"sent": 1, "message": "Sent 1 reminder(s) for ..."}` and an email in the inbox.

---

## Part 6: Cron Job (cron-job.org)

### Step 6.1: Create Job

1. Go to [https://cron-job.org](https://cron-job.org)
2. Log in
3. **Create cronjob**

---

### Step 6.2: Configure

| Field | Value |
|-------|-------|
| **Title** | Daily Checklist Reminder |
| **URL** | `https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders` |
| **Schedule** | Every day at 8:15 AM (or your time) |
| **Timezone** | Asia/Kolkata |

---

### Step 6.3: Add Auth Header

1. **Advanced** tab
2. **Request method**: POST or GET
3. **Headers** → Add:
   - Key: `X-Cron-Secret`
   - Value: `mysecret123`

---

### Step 6.4: Save and Test

1. **Create**
2. **Run now** / **Test** to trigger once
3. Confirm emails arrive at the expected time

---

## Part 7: Next Steps Summary

| # | Task | Status |
|---|-----|--------|
| 1 | SendGrid account, API key, sender verified | ☐ |
| 2 | `SENDGRID_*` and `CHECKLIST_CRON_SECRET` on Render | ☐ |
| 3 | `USER_PROFILES_EMAIL_FOR_REMINDERS.sql` run in Supabase | ☐ |
| 4 | Code pushed and deployed on Render | ☐ |
| 5 | Test API returns `sent ≥ 1` when tasks exist | ☐ |
| 6 | Cron job set up and tested | ☐ |
| 7 | (Optional) Supabase Custom SMTP with SendGrid | ☐ |

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| `sent: 0` | Add `?debug=1` to the URL and check `no_email`, `send_failed` |
| `no_email=1` | Run migration, ensure users have email in auth |
| `send_failed=1` | Verify `SENDGRID_API_KEY`, sender must be verified |
| 401 Unauthorized | Confirm API key is correct and has Mail Send |
| 403 Forbidden | Verify sender email in SendGrid |

---

## SendGrid SMTP (Alternative for Localhost)

For local development, you can use SendGrid SMTP instead of Postmark:

| Env Var | Value |
|---------|-------|
| `SMTP_HOST` | `smtp.sendgrid.net` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `apikey` |
| `SMTP_PASSWORD` | Your SendGrid API Key |
| `SMTP_FROM_EMAIL` | `aman@industryprime.com` |

When `SENDGRID_API_KEY` is set, the app uses the HTTP API (preferred on Render).
