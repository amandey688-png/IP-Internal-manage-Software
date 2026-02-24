# Checklist Module Setup

## 1. Run SQL Migration

In **Supabase Dashboard → SQL Editor**, run:

1. `database/CHECKLIST_MODULE.sql`
2. `database/CHECKLIST_MODULE_RLS.sql` (RLS policies)

CHECKLIST_MODULE.sql creates:
- `checklist_departments` – department lookup
- `checklist_holidays` – holiday list (default India 2026 holidays)
- `checklist_tasks` – task definitions
- `checklist_completions` – completion records (Submit)

## 2. Departments

- Customer Support & Success  
- Marketing  
- Accounts & Admin  
- Internal Development  

## 3. Frequency

- **D** – Daily (Mon–Sat, excluding holidays)
- **2D** – Every 2 days (from start date, excluding Sundays and holidays)
- **W** – Weekly (same weekday)
- **2W** – Every 2 weeks (same weekday, 14-day step)
- **M** – Monthly (same date)
- **Q** – Quarterly
- **F** – Half-yearly
- **Y** – Yearly  

Sunday and holidays = no task. For non-daily tasks, if the due date falls on Sunday/holiday, the task appears on the previous working day.

## 4. Filters

- **Completed** – Tasks marked done (Submit clicked)
- **Not Completed (Date Crossed)** – Overdue tasks
- **Upcoming** – Future tasks

## 5. Upload Holiday List

From **December 15th**, Admin/Master Admin can upload the holiday list for the next year via **Upload Holiday List**.

## 6. Visibility

- **User** – Sees only their own tasks
- **Admin / Master Admin** – Can filter by user (name filter dropdown)

## 7. Daily reminder email

When the task’s assigned date equals today, the doer gets one reminder email.

### Option A: SMTP (same as Supabase Custom SMTP)

Use the **same credentials** from Supabase → Authentication → SMTP. Add to backend `.env`:
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `CHECKLIST_CRON_SECRET`

### Option B: Resend API

`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CHECKLIST_CRON_SECRET`

### Cron (daily, e.g. 8:00 AM):

   ```bash
   curl -X POST https://your-backend.onrender.com/checklist/send-daily-reminders \
     -H "X-Cron-Secret: YOUR_CHECKLIST_CRON_SECRET"
   ```

   Or use Render Cron Jobs, GitHub Actions, Vercel Cron, etc.

**Manual trigger:** Admin can call the endpoint (logged in) or use `X-Cron-Secret` header. See `CHECKLIST_DAILY_REMINDER_SETUP.md` for full guide.
