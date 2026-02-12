# Checklist Daily Reminder – Full Fix & Test Guide

## What Was Fixed

1. **`.env` loading** – Backend now always loads `backend/.env`, even when started from the project root.
2. **Header handling** – Both `X-Cron-Secret` and `x-cron-secret` headers are supported.
3. **Test script** – `backend/test-checklist-reminder.ps1` added for easier testing.

---

## Step 1: Confirm `backend/.env`

Open `backend\.env` and ensure this line exists with **no spaces** around it:

```
CHECKLIST_CRON_SECRET=mysecret123
```

---

## Step 2: Restart the backend

1. Stop the running backend (Ctrl+C in its terminal).
2. Start it again:

```powershell
cd "C:\Support FMS to APPLICATION\backend"
uvicorn app.main:app --reload
```

---

## Step 3: Test the endpoint

### Option A: Run the test script (recommended)

In a new PowerShell window:

```powershell
cd "C:\Support FMS to APPLICATION"
.\backend\test-checklist-reminder.ps1
```

### Option B: PowerShell one-liner

```powershell
$h = @{"X-Cron-Secret"="mysecret123"}; Invoke-WebRequest -Uri "http://127.0.0.1:8000/checklist/send-daily-reminders" -Method POST -Headers $h -UseBasicParsing | Select-Object -ExpandProperty Content
```

### Option C: curl (if available)

```powershell
curl.exe -X POST "http://127.0.0.1:8000/checklist/send-daily-reminders" -H "X-Cron-Secret: mysecret123"
```

---

## Step 4: Expected response

**Success:**
```json
{"sent":0,"message":"Sent 0 reminder(s) for 2026-01-15"}
```

`sent: 0` is normal when there are no tasks due today.

**If you still get 401:**

1. Restart the backend again.
2. Confirm `CHECKLIST_CRON_SECRET=mysecret123` in `backend\.env` (no spaces, no quotes).
3. Use the same value in the header: `X-Cron-Secret: mysecret123`.

---

## Quick checklist

- [ ] `CHECKLIST_CRON_SECRET=mysecret123` in `backend\.env`
- [ ] Backend restarted after the change
- [ ] Request uses **POST**
- [ ] Header `X-Cron-Secret` has value `mysecret123`
