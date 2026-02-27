# Fix: WinError 10060 / ConnectTimeout when logging in on Localhost

This error means your **local backend** cannot reach Supabase’s servers in time. Follow these steps in order.

---

## Part 1: Supabase Dashboard (do this first)

### Step 1: Unpause the project

On the **free tier**, projects pause after ~7 days of no use. A paused project does not accept connections, so you get a timeout.

1. Go to **[https://supabase.com](https://supabase.com)** and sign in.
2. Open your **project** (e.g. the one for FMS / Industry Prime).
3. On the **project Home** page, check for:
   - **“Project is paused”** or **“Project paused”**
   - A **“Restore project”** or **“Resume project”** button.
4. If you see that:
   - Click **“Restore project”** (or **“Resume”**).
   - Wait **2–3 minutes** for the project to be fully up.
5. Try logging in again from your app (localhost). If it was only paused, this often fixes the timeout.

---

### Step 2: Get the correct Project URL and API keys

1. In the Supabase dashboard, click the **gear icon** (Project Settings) in the left sidebar.
2. Open the **“API”** section.
3. Copy these (you will put them in `backend/.env` in Part 2):

   | What to copy              | Use in `.env` as           |
   |---------------------------|---------------------------|
   | **Project URL**           | `SUPABASE_URL`            |
   | **anon public** key (JWT) | `SUPABASE_ANON_KEY`       |
   | **service_role** key      | `SUPABASE_SERVICE_ROLE_KEY` |

4. **Project URL** must look like:  
   `https://xxxxxxxxxxxxx.supabase.co`  
   (no path, no trailing slash in the value you paste into `.env` – the app adds paths itself.)

5. **Keys** must start with `eyJ...` (JWT format). Copy the full key.

---

### Step 3: (Optional) Check Auth and project region

1. In the left sidebar go to **Authentication** → **Providers** → **Email**.
   - Ensure **“Enable Email provider”** is ON.
2. In **Project Settings** → **General**, note the **Region** (e.g. Southeast Asia, US East).  
   - You cannot change region after creation. If your app is in a very different region, timeouts can be more likely; unpausing and a good network usually fix it.

---

## Part 2: Your PC (backend and network)

### Step 4: Set `backend/.env` correctly

1. Open the **`backend`** folder of your project.
2. Open the **`.env`** file (create it from `.env.example` if it doesn’t exist).
3. Set these three lines **exactly** (replace with the values from Step 2):

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_full_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_full_service_role_key
```

- No quotes around values.
- No spaces before or after `=`.
- **Project URL**: exactly as in the API settings (e.g. `https://geqcgxassdkrymzsjpoj.supabase.co`).
4. Save the file.
5. **Restart the backend** (stop and run `start-backend-utf8.bat` again).

---

### Step 5: Test if your PC can reach Supabase

1. On the **same PC** where the backend runs, open a **browser**.
2. Open this URL (replace with your actual Project URL from Step 2):  
   `https://YOUR_PROJECT_REF.supabase.co/rest/v1/`
3. You should get:
   - A **response** (e.g. JSON, or “Unauthorized”, or empty) — **not** “This site can’t be reached” or a long hang.
4. If the page **never loads** or times out:
   - Your **network or firewall is blocking** outbound HTTPS to Supabase.
   - Try from **mobile hotspot** (phone Wi‑Fi) on the same PC; if it works there, the issue is your usual network (e.g. office firewall).
   - Add an exception for **Python** or your backend in **Windows Firewall** and **antivirus** (allow outbound HTTPS).

---

### Step 6: Use the backend health check

1. With the backend running, open in the browser:  
   **http://127.0.0.1:8000/health/supabase**
2. Check the JSON:
   - `supabase_url_set`: should be `true`.
   - `anon_key_set` / `service_role_key_set`: should be `true`.
   - `reachable`: if `"ok"`, the backend can reach Supabase; if `"error"`, read the `hint` (e.g. timeout → network/firewall or project still starting).

---

## Quick checklist

- [ ] **Step 1:** Supabase project is **not paused** (Restore/Resume and wait 2–3 min).
- [ ] **Step 2:** Copied **Project URL**, **anon public**, **service_role** from Project Settings → API.
- [ ] **Step 4:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` set in `backend/.env` and backend **restarted**.
- [ ] **Step 5:** Browser on same PC can open `https://YOUR_PROJECT_REF.supabase.co/rest/v1/` (no timeout).
- [ ] **Step 6:** `http://127.0.0.1:8000/health/supabase` shows `reachable: "ok"` (or you fix what `hint` says).

After all of this, try **Sign in** again on localhost. If 10060 persists, the bottleneck is almost always: **project still paused**, **wrong/missing .env**, or **firewall/network blocking Supabase**.
