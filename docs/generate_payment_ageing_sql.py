"""
Build docs/SUPABASE_PAYMENT_AGEING_BULK_UPSERT.sql and docs/SUPABASE_PAYMENT_AGEING_FULL_SETUP.sql
from docs/payment_ageing_bulk_import.json + docs/SUPABASE_PAYMENT_AGEING_REPORT.sql (schema).

Run: python docs/parse_payment_ageing_tsv.py && python docs/generate_payment_ageing_sql.py
"""
from __future__ import annotations

import json
from pathlib import Path


def _sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def _json_compact(arr: list) -> str:
    return json.dumps(arr, ensure_ascii=False, separators=(",", ":"))


def main():
    root = Path(__file__).resolve().parent
    js = json.loads((root / "payment_ageing_bulk_import.json").read_text(encoding="utf-8"))
    rows = js.get("rows") or []
    if not rows:
        raise SystemExit("No rows in payment_ageing_bulk_import.json")

    schema = (root / "SUPABASE_PAYMENT_AGEING_REPORT.sql").read_text(encoding="utf-8").strip()

    value_lines = []
    for r in rows:
        name = (r.get("company_name") or "").strip()
        qd = r.get("quarter_days")
        if not name or not isinstance(qd, list):
            continue
        j = _json_compact(qd)
        value_lines.append(f"  ({_sql_str(name)}, {_sql_str(j)}::jsonb, now())")

    bulk_body = (
        "INSERT INTO public.onboarding_client_payment_ageing (company_name, quarter_days, updated_at)\n"
        "VALUES\n"
        + ",\n".join(value_lines)
        + "\nON CONFLICT (company_name) DO UPDATE SET\n"
        "  quarter_days = EXCLUDED.quarter_days,\n"
        "  updated_at = EXCLUDED.updated_at;\n"
    )

    bulk_header = (
        "-- =============================================================================\n"
        "-- Payment Ageing — bulk upsert (69 rows, 10 quarters per company)\n"
        "-- Run AFTER docs/SUPABASE_PAYMENT_AGEING_REPORT.sql\n"
        "-- Generated from docs/payment_ageing_bulk_import.json\n"
        "-- =============================================================================\n\n"
    )
    (root / "SUPABASE_PAYMENT_AGEING_BULK_UPSERT.sql").write_text(bulk_header + bulk_body, encoding="utf-8")

    full_header = (
        "-- =============================================================================\n"
        "-- Payment Ageing Report — FULL SETUP (single paste in Supabase SQL Editor)\n"
        "-- Requires: public.companies exists.\n"
        "-- Part A: tables | Part B: seed data (aligned to sheet Q3 FY23-24 … Q4 FY25-26)\n"
        "-- Amounts in the app still come from Payment Management (raised invoices).\n"
        "-- When the next fiscal quarter starts, extend this window in code + new seed.\n"
        "-- =============================================================================\n\n"
    )
    part_b = (
        "-- ---------- Part B: seed data ----------\n\n"
        + bulk_body
    )
    (root / "SUPABASE_PAYMENT_AGEING_FULL_SETUP.sql").write_text(
        full_header + "-- ---------- Part A: schema ----------\n\n" + schema + "\n\n" + part_b,
        encoding="utf-8",
    )

    print(f"Wrote SUPABASE_PAYMENT_AGEING_BULK_UPSERT.sql ({len(value_lines)} rows)")
    print("Wrote SUPABASE_PAYMENT_AGEING_FULL_SETUP.sql")


if __name__ == "__main__":
    main()
