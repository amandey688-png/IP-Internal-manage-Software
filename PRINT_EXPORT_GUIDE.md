# Print & Export – Step-by-Step Guide

**File:** [PRINT_EXPORT_GUIDE.md](PRINT_EXPORT_GUIDE.md)  
Every app page has **Print** and **Export** (where applicable). This guide explains how they work and how to use them.

---

## What’s included

- **Print** – Available on all pages. Prints the current page content (sidebar and header are hidden).
- **Export** – Available on pages with list/table data. Downloads the current data as a **CSV** file.

---

## Where the buttons appear

| Page | Print | Export |
|------|--------|--------|
| [Dashboard](fms-frontend/src/pages/Dashboard.tsx) | Yes (top right) | Yes – recent tickets (Title, Status, Type, Created) |
| [All Tickets / Chores & Bugs / Feature / etc.](fms-frontend/src/pages/Tickets/TicketList.tsx) | Yes (next to page title) | Yes – ticket list (Reference No, Title, Type, Status, Company, User, Created) |
| [Staging](fms-frontend/src/pages/Staging/StagingList.tsx) | Yes (next to title) | Yes – staging tickets |
| [Users](fms-frontend/src/pages/Users/UserList.tsx) | Yes (next to title) | Yes – users (Name, Email, User ID name, Role, Active, Created) |
| [Settings](fms-frontend/src/pages/Settings/SettingsPage.tsx) | Yes (next to title) | No (no table data) |
| [Solutions](fms-frontend/src/pages/Solutions/SolutionList.tsx) | Yes (next to title) | Yes – solutions list |
| [Ticket Detail](fms-frontend/src/pages/Tickets/TicketDetail.tsx) | Yes (next to Back / title) | No |
| [Approval Confirm](fms-frontend/src/pages/Approval/ApprovalConfirmPage.tsx) | Yes (top right) | No |

---

## Step 1: Use Print

1. Open any page (e.g. Dashboard, Users, Support → All Tickets).
2. Click the **Print** button (printer icon).
3. The browser print dialog opens. Sidebar and header are hidden; only the main content is printed.
4. Choose printer or “Save as PDF” and confirm.

**Technical:** Print uses `window.print()`. Global print styles are in [fms-frontend/src/styles/print.css](fms-frontend/src/styles/print.css) (hide sidebar/header, full-width content).

---

## Step 2: Use Export (CSV)

1. Open a page that has an **Export** button (Dashboard, Tickets, Staging, Users, Solutions).
2. (Optional) Use filters/search so the list shows the data you want (e.g. a specific company or date range). Export uses the **currently loaded** list (current page of data for paginated tables).
3. Click **Export** (download icon).
4. A CSV file is downloaded (e.g. `users.csv`, `tickets_chores-bugs.csv`). Open it in Excel, Google Sheets, or any text editor.

**Technical:** Export builds a CSV from the table data and triggers a download. No backend call; it uses the data already on the page.

---

## Step 3: Add Print/Export to a new page

1. **Import the component**
   - In your page file, add:
   - `import { PrintExport } from '../../components/common/PrintExport'`  
   - (adjust path if the page is in a different folder).

2. **Print only (no table)**
   - Add a row with the page title and the component:
   ```tsx
   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
     <Title level={2}>My Page</Title>
     <PrintExport pageTitle="My Page" />
   </div>
   ```

3. **Print + Export (with table data)**
   - Define columns and rows (same keys as your table):
   ```tsx
   const exportColumns = [
     { key: 'name', label: 'Name' },
     { key: 'email', label: 'Email' },
   ]
   const exportRows = myList.map((item) => ({
     name: item.name,
     email: item.email,
   }))
   ```
   - Render the component with `exportData`:
   ```tsx
   <PrintExport
     pageTitle="My Page"
     exportData={{ columns: exportColumns, rows: exportRows }}
     exportFilename="my_page"
   />
   ```
   - The CSV will use `exportColumns` as header and `exportRows` as body.

4. **Optional:** Custom filename  
   - Use `exportFilename="custom_name"` so the file is `custom_name.csv`.

---

## File reference (clickable)

| What | File |
|------|------|
| This guide | [PRINT_EXPORT_GUIDE.md](PRINT_EXPORT_GUIDE.md) |
| Print/Export component | [fms-frontend/src/components/common/PrintExport.tsx](fms-frontend/src/components/common/PrintExport.tsx) |
| Print styles | [fms-frontend/src/styles/print.css](fms-frontend/src/styles/print.css) |
| Layout (printable area) | [fms-frontend/src/components/layout/AppLayout.tsx](fms-frontend/src/components/layout/AppLayout.tsx) |
| Dashboard (with export) | [fms-frontend/src/pages/Dashboard.tsx](fms-frontend/src/pages/Dashboard.tsx) |
| Ticket list (with export) | [fms-frontend/src/pages/Tickets/TicketList.tsx](fms-frontend/src/pages/Tickets/TicketList.tsx) |
| User list (with export) | [fms-frontend/src/pages/Users/UserList.tsx](fms-frontend/src/pages/Users/UserList.tsx) |
| Staging list (with export) | [fms-frontend/src/pages/Staging/StagingList.tsx](fms-frontend/src/pages/Staging/StagingList.tsx) |
| Settings (print only) | [fms-frontend/src/pages/Settings/SettingsPage.tsx](fms-frontend/src/pages/Settings/SettingsPage.tsx) |
| Solutions (with export) | [fms-frontend/src/pages/Solutions/SolutionList.tsx](fms-frontend/src/pages/Solutions/SolutionList.tsx) |
| Ticket detail (print only) | [fms-frontend/src/pages/Tickets/TicketDetail.tsx](fms-frontend/src/pages/Tickets/TicketDetail.tsx) |
| Approval confirm (print only) | [fms-frontend/src/pages/Approval/ApprovalConfirmPage.tsx](fms-frontend/src/pages/Approval/ApprovalConfirmPage.tsx) |

---

## Troubleshooting

| Issue | What to do |
|--------|------------|
| Print shows sidebar/header | Ensure [print.css](fms-frontend/src/styles/print.css) is imported in [main.tsx](fms-frontend/src/main.tsx) and that Sidebar/Header have `className="no-print"` in [AppLayout](fms-frontend/src/components/layout/AppLayout.tsx) and [Header](fms-frontend/src/components/layout/Header.tsx). |
| Export does nothing / “No data to export” | Only pages with `exportData` and at least one row show Export. Check that `exportData={{ columns, rows }}` is passed and `rows.length > 0`. |
| CSV opens with wrong encoding | The CSV is UTF-8 with BOM. Open in Excel via “Data → From Text/CSV” and select UTF-8 if needed. |
| Want to export full list (all pages) | Today Export uses the current page of data. To export all, you’d need to fetch all data (e.g. higher `limit`) or add a backend “export all” endpoint and call it from the button. |

---

**Summary:** Use **Print** on any page to print content; use **Export** on list pages to download CSV. Both are implemented in [PrintExport.tsx](fms-frontend/src/components/common/PrintExport.tsx) and wired on every main page as above.
