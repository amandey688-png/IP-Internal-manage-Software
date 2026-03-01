# Performance Monitoring - Step-by-Step Setup Guide

## Overview

This guide covers the complete setup for the Performance Monitoring module including POC, Training, Followups, and all related features.

---

## Step 1: Run SQL Migrations in Order

Run these SQL scripts in the **Supabase SQL Editor** in this exact order:

### 1.1 Base Schema (Part 1)
- **File:** `SUCCESS_PERFORMANCE_MONITORING.sql`
- **What it does:** Creates `performance_monitoring`, `feature_list`, `performance_training`, `ticket_features`, `feature_followups` tables and RLS policies.
- **How:** Copy the entire file content → Supabase Dashboard → SQL Editor → Paste → Run

### 1.2 Training & Followups (Part 2 & 3)
- **File:** `SUCCESS_PERFORMANCE_PART2_PART3.sql`
- **What it does:** Adds `status` to ticket_features; allows multiple followups per feature; adds `added_percentage` and `total_percentage` to feature_followups.
- **How:** Same as above. Run after Part 1.

### 1.3 Initial Percentage & 24hr Lock (Part 4)
- **File:** `SUCCESS_PERFORMANCE_PART4.sql`
- **What it does:** Adds `initial_percentage` (1st time user-entered base %) and `features_committed_at` (locks Feature Committed for Use after 24hr).
- **How:** Same as above. Run after Part 2 & 3.

---

## Step 2: Verify Tables

Run this in Supabase SQL Editor to verify all tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('performance_monitoring', 'performance_training', 'ticket_features', 'feature_list', 'feature_followups')
ORDER BY table_name;
```

You should see 5 rows.

---

## Step 3: Verify New Columns (Part 4)

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'performance_training'
  AND column_name IN ('initial_percentage', 'features_committed_at');
```

You should see `initial_percentage` and `features_committed_at`.

---

## Step 4: Start Backend

```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## Step 5: Start Frontend

```bash
cd fms-frontend
npm run dev
```

---

## Feature Summary

| Feature | Description |
|---------|-------------|
| **POC** | Add POC details (Company, Message Owner, Response, Contact). All mandatory except Remarks. |
| **Training** | Call POC, Message POC, Message Owner, Training Schedule Date, Training Status, Feature Committed for Use. All mandatory except Remarks. **Feature Committed** locks after 24 hours. |
| **Followup** | 1st time: user enters **Initial %** (base % already completed). Remaining (100 - initial) divided equally among features. Each completed feature adds its share. Status & Remarks per followup. |
| **View Details** | Full ticket details, **Current Stage** (where it's pending), **Pending features**, and action buttons (Training, Followup). |
| **Status Column** | Shows **Current Stage** instead of generic Status (e.g. "Followup: 2/5 completed - Pending: Issue, Item Approval"). |
| **Filters** | Filter by Reference Number and Company Name. |

---

## Troubleshooting

### "duplicate key violates unique constraint performance_training_performance_id_key"
- Backend uses upsert; ensure you restarted the backend after the latest code.

### "First followup: enter Initial percentage"
- For the first followup entry, you must enter **Initial %** (base % you already completed). Remaining % is divided equally among features.

### Feature Committed for Use is disabled
- Locked after 24 hours. Other Training fields (Call POC, Message POC, etc.) remain editable.

### Tables not found (503)
- Run all SQL migrations in order (Part 1 → Part 2 & 3 → Part 4).
