#!/usr/bin/env python3
"""
Generate INSERT statements for public.tickets from Pending and Hold TSV data.
- Description includes " Old Ref: <ref> Time Delay: <time_delay>" (and " Status: Hold" for hold).
- company_id resolved from COMPANY_ID_MAPPING.txt (alias -> uuid).
- Run: python gen_tickets_pending_hold.py pending.tsv hold.tsv > TICKETS_BULK_INSERT_PENDING_AND_HOLD.sql
  Or paste TSV data into pending.tsv and hold.tsv (tab-separated, header row).
"""
import sys
import re
from datetime import datetime

def load_company_mapping(path="COMPANY_ID_MAPPING.txt"):
    m = {}
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parts = line.split("\t", 1)
                if len(parts) >= 2:
                    m[parts[0].strip()] = parts[1].strip()
    except FileNotFoundError:
        pass
    return m

def escape_sql(s):
    if s is None or (isinstance(s, str) and not s.strip()):
        return "NULL"
    t = str(s).replace("\\", "\\\\").replace("'", "''").strip().replace("\n", " ").replace("\r", " ")
    if not t:
        return "NULL"
    return "'" + t + "'"

def parse_date(ts):
    if not ts or not str(ts).strip():
        return None
    ts = str(ts).strip()
    for fmt in ("%m/%d/%Y %H:%M:%S", "%m/%d/%Y %H:%M", "%m/%d/%Y", "%d/%m/%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            dt = datetime.strptime(ts[:19].replace("-", "/"), fmt.replace("-", "/"))
            return dt.strftime("%Y-%m-%d %H:%M:%S+00")
        except ValueError:
            continue
    return None

def type_to_db(t):
    if not t:
        return "chore"
    t = str(t).strip().lower()
    if "bug" in t:
        return "bug"
    if "chore" in t:
        return "chore"
    return "chore"

def comm_to_db(c):
    if not c or not str(c).strip():
        return "NULL"
    c = str(c).strip().lower()
    if "phone" in c:
        return "'phone'"
    if "mail" in c or "email" in c:
        return "'mail'"
    if "chat" in c or "whatsapp" in c:
        return "'whatsapp'"
    return "NULL"

def parse_tsv_row(parts, ref_col=15, time_delay_col=16):
    """Parse row; columns: 0=Title, 1=Description, 2=Attachment, 3=Type, 4=Page, 5=Company, 6=Users Name, 7=Division, 8=Other, 9=Comm, 10=Submitted By, 11=Query Arrival, 12=Quality, 13=Customer Q, 14=Query Response, 15=Ref No, 16=Time Delay."""
    if len(parts) <= max(ref_col, time_delay_col):
        return None
    ref = parts[ref_col].strip() if ref_col < len(parts) else ""
    time_delay = parts[time_delay_col].strip() if time_delay_col < len(parts) else ""
    if not ref:
        return None
    title = parts[0].strip() if len(parts) > 0 else ""
    desc_base = parts[1].strip() if len(parts) > 1 else ""
    attachment = parts[2].strip() if len(parts) > 2 else ""
    type_req = type_to_db(parts[3] if len(parts) > 3 else "")
    page = parts[4].strip() if len(parts) > 4 else ""
    company_name = parts[5].strip() if len(parts) > 5 else ""
    user_name = parts[6].strip() if len(parts) > 6 else ""
    division = parts[7].strip() if len(parts) > 7 else "All"
    division_other = parts[8].strip() if len(parts) > 8 else ""
    comm = comm_to_db(parts[9] if len(parts) > 9 else "")
    submitted_by = parts[10].strip() if len(parts) > 10 else ""
    query_arrival = parts[11].strip() if len(parts) > 11 else ""
    quality = parts[12].strip() if len(parts) > 12 else ""
    customer_q = parts[13].strip() if len(parts) > 13 else ""
    query_resp = parts[14].strip() if len(parts) > 14 else ""
    created_at_iso = parse_date(query_arrival)
    created_at_sql = f"'{created_at_iso}'::TIMESTAMPTZ" if created_at_iso else "NOW()"
    query_arrival_sql = f"'{created_at_iso}'::TIMESTAMPTZ" if created_at_iso else "NULL"
    query_resp_sql = "NULL"
    if query_resp:
        qr = parse_date(query_resp)
        if qr:
            query_resp_sql = f"'{qr}'::TIMESTAMPTZ"
    return {
        "reference_no": ref,
        "title": title,
        "desc_base": desc_base,
        "attachment": attachment,
        "type": type_req,
        "page": page,
        "company_name": company_name,
        "user_name": user_name,
        "division": division,
        "division_other": division_other,
        "comm": comm,
        "submitted_by": submitted_by,
        "query_arrival": query_arrival,
        "quality": quality,
        "customer_q": customer_q,
        "query_resp_sql": query_resp_sql,
        "time_delay": time_delay,
        "created_at_sql": created_at_sql,
        "query_arrival_sql": query_arrival_sql,
    }

def build_description(row, include_status_hold=False):
    desc = (row["desc_base"] or "").strip()
    suffix = f" Old Ref: {row['reference_no']} Time Delay: {row['time_delay']}"
    if include_status_hold:
        suffix += " Status: Hold"
    if desc:
        return desc + suffix
    return suffix.strip()

def main():
    if len(sys.argv) < 3:
        print("Usage: python gen_tickets_pending_hold.py <pending.tsv> <hold.tsv> [company_mapping.txt]", file=sys.stderr)
        sys.exit(1)
    pending_path = sys.argv[1]
    hold_path = sys.argv[2]
    mapping_path = sys.argv[3] if len(sys.argv) > 3 else "COMPANY_ID_MAPPING.txt"
    company_map = load_company_mapping(mapping_path)

    def resolve_company_id(name):
        if not name:
            return "(SELECT id FROM public.companies ORDER BY id ASC LIMIT 1)"
        name = name.strip()
        uid = company_map.get(name) or company_map.get(name.replace("_", " "))
        if uid:
            return f"'{uid}'::uuid"
        return "(SELECT id FROM public.companies ORDER BY id ASC LIMIT 1)"

    def emit_insert(rows, status, include_status_hold):
        if not rows:
            return
        print("-- " + status.upper() + " tickets: description includes Old Ref, Time Delay" + (" and Status: Hold" if include_status_hold else ""))
        print("INSERT INTO public.tickets (")
        print("  reference_no, title, description, type, status, priority,")
        print("  company_id, division_id, created_by, created_at, updated_at,")
        print("  attachment_url, page, company_name, division, division_other, user_name,")
        print("  communicated_through, submitted_by, query_arrival_at, quality_of_response,")
        print("  customer_questions, query_response_at")
        print(") VALUES")
        values_lines = []
        for r in rows:
            desc = build_description(r, include_status_hold)
            company_id = resolve_company_id(r["company_name"])
            att = r["attachment"]
            att_sql = escape_sql(att) if (att and att.strip()) else "NULL"
            values_lines.append(
                f"  ({escape_sql(r['reference_no'])}, {escape_sql(r['title'][:500])}, {escape_sql(desc[:8000])}, "
                f"{escape_sql(r['type'])}, '{status}', 'medium', "
                f"{company_id}, NULL, (SELECT id FROM public.user_profiles ORDER BY id ASC LIMIT 1), "
                f"{r['created_at_sql']}, NOW(), "
                f"{att_sql}, {escape_sql(r['page'][:200])}, "
                f"{escape_sql(r['company_name'][:200])}, {escape_sql(r['division'][:100])}, "
                f"{escape_sql(r['division_other'][:200]) or 'NULL'}, {escape_sql(r['user_name'][:200])}, "
                f"{r['comm']}, {escape_sql(r['submitted_by'][:200])}, "
                f"{r['query_arrival_sql']}, {escape_sql(r['quality'][:500]) or 'NULL'}, "
                f"{escape_sql(r['customer_q'][:1000]) or 'NULL'}, {r['query_resp_sql']})"
            )
        print(",\n".join(values_lines))
        print("ON CONFLICT (reference_no) DO NOTHING;")
        print()

    def normalize_tsv_lines(lines, ref_col=15):
        """Merge lines that are continuations (e.g. multiline description). Expect 17 columns = 16 tabs per row."""
        if not lines:
            return lines
        out = []
        buf = []
        for line in lines:
            buf.append(line)
            joined = " ".join(buf)
            parts = joined.split("\t")
            if len(parts) > ref_col and parts[ref_col].strip():
                ref = parts[ref_col].strip()
                if ref and (ref.startswith("CH-") or ref.startswith("BU-")):
                    out.append(joined)
                    buf = []
        if buf:
            out.append(" ".join(buf))
        return out

    # Parse pending
    pending_rows = []
    try:
        with open(pending_path, encoding="utf-8", errors="replace") as f:
            raw_lines = f.read().splitlines()
    except FileNotFoundError:
        print(f"-- No file: {pending_path}", file=sys.stderr)
    else:
        start = 1 if raw_lines and ("Reference No" in raw_lines[0] or "Title" in raw_lines[0]) else 0
        data_lines = normalize_tsv_lines(raw_lines[start:])
        for line in data_lines:
            parts = line.split("\t")
            row = parse_tsv_row(parts)
            if row:
                pending_rows.append(row)

    # Parse hold
    hold_rows = []
    try:
        with open(hold_path, encoding="utf-8", errors="replace") as f:
            raw_lines = f.read().splitlines()
    except FileNotFoundError:
        print(f"-- No file: {hold_path}", file=sys.stderr)
    else:
        start = 1 if raw_lines and ("Reference No" in raw_lines[0] or "Title" in raw_lines[0]) else 0
        data_lines = normalize_tsv_lines(raw_lines[start:])
        for line in data_lines:
            parts = line.split("\t")
            row = parse_tsv_row(parts)
            if row:
                hold_rows.append(row)

    print("-- Bulk INSERT into public.tickets (Pending + Hold).")
    print("-- Run TICKETS_ADD_SUPPORT_COLUMNS.sql first. Requires companies and user_profiles.")
    print("-- Description format: <base> Old Ref: <ref> Time Delay: <days> [Status: Hold]")
    print()
    emit_insert(pending_rows, "open", include_status_hold=False)
    emit_insert(hold_rows, "on_hold", include_status_hold=True)

if __name__ == "__main__":
    main()
