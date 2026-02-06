# Full RLS for All Tables

**File:** `FULL_RLS_ALL_TABLES.sql`  
Enables **Row Level Security (RLS)** on all public tables and adds policies so that only **authenticated** users (valid JWT) can access data. Unauthenticated (anon with no JWT) sees no rows.

## Before you run

- Ensure all app tables exist (run `RUN_IN_SUPABASE.sql`, `ROLES_AND_APPROVAL_WORKFLOW.sql`, `USER_PROFILES_AND_SECTION_PERMISSIONS.sql` first if you use them).
- Your **backend uses the service_role key**, which **bypasses RLS**. So enabling RLS does **not** change backend behavior. These policies apply when access uses the anon key or an authenticated user JWT (e.g. direct Supabase client from frontend or future serverless).

## How to run

1. Open **Supabase Dashboard** → your project.
2. Go to **SQL Editor**.
3. Paste the full contents of `database/FULL_RLS_ALL_TABLES.sql`.
4. Click **Run**.

## What it does

| Table / view | RLS | Policies |
|--------------|-----|----------|
| `roles` | ON | SELECT for authenticated |
| `user_profiles` | ON | SELECT all; UPDATE own row only (id = auth.uid()) |
| `companies`, `pages`, `divisions` | ON | Full access (SELECT/INSERT/UPDATE/DELETE) for authenticated |
| `tickets` | ON | SELECT all; INSERT only with created_by = auth.uid(); UPDATE/DELETE for authenticated |
| `ticket_responses` | ON | Full access for authenticated |
| `approval_settings` | ON | Full access for authenticated |
| `approval_logs` | ON | SELECT + INSERT for authenticated |
| `approval_tokens` | ON | SELECT + INSERT + UPDATE for authenticated |
| `solutions` | ON | Full access for authenticated |
| `staging_deployments` | ON | Full access for authenticated |
| `user_section_permissions` | ON | Full access for authenticated |
| `users_view` | — | View uses security_invoker so underlying table RLS applies |

## If a table is missing

If you see `relation "public.xxx" does not exist`, that table was not created in your project. You can:

- Run the migration that creates it (e.g. `ROLES_AND_APPROVAL_WORKFLOW.sql` for approval_*), then run this script again, or  
- Comment out or delete the section for that table in `FULL_RLS_ALL_TABLES.sql` and run the rest.

## If the Users list shows "No data" after enabling RLS

The Users page lists people from `users_view`. If you previously set `security_invoker = on` on that view, the backend (service_role) may get no rows. Run **`database/FIX_USERS_VIEW_AFTER_RLS.sql`** in the SQL Editor so the view works again with the backend. Also ensure your logged-in user has role **Admin** or **Master Admin** (only those roles can call GET /users).

## Verify

In SQL Editor:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

`rowsecurity` should be `true` for every table listed.
