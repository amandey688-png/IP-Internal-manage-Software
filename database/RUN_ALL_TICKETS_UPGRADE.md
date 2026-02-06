# All Tickets Upgrade - Database Migration

Run this migration in Supabase SQL Editor to enable the enterprise ticket management features.

## Prerequisites

1. Run `FRESH_SETUP.sql` (or have existing FMS schema)
2. Run `DASHBOARD_UPGRADE.sql` (companies, pages, divisions tables)

## Migration

Execute `ALL_TICKETS_UPGRADE.sql` in Supabase SQL Editor.

This adds:

- **ticket_responses** table - Response history per ticket
- **division_other**, **approval_status**, **remarks**, **actual_time_seconds** columns to tickets
- New reference_no format: CH/0001, BU/0001, FE/0001 (by type)
- Indexes for performance
- Trigger to compute actual_time on resolve

## Verification

```sql
-- Check ticket_responses exists
SELECT * FROM ticket_responses LIMIT 1;

-- Check new columns
SELECT division_other, approval_status, remarks, actual_time_seconds FROM tickets LIMIT 1;
```
