#!/usr/bin/env python3
"""
Import Client ONB rows from a tab-separated file (Excel → Save as Unicode text / copy TSV).

Run from the backend folder so .env resolves:

  cd backend
  python scripts/bulk_import_client_onb.py ..\\data\\active_clients.tsv --status active
  python scripts/bulk_import_client_onb.py ..\\data\\inactive_clients.tsv --status inactive --dry-run

  # Generate SQL for Supabase SQL Editor (no API keys needed):
  python scripts/bulk_import_client_onb.py ..\\data\\active_clients.tsv --status active --emit-sql active_inserts.sql
  python scripts/bulk_import_client_onb.py ..\\data\\inactive_clients.tsv --status inactive --emit-sql inactive_inserts.sql

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env (not needed for --emit-sql or --dry-run).

Before inactive imports with follow-up columns, run in Supabase:
  docs/SUPABASE_DB_CLIENT_CLIENT_ONB_FOLLOWUP_COLUMNS.sql
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import sys
import uuid
from datetime import date, datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

_backend_dir = Path(__file__).resolve().parent.parent
_env = _backend_dir / ".env"
if _env.exists():
    load_dotenv(_env)
else:
    load_dotenv()


def _norm_header(h: str) -> str:
    return re.sub(r"\s+", " ", (h or "").strip().lower())


# Excel header → internal key
HEADER_TO_KEY: dict[str, str] = {}
for _canon, _variants in {
    "organization_name": ("organization name",),
    "company_name": ("company name",),
    "contact_person": ("contact person",),
    "mobile_no": ("mobile no.", "mobile no", "mobile"),
    "email_id": ("email id", "email"),
    "paid_divisions": ("paid divisions",),
    "division_abbreviation": ("division abbreviation",),
    "name_of_divisions_cost_details": (
        "name of divisons & cost details",
        "name of divisions & cost details",
        "name of divisons",
        "name of divisions",
    ),
    "amount_paid_per_division": ("amount paid per division",),
    "total_amount_paid_per_month": ("total amount paid per month",),
    "payment_frequency": ("payment frequency",),
    "client_since": ("client since",),
    "client_till": ("client till",),
    "client_duration": ("client duration", "duration"),
    "total_amount_paid_till_date": ("total amount paid till date",),
    "tds_percent": ("tds %", "tds%"),
    "client_location_city": ("client location (city)", "client location city"),
    "client_location_state": ("client location (state)", "client location state"),
    "remarks": ("remarks",),
    "whatsapp_group_details": ("whatsapp group details",),
    "last_contacted_on": ("last contacted on",),
    "remarks_2": ("remarks2", "remarks 2"),
    "follow_up_needed": ("do we need to follow up?",),
}.items():
    for v in _variants:
        HEADER_TO_KEY[_norm_header(v)] = _canon


def _cell_str(raw: str | None, default: str = "—") -> str:
    if raw is None:
        return default
    s = str(raw).strip()
    if not s:
        return default
    up = s.upper()
    if up in ("N/A", "#NUM!", "#VALUE!", "#REF!"):
        return default
    return s


def _cell_opt(raw: str | None) -> str | None:
    s = _cell_str(raw, default="")
    return s if s else None


def _parse_date(raw: str | None) -> date | None:
    s = _cell_opt(raw)
    if not s:
        return None
    low = s.lower()
    if low in ("present", "ongoing", "-"):
        return None
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:10] if len(s) >= 10 and fmt != "%Y-%m-%d" else s[:10], fmt).date()
        except ValueError:
            continue
    try:
        return date.fromisoformat(s[:10])
    except ValueError:
        return None


def _follow_up(raw: str | None) -> str | None:
    s = _cell_opt(raw)
    if not s:
        return None
    low = s.lower()
    if low in ("yes", "y"):
        return "Yes"
    if low in ("no", "n"):
        return "No"
    return s


def _build_row(
    row: dict[str, str],
    status: str,
    *,
    inactive_sheet: bool,
) -> dict:
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    ref = f"ONB-IMP-{uuid.uuid4().hex[:12].upper()}"
    cs = _parse_date(row.get("client_since"))
    ct = _parse_date(row.get("client_till"))

    out: dict = {
        "timestamp": now,
        "reference_no": ref,
        "organization_name": _cell_str(row.get("organization_name")),
        "company_name": _cell_str(row.get("company_name")),
        "contact_person": _cell_str(row.get("contact_person")),
        "mobile_no": _cell_str(row.get("mobile_no")),
        "email_id": _cell_str(row.get("email_id")),
        "paid_divisions": _cell_str(row.get("paid_divisions")),
        "division_abbreviation": _cell_str(row.get("division_abbreviation")),
        "name_of_divisions_cost_details": _cell_str(row.get("name_of_divisions_cost_details")),
        "amount_paid_per_division": _cell_str(row.get("amount_paid_per_division")),
        "total_amount_paid_per_month": _cell_str(row.get("total_amount_paid_per_month")),
        "payment_frequency": _cell_str(row.get("payment_frequency")),
        "client_since": cs.isoformat() if cs else None,
        "client_till": ct.isoformat() if ct else None,
        "client_duration": _cell_str(row.get("client_duration")),
        "total_amount_paid_till_date": _cell_str(row.get("total_amount_paid_till_date")),
        "client_location_city": _cell_str(row.get("client_location_city")),
        "client_location_state": _cell_str(row.get("client_location_state")),
        "remarks": _cell_str(row.get("remarks")),
        "whatsapp_group_details": _cell_str(row.get("whatsapp_group_details"), "—"),
        "updated_at": now,
        "status": status,
    }
    tds_raw = row.get("tds_percent")
    if inactive_sheet and not _cell_opt(tds_raw):
        out["tds_percent"] = "—"
    else:
        out["tds_percent"] = _cell_str(tds_raw)
    if inactive_sheet:
        lc = _parse_date(row.get("last_contacted_on"))
        out["last_contacted_on"] = lc.isoformat() if lc else None
        out["remarks_2"] = _cell_opt(row.get("remarks_2"))
        out["follow_up_needed"] = _follow_up(row.get("follow_up_needed"))
    else:
        out["last_contacted_on"] = None
        out["remarks_2"] = None
        out["follow_up_needed"] = None
    return out


def _map_headers(header_row: list[str]) -> list[str | None]:
    keys: list[str | None] = []
    for h in header_row:
        k = HEADER_TO_KEY.get(_norm_header(h))
        keys.append(k)
    return keys


# Column order must match public.db_client_client_onb (excluding id).
_SQL_INSERT_COLUMNS = [
    "timestamp",
    "reference_no",
    "organization_name",
    "company_name",
    "contact_person",
    "mobile_no",
    "email_id",
    "paid_divisions",
    "division_abbreviation",
    "name_of_divisions_cost_details",
    "amount_paid_per_division",
    "total_amount_paid_per_month",
    "payment_frequency",
    "client_since",
    "client_till",
    "client_duration",
    "total_amount_paid_till_date",
    "tds_percent",
    "client_location_city",
    "client_location_state",
    "remarks",
    "whatsapp_group_details",
    "updated_at",
    "last_contacted_on",
    "remarks_2",
    "follow_up_needed",
    "status",
]


def _sql_escape_str(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "''")


def _sql_value(col: str, row: dict) -> str:
    v = row.get(col)
    if v is None:
        return "NULL"
    if col in ("client_since", "client_till", "last_contacted_on"):
        s = str(v)[:10]
        return f"'{_sql_escape_str(s)}'::date"
    if col in ("timestamp", "updated_at"):
        return f"'{_sql_escape_str(str(v))}'::timestamptz"
    return f"'{_sql_escape_str(str(v))}'"


def _emit_sql_file(rows: list[dict], out_path: Path, *, batch_size: int = 50) -> None:
    cols_sql = ",\n  ".join(_SQL_INSERT_COLUMNS)
    lines: list[str] = [
        "-- Generated by bulk_import_client_onb.py --emit-sql",
        "-- Run in Supabase → SQL Editor after migrations (status + follow-up columns for inactive).",
        "BEGIN;",
        "",
    ]
    for i in range(0, len(rows), batch_size):
        chunk = rows[i : i + batch_size]
        lines.append(f"INSERT INTO public.db_client_client_onb (\n  {cols_sql}\n) VALUES")
        value_lines = []
        for r in chunk:
            vals = ", ".join(_sql_value(c, r) for c in _SQL_INSERT_COLUMNS)
            value_lines.append(f"  ({vals})")
        lines.append(",\n".join(value_lines) + ";")
        lines.append("")
    lines.append("COMMIT;")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    p = argparse.ArgumentParser(description="Bulk import db_client_client_onb from TSV")
    p.add_argument("file", type=Path, help="Path to .tsv (tab-separated)")
    p.add_argument("--status", choices=("active", "inactive"), required=True)
    p.add_argument("--dry-run", action="store_true", help="Parse only; do not insert")
    p.add_argument(
        "--emit-sql",
        type=Path,
        default=None,
        metavar="OUT.sql",
        help="Write INSERT statements to this file (BEGIN/COMMIT, batched). No Supabase insert.",
    )
    args = p.parse_args()

    path = args.file.resolve()
    if not path.is_file():
        print(f"File not found: {path}", file=sys.stderr)
        return 1

    sup_url = (os.getenv("SUPABASE_URL") or "").strip()
    key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if not args.dry_run and not args.emit_sql and (not sup_url or not key):
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env", file=sys.stderr)
        return 1

    inactive_sheet = args.status == "inactive"

    rows_out: list[dict] = []
    errors: list[str] = []

    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f, delimiter="\t")
        header_line = next(reader, None)
        if not header_line:
            print("Empty file", file=sys.stderr)
            return 1
        key_row = _map_headers(header_line)
        if not any(key_row):
            print("Could not map any columns. First line:", header_line[:8], file=sys.stderr)
            return 1

        for i, parts in enumerate(reader, start=2):
            if not parts or not any(str(c).strip() for c in parts):
                continue
            raw: dict[str, str] = {}
            for j, cell in enumerate(parts):
                if j >= len(key_row):
                    break
                kk = key_row[j]
                if kk:
                    raw[kk] = cell
            try:
                rows_out.append(_build_row(raw, args.status, inactive_sheet=inactive_sheet))
            except Exception as e:  # noqa: BLE001
                errors.append(f"Line {i}: {e}")

    print(f"Parsed {len(rows_out)} data rows; {len(errors)} errors")
    for e in errors[:20]:
        print(e, file=sys.stderr)
    if len(errors) > 20:
        print(f"... and {len(errors) - 20} more", file=sys.stderr)

    if args.emit_sql:
        _emit_sql_file(rows_out, args.emit_sql.resolve())
        print(f"Wrote {len(rows_out)} rows to {args.emit_sql.resolve()}")
        return 0 if not errors else 1

    if args.dry_run:
        if rows_out:
            print("Sample row keys:", sorted(rows_out[0].keys()))
        return 0 if not errors else 1

    from supabase import create_client  # noqa: PLC0415

    client = create_client(sup_url, key)
    ok = 0
    for row in rows_out:
        try:
            client.table("db_client_client_onb").insert(row).execute()
            ok += 1
        except Exception as e:  # noqa: BLE001
            errors.append(f"Insert {row.get('reference_no')}: {e}")

    print(f"Inserted {ok}/{len(rows_out)} rows")
    if errors:
        for e in errors[-10:]:
            print(e, file=sys.stderr)
    return 0 if ok == len(rows_out) and not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
