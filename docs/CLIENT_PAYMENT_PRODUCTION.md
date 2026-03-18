# Client Payment (Raised Invoices) – production checklist

## Why you see **“Not Found”** on Save (Vercel)

The toast **“Not Found”** is almost always **HTTP 404** from your API: the URL your frontend calls does **not** exist on the server that Vercel uses.

Common causes:

1. **Backend (e.g. Render) is an old deploy** – it does not include the routes:
   - `GET/POST /onboarding/client-payment`
   - Same paths work with `/api` prefix: `/api/onboarding/client-payment`
2. **Wrong API URL on Vercel** – `VITE_API_BASE_URL` (or `VITE_API_URL`) must be the **live FastAPI base URL** (no path suffix like `/api` required in env; the app calls `/onboarding/client-payment` on that host).

### Fix (deploy)

1. **Merge / deploy the latest `backend/app/main.py`** that contains `list_client_payment` and `create_client_payment` (and related `/onboarding/client-payment/...` routes).
2. On **Render** (or your host): trigger a **manual deploy** from the branch that has this code.
3. On **Vercel** → Project → **Environment Variables**:
   - `VITE_API_BASE_URL` = `https://YOUR-BACKEND.onrender.com` (example; **no** trailing slash)
4. **Redeploy Vercel** after changing env vars (they are baked in at build time).

### Quick verification

In the browser (while logged in, or with a token), open:

`https://YOUR-BACKEND.onrender.com/onboarding/client-payment?status=open`

- **200 + JSON `{ "items": [...] }`** → routes are live; if the app still fails, check Vercel API URL.
- **404 Not Found** → backend deploy is still old; redeploy backend.

---

## Why the table is empty

- **No rows yet** – normal after first setup.
- **List always empty** – if `onboarding_client_payment` table is **missing**, the backend catches errors and returns `{ "items": [] }`, so the UI shows no data and Save may also fail differently.
- **All rows “completed”** – open list only shows rows **without** `payment_received_date`. Completed invoices appear under Q-Comp / M-Comp / HF-Comp routes.

---

## What to run in Supabase (order matters)

Run in **SQL Editor**, in this order:

| Step | File | Purpose |
|------|------|---------|
| **1** | `docs/SUPABASE_CLIENT_PAYMENT_CORE.sql` | `onboarding_client_payment`, `onboarding_client_payment_sent`, `onboarding_client_payment_followup1` |
| **2** | `docs/supabase_client_payment_followup_flow.sql` | Follow-ups 1–10, Intercept, Discontinuation, Payment Receive |

After step 1, **Add Raised Invoice** and **list open invoices** should work (with a deployed backend).

---

## CORS (if browser blocks API)

Backend must allow your Vercel origin, e.g. in `backend/.env` on Render:

```env
CORS_ORIGIN=https://industryprime.vercel.app
```

(or `CORS_ORIGINS` comma-separated list including that URL)

Restart/redeploy backend after changing env.
