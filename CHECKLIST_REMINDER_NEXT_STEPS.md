# Checklist Daily Reminder – Next Steps (Step-by-Step)

You've tested successfully. Here’s what to do next.

---

## Step 1: Test That the Email Is Sent

Confirm that reminder emails are actually sent when tasks are due today.

### 1.1 Create a task due today

1. Open your app in the browser and log in.
2. Go to **Task → Checklist**.
3. Click **Add Task**.
4. Fill in:
   - **Name of Task:** Test reminder
   - **Department:** Customer Support & Success
   - **Frequency:** D (Daily)
   - **Day & Date:** today
5. Click **Add Task**.

### 1.2 Trigger the reminder endpoint

```powershell
.\backend\test-checklist-reminder.ps1
```

Or:

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/checklist/send-daily-reminders" -Method POST -Headers @{"X-Cron-Secret"="mysecret123"} -UseBasicParsing | Select-Object -ExpandProperty Content
```

### 1.3 Check the result

- Response should look like: `{"sent":1,"message":"Sent 1 reminder(s) for ..."}`
- Check the inbox of the user assigned to that task.
- If not in inbox, check spam/junk.

---

## Step 2: Add Env Vars to Production

Add these to your production backend (e.g. Render, Railway).

### 2.1 SMTP (Postmark)

- `SMTP_HOST` = smtp.postmarkapp.com
- `SMTP_PORT` = 587
- `SMTP_USER` = 025fddbf-90e2-43d5-a642-3fee36bb3acc
- `SMTP_PASSWORD` = 025fddbf-90e2-43d5-a642-3fee36bb3acc
- `SMTP_FROM_EMAIL` = aman@industryprime.com
- `SMTP_POSTMARK_STREAM` = outbound

### 2.2 Cron secret

- `CHECKLIST_CRON_SECRET` = mysecret123 (or a stronger random string for production)

### 2.3 How to add on Render

1. Dashboard → Your service → **Environment**
2. Add each variable above
3. Redeploy if needed

---

## Step 3: Set Up Daily Cron (Production)

Run the reminder every day, e.g. at 8:00 AM.

### 3.1 Using cron-job.org

1. Go to [cron-job.org](https://cron-job.org) and create an account.
2. Create new cron job.
3. Settings:
   - **URL:** `https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders`
   - **Method:** POST
   - **Headers:** add header `X-Cron-Secret` with value `mysecret123`
   - **Schedule:** every day at 8:00 AM (adjust time zone).
4. Save.

### 3.2 Using GitHub Actions

1. Create `.github/workflows/checklist-reminder.yml`:

```yaml
name: Checklist Daily Reminder
on:
  schedule:
    - cron: '0 2 * * *'   # 2 AM UTC (adjust for your timezone)
  workflow_dispatch:
jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Send reminders
        run: |
          curl -X POST "${{ secrets.BACKEND_URL }}/checklist/send-daily-reminders" \
            -H "X-Cron-Secret: ${{ secrets.CHECKLIST_CRON_SECRET }}"
```

2. Add repository secrets:
   - `BACKEND_URL` = https://your-backend.onrender.com
   - `CHECKLIST_CRON_SECRET` = mysecret123

### 3.3 Using Render Cron Jobs (if applicable)

If your Render plan supports cron:

1. Add a **Cron Job**.
2. URL: `https://your-backend.onrender.com/checklist/send-daily-reminders`
3. Method: POST
4. Schedule: `0 8 * * *` (8 AM daily)
5. Header: `X-Cron-Secret` = `mysecret123`

---

## Step 4: Verify Production Reminder

1. Deploy backend with the new env vars.
2. Ensure `CHECKLIST_CRON_SECRET` matches what the cron sends.
3. Test production endpoint:

```powershell
Invoke-WebRequest -Uri "https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders" -Method POST -Headers @{"X-Cron-Secret"="mysecret123"} -UseBasicParsing | Select-Object -ExpandProperty Content
```

4. Confirm there are tasks due today and that an email was received.

---

## Quick Checklist

- [ ] Step 1: Local test with a task due today and email received
- [ ] Step 2: SMTP and `CHECKLIST_CRON_SECRET` added to production
- [ ] Step 3: Daily cron configured on cron-job.org or GitHub Actions
- [ ] Step 4: Production endpoint tested successfully

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| No email received | Check spam, Postmark dashboard, SMTP env vars |
| 401 from cron | Ensure header value matches `CHECKLIST_CRON_SECRET` |
| `sent: 0` | Normal if no tasks due today; create a test task |
| Backend not reachable | Check URL, CORS, and that backend is running |
