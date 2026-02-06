# Step-by-Step: Supabase Setup & Three User IDs (Roles)

This guide sets up the three role-based user IDs with strict permissions and approval workflow.

---

## 1. Run SQL Migrations in Supabase

In **Supabase Dashboard** → **SQL Editor**, run the following **in order**:

### 1.1 Base schema (if not already done)

Run `RUN_IN_SUPABASE.sql` and any other existing migrations so you have:

- `roles` table
- `user_profiles` table (with `role_id` referencing `roles`)
- `tickets` table and related tables

### 1.2 Roles and approval workflow

Run **`ROLES_AND_APPROVAL_WORKFLOW.sql`**. This:

- Inserts the **approver** role if it does not exist
- Creates **approval_settings** (for approval email addresses)
- Creates **approval_logs** (audit trail)
- Creates **approval_tokens** (one-time email approval links)
- Adds **approved_by** and **approval_source** to `tickets`

### 1.3 Verify roles

In SQL Editor:

```sql
SELECT id, name FROM public.roles ORDER BY name;
```

You should see: **admin**, **approver**, **master_admin**, **user** (or similar). The app maps:

- **master_admin** or **admin** → Super Admin (Role 1)
- **approver** → Approver (Role 2)
- **user** → Operator (Role 3)

If **approver** is missing, run again the insert from `ROLES_AND_APPROVAL_WORKFLOW.sql`:

```sql
INSERT INTO public.roles (id, name, description, is_system_role)
SELECT gen_random_uuid(), 'approver', 'Can approve/reject tickets, no settings', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'approver');
```

---

## 2. Create the Three User IDs in Supabase Auth

In **Supabase Dashboard** → **Authentication** → **Users**:

### Option A: Create users manually (recommended for testing)

1. **Super Admin (Role 1)**  
   - Click **Add user** → **Create new user**  
   - Email: `aman@industryprime.com`  
   - Password: `Ad12345@`  
   - Check **Auto Confirm User**  
   - Create user. Copy the **User UID**.

2. **Approver (Role 2)**  
   - Add user: `test@industryprime.com`  
   - Password: `Ad@12345`  
   - Auto Confirm: Yes  
   - Create user. Copy the **User UID**.

3. **Operator (Role 3)**  
   - Use existing user `amandey688@gmail.com` or create a new one.  
   - If you create new: set password and Auto Confirm. Copy the **User UID**.

### Option B: Invite by email

Use **Invite user** for each email; users set password via the invite link. Then confirm them (or use Auto Confirm in Auth settings).

---

## 3. Create or Update user_profiles and Assign role_id

You must have one row in **user_profiles** per auth user, with the correct **role_id**.

### 3.1 Get role IDs

```sql
SELECT id, name FROM public.roles;
```

Note the `id` (UUID) for:

- **admin** or **master_admin** (Super Admin)
- **approver**
- **user**

### 3.2 Create/update profiles and set roles

Replace the UUIDs below with your actual **auth user IDs** (from step 2) and **role IDs** (from step 3.1).

```sql
-- Replace these UUIDs with real values from auth.users and public.roles

-- 1) Super Admin: aman@industryprime.com → admin or master_admin role
INSERT INTO public.user_profiles (id, full_name, role_id, is_active)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Super Admin'),
  (SELECT id FROM public.roles WHERE name IN ('admin', 'master_admin') LIMIT 1),
  TRUE
FROM auth.users au
WHERE au.email = 'aman@industryprime.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role_id = (SELECT id FROM public.roles WHERE name IN ('admin', 'master_admin') LIMIT 1),
  is_active = TRUE;

-- 2) Approver: test@industryprime.com → approver role
INSERT INTO public.user_profiles (id, full_name, role_id, is_active)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Approver'),
  (SELECT id FROM public.roles WHERE name = 'approver' LIMIT 1),
  TRUE
FROM auth.users au
WHERE au.email = 'test@industryprime.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role_id = (SELECT id FROM public.roles WHERE name = 'approver' LIMIT 1),
  is_active = TRUE;

-- 3) Operator: amandey688@gmail.com → user role
INSERT INTO public.user_profiles (id, full_name, role_id, is_active)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Operator'),
  (SELECT id FROM public.roles WHERE name = 'user' LIMIT 1),
  TRUE
FROM auth.users au
WHERE au.email = 'amandey688@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role_id = (SELECT id FROM public.roles WHERE name = 'user' LIMIT 1),
  is_active = TRUE;
```

If your `user_profiles` table has no `ON CONFLICT` (e.g. no unique on `id`), use separate checks:

```sql
-- Ensure profile exists for each user and set role
-- Run after FIX_USER_PROFILE.sql if needed
```

You can run **FIX_USER_PROFILE.sql** first to create missing profiles with default **user** role, then run the three blocks above to upgrade **aman@...** and **test@...** to admin and approver.

---

## 4. Verify

1. **Roles and profiles**

```sql
SELECT au.email, up.full_name, r.name AS role_name
FROM auth.users au
JOIN public.user_profiles up ON up.id = au.id
JOIN public.roles r ON r.id = up.role_id
WHERE au.email IN ('aman@industryprime.com', 'test@industryprime.com', 'amandey688@gmail.com');
```

2. **Login**

- **aman@industryprime.com** / Ad12345@ → sees Settings, Approval Status, Users, all sections.  
- **test@industryprime.com** / Ad@12345 → sees Approval Status, no Settings, no Users.  
- **amandey688@gmail.com** → no Approval Status, no Settings, no Users; can create tickets and submit solution form.

3. **Approval emails (Super Admin only)**

- Log in as Super Admin → **Settings** → **Approval Email Configuration**.
- Add one or more comma-separated emails and save.

---

## 5. Email-Based Approval Links (Optional)

The app supports one-time approval links via **approval_tokens**. To send emails when a Feature ticket needs approval:

1. Backend creates tokens (e.g. when a Feature ticket is created or when you trigger “send approval request”).
2. Email content should include:
   - Approve: `https://your-frontend/approval/confirm?token=<approve_token>&action=approve`
   - Reject: `https://your-frontend/approval/confirm?token=<reject_token>&action=reject`
3. The **Approval Confirm** page calls `POST /approval/execute-by-token` and shows success or error.

Token creation and actual email sending (e.g. Resend, SendGrid) can be added in the backend or via an Edge Function; the database and execute-by-token endpoint are already in place.

---

## 6. Summary of Access

| Section / Action              | Super Admin | Approver | Operator |
|------------------------------|-------------|----------|----------|
| Dashboard                    | Yes         | Yes      | Yes      |
| All Tickets                  | Yes         | Yes      | Yes      |
| Chores & Bugs                | Yes         | Yes      | Yes      |
| Staging                      | Yes         | Yes      | Yes      |
| Feature                      | Yes         | Yes      | Yes      |
| Approval Status              | Yes         | Yes      | No       |
| Approve / Unapprove          | Yes         | Yes      | No       |
| Completed Chores & Bugs      | Yes         | Yes      | Yes      |
| Completed Feature            | Yes         | Yes      | Yes      |
| Solution                     | Yes         | Yes      | Yes      |
| Submit Support Ticket        | Yes         | Yes      | Yes      |
| Submit Solution Form         | Yes         | Yes      | Yes      |
| Settings                     | Yes         | No       | No       |
| Approval email config        | Yes         | No       | No       |
| Users                        | Yes         | No       | No       |

---

## Troubleshooting

- **"User profile not found"**  
  Run **FIX_USER_PROFILE.sql**, then the role-assignment blocks in section 3.2.

- **"Insufficient permissions" on Approval Status**  
  User’s `user_profiles.role_id` must be **approver** or **admin**/ **master_admin**.

- **Settings or Users not visible**  
  User’s role must be **admin** or **master_admin** (Super Admin). Check `roles.name` and `user_profiles.role_id` as in section 4.

- **Approval emails not saving**  
  Ensure **approval_settings** table exists (from **ROLES_AND_APPROVAL_WORKFLOW.sql**) and the logged-in user has role **admin** or **master_admin**.
