#!/usr/bin/env python3
"""Generate INSERT for Feature tickets. Reads feature_tickets.tsv (tab-separated).
Columns: Company Name, Users Name, Page, Division, Other, Attachment, Title, Description, Type, Communicated, Submitted By, Referance No, Why Feature ?, Numbers
Description in DB = (Title or Description) + " Old Ref: <ref> Time Delay: <Numbers> Day's"
reference_no = Referance No when provided (FE-xxxx), else FE-0129, FE-0130, ...
"""
import sys
import re

def escape_sql(s):
    if s is None or (isinstance(s, str) and not s.strip()):
        return "NULL"
    t = str(s).replace("\\", "\\\\").replace("'", "''").strip().replace("\n", " ").replace("\r", " ").replace("\u20b9", "Rs ")
    if not t:
        return "NULL"
    return "'" + t[:500] + "'"  # title limit

def escape_desc(s, maxlen=8000):
    if s is None or (isinstance(s, str) and not s.strip()):
        return ""
    t = str(s).replace("\\", "\\\\").replace("'", "''").strip().replace("\n", " ").replace("\r", " ").replace("\u20b9", "Rs ")
    return t[:maxlen]

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

# Page name fixes to match public.pages
PAGE_FIX = {
    "Quotation Comparision": "Quotation Comparison",
    "Pending Po (GRN)": "Pending PO (GRN)",
    "GRNs to Approve": "GRN Approval",
    "Physical Stocks to Approve": "Physical stocks to approve",
    "Non returnable gate pass": "Non-returnable Gate Pass",
}

def main():
    path = "feature_tickets.tsv"
    if len(sys.argv) > 1:
        path = sys.argv[1]
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            raw = f.read()
    except FileNotFoundError:
        print("-- No file:", path, file=sys.stderr)
        sys.exit(1)

    lines = raw.splitlines()
    start = 0
    if lines and ("Referance No" in lines[0] or "Company Name" in lines[0]):
        start = 1
    rows = []
    buf = []
    for line in lines[start:]:
        buf.append(line)
        joined = " ".join(buf).replace("\n", " ").replace("\r", " ")
        parts = joined.split("\t")
        if len(parts) >= 14:
            ref = parts[11].strip() if len(parts) > 11 else ""
            num = (parts[13].strip() if len(parts) > 13 else "").strip()
            if num.isdigit() or ref.startswith("FE-") or (len(parts) >= 14 and (num or ref or parts[0].strip())):
                row = parts[:14] if len(parts) >= 14 else parts + [""] * (14 - len(parts))
                if len(row) < 14:
                    row += [""] * (14 - len(row))
                rows.append(row)
                buf = []
    if buf:
        joined = " ".join(buf).replace("\n", " ").replace("\r", " ")
        parts = joined.split("\t")
        if len(parts) >= 14:
            row = parts[:14] if len(parts) >= 14 else parts + [""] * (14 - len(parts))
            rows.append(row)

    next_ref = 129
    values_lines = []
    company_refs = {}  # company_name -> [reference_no]
    for r in rows:
        company = r[0].strip() if len(r) > 0 else ""
        user = r[1].strip() if len(r) > 1 else ""
        page = r[2].strip() if len(r) > 2 else ""
        page = PAGE_FIX.get(page, page)
        division = (r[3].strip() or "All") if len(r) > 3 else "All"
        other = r[4].strip() if len(r) > 4 else ""
        attachment = r[5].strip() if len(r) > 5 else ""
        title = r[6].strip() if len(r) > 6 else ""
        desc_body = (r[7].strip() or title) if len(r) > 7 else title
        comm = comm_to_db(r[9] if len(r) > 9 else "")
        submitted = r[10].strip() if len(r) > 10 else ""
        old_ref = r[11].strip() if len(r) > 11 else ""  # Old ref only for description
        numbers = r[13].strip() if len(r) > 13 else "0"
        ref_no = f"FE-{next_ref:04d}"
        next_ref += 1
        # Use actual old ref from data (blank, numeric, or FE-xxx); never use new ref_no in description
        old_ref_text = old_ref if old_ref else "-"
        desc_full = escape_desc(desc_body) + f" Old Ref: {old_ref_text} Time Delay: {numbers} days"
        company_refs.setdefault(company, []).append(ref_no)
        att_sql = escape_sql(attachment) if attachment else "NULL"
        page_sql = escape_sql(page) if page else "NULL"
        page_id_sql = f"(SELECT id FROM public.pages WHERE name = {page_sql} LIMIT 1)" if page else "NULL"
        div_sql = escape_sql(division) if division else "NULL"
        other_sql = escape_sql(other) if other else "NULL"
        # query_arrival_at = NOW() - N days so system-computed time delay matches
        try:
            n_days = int(numbers) if numbers else 0
            query_arrival_sql = f"NOW() - interval '{n_days} days'" if n_days > 0 else "NULL"
        except ValueError:
            query_arrival_sql = "NULL"
        values_lines.append(
            f"  ({escape_sql(ref_no)}, {escape_sql(title[:500])}, {escape_sql(desc_full[:8000])}, "
            f"'feature', 'open', 'medium', (SELECT id FROM public.companies LIMIT 1), NULL, (SELECT id FROM public.user_profiles LIMIT 1), "
            f"NOW(), NOW(), {att_sql}, {page_sql}, {page_id_sql}, NULL, {div_sql}, {other_sql}, {escape_sql(user)}, "
            f"{comm}, {escape_sql(submitted)}, {query_arrival_sql}, NULL, NULL, NULL)"
        )

    out = []
    out.append("-- FEATURE tickets: description includes Old Ref and Time Delay (legacy data).")
    out.append("INSERT INTO public.tickets (")
    out.append("  reference_no, title, description, type, status, priority,")
    out.append("  company_id, division_id, created_by, created_at, updated_at,")
    out.append("  attachment_url, page, page_id, company_name, division, division_other, user_name,")
    out.append("  communicated_through, submitted_by, query_arrival_at, quality_of_response,")
    out.append("  customer_questions, query_response_at")
    out.append(") VALUES")
    out.append(",\n".join(values_lines))
    out.append("ON CONFLICT (reference_no) DO NOTHING;")
    result = "\n".join(out)
    out_path = path.replace(".tsv", "_insert.sql") if path.endswith(".tsv") else "feature_tickets_insert.sql"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(result)
    print("Wrote", out_path, file=sys.stderr)
    # Company name UPDATEs for Feature tickets
    up_path = path.replace(".tsv", "_company_updates.sql") if path.endswith(".tsv") else "feature_tickets_company_updates.sql"
    up_lines = ["-- Feature ticket company_name (run after bulk insert)", ""]
    for cname, refs in sorted(company_refs.items()):
        if not cname:
            continue
        ref_list = ", ".join(f"'{r}'" for r in refs)
        c_esc = cname.replace("'", "''")
        up_lines.append(f"UPDATE public.tickets SET company_name = '{c_esc}' WHERE reference_no IN ({ref_list});")
    with open(up_path, "w", encoding="utf-8") as f:
        f.write("\n".join(up_lines))
    print("Wrote", up_path, file=sys.stderr)

if __name__ == "__main__":
    main()
