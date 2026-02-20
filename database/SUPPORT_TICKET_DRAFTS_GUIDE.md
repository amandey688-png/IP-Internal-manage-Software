# Support Ticket Draft – User-wise Save (Step-by-Step Guide)

When a user opens **Submit Support Ticket**, adds data (Company, User name, etc.), and closes **without** submitting, the form data is saved for that user only. Drafts expire after **24 hours**. When they reopen the form within 24 hours, the draft is loaded.

---

## Step 1: Run the database script

1. Open **Supabase Dashboard** → **SQL Editor**
2. Create a new query
3. Copy and paste the entire contents of `database/SUPPORT_TICKET_DRAFTS_TABLE.sql`
4. Click **Run**

This creates:
- `public.support_ticket_drafts` table (one row per user)
- Trigger to update `updated_at`
- RLS policies so each user only accesses their own draft

---

## Step 2: Confirm the table

1. Go to **Table Editor**
2. Select `support_ticket_drafts`
3. Columns should be: `id`, `user_id`, `draft_data`, `created_at`, `updated_at`

---

## Step 3: Start backend and frontend

1. Start backend: `cd backend && python -m uvicorn app.main:app --reload`
2. Start frontend: `cd fms-frontend && npm run dev`

---

## Step 4: Verify behaviour

1. Log in as a user
2. Click **Submit Support Ticket**
3. Fill in some fields (company, title, etc.) but **do not** submit
4. Close the modal
5. Reopen **Submit Support Ticket** – the fields should be pre-filled with your draft
6. Submit the ticket – the draft should be cleared and not shown on the next open

---

## API endpoints (backend)

| Method | Endpoint                 | Purpose                              |
|--------|--------------------------|--------------------------------------|
| GET    | `/drafts/support-ticket` | Get current user's draft (404 if none) |
| PUT    | `/drafts/support-ticket` | Save/update draft                    |
| DELETE | `/drafts/support-ticket` | Delete draft (e.g. after submit)     |

All require Bearer token. Drafts are scoped to the logged-in user.

---

## When data is saved

- **Auto-save**: ~800ms after the user stops typing or changing fields
- **On close**: When the modal is closed without submitting (any entered data)

## When draft is cleared

- When the ticket is **successfully** submitted
- When the draft is **older than 24 hours** (expired drafts are deleted on next load attempt)

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| 404 on GET draft | Normal if no draft has been saved yet |
| Table does not exist | Run `SUPPORT_TICKET_DRAFTS_TABLE.sql` in Supabase SQL Editor |
| RLS blocks access | Policies use `auth.uid()`. Backend uses service_role, which bypasses RLS. |
| Draft not loading | Check browser console and network tab for API errors |
