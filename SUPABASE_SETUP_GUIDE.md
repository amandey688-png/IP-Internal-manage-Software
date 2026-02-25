# Supabase Setup Guide – Fix Login Timeout (WinError 10060)

If you see **"connection attempt failed... connected party did not properly respond"** or **WinError 10060** when signing in, your backend cannot reach Supabase. Follow these steps.

---

## Step 1: Open Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Open your **project** (the one used by this app).

---

## Step 2: Unpause the Project (if paused)

On the **free tier**, projects pause after about 7 days of no use.

1. On the project **Home** in the dashboard, check for a **"Project is paused"** (or similar) message.
2. If paused, click **"Restore project"** or **"Resume"**.
3. Wait 1–2 minutes for the project to be fully up.
4. Try logging in again from your app.

---

## Step 3: Get Correct API URL and Keys

1. In the Supabase dashboard, go to **Project Settings** (gear icon in the left sidebar).
2. Open the **API** section.
3. Note:
   - **Project URL**  
     Example: `https://xxxxxxxxxxxx.supabase.co`  
     → Use this as `SUPABASE_URL` in `.env`.
   - **Project API keys**
     - **anon public** (starts with `eyJ...`)  
       → Use as `SUPABASE_ANON_KEY`.
     - **service_role** (starts with `eyJ...`)  
       → Use as `SUPABASE_SERVICE_ROLE_KEY`.  
       **Do not** expose this in the frontend or in public repos.

---

## Step 4: Configure Backend `.env`

1. Open the **backend** folder of this project.
2. Create or edit the **`.env`** file (same folder as `app/`).
3. Set (replace with your real values):

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Save the file.
5. **Restart the backend** (stop and run `start-backend-utf8.bat` again).

---

## Step 5: Allow Supabase Through Firewall / Antivirus

Your PC or antivirus may block outbound HTTPS to Supabase.

1. **Windows Firewall**
   - Open **Windows Security** → **Firewall & network protection** → **Allow an app through firewall**.
   - Ensure your browser and **Python** (or the app you use to run the backend) are allowed for **Private** and **Public** (if you need that).
2. **Antivirus / security software**
   - Add an exception or allow outbound HTTPS for:
     - Your backend (e.g. the folder where you run `uvicorn` or the batch file).
     - Or for **Python** (e.g. `python.exe`).
3. **Corporate / office network**
   - If you’re on a restricted network, Supabase might be blocked. Try from another network (e.g. mobile hotspot) to confirm. If it works there, ask IT to allow `*.supabase.co` (HTTPS).

---

## Step 6: Test Supabase Reachability (optional)

1. In a browser, open your **Project URL** from Step 3, e.g.:  
   `https://YOUR_PROJECT_REF.supabase.co`  
   You should get a short JSON response (e.g. "Not found" or similar from the API), not a long timeout.
2. From the machine where the backend runs, you can also run:

```bash
curl -s -o NUL -w "%{http_code}" https://YOUR_PROJECT_REF.supabase.co
```

   Any HTTP status (e.g. 404) means the host is reachable; a timeout means network/firewall is blocking.

---

## Step 7: Auth Settings (if login still fails with “invalid” or “email not confirmed”)

1. In Supabase dashboard go to **Authentication** → **Providers** → **Email**.
2. If you want to skip email confirmation for development:
   - Enable **"Confirm email"** if you need it, or turn it **off** for testing.
   - Ensure **"Enable Email provider"** is ON.
3. Create or confirm the user in **Authentication** → **Users** (same email you use to sign in).

---

## Quick checklist

- [ ] Supabase project is **not paused** (Step 2).
- [ ] **SUPABASE_URL**, **SUPABASE_ANON_KEY**, and **SUPABASE_SERVICE_ROLE_KEY** in `backend/.env` match the dashboard (Steps 3–4).
- [ ] Backend was **restarted** after changing `.env` (Step 4).
- [ ] Firewall/antivirus allows outbound HTTPS to Supabase (Step 5).
- [ ] User exists in **Authentication → Users** and email is confirmed if required (Step 7).

After these steps, the login timeout (WinError 10060) should stop. If the error message in the app still appears, restart the backend and try again so the new error handling and timeout settings are in use.

---

## Optional: Session / JWT settings (production – session does not expire until logout)

The app refreshes the access token in the background so that as long as the user does **not** log out, the session stays active. If you want refresh tokens to last longer in production:

1. In Supabase dashboard go to **Authentication** → **Settings** (or **Project Settings** → **Auth**).
2. Under **JWT settings** you can review:
   - **JWT expiry** – access token lifetime (e.g. 3600 seconds = 1 hour). The frontend refreshes before this.
   - **Refresh token rotation** – if enabled, each refresh gives a new refresh token and can extend how long the user can stay logged in.
3. Under **Auth providers** or **Sessions**, check **Refresh token reuse interval** / **Refresh token lifetime** if available in your plan. Longer values mean the session can stay alive longer without re-login.

No change is required for the “session does not expire until logout” behavior; the frontend already handles proactive refresh and refresh on tab focus.
