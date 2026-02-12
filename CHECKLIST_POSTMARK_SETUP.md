# Checklist Reminder – Postmark SMTP Setup

Your Supabase Custom SMTP uses **Postmark** (smtp.postmarkapp.com). Use the same credentials for the checklist daily reminder.

---

## Step 1: Add these to `backend/.env`

Copy from your Supabase Dashboard → Authentication → SMTP (or from the image you shared):

```env
# Postmark SMTP (same as Supabase Custom SMTP)
SMTP_HOST=smtp.postmarkapp.com
SMTP_PORT=587
SMTP_USER=025fddbf-90e2-43d5-a642-3fee36bb3acc
SMTP_PASSWORD=025fddbf-90e2-43d5-a642-3fee36bb3acc
SMTP_FROM_EMAIL=aman@industryprime.com
SMTP_POSTMARK_STREAM=outbound

# Cron secret (create a random string, e.g. run: openssl rand -hex 32)
CHECKLIST_CRON_SECRET=your_random_secret_here
```

> **Note:** Username and password are your Postmark **Server API Token** (often the same value).

---

## Step 2: Restart the backend

```bash
cd backend
uvicorn app.main:app --reload
```

---

## Step 3: Test manually (MUST use POST, not GET)

**IMPORTANT:** The endpoint is **POST**. If you open the URL in a browser, you'll get 405 Method Not Allowed.

**PowerShell (Windows):**

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/checklist/send-daily-reminders" -Method POST -Headers @{"X-Cron-Secret"="your_random_secret_here"}
```

**curl:**

```bash
curl -X POST "http://127.0.0.1:8000/checklist/send-daily-reminders" -H "X-Cron-Secret: your_random_secret_here"
```

See `CHECKLIST_REMINDER_TEST_STEPS.md` for detailed step-by-step guide.

If you have tasks due today (and the doer has an email), you should see something like:

```json
{"sent": 1, "message": "Sent 1 reminder(s) for 2026-01-15"}
```

---

## Step 4: Set up daily cron (production)

Use a cron service (e.g. [cron-job.org](https://cron-job.org)):

1. **URL:** `https://your-backend.onrender.com/checklist/send-daily-reminders`
2. **Method:** POST
3. **Header:** `X-Cron-Secret: your_random_secret_here`
4. **Schedule:** Daily at your chosen time (e.g. 8:00 AM)

Also add `CHECKLIST_CRON_SECRET` and the SMTP variables to your backend hosting (e.g. Render environment variables).
