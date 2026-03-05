# How to make a user (e.g. Adrija Biswas) visible in the **Task** part

The **Task** dropdown in the sidebar (Checklist, Delegation) is shown only if the user has **View** access for the section key **`task`**. Below are two ways to grant it.

---

## Option 1: Using the app (recommended)

1. **Log in as Master Admin or Admin** (only they can edit user permissions).
2. Go to **Users** (sidebar).
3. Find the user (e.g. **Adrija Biswas**) and open the **⋮** menu → **Edit**.
4. In the **Section permissions (View / Edit)** section, find the row **Task**.
5. Check **View** (and **Edit** if they should be able to edit Task data).
6. Click **Save** (or **OK**).
7. **Ask the user to log out and log in again** so their token/profile is refreshed and the Task section appears in the sidebar.

No query or code change is needed when using this option.

---

## Option 2: Using Supabase (SQL)

Use this if you cannot use the app (e.g. no Master Admin) or you want to fix data directly.

### Step 1: Get the user’s ID

In **Supabase Dashboard** → **Table Editor** → **auth.users** (or your `user_profiles` table if you store display names there), find the row for **Adrija Biswas** and note the **id** (UUID).

Or run in **SQL Editor**:

```sql
-- Replace 'Adrija Biswas' with the display name or email if needed
SELECT id, email, raw_user_meta_data->>'full_name' AS full_name
FROM auth.users
WHERE raw_user_meta_data->>'full_name' ILIKE '%Adrija%Biswas%'
   OR email ILIKE '%adrija%';
```

Use the `id` from the result as `USER_ID` below.

### Step 2: Ensure the table exists

If you haven’t set up section permissions yet, create the table (run once):

```sql
-- Only if user_section_permissions doesn't exist yet
CREATE TABLE IF NOT EXISTS public.user_section_permissions (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    section_key TEXT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT true,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, section_key)
);
```

### Step 3: Grant Task (View and optionally Edit)

Replace `USER_ID` with the UUID from Step 1.

**Task – View only:**

```sql
INSERT INTO public.user_section_permissions (user_id, section_key, can_view, can_edit, updated_at)
VALUES ('USER_ID', 'task', true, false, NOW())
ON CONFLICT (user_id, section_key)
DO UPDATE SET can_view = true, can_edit = false, updated_at = NOW();
```

**Task – View and Edit:**

```sql
INSERT INTO public.user_section_permissions (user_id, section_key, can_view, can_edit, updated_at)
VALUES ('USER_ID', 'task', true, true, NOW())
ON CONFLICT (user_id, section_key)
DO UPDATE SET can_view = true, can_edit = true, updated_at = NOW();
```

### Step 4: Refresh for the user

The user must **log out and log in again** so the app loads the new section permissions and shows the Task part in the sidebar.

---

## Summary

| Goal                         | What to do                                                                 |
|-----------------------------|----------------------------------------------------------------------------|
| Show **Task** in sidebar    | Give the user **View** (and optionally **Edit**) for section **Task** in Edit User or via SQL. |
| After changing permissions | User must **log out and log in** so the Task section appears.             |

Section key used in code and DB for the Task part: **`task`**.
