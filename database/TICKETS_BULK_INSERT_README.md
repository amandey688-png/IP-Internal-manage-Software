# Bulk INSERT: Pending and Hold Tickets

## Step-by-step guide

### Prerequisites

1. **Database**
   - Ensure `public.companies` and `public.user_profiles` have at least one row.
   - If your schema doesn’t have the ticket columns yet, run **`TICKETS_ADD_SUPPORT_COLUMNS.sql`** once in the Supabase SQL Editor.

2. **Company mapping**
   - Open **`database/COMPANY_ID_MAPPING.txt`**.
   - Add one line per company: `Company name as in your sheet<TAB>uuid-from-public.companies`.
   - Use the exact “Company Name” from your sheet (e.g. `Demo_c`, `BIHAR FOUNDRY`, `Balmukund Sponge Iron Pvt. Ltd.`). Add aliases if the same company appears with different names.

### Step 1: Create the TSV files

1. **Pending data**  
   - In Excel/Google Sheets, open the sheet that has **Pending** tickets.  
   - Columns must include (in order): Title, Description, Attachment, Type of request, Page, Company Name, Users Name, Division, If you selected "Others," please specify., Communicated Though, Submitted By, Query Arrival Date & Time, Quality of response, Customer Questions, Query Response Date & Time, **Reference No**, **Time Delay**.  
   - Copy the header row + all pending rows.  
   - Paste into a text editor. Ensure fields are **tab-separated** (paste from Excel/Sheets usually keeps tabs).  
   - If a cell contains line breaks, either replace them with a space so each ticket is one line, or leave as-is; the script will try to merge continuation lines until it sees a Reference No (CH-… or BU-…).  
   - Save as **`database/pending.tsv`** (UTF-8).

2. **Hold data**  
   - Do the same for **Hold** tickets (same column order).  
   - Save as **`database/hold.tsv`** (UTF-8).

### Step 2: Generate the SQL file

1. Open a terminal and go to the **`database`** folder:
   ```bash
   cd "c:\Support FMS to APPLICATION\database"
   ```
2. Run:
   ```bash
   python gen_tickets_pending_hold.py pending.tsv hold.tsv > TICKETS_BULK_INSERT_PENDING_AND_HOLD.sql
   ```
3. If you see “No file: pending.tsv” or “No file: hold.tsv”, create those files in the `database` folder (Step 1).  
4. The file **`TICKETS_BULK_INSERT_PENDING_AND_HOLD.sql`** is now overwritten with all Pending + Hold INSERTs.

### Step 3: Run the SQL in Supabase

1. Open **Supabase** → your project → **SQL Editor**.  
2. If you haven’t already, run **`TICKETS_ADD_SUPPORT_COLUMNS.sql`** once.  
3. Open **`TICKETS_BULK_INSERT_PENDING_AND_HOLD.sql`** in your editor, copy its full content, and paste into the SQL Editor.  
4. Run the script.  
5. The script uses **`ON CONFLICT (reference_no) DO NOTHING`**, so existing reference numbers are skipped and new ones are inserted.

### Step 4: Verify

- In Supabase: **Table Editor** → **tickets**.  
- Filter or sort by **status** = `open` (Pending) and `on_hold` (Hold).  
- Check that **description** contains “Old Ref: …” and “Time Delay: …”, and that Hold tickets also contain “Status: Hold”.

---

**Quick recap:**  
1. Add company names → UUIDs in `COMPANY_ID_MAPPING.txt`.  
2. Save Pending data as `pending.tsv`, Hold data as `hold.tsv` (tab-separated, header + data).  
3. Run `python gen_tickets_pending_hold.py pending.tsv hold.tsv > TICKETS_BULK_INSERT_PENDING_AND_HOLD.sql` from `database`.  
4. Run `TICKETS_BULK_INSERT_PENDING_AND_HOLD.sql` in Supabase (after `TICKETS_ADD_SUPPORT_COLUMNS.sql` if needed).

## What you get

- **Pending tickets**: `status = 'open'`, description = base text + **" Old Ref: &lt;ref&gt; Time Delay: &lt;time_delay&gt;"**
- **Hold tickets**: `status = 'on_hold'`, description = base text + **" Old Ref: &lt;ref&gt; Time Delay: &lt;time_delay&gt; Status: Hold"**
- **company_id**: Resolved from `COMPANY_ID_MAPPING.txt` (alias → UUID). Add more alias→UUID lines for your companies.

## Steps

1. **Company mapping**  
   Edit `COMPANY_ID_MAPPING.txt` and add lines:
   ```text
   Company name as in your sheet<TAB>uuid-from-public.companies
   ```
   Use the id/name list you have; add aliases (e.g. `Demo_c` → Demo C’s uuid) so every ticket company name maps.

2. **TSV files**  
   - **pending.tsv** – Tab-separated, one row per pending ticket. First row = header (Title, Description, …, Reference No, Time Delay).  
   - **hold.tsv** – Same format for hold tickets.

3. **Generate SQL**  
   From the `database` folder:
   ```bash
   python gen_tickets_pending_hold.py pending.tsv hold.tsv > TICKETS_BULK_INSERT_PENDING_AND_HOLD.sql
   ```

4. **Run in Supabase**  
   - Run `TICKETS_ADD_SUPPORT_COLUMNS.sql` first if needed.  
   - Open `TICKETS_BULK_INSERT_PENDING_AND_HOLD.sql` in SQL Editor and run it.  
   - Uses `ON CONFLICT (reference_no) DO NOTHING` so existing reference numbers are skipped.

## Column order (0-based)

0=Title, 1=Description, 2=Attachment, 3=Type of request, 4=Page, 5=Company Name, 6=Users Name, 7=Division, 8=If Other specify, 9=Communicated Through, 10=Submitted By, 11=Query Arrival Date & Time, 12=Quality of response, 13=Customer Questions, 14=Query Response Date & Time, 15=Reference No, 16=Time Delay

Type: "Bugs" → bug, "Chores" → chore.  
Communicated: "Phone" → phone, "Mail" → mail, "Chat" → whatsapp.
