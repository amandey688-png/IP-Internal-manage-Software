#!/usr/bin/env python3
"""
Read support_tickets_upload.tsv (or tickets_upload.tsv) and generate
INSERT statements for public.tickets. Run from repo root:
  python database/gen_tickets_bulk_sql.py
Output: database/TICKETS_BULK_INSERT_FROM_TSV.sql
"""
import csv
import re
import sys
from pathlib import Path

TSV_PATH = Path(__file__).parent / "support_tickets_upload.tsv"
OUT_PATH = Path(__file__).parent / "TICKETS_BULK_INSERT_FROM_TSV.sql"

def esc(s: str) -> str:
    if s is None or (isinstance(s, str) and s.strip() == ""):
        return "NULL"
    s = str(s).strip()
    s = s.replace("\\", "\\\\").replace("'", "''")
    return f"'{s}'"

def parse_tsv_date(s: str):
    if not s or not str(s).strip():
        return None
    s = str(s).strip()
    # M/D/YYYY H:MM:SS or M/D/YYYY H:MM
    m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?", s)
    if m:
        month, day, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
        hour, minute = int(m.group(4)), int(m.group(5))
        sec = int(m.group(6)) if m.group(6) else 0
        return f"{year}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:{sec:02d}+00"
    return None

def ts_date_sql(s: str):
    v = parse_tsv_date(s)
    return f"'{v}'::TIMESTAMPTZ" if v else "NULL"

def map_type(t: str) -> str:
    if not t:
        return "feature"
    t = t.strip().lower()
    if "bug" in t:
        return "bug"
    if "chore" in t:
        return "chore"
    return "feature"

def map_communicated(t: str):
    if not t:
        return "NULL"
    t = t.strip().lower()
    if t == "phone":
        return "'phone'"
    if t == "mail":
        return "'mail'"
    if t == "chat":
        return "NULL"  # tickets CHECK allows only phone, mail, whatsapp
    if t == "whatsapp":
        return "'whatsapp'"
    return "NULL"

# Use first company for all rows so INSERT never fails with FK violation.
def company_id_sql(_cell: str) -> str:
    return "(SELECT id FROM public.companies LIMIT 1)"

# Display names for "Company Name" column (same row order as TSV). UI shows tickets.company_name.
COMPANY_NAMES = [
    "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c",
    "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c",
    "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c",
    "Ghankun Steel Pvt Ltd (SMS Division)", "Crescent Foundry", "Demo_c", "Kodarma Chemical Pvt. Ltd.",
    "Demo_c", "Demo_c", "Demo_c", "Nirmaan TMT", "Spintech Tubes Pvt Ltd", "Indo East Corporation Private Limited",
    "Karnikripa Power Pvt Ltd", "Demo_c", "Demo_c", "BIHAR FOUNDRY", "Flexicom Industries Pvt. Ltd.",
    "Demo_c", "Demo_c", "Demo_c", "Demo_c", "Demo_c", "BIHAR FOUNDRY", "BIHAR FOUNDRY", "BIHAR FOUNDRY",
    "Demo_c", "Demo_c", "Demo_c", "BIHAR FOUNDRY", "Demo_c", "Demo_c", "Demo_c", "BIHAR FOUNDRY",
    "Demo_c", "Demo_c", "Demo_c", "BIHAR FOUNDRY", "Bhagwati Power Pvt. Ltd.", "Bhagwati Power Pvt. Ltd.",
    "Bhagwati Power Pvt. Ltd.", "Bhagwati Power Pvt. Ltd.", "Bhagwati Power Pvt. Ltd.", "Bhagwati Power Pvt. Ltd.",
    "Bhagwati Power Pvt. Ltd.", "Karnikripa Power Pvt Ltd", "Bhagwati Power Pvt. Ltd.",
    "Bhagwati Power Pvt. Ltd.", "Bhagwati Power Pvt. Ltd.", "Bhagwati Power Pvt. Ltd.", "Bhagwati Power Pvt. Ltd.", "Karnikripa Power Pvt Ltd", "Bhagwati Power Pvt. Ltd.",
]

def main():
    rows = []
    with open(TSV_PATH, "r", encoding="utf-8", newline="") as f:
        reader = csv.reader(f, delimiter="\t")
        header = next(reader)
        for row in reader:
            if len(row) < 10:
                continue
            rows.append(row)

    out = []
    out.append("-- Bulk INSERT into public.tickets from support_tickets_upload.tsv")
    out.append("-- Run TICKETS_ADD_SUPPORT_COLUMNS.sql first. Requires at least one company and one user_profiles row.")
    out.append("")
    out.append("INSERT INTO public.tickets (")
    out.append("  reference_no, title, description, type, status, priority,")
    out.append("  company_id, division_id, created_by, created_at, updated_at,")
    out.append("  attachment_url, page, company_name, division, division_other, user_name,")
    out.append("  communicated_through, submitted_by, query_arrival_at, quality_of_response,")
    out.append("  customer_questions, query_response_at")
    out.append(") VALUES")

    # Auto-generate reference_no: BU-001, BU-002, ... for bugs; CH-001, CH-002, ... for chores/features
    # Support two TSV layouts:
    #   Old (17 cols): 0=Timestamp, 1=Title, 2=Description, ..., 6=Company Name, ..., 16=Ref No
    #   New (16 cols): 0=Title, 1=Description, 2=Attachment, ..., 5=Company Name ID (UUID), ..., 15=Ref No
    bug_num, chore_num = 0, 0
    values_list = []
    for i, r in enumerate(rows):
        while len(r) < 17:
            r.append("")
        is_old_format = len(r) >= 17 and re.match(r"^\d{1,2}/\d{1,2}/\d{4}", (r[0] or "").strip())
        if is_old_format:
            title = (r[1].strip() if len(r) > 1 else "") or "No title"
            desc_raw = (r[2].strip() if len(r) > 2 else "") or ""
            attachment = r[3] if len(r) > 3 else ""
            type_cell = r[4] if len(r) > 4 else ""
            page = r[5] if len(r) > 5 else ""
            company_cell = r[6] if len(r) > 6 else ""
            user_name = r[7] if len(r) > 7 else ""
            division = r[8] if len(r) > 8 else ""
            others = r[9] if len(r) > 9 else ""
            comm = r[10] if len(r) > 10 else ""
            submitted = r[11] if len(r) > 11 else ""
            query_arrival = r[12] if len(r) > 12 else ""
            quality = r[13] if len(r) > 13 else ""
            cust_q = r[14] if len(r) > 14 else ""
            query_resp = r[15] if len(r) > 15 else ""
            old_ref = (r[16].strip() if len(r) > 16 else "") or ""
            company_name = r[6] if len(r) > 6 else ""  # old: company name text
        else:
            # New format (16 cols): Company Name ID (UUID) at index 5
            title = (r[0].strip() if len(r) > 0 else "") or "No title"
            desc_raw = (r[1].strip() if len(r) > 1 else "") or ""
            attachment = r[2] if len(r) > 2 else ""
            type_cell = r[3] if len(r) > 3 else ""
            page = r[4] if len(r) > 4 else ""
            company_cell = r[5] if len(r) > 5 else ""
            user_name = r[6] if len(r) > 6 else ""
            division = r[7] if len(r) > 7 else ""
            others = r[8] if len(r) > 8 else ""
            comm = r[9] if len(r) > 9 else ""
            submitted = r[10] if len(r) > 10 else ""
            query_arrival = r[11] if len(r) > 11 else ""
            quality = r[12] if len(r) > 12 else ""
            cust_q = r[13] if len(r) > 13 else ""
            query_resp = r[14] if len(r) > 14 else ""
            old_ref = (r[15].strip() if len(r) > 15 else "") or ""
            company_name = ""  # new format: no company name text, use company_id only

        t = map_type(type_cell)
        if t == "bug":
            bug_num += 1
            ref = f"BU-{bug_num:03d}"
        else:
            chore_num += 1
            ref = f"CH-{chore_num:03d}"
        if old_ref:
            desc_raw = (desc_raw + " Old Ref: " + old_ref) if desc_raw else ("Old Ref: " + old_ref)
        # Company name for UI: from row (old format) or from COMPANY_NAMES list (new format)
        display_name = (company_name and str(company_name).strip()) or (COMPANY_NAMES[i] if i < len(COMPANY_NAMES) else "Demo_c")
        created_ts = ts_date_sql(query_arrival) if (query_arrival and parse_tsv_date(query_arrival)) else "NOW()"
        query_arrival_sql = ts_date_sql(query_arrival) or "NULL"
        query_resp_sql = ts_date_sql(query_resp) or "NULL"

        vals = (
            esc(ref),
            esc(title),
            esc(desc_raw) if desc_raw else "NULL",
            f"'{t}'",
            "'open'",
            "'medium'",
            company_id_sql(company_cell),
            "NULL",
            "(SELECT id FROM public.user_profiles LIMIT 1)",
            created_ts,
            "NOW()",
            esc(attachment) if attachment and str(attachment).strip() else "NULL",
            esc(page) if page and str(page).strip() else "NULL",
            esc(display_name) if display_name and str(display_name).strip() else "NULL",
            esc(division) if division and str(division).strip() else "NULL",
            esc(others) if others and str(others).strip() else "NULL",
            esc(user_name) if user_name and str(user_name).strip() else "NULL",
            map_communicated(comm),
            esc(submitted) if submitted and str(submitted).strip() else "NULL",
            query_arrival_sql,
            esc(quality) if quality and str(quality).strip() else "NULL",
            esc(cust_q) if cust_q and str(cust_q).strip() else "NULL",
            query_resp_sql,
        )
        values_list.append("  (" + ", ".join(vals) + ")")

    out.append(",\n".join(values_list))
    out.append("ON CONFLICT (reference_no) DO NOTHING;")

    OUT_PATH.write_text("\n".join(out), encoding="utf-8")
    print(f"Wrote {len(rows)} rows to {OUT_PATH}", file=sys.stderr)

if __name__ == "__main__":
    main()
