# Reference No (EX-CH/BU/FE-0001) & Time Delay – Step-by-Step Guide

## 1. Reference No: New Format "EX - CH / BU / FE -0001"

### What changed
- **Old format:** CH-000001, BU-000001, FE-000001 (or CH-1242, etc.).
- **New format:** EX-CH-0001, EX-BU-0001, EX-FE-0001 (then 0002, 0003, …).

### How it works
- The **database trigger** `generate_ticket_reference()` runs on INSERT when `reference_no` is NULL.
- It assigns the next number **per type** (chore / bug / feature) only for refs that already follow the new pattern (`EX-CH-%`, `EX-BU-%`, `EX-FE-%`).
- Existing tickets (CH-1242, BU-0011, FE-0129, etc.) are **unchanged**.
- **New tickets** (created from the app with no reference number) get EX-CH-0001, EX-BU-0001, EX-FE-0001 and so on.

### Steps to apply (database)
1. Run the migration once on your Postgres/Supabase DB:
   - **File:** `database/TICKETS_REFERENCE_EX_FORMAT.sql`
   - Or apply the same `CREATE OR REPLACE FUNCTION generate_ticket_reference() ...` from `fms_database_schema.sql`.
2. From then on, every new ticket inserted **without** a `reference_no` will get the new EX-* format automatically.

### No app code change for creation
- The app already inserts tickets with `reference_no` left unset (NULL), so the trigger will generate EX-CH-0001, EX-BU-0001, EX-FE-0001, etc., with no extra work.

---

## 2. Time Delay: Visible and Depending on Status

### What changed
- **Chores & Bugs:** Time Delay column now:
  - Uses **status-based** delay (current SLA stage) when available.
  - If that would be "-", it **falls back** to overall delay from `query_arrival_at` or `created_at` to now, so the value is **always visible** when a date exists.
- **Feature:** A **Time Delay** column was added. It shows overall delay from `query_arrival_at` or `created_at` to now (so it depends on “status” in the sense of “ticket still open / in progress”).

### Where it’s implemented
- **Helpers:** `getOverallDelaySeconds()`, `getTicketTimeDelayDisplay()` in `fms-frontend/src/utils/helpers.ts`.
- **Chores & Bugs list:** Time Delay column uses `getTicketTimeDelayDisplay()` (status-based with fallback).
- **Feature list:** New Time Delay column also uses `getTicketTimeDelayDisplay()` (overall delay).

### Steps (already done in code)
- No DB migration needed for time delay.
- Frontend: ensure you have the latest `helpers.ts` and `TicketList.tsx` (with the new Time Delay column for Feature).

---

## 3. Summary Checklist

| Item | Action |
|------|--------|
| New ref format EX-CH-0001, EX-BU-0001, EX-FE-0001 | Run `database/TICKETS_REFERENCE_EX_FORMAT.sql` once on your DB (or use updated schema). |
| Existing tickets | Keep current reference_no (CH-*, BU-*, FE-*). |
| New tickets | Get EX-* refs automatically when `reference_no` is NULL on insert. |
| Time Delay – Chores & Bugs | Visible; uses status (stage) when available, else overall delay. |
| Time Delay – Feature | New column; shows overall delay (query_arrival_at / created_at → now). |

---

## 4. Quick Test

1. **Reference No**
   - Create a new Chore/Bug/Feature ticket from the UI (without setting reference no).
   - Confirm it gets EX-CH-0001, EX-BU-0001, or EX-FE-0001 (or next number in sequence).
2. **Time Delay**
   - Open Support → Chores & Bugs: confirm Time Delay column shows a value (or "-" only when no dates).
   - Open Feature section: confirm Time Delay column appears and shows delay (or "-" when no dates).
