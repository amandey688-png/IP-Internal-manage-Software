"""
Parse docs/payment_ageing_bulk_import.tsv → docs/payment_ageing_bulk_import.json

Columns: Company Name, Amount×2, then 10 fiscal quarters (Q3 FY 23-24 … Q4 FY 25-26),
optional 14th column = Median Value from sheet (ignored in DB).

Run: python docs/parse_payment_ageing_tsv.py
Then: python docs/generate_payment_ageing_sql.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

NUM_QUARTERS = 10


def _clean_cell(s: str) -> str:
    s = (s or "").strip().strip('"').strip("'").strip()
    return s


def _to_int_or_none(s: str):
    s = _clean_cell(s)
    if s == "" or s == "—":
        return None
    if re.fullmatch(r"-?\d+", s):
        return int(s)
    return None


def parse_row(parts: list[str]) -> tuple[str, list[int | None]] | None:
    if not parts or not parts[0].strip():
        return None
    name = _clean_cell(parts[0])
    if name.lower() in ("company name", "days"):
        return None
    # name, amt, amt, then 10 quarter cells; optional parts[13+] = median (ignored)
    while len(parts) < 3 + NUM_QUARTERS:
        parts.append("")
    qcells = parts[3 : 3 + NUM_QUARTERS]
    quarter_days = [_to_int_or_none(x) for x in qcells]
    return name, quarter_days


def main():
    root = Path(__file__).resolve().parent
    tsv = (root / "payment_ageing_bulk_import.tsv").read_text(encoding="utf-8")
    lines = [ln.strip("\r") for ln in tsv.splitlines() if ln.strip()]
    rows_out: list[dict] = []
    for ln in lines:
        parts = ln.split("\t")
        parsed = parse_row(parts)
        if not parsed:
            continue
        name, qd = parsed
        rows_out.append({"company_name": name, "quarter_days": qd})

    out = {"rows": rows_out}
    out_path = root / "payment_ageing_bulk_import.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(rows_out)} rows to {out_path}")


if __name__ == "__main__":
    main()
