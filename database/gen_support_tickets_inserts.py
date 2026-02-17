#!/usr/bin/env python3
"""Generate INSERT statements for support_tickets from tab-separated data. Reads from stdin or first arg file."""
import sys
import re
from datetime import datetime

def escape_sql(s):
    if s is None:
        return "NULL"
    t = str(s).replace("\\", "\\\\").replace("'", "''").strip()
    if not t:
        return "NULL"
    return "'" + t.replace("\n", " ").replace("\r", " ") + "'"

def parse_date(ts):
    """Parse M/D/YYYY H:MM:SS or MM/DD/YYYY H:MM:SS to ISO timestamp."""
    if not ts or not str(ts).strip():
        return None
    ts = str(ts).strip()
    try:
        # Try with time
        for fmt in ("%m/%d/%Y %H:%M:%S", "%m/%d/%y %H:%M:%S", "%d/%m/%Y %H:%M:%S"):
            try:
                dt = datetime.strptime(ts[:19], fmt)
                return dt.strftime("%Y-%m-%d %H:%M:%S+00")
            except ValueError:
                continue
        # Date only
        for fmt in ("%m/%d/%Y", "%Y-%m-%d"):
            try:
                dt = datetime.strptime(ts[:10], fmt)
                return dt.strftime("%Y-%m-%d 00:00:00+00")
            except ValueError:
                continue
    except Exception:
        pass
    return None

def main():
    out = open(sys.argv[2], "w", encoding="utf-8") if len(sys.argv) > 2 else None
    raw = sys.stdin.read() if not sys.argv[1:] else open(sys.argv[1], encoding="utf-8", errors="replace").read()
    lines = [ln for ln in raw.splitlines() if ln.strip()]
    if not lines:
        return
    # Skip header
    start = 0
    if lines[0].lower().startswith("timestamp") or "Reference No" in lines[0]:
        start = 1
    rows = []
    for line in lines[start:]:
        parts = line.split("\t")
        if len(parts) < 10:
            continue
        # Reference No: last non-empty
        ref = ""
        for i in range(len(parts) - 1, -1, -1):
            if parts[i].strip():
                ref = parts[i].strip()
                break
        if not ref:
            continue
        ts_str = parts[0].strip() if parts else ""
        title = parts[1].strip() if len(parts) > 1 else ""
        desc = parts[2].strip() if len(parts) > 2 else ""
        type_req = parts[4].strip() if len(parts) > 4 else ""
        page = parts[5].strip() if len(parts) > 5 else ""
        company = parts[6].strip() if len(parts) > 6 else ""
        submitted = parts[11].strip() if len(parts) > 11 else ""
        query_arrival = parts[12].strip() if len(parts) > 12 else ts_str
        query_resp = parts[15].strip() if len(parts) > 15 else ""
        created_at = parse_date(ts_str) or parse_date(query_arrival)
        if not created_at:
            created_at = "2024-01-01 00:00:00+00"
        desc_full = f"{title}. {desc}".strip()
        if desc_full:
            desc_full += f" Original Ref: {ref}"
        else:
            desc_full = f"Original Ref: {ref}"
        rows.append({
            "old_reference_no": ref,
            "description": desc_full,
            "title": title,
            "type_of_request": type_req or None,
            "page": page or None,
            "company_name": company or None,
            "submitted_by": submitted or None,
            "created_at": created_at,
            "query_arrival_at": parse_date(query_arrival),
            "query_response_at": parse_date(query_resp) if query_resp else None,
        })
    def w(s):
        (out or sys.stdout).write(s + "\n")

    # Output SQL
    w("-- Bulk INSERT for support_tickets (generated). Run in Supabase after SUPPORT_TICKETS_TABLE.sql")
    w("-- Delete sample rows first if you already ran SUPPORT_TICKETS_MIGRATION.sql:")
    w("-- DELETE FROM public.support_tickets WHERE response_source = 'upload';")
    w("")
    for r in rows:
        q_arr = (escape_sql(r["query_arrival_at"]) + "::TIMESTAMPTZ") if r["query_arrival_at"] else "NULL"
        q_resp = (escape_sql(r["query_response_at"]) + "::TIMESTAMPTZ") if r["query_response_at"] else "NULL"
        desc_trunc = (r["description"][:5000] if r["description"] else "").replace("'", "''").replace("\\", "\\\\").replace("\n", " ").replace("\r", " ")
        desc_sql = "'" + desc_trunc + "'" if desc_trunc else "NULL"
        w(f"""INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  {escape_sql(r['old_reference_no'])},
  {desc_sql},
  'Pending',
  'Pending',
  '{r['created_at']}'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  {escape_sql(r['title'][:500]) if r['title'] else 'NULL'},
  {escape_sql(r['type_of_request']) if r['type_of_request'] else 'NULL'},
  {escape_sql(r['page'][:250]) if r['page'] else 'NULL'},
  {escape_sql(r['company_name'][:250]) if r['company_name'] else 'NULL'},
  {escape_sql(r['submitted_by'][:250]) if r['submitted_by'] else 'NULL'},
  {q_arr},
  {q_resp}
);""")
    if out:
        out.close()

if __name__ == "__main__":
    main()
