# Checklist Daily Reminder – Step-by-Step Test Guide

## Why you got 405 Error

The endpoint is **POST**, not GET. Browsers use GET when you type a URL. You must call it with **POST**.

---

## Step 1: Make sure the backend is running

In a terminal:

```powershell
cd "C:\Support FMS to APPLICATION\backend"
uvicorn app.main:app --reload
```

Leave this running. You should see `Uvicorn running on http://127.0.0.1:8000`.

---

## Step 2: Add the cron secret to `.env`

1. Open `backend\.env`
2. Add (or update):

```
CHECKLIST_CRON_SECRET=mysecret123
```

You can use any random string. Save the file.

---

## Step 3: Call the endpoint with POST

Use a **new** terminal (keep the backend one open).

### Option A: Using PowerShell

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/checklist/send-daily-reminders" -Method POST -Headers @{"X-Cron-Secret"="mysecret123"}
```

Use the same secret you put in `.env`.

### Option B: Using curl (if installed)

```powershell
curl -X POST "http://127.0.0.1:8000/checklist/send-daily-reminders" -H "X-Cron-Secret: mysecret123"
```

### Option C: Using a browser extension

1. Install a REST client extension (e.g. Thunder Client in VS Code).
2. Create a new request:
   - **Method:** POST
   - **URL:** `http://127.0.0.1:8000/checklist/send-daily-reminders`
   - **Header:** `X-Cron-Secret` = `mysecret123`
3. Send the request.

---

## Step 4: Check the result

**If it works**, you might see:

```json
{"sent": 0, "message": "Sent 0 reminder(s) for 2026-01-15"}
```

`sent: 0` is normal when there are no tasks due today.

**If you get 401 Unauthorized**, `CHECKLIST_CRON_SECRET` in `.env` doesn’t match the header value. Check both.

**If you get 200 but `sent: 0`**, no tasks are due today. To test the email:

1. Create a checklist task with today’s date as the first occurrence.
2. Make sure you are the doer (assignee).
3. Run the POST request again; you should see `sent: 1` and receive an email.

---

## Quick Reference

| Item | Value |
|------|-------|
| URL | `http://127.0.0.1:8000/checklist/send-daily-reminders` |
| Method | **POST** (not GET) |
| Header | `X-Cron-Secret: mysecret123` (same as in .env) |

---

## Summary

1. Backend running with `uvicorn app.main:app --reload`
2. `CHECKLIST_CRON_SECRET` set in `backend\.env`
3. Call the URL with **POST** and `X-Cron-Secret` header (e.g. via PowerShell command above)
