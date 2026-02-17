# Fix: Company names show on local but not in production

Company names work locally because your **local backend** uses the updated logic that prefers `tickets.company_name`. In production, either the **backend** is still on the old code or the **database** doesn’t have `company_name` set.

Follow these steps in order.

---

## Step 1: Confirm the backend fix is in your repo

The backend must use the ticket’s own `company_name` when it’s set.

- Open **`backend/app/main.py`** and find the function **`_enrich_tickets_with_lookups`** (around line 711).
- The line that sets `company_name` should look like this:

```python
row["company_name"] = (row.get("company_name") and str(row.get("company_name")).strip()) or (companies_map.get(row.get("company_id")) if row.get("company_id") else None)
```

- If you still see only:
  `row["company_name"] = companies_map.get(row.get("company_id")) ...`
  then the fix is not applied. Apply the change above (prefer `row.get("company_name")`, then fallback to `companies_map`).

---

## Step 2: Deploy the backend to production

Production must run this same code. How you deploy depends on where the API is hosted.

### If the API is on **Render**

1. Push your latest code (including the `main.py` change) to your Git branch (e.g. `main`).
2. In **Render Dashboard** → your **Backend/Web Service** → **Manual Deploy** → **Deploy latest commit** (or wait for auto-deploy if connected to Git).
3. Wait until the deploy finishes and the service is **Live**.
4. Optional: in Render **Logs**, check that the service started without errors.

### If the API is on **Railway / Fly.io / other**

1. Push the latest code to the branch that production deploys from.
2. Trigger a new deploy (e.g. “Redeploy” or push to trigger CI/CD).
3. Wait until the new version is live.

After this, the **production API** will use `tickets.company_name` when it’s set.

---

## Step 3: Ensure production database has `company_name` set

Production frontend and API usually point to the **same Supabase project** as local. If they do, and you already ran the update script in Supabase, `tickets.company_name` is already set and you can skip to Step 4.

If production uses a **different** Supabase project, or you never ran the update there:

1. Open **Supabase** → select the **production** project (same one the production API uses).
2. Go to **SQL Editor** → **New query**.
3. Open **`database/TICKETS_UPDATE_COMPANY_NAMES.sql`** in your project, copy its **entire** contents, paste into the SQL Editor, and run it.

This updates `tickets.company_name` by `reference_no`. If your production `reference_no` values differ (e.g. `BU/0001` instead of `BU-001`), edit the script so the `reference_no` in the `WHERE` clauses match your production data, then run it again.

---

## Step 4: Set production frontend env (if needed)

Production frontend (e.g. on Vercel) must call the **production** API URL.

1. In **Vercel** → your project → **Settings** → **Environment Variables**.
2. Ensure **`VITE_API_BASE_URL`** (or **`VITE_API_URL`**) is set to your **production backend URL** (e.g. `https://your-api.onrender.com`), **no trailing slash**.
3. Save and **redeploy** the frontend so the new value is used (Vite embeds env at build time).

---

## Step 5: Hard refresh production

After backend and (if needed) DB and frontend are updated:

1. Open the production app (e.g. `https://ip-internal-manage-software.vercel.app/tickets`).
2. Hard refresh: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac), or clear cache for that site.

You should now see the same company names as on local (e.g. Demo C, Bhagwati Power, BIHAR FOUNDRY).

---

## Checklist

| Step | Action | Done |
|------|--------|------|
| 1 | Backend code uses ticket’s `company_name` first (see `main.py`) | ☐ |
| 2 | Deploy backend to production (Render / Railway / etc.) | ☐ |
| 3 | Run `TICKETS_UPDATE_COMPANY_NAMES.sql` in **production** Supabase if needed | ☐ |
| 4 | Production frontend has correct `VITE_API_BASE_URL` and is redeployed | ☐ |
| 5 | Hard refresh production app | ☐ |

---

## If it still doesn’t show

- In the browser on **production**, open **Developer Tools (F12)** → **Network**. Reload the tickets page, click the request that fetches tickets (e.g. `GET .../tickets`). In the **Response** tab, check whether each ticket has a `company_name` field and if it’s filled. If the API returns `company_name` but the UI doesn’t show it, the issue is in the frontend. If the API returns `company_name` null or missing, the issue is backend or DB (steps 2 and 3).
- Confirm the production backend process was restarted after deploy (Render/Railway usually do this automatically on deploy).
