# Why "Sent 0 reminder(s)"?

## Fixes Applied

1. **ID matching** – `user_map`, `already_sent`, and `comp` now use string IDs so lookups work correctly.
2. **Date handling** – `occurrence_date` from the database is normalized for comparisons.
3. **user_profiles.email** – Email is now stored in `user_profiles` and synced from `auth.users`. The reminder reads only from `user_profiles` (no users_view or auth.admin). **Run `database/USER_PROFILES_EMAIL_FOR_REMINDERS.sql` in Supabase first.**

---

## Common Reasons for Sent 0

### 1. Reminder already sent today

If you ran the script earlier and it succeeded, we record it in `checklist_reminder_sent`. Later runs on the same day skip those users.

**To re-test:** In Supabase SQL Editor run:

```sql
DELETE FROM public.checklist_reminder_sent WHERE reminder_date = CURRENT_DATE;
```

Then run the script again.

---

### 2. User email missing

The user must have an email in `user_profiles.email`. Run `database/USER_PROFILES_EMAIL_FOR_REMINDERS.sql` to add the column and backfill from `auth.users`.

**Check in Supabase:**

```sql
SELECT id, email, full_name FROM public.user_profiles;
```

---

### 3. Task start date in the future

The task’s first occurrence must be on or before today. If `start_date` is after today, today’s date will not be in the occurrence list.

---

### 4. Debug output

Add `?debug=1` to see why `sent` is 0:

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/checklist/send-daily-reminders?debug=1" -Method POST -Headers @{"X-Cron-Secret"="mysecret123"} -UseBasicParsing | Select-Object -ExpandProperty Content
```

Example output:

`Sent 0 reminder(s) for 2026-02-11 | tasks=2 by_user=1 already_sent=1`
or
`Sent 0 reminder(s) for 2026-02-11 | tasks=3 by_user=1 already_sent=0 no_email=1`

- **tasks=0** – No checklist tasks in the DB
- **by_user=0** – No tasks due today or all are completed
- **already_sent=1** – Reminders already sent for those users today
- **no_email=1** – Doer(s) have no email in auth.users (check Supabase Auth → Users)

---

## Steps to Test Again

1. **Run migration** (one-time, Supabase SQL Editor): `database/USER_PROFILES_EMAIL_FOR_REMINDERS.sql`
2. Restart the backend.
3. Clear today’s reminders (optional):

   ```sql
   DELETE FROM public.checklist_reminder_sent WHERE reminder_date = CURRENT_DATE;
   ```

4. Run: `Invoke-WebRequest -Uri "http://127.0.0.1:8000/checklist/send-daily-reminders" -Method POST -Headers @{"X-Cron-Secret"="mysecret123"} -UseBasicParsing`
5. If still 0, add `?debug=1` to the URL and check `tasks`, `by_user`, `already_sent`, or `no_email`.
