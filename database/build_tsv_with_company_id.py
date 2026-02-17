#!/usr/bin/env python3
"""Build support_tickets_upload.tsv with Company Name ID column (from user-provided UUIDs)."""
import csv
from pathlib import Path

TSV_DIR = Path(__file__).parent
OLD_TSV = TSV_DIR / "support_tickets_upload.tsv"
NEW_TSV = TSV_DIR / "support_tickets_upload.tsv"

# Company Name ID per row (same order as current TSV, from user's new data)
COMPANY_IDS = [
    "c57a07d6-1751-4601-b0e5-6dba2ab52689", "c57a07d6-1751-4601-b0e5-6dba2ab52690",
    "c57a07d6-1751-4601-b0e5-6dba2ab52691", "c57a07d6-1751-4601-b0e5-6dba2ab52692",
    "c57a07d6-1751-4601-b0e5-6dba2ab52693", "c57a07d6-1751-4601-b0e5-6dba2ab52694",
    "c57a07d6-1751-4601-b0e5-6dba2ab52695", "c57a07d6-1751-4601-b0e5-6dba2ab52696",
    "c57a07d6-1751-4601-b0e5-6dba2ab52697", "c57a07d6-1751-4601-b0e5-6dba2ab52698",
    "c57a07d6-1751-4601-b0e5-6dba2ab52699", "c57a07d6-1751-4601-b0e5-6dba2ab52700",
    "c57a07d6-1751-4601-b0e5-6dba2ab52701", "c57a07d6-1751-4601-b0e5-6dba2ab52702",
    "c57a07d6-1751-4601-b0e5-6dba2ab52703", "c57a07d6-1751-4601-b0e5-6dba2ab52704",
    "c57a07d6-1751-4601-b0e5-6dba2ab52705", "c57a07d6-1751-4601-b0e5-6dba2ab52706",
    "c57a07d6-1751-4601-b0e5-6dba2ab52707", "c57a07d6-1751-4601-b0e5-6dba2ab52708",
    "c57a07d6-1751-4601-b0e5-6dba2ab52709", "c57a07d6-1751-4601-b0e5-6dba2ab52710",
    "c57a07d6-1751-4601-b0e5-6dba2ab52711", "c57a07d6-1751-4601-b0e5-6dba2ab52712",
    "c57a07d6-1751-4601-b0e5-6dba2ab52713", "c57a07d6-1751-4601-b0e5-6dba2ab52714",
    "c57a07d6-1751-4601-b0e5-6dba2ab52715", "c57a07d6-1751-4601-b0e5-6dba2ab52716",
    "c57a07d6-1751-4601-b0e5-6dba2ab52717", "c57a07d6-1751-4601-b0e5-6dba2ab52718",
    "c57a07d6-1751-4601-b0e5-6dba2ab52719", "747f51f6-1b8e-44db-915b-e6210179178f",
    "f54cf6e2-e68d-40d1-ac00-4c7bbf6b4dff", "c57a07d6-1751-4601-b0e5-6dba2ab52719",
    "96f250cc-a604-4adb-bf5a-61acbbecd2f5", "c57a07d6-1751-4601-b0e5-6dba2ab52694",
    "c57a07d6-1751-4601-b0e5-6dba2ab52695", "c57a07d6-1751-4601-b0e5-6dba2ab52696",
    "Nirmaan TMT", "22271708-2eca-48ac-9846-8e6c14a92543",
    "0836fd22-8796-489f-8d72-d14fb3ec7274", "f6070d1f-f536-40df-b401-daf90feb46c2",
    "c57a07d6-1751-4601-b0e5-6dba2ab52689", "c57a07d6-1751-4601-b0e5-6dba2ab52689",
    "abd6873e-eb90-43e4-b861-d5f906f83d10", "e1c0081a-6823-4332-a0be-d4575a2e392e",
    "c57a07d6-1751-4601-b0e5-6dba2ab52689", "c57a07d6-1751-4601-b0e5-6dba2ab52689",
    "c57a07d6-1751-4601-b0e5-6dba2ab52689", "8c4d1820-b285-40f1-b2e8-f4a279f6917c",
    "abd6873e-eb90-43e4-b861-d5f906f83d10", "abd6873e-eb90-43e4-b861-d5f906f83d10",
    "c57a07d6-1751-4601-b0e5-6dba2ab52689", "c57a07d6-1751-4601-b0e5-6dba2ab52690",
    "c57a07d6-1751-4601-b0e5-6dba2ab52691", "c57a07d6-1751-4601-b0e5-6dba2ab52692",
    "c57a07d6-1751-4601-b0e5-6dba2ab52693", "c57a07d6-1751-4601-b0e5-6dba2ab52694",
    "c57a07d6-1751-4601-b0e5-6dba2ab52695", "c57a07d6-1751-4601-b0e5-6dba2ab52696",
    "c57a07d6-1751-4601-b0e5-6dba2ab52697", "c57a07d6-1751-4601-b0e5-6dba2ab52698",
    "c57a07d6-1751-4601-b0e5-6dba2ab52699", "c57a07d6-1751-4601-b0e5-6dba2ab52700",
    "c57a07d6-1751-4601-b0e5-6dba2ab52701", "abd6873e-eb90-43e4-b861-d5f906f83d10",
    "abd6873e-eb90-43e4-b861-d5f906f83d11", "abd6873e-eb90-43e4-b861-d5f906f83d12",
    "abd6873e-eb90-43e4-b861-d5f906f83d13", "c57a07d6-1751-4601-b0e5-6dba2ab52701",
    "abd6873e-eb90-43e4-b861-d5f906f83d10", "abd6873e-eb90-43e4-b861-d5f906f83d10",
    "b3f647a2-c757-4acd-8ef3-d6fed5a1fb55", "b3f647a2-c757-4acd-8ef3-d6fed5a1fb55",
    "b3f647a2-c757-4acd-8ef3-d6fed5a1fb55", "b3f647a2-c757-4acd-8ef3-d6fed5a1fb55",
    "b3f647a2-c757-4acd-8ef3-d6fed5a1fb55", "b3f647a2-c757-4acd-8ef3-d6fed5a1fb55",
    "b3f647a2-c757-4acd-8ef3-d6fed5a1fb55", "f6070d1f-f536-40df-b401-daf90feb46c2",
    "b3f647a2-c757-4acd-8ef3-d6fed5a1fb55",
]

def main():
    rows = []
    with open(OLD_TSV, "r", encoding="utf-8", newline="") as f:
        reader = csv.reader(f, delimiter="\t")
        header = next(reader)
        for row in reader:
            rows.append(row)
    # New header: drop Timestamp, rename Company Name -> Company Name ID
    new_header = [
        "Title", "Description", "Attachment", "Type of request", "Page", "Company Name ID",
        "Users Name", "Division", 'If you selected "Others," please specify.',
        "Communicated Though", "Submitted By", "Query Arrival Date & Time",
        "Quality of response", "Customer Questions", "Query Response Date & Time", "Reference No"
    ]
    out_rows = [new_header]
    for i, r in enumerate(rows):
        if i >= len(COMPANY_IDS):
            break
        # Old: 0=Timestamp, 1=Title, 2=Description, ..., 6=Company Name, ..., 16=Ref No
        # New: 0=Title, 1=Description, 2=Attachment, 3=Type, 4=Page, 5=Company Name ID, 6=Users Name, ...
        new_row = [
            r[1], r[2], r[3], r[4], r[5], COMPANY_IDS[i],
            r[7], r[8], r[9], r[10], r[11], r[12], r[13], r[14], r[15], r[16]
        ]
        out_rows.append(new_row)
    with open(NEW_TSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter="\t")
        writer.writerows(out_rows)
    print(f"Wrote {len(out_rows)-1} data rows to {NEW_TSV}")

if __name__ == "__main__":
    main()
