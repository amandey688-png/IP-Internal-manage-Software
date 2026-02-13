# Production Checklist Email Fix – Step by Step

**Why it fails on Render:** Render blocks SMTP ports (25, 465, 587, 2525). Only the **Postmark HTTP API** works.

---

## Step 1: Remove SMTP from Render

1. Go to [Render Dashboard](https://dashboard.render.com) → your service **IP-Internal-manage-Software**
2. Click **Environment** (left sidebar)
3. Click **Edit** (top right)
4. **Remove** these variables (if present):
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
5. **Keep** or add only the Postmark API vars (Step 2)

---

## Step 2: Add Postmark API Variables on Render

In **Environment** → **Edit**, add or keep:

| Key | Value |
|-----|-------|
| `POSTMARK_SERVER_TOKEN` | Your Postmark Server API token (from [Postmark](https://account.postmarkapp.com) → Server → API Tokens) |
| `SMTP_FROM_EMAIL` | `aman@industryprime.com` |
| `SMTP_POSTMARK_STREAM` | `outbound` |
| `CHECKLIST_CRON_SECRET` | `mysecret123` |

**Do NOT use SMTP vars on Render.**

Click **Save**. Wait for Render to redeploy (2–5 minutes).

---

## Step 3: Confirm Backend Uses Postmark API

Your backend already uses Postmark HTTP API when `POSTMARK_SERVER_TOKEN` is set. No code changes needed.

The backend sends email via:
```
POST https://api.postmarkapp.com/email
Headers: X-Postmark-Server-Token, Content-Type, Accept
```

---

## Step 4: Push Latest Code

```powershell
cd "c:\Support FMS to APPLICATION"
git add .
git commit -m "fix: use Postmark HTTP API in production (SMTP blocked on Render)"

# Pull first if remote has new commits (fixes "rejected" push error)
git pull origin main

git push origin main
```

If `git pull` shows conflicts, fix the files Git lists, then:
```powershell
git add .
git commit -m "merge remote main"
git push origin main
```

Wait for Render to deploy the latest commit.

---

## Step 5: Run Supabase Migration (if not done)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **SQL Editor** → **New query**
3. Run the contents of `database/USER_PROFILES_EMAIL_FOR_REMINDERS.sql`
4. Verify: `SELECT id, full_name, email FROM public.user_profiles;` (emails must exist)

---

## Step 6: Clear Today’s Reminder (for re-testing)

In Supabase **SQL Editor**:

```sql
DELETE FROM public.checklist_reminder_sent
WHERE reminder_date = CURRENT_DATE;
```

Click **Run**.

---

## Step 7: Test Production

Open in browser:

```
https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=mysecret123&debug=1
```

**Expected:**
```json
{"sent": 1, "message": "Sent 1 reminder(s) for 2026-02-XX | ..."}
```

Check the inbox of the user who has tasks due today.

---

## Step 8: Set Up Cron Job

1. Go to [cron-job.org](https://cron-job.org)
2. **Create cronjob**:
   - **URL**: `https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=mysecret123`
   - **Method**: **GET**
   - **Schedule**: e.g. 8:15 AM, Asia/Kolkata
3. **TEST RUN** – should succeed.

---

## Why SMTP Fails on Render

| Port | Status on Render Free |
|------|------------------------|
| 587  | Blocked |
| 465  | Blocked |
| 2525 | Blocked |
| 25   | Blocked |

Only the **Postmark HTTP API** (HTTPS, port 443) works.

---

## Quick Checklist

- [ ] SMTP vars removed from Render
- [ ] `POSTMARK_SERVER_TOKEN`, `SMTP_FROM_EMAIL`, `SMTP_POSTMARK_STREAM`, `CHECKLIST_CRON_SECRET` set on Render
- [ ] Code pushed and deployed
- [ ] `USER_PROFILES_EMAIL_FOR_REMINDERS.sql` run in Supabase
- [ ] Cleared `checklist_reminder_sent` for today (optional, for re-test)
- [ ] Test URL returns `sent: 1`
- [ ] Email received
- [ ] cron-job.org configured and tested
