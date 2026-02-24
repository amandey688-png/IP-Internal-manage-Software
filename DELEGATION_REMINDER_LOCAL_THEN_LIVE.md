# Delegation Daily Reminder – Local Setup First, Then Push to Live

Step-by-step guide to set up Delegation reminder email locally, test it, then deploy to production.

---

## Part 1: Local Setup

### Step 1.1: Run database migration (Supabase)

1. Open **Supabase Dashboard** → your project → **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `database/DELEGATION_REMINDER_SENT.sql`
4. Click **Run**
5. Confirm: table `delegation_reminder_sent` created

Verify:
```sql
SELECT * FROM public.delegation_reminder_sent LIMIT 1;
```
(Empty result is fine; table exists.)

---

### Step 1.2: Configure backend `.env` (local)

In `backend/.env`, add or ensure these exist:

```env
# SMTP (same as Checklist) – required for sending
SMTP_HOST=smtp.postmarkapp.com
SMTP_PORT=587
SMTP_USER=your_postmark_server_token
SMTP_PASSWORD=your_postmark_server_token
SMTP_FROM_EMAIL=noreply@yourdomain.com

# Cron secret – used for manual test or cron
CHECKLIST_CRON_SECRET=your_local_secret_123
```

If you use Resend instead of SMTP:
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
CHECKLIST_CRON_SECRET=your_local_secret_123
```

---

### Step 1.3: Ensure assignees have email

Delegation reminders go to task assignees. Emails are read from `user_profiles.email` or `auth.users.email`.

1. Create or pick a delegation task with an assignee
2. Check assignee email:
```sql
SELECT up.id, up.full_name, up.email, au.email AS auth_email
FROM public.user_profiles up
LEFT JOIN auth.users au ON au.id = up.id
WHERE up.id = 'YOUR_ASSIGNEE_UUID';
```
3. Make sure `email` or `auth_email` is set

---

### Step 1.4: Start backend locally

```powershell
cd backend
uvicorn app.main:app --reload --port 8000
```

Wait until you see: `Uvicorn running on http://127.0.0.1:8000`

---

### Step 1.5: Test the endpoint locally

**Option A – With cron secret (no login):**
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/delegation/send-daily-reminders" -Method POST -Headers @{"X-Cron-Secret"="your_local_secret_123"} -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Option B – With query param:**
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/delegation/send-daily-reminders?secret=your_local_secret_123" -Method GET -UseBasicParsing | Select-Object -ExpandProperty Content
```

Replace `your_local_secret_123` with your `CHECKLIST_CRON_SECRET` value.

**Expected response:**
```json
{"status":"started","message":"Delegation reminder job started. Check server logs for result."}
```

---

### Step 1.6: Check backend logs and inbox

1. In the terminal where backend is running, look for lines like:
   - `Delegation reminder sent to user@example.com`
   - `Delegation reminder background: sent N for YYYY-MM-DD`

2. Open the assignee’s inbox and verify an email:
   - **Subject:** "Delegation: Pending tasks due"
   - **Body:** List of pending delegation tasks

---

### Step 1.7: Re-test same day (optional)

If you already sent today, you won’t get another email unless you clear the record.

Run in Supabase SQL Editor:
```sql
DELETE FROM public.delegation_reminder_sent WHERE reminder_date = CURRENT_DATE;
```

Then call the endpoint again (Step 1.5).

---

## Part 2: Push to Live

### Step 2.1: Commit and push to Git

```powershell
cd "c:\Support FMS to APPLICATION"
git add -A
git status
git commit -m "Add Delegation daily reminder email (same pattern as Checklist)"
git push origin feature/stage2-remarks
```

If your main branch is protected, create a new branch:

```powershell
git checkout main
git pull origin main
git checkout -b feature/delegation-reminder
git add database/DELEGATION_REMINDER_SENT.sql backend/app/main.py backend/.env.example DELEGATION_DAILY_REMINDER_SETUP.md DELEGATION_REMINDER_LOCAL_THEN_LIVE.md
git commit -m "Add Delegation daily reminder email (same pattern as Checklist)"
git push -u origin feature/delegation-reminder
```

Then open a Pull Request on GitHub.

---

### Step 2.2: Merge to main

1. Open GitHub → your repo → Pull Requests
2. Open the PR for `feature/delegation-reminder`
3. Merge after checks pass (if configured)

---

### Step 2.3: Run migration on production Supabase

1. Open **Supabase Dashboard** (same project used in production)
2. Go to **SQL Editor**
3. Run `database/DELEGATION_REMINDER_SENT.sql`
4. Confirm: table `delegation_reminder_sent` exists

---

### Step 2.4: Set environment variables on production

On your production host (e.g. Render):

1. Open **Dashboard** → your backend service → **Environment**
2. Add or update:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `SMTP_FROM_EMAIL`
   - `CHECKLIST_CRON_SECRET` (or `DELEGATION_CRON_SECRET`)

3. Save changes and redeploy if required

---

### Step 2.5: Deploy backend

- **Render:** redeploy from Dashboard or via new Git push
- **Railway / other:** trigger deploy from Git or dashboard

---

### Step 2.6: Set up cron job for production

Use cron-job.org or your host’s cron:

1. Create a new cron job
2. **URL:** `https://YOUR-PRODUCTION-BACKEND-URL/delegation/send-daily-reminders`
3. **Method:** POST (or GET)
4. **Headers:** `X-Cron-Secret: YOUR_PRODUCTION_CRON_SECRET`
5. **Schedule:** Daily at your desired time (e.g. 9:00 AM Asia/Kolkata)

Save and run a **Test run** once.

---

### Step 2.7: Verify on production

1. Call the endpoint manually:
```powershell
Invoke-WebRequest -Uri "https://YOUR-BACKEND-URL/delegation/send-daily-reminders" -Method POST -Headers @{"X-Cron-Secret"="YOUR_PRODUCTION_SECRET"} -UseBasicParsing
```

2. Confirm response: `{"status":"started",...}`

3. Check assignee inbox for the email

4. Check backend logs for: `Delegation reminder sent to ...` and `Delegation reminder background: sent N ...`

---

## Quick reference

| Phase | Step | Action |
|-------|------|--------|
| **Local** | 1 | Run `DELEGATION_REMINDER_SENT.sql` in Supabase |
| **Local** | 2 | Add SMTP + `CHECKLIST_CRON_SECRET` in `backend/.env` |
| **Local** | 3 | Ensure assignees have email in `user_profiles` / `auth.users` |
| **Local** | 4 | Start backend: `uvicorn app.main:app --reload --port 8000` |
| **Local** | 5 | Call `POST http://127.0.0.1:8000/delegation/send-daily-reminders` with header `X-Cron-Secret` |
| **Local** | 6 | Check backend logs and assignee inbox |
| **Live** | 1 | Commit, push, create PR, merge |
| **Live** | 2 | Run migration on production Supabase |
| **Live** | 3 | Add env vars on production host |
| **Live** | 4 | Deploy backend |
| **Live** | 5 | Add cron job for daily 9 AM |
| **Live** | 6 | Test manually and verify email + logs |
