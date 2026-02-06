# Fix Summary - Email Confirmation & User Profile Creation

## Problems Fixed

### 1. ✅ Email Confirmation Redirect Issue
**Problem**: After clicking email confirmation link, user was redirected to login page without showing confirmation message.

**Solution**:
- Updated `ConfirmationSuccess.tsx` to handle email confirmation callback with token/type query params
- Added route `/auth/confirm` in `App.tsx` to catch Supabase redirects
- Enhanced confirmation page to show success message and auto-redirect after 5 seconds

### 2. ✅ User Profile Not Created in Database
**Problem**: Users were created in `auth.users` but NOT in `public.user_profiles` table, preventing login.

**Solution**:
- Created database trigger `handle_new_user()` that automatically creates `user_profiles` record when user signs up
- Created email confirmation trigger `handle_user_email_confirmed()` to ensure profile exists when email is confirmed
- Updated backend `register_user()` to verify/create user_profiles as backup
- Created comprehensive SQL setup script in `backend/database/create_user_profile_trigger.sql`

---

## Files Changed

### Backend
1. **`backend/app/main.py`**
   - Added backup logic to create `user_profiles` if trigger fails
   - Added `/auth/confirm` endpoint for email confirmation callback

### Frontend
1. **`fms-frontend/src/App.tsx`**
   - Added route `/auth/confirm` to handle email confirmation redirects

2. **`fms-frontend/src/pages/auth/ConfirmationSuccess.tsx`**
   - Enhanced to handle email confirmation callback with query params
   - Shows proper success message
   - Auto-redirects to login after 5 seconds

### Database
1. **`backend/database/create_user_profile_trigger.sql`** (NEW)
   - Complete SQL script to create triggers for auto-creating user_profiles

2. **`DATABASE_SETUP_STEPS.md`** (NEW)
   - Step-by-step guide to set up database triggers
   - Troubleshooting section
   - Manual fix for existing users

---

## What You Need to Do

### Step 1: Run Database SQL Scripts

1. **Open Supabase Dashboard** → **SQL Editor** → **New Query**

2. **Run the complete trigger setup** (copy from `backend/database/create_user_profile_trigger.sql`):

```sql
-- Step 1: Ensure user_profiles table exists
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON public.user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);

-- Step 2: Ensure 'user' role exists
INSERT INTO public.roles (name, description, is_system_role)
SELECT 'user', 'Standard user with basic permissions', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'user');

-- Step 3: Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    SELECT id INTO default_role_id
    FROM public.roles
    WHERE name = 'user'
    LIMIT 1;

    IF default_role_id IS NULL THEN
        INSERT INTO public.roles (name, description, is_system_role)
        VALUES ('user', 'Standard user with basic permissions', TRUE)
        RETURNING id INTO default_role_id;
    END IF;

    INSERT INTO public.user_profiles (
        id, full_name, role_id, is_active, created_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        default_role_id,
        TRUE,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Email confirmation handler
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    SELECT id INTO default_role_id
    FROM public.roles
    WHERE name = 'user'
    LIMIT 1;

    IF default_role_id IS NULL THEN
        INSERT INTO public.roles (name, description, is_system_role)
        VALUES ('user', 'Standard user with basic permissions', TRUE)
        RETURNING id INTO default_role_id;
    END IF;

    INSERT INTO public.user_profiles (
        id, full_name, role_id, is_active, created_at
    )
    SELECT
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        default_role_id,
        TRUE,
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_profiles WHERE id = NEW.id
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Email confirmation trigger
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
    EXECUTE FUNCTION public.handle_user_email_confirmed();
```

3. **Fix existing users** (if you already have users in `auth.users` but not in `user_profiles`):

```sql
INSERT INTO public.user_profiles (id, full_name, role_id, is_active, created_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    (SELECT id FROM public.roles WHERE name = 'user' LIMIT 1),
    TRUE,
    COALESCE(au.created_at, NOW())
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.id = au.id
);
```

### Step 2: Configure Supabase Email Redirect URL

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3001`
3. Add to **Redirect URLs**:
   - `http://localhost:3001/confirmation-success`
   - `http://localhost:3001/auth/confirm`
   - `http://127.0.0.1:3001/confirmation-success`
   - `http://127.0.0.1:3001/auth/confirm`

### Step 3: Restart Backend (if running)

```bash
cd backend
# Stop current server (Ctrl+C)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Step 4: Test the Flow

1. **Register a new user** via frontend (`http://localhost:3001/register`)
2. **Check `auth.users` table** in Supabase - should see new user
3. **Check `public.user_profiles` table** - should automatically have new record ✅
4. **Check email** - should receive confirmation email
5. **Click confirmation link** - should redirect to:
   - `http://localhost:3001/confirmation-success?token=...&type=signup`
6. **Should see**: "Email Confirmed! ✅" message
7. **After 5 seconds**: Auto-redirects to login
8. **Try logging in** - should work now! ✅

---

## Verification Checklist

- [ ] Database triggers created successfully
- [ ] `user_profiles` table exists with correct schema
- [ ] `roles` table has 'user' role
- [ ] Supabase redirect URLs configured
- [ ] Backend restarted
- [ ] New user registration creates `user_profiles` record
- [ ] Email confirmation shows success message
- [ ] User can login after email confirmation

---

## Troubleshooting

**If user_profiles is still empty after registration:**

1. Check trigger exists:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE event_object_table = 'users' AND trigger_schema = 'auth';
   ```

2. Check if function exists:
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname = 'handle_new_user';
   ```

3. Manually create profile (see Step 1.3 above)

**If email confirmation doesn't show message:**

- Check browser console for errors
- Verify redirect URL in Supabase matches frontend URL
- Check `ConfirmationSuccess.tsx` is receiving query params

**If login still fails:**

- Verify `user_profiles` record exists for the user
- Check `role_id` is set correctly
- Check `is_active` is `TRUE`

---

## Summary

✅ **Fixed**: Email confirmation now shows success message  
✅ **Fixed**: User profiles automatically created in database  
✅ **Fixed**: Users can login after email confirmation  

**Next Steps**: Test the complete flow and verify everything works!
