# Checklist Reminder – User Email Setup

When you get `no_email=1`, the doer (task assignee) has no email in Supabase Auth, so the reminder cannot be sent.

---

## 1. Find the User Without Email

### Option A: From checklist_tasks (Supabase SQL Editor)

```sql
-- Get doer IDs from today's pending tasks
SELECT DISTINCT ct.doer_id, up.full_name, au.email
FROM public.checklist_tasks ct
LEFT JOIN public.user_profiles up ON up.id = ct.doer_id
LEFT JOIN auth.users au ON au.id = ct.doer_id
WHERE ct.doer_id IS NOT NULL;
```

- If `au.email` is NULL for a row, that user has no email in Auth.
- `full_name` shows who (e.g. "Aman").

### Option B: From users_view

```sql
SELECT id, email, full_name FROM public.users_view;
```

- Empty or NULL `email` means no email in Auth.

---

## 2. Set Email in Supabase Auth (Manual)

1. Go to **Supabase Dashboard** → **Authentication** → **Users**.
2. Find the user (e.g. "Aman") by name or ID.
3. Click the **three dots (⋮)** or **Edit**.
4. Enter the **Email** and save.

Supabase stores emails only in `auth.users`, not in `user_profiles`.

---

## 3. Ensure New Users Get Email

When users register via the app, they must provide an email. If users are created manually:

1. **Authentication** → **Users** → **Add user**.
2. Fill in **Email** and **Password**.
3. Enable **Auto Confirm User** if you want them to use the app immediately.

---

## 4. Link checklist_tasks.doer_id to the Correct Auth User

`doer_id` must reference `auth.users(id)`.

**Check in Supabase SQL Editor:**

```sql
SELECT ct.id, ct.task_name, ct.doer_id, up.full_name, au.email
FROM public.checklist_tasks ct
JOIN public.user_profiles up ON up.id = ct.doer_id
LEFT JOIN auth.users au ON au.id = ct.doer_id;
```

- Rows where `au.email` is NULL are the ones causing `no_email=1`.

---

## 5. Update Email via SQL (Supabase SQL Editor)

If you know the user ID and new email, you can run:

```sql
UPDATE auth.users
SET email = 'aman@yourcompany.com',
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('email', 'aman@yourcompany.com')
WHERE id = 'YOUR-DOER-UUID-HERE';
```

Replace `YOUR-DOER-UUID-HERE` with the `doer_id` from the query in section 1.
Replace `aman@yourcompany.com` with the correct email.

---

## 6. Update Email via Admin API (Programmatic)

To update a user’s email from your backend (e.g. admin tool):

```python
supabase.auth.admin.update_user_by_id(user_id, {"email": "newemail@example.com"})
```

(Requires `SUPABASE_SERVICE_ROLE_KEY` in your backend.)

---

## Summary

| Problem              | Solution                                      |
|----------------------|-----------------------------------------------|
| User has no email    | Set email in Auth → Users → Edit user         |
| User created by hand | Use "Add user" and always set Email           |
| Wrong doer_id        | Recreate the checklist task with correct doer |
