# cron-job.org — email reminders (no in-app scheduler)

The app **does not** store send times in Settings. You set the schedule **only on cron-job.org**.

---

## Secret (local + production)

`backend/.env` (local) and **Render → Environment** (production):

```env
FEATURE_APPROVAL_CRON_SECRET=mysecret123
POSTMARK_SERVER_TOKEN=...
POSTMARK_FROM_EMAIL=...
```

cron-job.org header: **`X-Cron-Secret: mysecret123`**

---

## Production — recommended: one cron job

| Field | Value |
|--------|--------|
| **URL** | `https://ip-internal-manage-software.onrender.com/api/cron/run-all-emails` |
| **Method** | GET |
| **Schedule** | Set each time you want mail (e.g. daily `0 8 * * *` for 8:00 UTC, or use cron-job.org UI for 8:00 IST) |
| **Header** | `X-Cron-Secret` = your secret |

Legacy URL (still works): `/api/scheduler/tick` — same behavior.

---

## Production — separate jobs per module

| Module | URL |
|--------|-----|
| Feature approval | `/api/feature-approval-reminders/run` |
| Checklist | `/api/checklist/send-daily-reminders` |
| Delegation | `/api/delegation/send-daily-reminders` |
| Escalation pending | `/api/escalation/send-pending-mails` |
| Escalation critical | `/api/escalation/send-critical-mails` |
| Escalation stages | `/api/escalation/send-stage-mails` |

Same `X-Cron-Secret` on all.

---

## Local

cron-job.org cannot reach `127.0.0.1`. Options:

1. **ngrok:** `ngrok http 8020` → `https://YOUR-ID.ngrok-free.app/api/cron/run-all-emails`
2. **PowerShell test:**
   ```powershell
   Invoke-RestMethod -Uri "http://127.0.0.1:8020/api/cron/run-all-emails" -Headers @{ "X-Cron-Secret" = "mysecret123" }
   ```

---

## Supabase cleanup (once)

If you used the old in-app scheduler, run:

```sql
-- database/DROP_EMAIL_JOB_SCHEDULES.sql
DROP TABLE IF EXISTS public.email_job_schedules CASCADE;
```

---

## Settings in the app

- **Feature Approval** — recipients list only; time = cron-job.org  
- **Checklist / Delegation** — info + cron URLs  
- **Escalation** — recipients + enable flags; time = cron-job.org  
