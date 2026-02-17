# Render 503 Fix – What We Did & What You Do

Cron at 9:11 AM was getting **503 Service Unavailable** because the app was sleeping (cold start) or the reminder endpoint took too long. Below is what was changed in the backend and what you need to do on your side.

---

## What We Changed (Backend)

1. **`/health` endpoint**  
   - Already existed; it’s lightweight (no DB).  
   - Use it for **keep-alive pings only** (e.g. every 5 minutes).  
   - Do **not** hit `/checklist/send-daily-reminders` or `/reminders/send-pending-digest` every 5 minutes.

2. **Reminder endpoints return immediately**  
   - **`/checklist/send-daily-reminders`**  
     - Validates cron secret (or admin), then starts the real work in a **background task** and returns right away.  
     - Response: `{"status": "started", "message": "Checklist reminder job started. Check server logs for result."}`  
   - **`/reminders/send-pending-digest`**  
     - Same: validates auth, starts background task, returns immediately.  
     - Response: `{"status": "started", "message": "Pending digest job started. Check server logs for result."}`  
     - If there are no recipients: `{"status": "skipped", "message": "No recipients found..."}` (no background task).

3. **Actual sending happens in background**  
   - Emails and DB work run after the HTTP response is sent, so the request no longer times out.  
   - Results are written to **server logs** (e.g. “Checklist reminder background: sent N for …”, “Pending digest background: sent N for …”).

---

## What You Need To Do (Your Side)

### 1. Keep the service awake (avoid cold start)

Use a **separate** monitor that only hits **`/health`** every 5 minutes. That way the app stays warm and the 9 AM cron gets a running instance.

**Option A – UptimeRobot (free)**

1. Go to [https://uptimerobot.com](https://uptimerobot.com) and sign up / log in.  
2. **Add New Monitor**  
   - **Monitor Type:** HTTP(s)  
   - **URL:** `https://YOUR-RENDER-URL/health`  
     (e.g. `https://ip-internal-manage-software.onrender.com/health`)  
   - **Monitoring Interval:** 5 minutes (free tier allows this).  
3. Save.  
4. Do **not** use this monitor for the reminder URLs; use it only for `/health`.

**Option B – cron-job.org (second job)**

1. In [cron-job.org](https://cron-job.org) create a **second** cron job.  
2. **URL:** `https://YOUR-RENDER-URL/health`  
3. **Schedule:** Every 5 minutes (e.g. `*/5 * * * *` or the 5-minute option).  
4. No special headers needed.  
5. This job is only to keep the service awake; the existing 9:11 AM job still triggers the reminders.

---

### 2. Daily reminder at 9 AM (existing cron)

Keep your existing cron that calls the reminder endpoint once a day (e.g. 9:11 AM Asia/Kolkata).

- **Checklist reminders:**  
  `https://YOUR-RENDER-URL/checklist/send-daily-reminders`  
  Method: GET or POST.  
  Header: `X-Cron-Secret: YOUR_CHECKLIST_CRON_SECRET`  
  (or `?secret=YOUR_SECRET` in the URL.)

- **Pending digest (Support task mail):**  
  `https://YOUR-RENDER-URL/reminders/send-pending-digest`  
  Same: GET or POST, same secret header or `?secret=...`.

Because the backend now returns immediately, a **30 second timeout** in cron-job.org is enough. You can set it in the job’s **Advanced** tab if you want.

---

### 3. Check Render logs after 9 AM

- In **Render Dashboard** → your service → **Logs**.  
- At ~9:11 AM look for:  
  - `Checklist reminder background: sent N for YYYY-MM-DD`  
  - `Pending digest background: sent N for YYYY-MM-DD`  
- If you see errors (Supabase, Postmark, etc.), the traceback will be there.

---

### 4. Quick checks

| Check | What to do |
|-------|------------|
| 503 on reminder at 9 AM | Ensure a 5‑minute **/health** ping is running (UptimeRobot or second cron-job). |
| 200 but no emails | Check Render logs for “background: sent 0” or errors; fix recipients / SMTP or Postmark. |
| 401 on reminder | Cron request must send the same secret as `CHECKLIST_CRON_SECRET` or `PENDING_REMINDER_CRON_SECRET` in Render env. |

---

## Summary

- **Backend:** Reminder endpoints return **immediately** with `"status": "started"` and do the work in the **background**; `/health` is for keep-alive only.  
- **You:** Add a **5‑minute ping to `/health`** (UptimeRobot or second cron), keep the **9 AM cron** for the reminder URLs, and use **Render logs** to confirm “sent N” or errors.
