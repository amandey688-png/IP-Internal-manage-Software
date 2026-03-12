# Supabase updates – what to run

## Single file (recommended)

**File: `SUPABASE_UPDATE_ALL.sql`**

1. In Supabase Dashboard go to **SQL Editor**.
2. Click **New query**.
3. Paste the full contents of `database/SUPABASE_UPDATE_ALL.sql`.
4. Click **Run**.

This file:

- Creates all **Onboarding** tables (Payment Status and every step through Final Setup) and their RLS policies.
- Adds **POC Checklist** table (used by the app but previously not in a separate SQL file).
- Enables **RLS on `feature_list`** (fixes Security Advisor “RLS Disabled in Public” for `public.feature_list`).

**Note:** The `feature_list` RLS block at the end requires the table `public.feature_list` to exist. If you use the Success/Performance module, run `SUCCESS_PERFORMANCE_MONITORING.sql` first so that `feature_list` is created. If you don’t use that module and don’t have `feature_list`, comment out or delete the “Feature list RLS” section (section 13) in `SUPABASE_UPDATE_ALL.sql` before running it.

---

## Optional: run scripts one by one

If you prefer to run smaller scripts in order:

| Order | File | Purpose |
|-------|------|--------|
| 1 | `ONBOARDING_PAYMENT_STATUS.sql` | Payment Status table + RLS |
| 2 | `ONBOARDING_PRE_ONBOARDING.sql` | Pre-Onboarding + Pre-Onboarding Checklist |
| 3 | (POC Checklist – included only in `SUPABASE_UPDATE_ALL.sql`) | POC Checklist table + RLS |
| 4 | `ONBOARDING_POC_DETAILS.sql` | POC Details |
| 5 | `ONBOARDING_DETAILS_COLLECTED_CHECKLIST.sql` | Details Collected Checklist |
| 6 | `ONBOARDING_ITEM_CLEANING.sql` | Item Cleaning |
| 7 | `ONBOARDING_ITEM_CLEANING_CHECKLIST.sql` | Item Cleaning Checklist |
| 8 | `ONBOARDING_ORG_MASTER_ID.sql` | Org & Master ID |
| 9 | `ONBOARDING_ORG_MASTER_CHECKLIST.sql` | Org & Master Checklist |
| 10 | `ONBOARDING_SETUP_CHECKLIST.sql` | Setup Checklist |
| 11 | `ONBOARDING_ITEM_STOCK_CHECKLIST.sql` | Item & Stock Checklist |
| 12 | `ONBOARDING_FINAL_SETUP.sql` | Final Setup |
| 13 | `FEATURE_LIST_RLS.sql` | RLS for `feature_list` (table must exist) |

---

## Client Training

**Client Training** (Training → Client Training) does **not** need any new Supabase tables. It uses:

- `onboarding_payment_status`
- `onboarding_final_setup` (only rows where `data->>'final_status' = 'Done'`)

So as long as you’ve run the Onboarding + Final Setup parts above, Client Training will work after you run `SUPABASE_UPDATE_ALL.sql`.
