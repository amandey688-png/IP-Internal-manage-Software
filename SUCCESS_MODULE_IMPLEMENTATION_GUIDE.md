# Success Module – Performance Monitoring: Step-by-Step Implementation Guide

This guide covers building the **Success** module with the **Performance Monitoring** section in your FastAPI + Supabase project.

---

## Overview

| Part | Description |
|------|-------------|
| **Part 1** | Add POC Details Form – company, message owner, response, contact; generates reference (e.g. INDU0001) |
| **Part 2** | Training Form – per-ticket button; call/message POC, training date/status, features committed |
| **Part 3** | Followup System – one followup per selected feature; previous/current percentage |
| **Part 4** | Percentage Logic – equal split by features, 100% cap, “Completed Company” when done |
| **Part 5** | Technical – FastAPI, Supabase, UUIDs, FK constraints, edge cases |

---

## Step 1: Database Schema (SQL)

**Run** `database/SUCCESS_PERFORMANCE_MONITORING.sql` in Supabase SQL Editor.  
(SQL file is included in the project. Copy its contents into Supabase → SQL Editor → New query → Run.)

<details>
<summary>View full schema (or use the file directly)</summary>

```sql
-- ============================================================================
-- SUCCESS MODULE - Performance Monitoring
-- ============================================================================
-- Run after RUN_IN_SUPABASE.sql (companies table exists)
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PART 1: performance_monitoring (POC Details)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.performance_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    message_owner TEXT NOT NULL CHECK (message_owner IN ('yes', 'no')),
    response TEXT,
    contact TEXT,
    reference_no TEXT NOT NULL UNIQUE,
    completion_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress', 'completed')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_monitoring_company ON public.performance_monitoring(company_id);
CREATE INDEX IF NOT EXISTS idx_performance_monitoring_status ON public.performance_monitoring(completion_status);
CREATE INDEX IF NOT EXISTS idx_performance_monitoring_ref ON public.performance_monitoring(reference_no);

-- Function: Generate reference_no (first 4 letters of company + 0001, 0002, ... per company)
CREATE OR REPLACE FUNCTION public.generate_performance_reference(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
    company_prefix TEXT;
    next_num INT;
BEGIN
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 4))
    INTO company_prefix
    FROM public.companies WHERE id = p_company_id;
    
    IF company_prefix IS NULL OR LENGTH(company_prefix) < 1 THEN
        company_prefix := 'XXXX';
    END IF;
    
    SELECT COALESCE(MAX(
        CAST(NULLIF(REGEXP_REPLACE(reference_no, '^[A-Z]{1,4}', ''), '') AS INT)
    ), 0) + 1
    INTO next_num
    FROM public.performance_monitoring
    WHERE company_id = p_company_id
      AND reference_no ~ ('^' || company_prefix || '[0-9]+$');
    
    RETURN company_prefix || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 2: feature_list (master list of features)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.feature_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.feature_list (name, display_order) VALUES
    ('Indent', 1), ('PO', 2), ('GRN', 3), ('Issue', 4), ('Item Approval', 5),
    ('Reorder Level', 6), ('RFQ', 7), ('QC', 8), ('Gate Pass', 9), ('Work Order', 10),
    ('CC in Issue', 11), ('Location in Stock', 12), ('Vendor Approval', 13),
    ('Negotiation', 14), ('Physical Stock Taking', 15), ('Payment Management', 16),
    ('Budget', 17), ('Scrap', 18), ('Mandatory Vendor', 19)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PART 2: performance_training (Training Form per ticket)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.performance_training (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performance_id UUID NOT NULL REFERENCES public.performance_monitoring(id) ON DELETE CASCADE,
    call_poc TEXT NOT NULL CHECK (call_poc IN ('yes', 'no')),
    message_poc TEXT NOT NULL CHECK (message_poc IN ('yes', 'no')),
    message_owner TEXT NOT NULL CHECK (message_owner IN ('yes', 'no')),
    training_schedule_date DATE,
    training_status TEXT NOT NULL CHECK (training_status IN ('yes', 'no')),
    remarks TEXT,
    total_percentage NUMERIC(5,2) DEFAULT 0 CHECK (total_percentage >= 0 AND total_percentage <= 100),
    previous_percentage NUMERIC(5,2) DEFAULT 0,
    current_percentage NUMERIC(5,2) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(performance_id)
);

CREATE INDEX IF NOT EXISTS idx_performance_training_perf ON public.performance_training(performance_id);

-- ============================================================================
-- PART 2: ticket_features (features committed per training)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ticket_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_id UUID NOT NULL REFERENCES public.performance_training(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES public.feature_list(id) ON DELETE CASCADE,
    UNIQUE(training_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_features_training ON public.ticket_features(training_id);
CREATE INDEX IF NOT EXISTS idx_ticket_features_feature ON public.ticket_features(feature_id);

-- ============================================================================
-- PART 3: feature_followups (one per feature per ticket)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.feature_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_feature_id UUID NOT NULL REFERENCES public.ticket_features(id) ON DELETE CASCADE,
    previous_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    feature_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'pending')),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ticket_feature_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_followups_ticket_feature ON public.feature_followups(ticket_feature_id);

-- ============================================================================
-- RLS (optional - adjust as per your auth)
-- ============================================================================
ALTER TABLE public.performance_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_followups ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (or restrict by role)
DROP POLICY IF EXISTS performance_select ON public.performance_monitoring;
CREATE POLICY performance_select ON public.performance_monitoring FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS performance_insert ON public.performance_monitoring;
CREATE POLICY performance_insert ON public.performance_monitoring FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS performance_update ON public.performance_monitoring;
CREATE POLICY performance_update ON public.performance_monitoring FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS training_select ON public.performance_training;
CREATE POLICY training_select ON public.performance_training FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS training_insert ON public.performance_training;
CREATE POLICY training_insert ON public.performance_training FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS training_update ON public.performance_training;
CREATE POLICY training_update ON public.performance_training FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS ticket_features_select ON public.ticket_features;
CREATE POLICY ticket_features_select ON public.ticket_features FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS ticket_features_insert ON public.ticket_features;
CREATE POLICY ticket_features_insert ON public.ticket_features FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS followups_select ON public.feature_followups;
CREATE POLICY followups_select ON public.feature_followups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS followups_insert ON public.feature_followups;
CREATE POLICY followups_insert ON public.feature_followups FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS followups_update ON public.feature_followups;
CREATE POLICY followups_update ON public.feature_followups FOR UPDATE TO authenticated USING (true);
```

</details>

---

## Step 2: API Endpoints

### 2.1 Part 1 – POC Details

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies` | Already exists – list companies for dropdown |
| POST | `/api/success/performance/poc` | Create POC details; generates `reference_no` |

**Request:**
```json
{
  "company_id": "uuid",
  "message_owner": "yes",
  "response": "text",
  "contact": "text"
}
```

**Response:**
```json
{
  "id": "uuid",
  "company_id": "uuid",
  "company_name": "Industry Prime",
  "message_owner": "yes",
  "response": "...",
  "contact": "...",
  "reference_no": "INDU0001",
  "completion_status": "in_progress",
  "created_at": "2026-02-27T10:00:00Z"
}
```

### 2.2 Part 2 – Training Form

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/success/performance/list` | List performance tickets (with filters) |
| GET | `/api/success/features` | List `feature_list` for dropdown |
| POST | `/api/success/performance/{id}/training` | Create/update training + ticket_features |

**Request:**
```json
{
  "call_poc": "yes",
  "message_poc": "no",
  "message_owner": "yes",
  "training_schedule_date": "2026-03-15",
  "training_status": "yes",
  "remarks": "long text",
  "feature_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "performance_id": "uuid",
  "total_percentage": 0,
  "previous_percentage": 0,
  "current_percentage": 0,
  "feature_count": 3,
  "features": [
    { "id": "uuid", "name": "Indent" },
    { "id": "uuid", "name": "PO" },
    { "id": "uuid", "name": "GRN" }
  ]
}
```

### 2.3 Part 3 – Followup System

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/success/performance/{id}/followups` | Add/update followups (one per feature) |
| GET | `/api/success/performance/{id}/followups` | List followups for a ticket |

**Request:**
```json
{
  "followups": [
    {
      "ticket_feature_id": "uuid",
      "previous_percentage": 0,
      "feature_name": "Indent",
      "status": "completed",
      "remarks": "..."
    },
    {
      "ticket_feature_id": "uuid",
      "previous_percentage": 33.33,
      "feature_name": "PO",
      "status": "pending",
      "remarks": "..."
    }
  ]
}
```

### 2.4 Part 4 – Percentage Logic

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/success/performance/{id}/followup-complete` | Mark a feature completed; backend recalculates % |
| GET | `/api/success/performance/{id}` | Full ticket with percentages, features, followups |

---

## Step 3: Percentage Calculation Logic (Backend)

### Rules

1. Each selected feature = `100 / N` percent (N = number of features).
2. When feature status = `completed`: add its share to `total_percentage`.
3. `total_percentage` never exceeds 100 (enforced in backend).
4. When all features completed: set `completion_status = 'completed'` on `performance_monitoring`.

### Pseudocode

```python
def calculate_percentage(training_id: str) -> dict:
    # 1. Get ticket_features for this training
    features = get_ticket_features(training_id)
    N = len(features)
    if N == 0:
        return {"total": 0, "per_feature": 0}
    
    per_feature = 100.0 / N  # e.g. 4 features → 25% each
    
    # 2. Get followups; count completed
    followups = get_followups_for_features([f.id for f in features])
    completed_count = sum(1 for fu in followups if fu.status == "completed")
    
    # 3. Cap at 100
    total = min(100.0, completed_count * per_feature)
    
    # 4. If all completed, mark performance_monitoring as completed
    if completed_count >= N:
        update_performance_completion_status(training.performance_id, "completed")
    
    return {"total_percentage": round(total, 2), "previous_percentage": ..., "current_percentage": per_feature}
```

### Edge Cases

| Case | Handling |
|------|----------|
| 0 features selected | Reject training submit; require at least 1 feature |
| Duplicate feature completion | UNIQUE on `(ticket_feature_id)` in `feature_followups` – one followup per feature |
| Total > 100% | `CHECK (total_percentage <= 100)` + backend `min(100, ...)` |
| Fractional rounding | Store `NUMERIC(5,2)`; round to 2 decimals |
| Re-marking completed→pending | Recalculate; subtract that feature’s share from total |

---

## Step 4: Example JSON Responses

### POC List (In Progress)

```json
{
  "items": [
    {
      "id": "uuid",
      "reference_no": "INDU0001",
      "company_name": "Industry Prime",
      "message_owner": "yes",
      "completion_status": "in_progress",
      "total_percentage": 50,
      "created_at": "2026-02-27T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Full Ticket with Training + Followups

```json
{
  "id": "uuid",
  "reference_no": "INDU0001",
  "company_name": "Industry Prime",
  "message_owner": "yes",
  "response": "...",
  "contact": "...",
  "completion_status": "in_progress",
  "training": {
    "id": "uuid",
    "call_poc": "yes",
    "message_poc": "no",
    "training_schedule_date": "2026-03-15",
    "training_status": "yes",
    "total_percentage": 50,
    "previous_percentage": 25,
    "current_percentage": 25
  },
  "features": [
    { "id": "uuid", "name": "Indent", "status": "completed" },
    { "id": "uuid", "name": "PO", "status": "completed" },
    { "id": "uuid", "name": "GRN", "status": "pending" },
    { "id": "uuid", "name": "Issue", "status": "pending" }
  ],
  "followups": [
    {
      "ticket_feature_id": "uuid",
      "feature_name": "Indent",
      "previous_percentage": 0,
      "status": "completed",
      "remarks": "Done"
    },
    {
      "ticket_feature_id": "uuid",
      "feature_name": "PO",
      "previous_percentage": 25,
      "status": "completed",
      "remarks": "Done"
    }
  ]
}
```

---

## Step 5: Implementation Order

### Phase 1 – Database & Part 1

1. Run `database/SUCCESS_PERFORMANCE_MONITORING.sql` in Supabase.
2. Add `POST /api/success/performance/poc` in `backend/app/main.py`.
3. Create `fms-frontend/src/pages/Success/PerformanceMonitoringPage.tsx` with Add POC Details form.
4. Add route `/success/performance` and sidebar entry under “Success”.

### Phase 2 – Part 2 (Training Form)

1. Add `GET /api/success/features` and `GET /api/success/performance/list`.
2. Add `POST /api/success/performance/{id}/training`.
3. Add “Training” button next to each row in the performance list.
4. Add `TrainingFormModal` with all fields + multi-select features.

### Phase 3 – Part 3 & 4 (Followup + Percentage)

1. Add `POST /api/success/performance/{id}/followups`.
2. Add percentage calculation logic in backend.
3. Add followup UI – one row per feature, previous % auto-filled.
4. Add “Completed Company” view – filter `completion_status = 'completed'`.

### Phase 4 – Polish

1. Add RLS policies per your role model.
2. Add section permission `success_performance` in constants and user permissions.
3. Add unit tests for percentage calculation and reference generation.

---

## Step 6: Frontend Structure

```
fms-frontend/src/
├── pages/
│   └── Success/
│       └── PerformanceMonitoringPage.tsx   # Main page with tabs/sections
├── components/
│   └── Success/
│       ├── AddPOCDetailsForm.tsx
│       ├── PerformanceList.tsx
│       ├── TrainingFormModal.tsx
│       └── FollowupForm.tsx
├── api/
│   └── success.ts
```

### Constants to Add

```typescript
// utils/constants.ts
ROUTES.SUCCESS_PERFORMANCE = '/success/performance'
SECTION_LABELS.success_performance = 'Performance Monitoring'
```

---

## Step 7: Reference Number Generation (SQL Alternative)

If you prefer app-side generation:

```python
def generate_performance_reference(company_id: str) -> str:
    # Get company name
    r = supabase.table("companies").select("name").eq("id", company_id).single().execute()
    name = (r.data or {}).get("name", "XXXX")
    prefix = "".join(c for c in name.upper() if c.isalpha())[:4] or "XXXX"
    
    # Get max seq for this company (refs starting with prefix)
    rows = supabase.table("performance_monitoring").select("reference_no").eq("company_id", company_id).execute()
    nums = []
    for row in (rows.data or []):
        ref = row.get("reference_no", "")
        if ref.startswith(prefix) and ref[len(prefix):].isdigit():
            nums.append(int(ref[len(prefix):]))
    next_num = max(nums, default=0) + 1
    return f"{prefix}{next_num:04d}"
```

---

## Summary Checklist

- [ ] Run `SUCCESS_PERFORMANCE_MONITORING.sql`
- [ ] Implement `POST /api/success/performance/poc`
- [ ] Implement `GET /api/success/performance/list`, `GET /api/success/features`
- [ ] Implement `POST /api/success/performance/{id}/training`
- [ ] Implement `POST /api/success/performance/{id}/followups` + percentage logic
- [ ] Add Success > Performance Monitoring route and sidebar
- [ ] Add POC form, Training modal, Followup form
- [ ] Add “Completed Company” section
- [ ] Add section permission and tests
