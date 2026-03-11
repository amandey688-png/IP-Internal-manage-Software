# Pre-Onboarding & Pre-Onboarding Checklist – Database Setup

If you see **"Failed to load Pre-Onboarding"** or **"Failed to load Pre-Onboarding Checklist"** when clicking those buttons, the backend tables are missing.

## What to run

1. Open **Supabase Dashboard** → your project → **SQL Editor**.
2. Make sure the **Payment Status** table exists (run `database/ONBOARDING_PAYMENT_STATUS.sql` first if you haven’t).
3. Copy and run the script below in the SQL Editor.

---

## SQL script (copy everything below)

```sql
-- ============================================================================
-- Onboarding > Pre-Onboarding & Pre-Onboarding Checklist (per Payment Status)
-- Run in Supabase SQL Editor after ONBOARDING_PAYMENT_STATUS
-- ============================================================================

-- Pre-Onboarding: one row per payment_status record; data as JSONB; editable 48h after submit
CREATE TABLE IF NOT EXISTS public.onboarding_pre_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_pre_onboarding_payment_status_id ON public.onboarding_pre_onboarding(payment_status_id);

ALTER TABLE public.onboarding_pre_onboarding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_pre_onboarding_select_authenticated" ON public.onboarding_pre_onboarding;
CREATE POLICY "onboarding_pre_onboarding_select_authenticated" ON public.onboarding_pre_onboarding FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_pre_onboarding_insert_authenticated" ON public.onboarding_pre_onboarding;
CREATE POLICY "onboarding_pre_onboarding_insert_authenticated" ON public.onboarding_pre_onboarding FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_pre_onboarding_update_authenticated" ON public.onboarding_pre_onboarding;
CREATE POLICY "onboarding_pre_onboarding_update_authenticated" ON public.onboarding_pre_onboarding FOR UPDATE TO authenticated USING (true);

-- Pre-Onboarding Checklist
CREATE TABLE IF NOT EXISTS public.onboarding_pre_onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_pre_onboarding_checklist_payment_status_id ON public.onboarding_pre_onboarding_checklist(payment_status_id);

ALTER TABLE public.onboarding_pre_onboarding_checklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_pre_onboarding_checklist_select_authenticated" ON public.onboarding_pre_onboarding_checklist;
CREATE POLICY "onboarding_pre_onboarding_checklist_select_authenticated" ON public.onboarding_pre_onboarding_checklist FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_pre_onboarding_checklist_insert_authenticated" ON public.onboarding_pre_onboarding_checklist;
CREATE POLICY "onboarding_pre_onboarding_checklist_insert_authenticated" ON public.onboarding_pre_onboarding_checklist FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_pre_onboarding_checklist_update_authenticated" ON public.onboarding_pre_onboarding_checklist;
CREATE POLICY "onboarding_pre_onboarding_checklist_update_authenticated" ON public.onboarding_pre_onboarding_checklist FOR UPDATE TO authenticated USING (true);

COMMENT ON TABLE public.onboarding_pre_onboarding IS 'Pre-Onboarding form data per Payment Status. Editable 48h after submit.';
COMMENT ON TABLE public.onboarding_pre_onboarding_checklist IS 'Pre-Onboarding Checklist form data per Payment Status. Editable 48h after submit.';
```

4. Click **Run**. You should see “Success. No rows returned.”
5. Restart or reload your app; **Pre-Onboarding** and **Pre-Onboarding Checklist** should open the form. After the tables exist, **Submit** will save data.

---

**Note:** The backend was updated so that if these tables don’t exist yet, the API still returns empty data instead of an error. So the form will open even before you run the SQL; only **saving** will fail until the tables are created.
