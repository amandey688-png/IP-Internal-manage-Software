# Checklist Reminder: Fix "Sent 0" and Deploy to Live

## Why Emails Work Locally But Not on Render

**Render blocks SMTP ports (25, 465, 587, 2525).** Your local server can use Postmark SMTP, but production cannot.

**Fix:** Use **Postmark HTTP API only** on Render. Remove SMTP vars—they do not work.

---

## Step 1: Get Your Postmark Server Token

1. Log in to [Postmark](https://account.postmarkapp.com)
2. Open your **Server** → **API Tokens**
3. Copy the **Server API token** (same token you use for SMTP in local .env)

---

## Step 2: Set Environment Variables on Render

**Remove** any SMTP vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`).

**Add only** these (Postmark HTTP API – SMTP does not work on Render):

| Variable | Value |
|----------|-------|
| `POSTMARK_SERVER_TOKEN` | Your Server API token from Postmark |
| `SMTP_FROM_EMAIL` | `aman@industryprime.com` |
| `SMTP_POSTMARK_STREAM` | `outbound` |
| `CHECKLIST_CRON_SECRET` | `mysecret123` |

**Save** → Render will redeploy.

---

## Step 3: Run Migration in Production Supabase

1. Open **Supabase** → **SQL Editor**
2. Run: `database/USER_PROFILES_EMAIL_FOR_REMINDERS.sql`
3. Verify:
```sql
SELECT id, full_name, email FROM public.user_profiles LIMIT 10;
```

---

## Step 4: Deploy Latest Code

```powershell
cd "c:\Support FMS to APPLICATION"
git add .
git commit -m "fix: use Postmark API for emails on Render (SMTP blocked)"
git push origin main
```

---

## Step 5: Test the Endpoint

### Clear today's reminders (optional)
```sql
DELETE FROM public.checklist_reminder_sent WHERE reminder_date = CURRENT_DATE;
```

### Call the API
```
https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=mysecret123&debug=1
```

**Expected:** `{"sent": 1, "message": "Sent 1 reminder(s) for ..."}` and email in inbox.

---

## Step 6: Cron Job (cron-job.org)

1. Go to [cron-job.org](https://cron-job.org)
2. **Create cronjob**:
   - **URL**: `https://ip-internal-manage-software.onrender.com/checklist/send-daily-reminders?secret=mysecret123`  
     **(required – must match `CHECKLIST_CRON_SECRET` on Render, otherwise you get 401)**
   - **Method**: **GET**
   - **Headers** (ADVANCED tab): Add `X-Cron-Secret` = `mysecret123`  
     *(alternative to secret in URL; use one or both)*
   - **Schedule**: Every day at your desired time (e.g. 8:15 AM)
   - **Timezone**: Asia/Kolkata

3. **TEST RUN** to verify.

---

## Local vs Production

| Env | Email method |
|-----|--------------|
| **Localhost** | SMTP (Postmark) – use `SMTP_*` vars in `.env` |
| **Render** | Postmark HTTP API – use `POSTMARK_SERVER_TOKEN` + `SMTP_FROM_EMAIL` |

---

## Checklist

- [ ] `POSTMARK_SERVER_TOKEN`, `SMTP_FROM_EMAIL`, `CHECKLIST_CRON_SECRET` set on Render
- [ ] `USER_PROFILES_EMAIL_FOR_REMINDERS.sql` run in Supabase
- [ ] Code pushed and deployed
- [ ] Test URL returns sent ≥ 1
- [ ] cron-job.org set to desired time (e.g. 8:15 AM Asia/Kolkata)
