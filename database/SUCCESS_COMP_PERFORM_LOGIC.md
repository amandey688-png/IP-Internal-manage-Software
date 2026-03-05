# Comp- Perform & Performance Monitoring – Supabase logic

## No schema change required

The existing `performance_monitoring` table already has:

- `completion_status` TEXT with values `'in_progress'` or `'completed'`

No new tables or columns are needed for **Comp- Perform**.

---

## When does a company move to Comp- Perform?

1. **Performance Monitoring** lists only rows with `completion_status = 'in_progress'`.
2. **Comp- Perform** lists only rows with `completion_status = 'completed'`.

The backend sets `completion_status = 'completed'` when **all features are completed** for that ticket:

- When the user submits a **followup** with status **Completed** for a feature, the API checks if every `ticket_feature` for that performance ticket has at least one `feature_followups` row with `status = 'completed'`.
- If that is true, the backend runs:

  ```text
  UPDATE performance_monitoring
  SET completion_status = 'completed', updated_at = NOW()
  WHERE id = <ticket_id>
  ```

So:

- **Supabase**: No migration or SQL to run. The column and logic already exist.
- **Application**:  
  - **Performance Monitoring** uses `GET /success/performance/list?completion_status=in_progress`.  
  - **Comp- Perform** uses `GET /success/performance/list?completion_status=completed`.

Once `completion_status` is set to `'completed'`, the row disappears from Performance Monitoring and appears only in Comp- Perform.
