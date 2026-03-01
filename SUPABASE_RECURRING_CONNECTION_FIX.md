# Fix: Supabase Connection Problem (Happens Again & Again After Some Time)

If you see **"Cannot reach Supabase"** or **503 Service Unavailable** on login, and it keeps happening **after some time** (e.g. next day, after a break), follow these steps.

---

## Why This Happens

1. **Supabase Free Tier pauses projects** after ~7 days of no use
2. **When paused**, the project does not accept connections → connection timeout (WinError 10060)
3. **When you unpause**, it can take **1–2 minutes** for the project to fully wake up
4. **Firewall/antivirus** may block outbound HTTPS to Supabase
5. **Network issues** (VPN, corporate proxy, unstable connection)

---

## Step-by-Step Fix Guide

### Step 1: Unpause the Supabase Project (Most Common Fix)

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)** and sign in.
2. Open your project: **FMS to APPLICATION**.
3. On the project **Home** page, look for:
   - **"Project is paused"** or **"Project paused"**
   - A **"Restore project"** or **"Resume project"** button.
4. If paused:
   - Click **"Restore project"** (or **"Resume"**).
   - **Wait 2–3 minutes** for the project to fully start.
5. Try logging in again. If it was only paused, this usually fixes it.

**Direct link:**  
https://supabase.com/dashboard/project/geqcgxassdkrymzsjpoj/settings/general

---

### Step 2: Verify `backend/.env` Keys

The backend requires **Legacy JWT keys** (starting with `eyJ`), **not** Publishable/Secret keys (`sb_publishable_...` / `sb_secret_...`).

1. In Supabase, go to **Project Settings** (gear icon) → **API** → **Legacy anon, service_role API keys**.
2. Copy:
   - **anon public** (long string starting with `eyJ...`) → `SUPABASE_ANON_KEY`
   - **service_role secret** (long string starting with `eyJ...`) → `SUPABASE_SERVICE_ROLE_KEY`
3. Edit `backend/.env`:

```env
SUPABASE_URL=https://geqcgxassdkrymzsjpoj.supabase.co
SUPABASE_ANON_KEY=<paste_full_anon_key_eyJ...>
SUPABASE_SERVICE_ROLE_KEY=<paste_full_service_role_key_eyJ...>
```

4. Save the file.
5. **Restart the backend** (stop and run `start-backend-utf8.bat` again).

---

### Step 3: Use the Health Diagnostic

1. Start the backend.
2. Open in browser: **http://127.0.0.1:8000/health/supabase**
3. Check the JSON:
   - `supabase_url_set`, `anon_key_set`, `service_role_key_set` → should be `true`
   - `reachable` → `"ok"` means the backend can reach Supabase
   - If `reachable: "error"`, read the `hint` for next steps.

---

### Step 4: Allow Supabase Through Firewall / Antivirus

1. **Windows Firewall:**  
   Windows Security → Firewall & network protection → Allow an app through firewall → Ensure **Python** is allowed (Private and Public).
2. **Antivirus:**  
   Add an exception for outbound HTTPS to `*.supabase.co` or for the folder where you run the backend.
3. **VPN / Proxy:**  
   Try disabling VPN or proxy, or switching to mobile hotspot, to see if the issue is network-related.

---

### Step 5: Retry After Unpause (App Will Auto-Retry)

The app now retries automatically when Supabase is unreachable:

- **Frontend:** Up to 3 attempts (initial + retry after 8s + retry after 25s).
- **Backend:** Up to 4 pre-checks with delays (0s, 8s, 20s, 45s) plus 5 retries for auth calls.

If the project was recently unpaused, wait **1–2 minutes**, then click **"Retry login"** or try signing in again.

---

## SQL to Run (If Setup Is Incomplete)

If the health check shows `reachable: "ok"` but login still fails (e.g. 404 "User profile not found"), run these in the **Supabase SQL Editor**:

| Script | When to run |
|--------|-------------|
| `database/FRESH_SETUP.sql` | First-time setup or complete reset |
| `database/FIX_USER_PROFILE.sql` | User exists in Auth but not in `user_profiles` |
| `database/ROLES_AND_APPROVAL_WORKFLOW.sql` | Missing roles table |
| `database/CHECKLIST_MODULE.sql` | Checklist not working |
| `database/DELEGATION_AND_PENDING_REMINDER.sql` | Delegation not working |

1. Go to Supabase → **SQL Editor**.
2. Paste the contents of the relevant script.
3. Click **Run**.

---

## Quick Checklist

- [ ] Supabase project **not paused** (Restore/Resume and wait 2–3 min).
- [ ] `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` use **Legacy JWT keys** (`eyJ...`).
- [ ] Backend **restarted** after changing `.env`.
- [ ] http://127.0.0.1:8000/health/supabase shows `reachable: "ok"`.
- [ ] Firewall/antivirus allows outbound HTTPS to Supabase.
- [ ] If still failing, wait 2–3 min after unpause and use **"Retry login"**.

---

## If It Still Fails

1. Open http://127.0.0.1:8000/health/supabase and copy the full JSON (remove any secrets before sharing).
2. Check https://status.supabase.com for incidents.
3. Try from another network (e.g. mobile hotspot) to rule out firewall/proxy.
