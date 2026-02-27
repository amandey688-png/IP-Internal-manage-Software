# Fix Login – Step-by-Step (Supabase + .env)

Your project **FMS to APPLICATION** is ACTIVE. Login fails because the **keys in backend/.env are wrong or incomplete**. Follow these steps exactly.

---

## Step 1: Open Supabase API settings

1. Go to **[https://supabase.com](https://supabase.com)** and sign in.
2. Click the project **FMS to APPLICATION**.
3. Click the **gear icon** (⚙️) in the left sidebar → **Project Settings**.
4. In the left menu under **Project Settings**, click **API**.

---

## Step 2: Copy the correct keys (JWT format)

On the **API** page you will see:

### Project URL
- **Copy** the **Project URL** (e.g. `https://geqcgxassdkrymzsjpoj.supabase.co`).
- It must start with `https://` and end with `.supabase.co`.

### Project API keys – two keys matter

1. **anon public** (under “Project API keys”)
   - Label: **anon** / **public**.
   - The key is a **long string starting with `eyJ`** (JWT).
   - Click **Reveal** or the copy icon and copy the **entire** key. It is long (200+ characters). Do not truncate it.
   - → This is for `SUPABASE_ANON_KEY`.

2. **service_role** (under “Project API keys”)
   - Label: **service_role** (often says “secret”).
   - This key **also starts with `eyJ`** (JWT), not with `sb_secret_`.
   - Click **Reveal** or the copy icon and copy the **entire** key.
   - → This is for `SUPABASE_SERVICE_ROLE_KEY`.

**Important:**  
- Both keys must start with **`eyJ`**.  
- If you see a key starting with **`sb_secret_`**, that is **not** the API key to use for `SUPABASE_SERVICE_ROLE_KEY`. Scroll or look for the **service_role** JWT that starts with `eyJ`.

---

## Step 3: Edit backend/.env

1. Open your project in the editor.
2. Open the file **`backend/.env`**.
3. Set these three lines **exactly** (replace with your copied values):

```env
SUPABASE_URL=https://geqcgxassdkrymzsjpoj.supabase.co
SUPABASE_ANON_KEY=paste_the_full_anon_key_here_starting_with_eyJ
SUPABASE_SERVICE_ROLE_KEY=paste_the_full_service_role_key_here_starting_with_eyJ
```

Rules:
- **No quotes** around the values.
- **No spaces** before or after `=`.
- **SUPABASE_ANON_KEY** and **SUPABASE_SERVICE_ROLE_KEY** must be the **full** keys (paste once; do not cut off the end).
- **SUPABASE_SERVICE_ROLE_KEY** must start with **`eyJ`**, not `sb_secret_`.

4. Save the file (Ctrl+S).

---

## Step 4: Remove wrong or duplicate entries (if present)

In `.env`:

- If you have a line like `SUPABASE_SERVICE_ROLE_KEY=sb_secret_...`, **delete it** or replace it with the correct `eyJ...` key from Step 2.
- Keep only **one** line each for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (no duplicates).

---

## Step 5: Restart the backend

1. Stop the backend (close the terminal or press Ctrl+C where it is running).
2. Start it again: double-click **`start-backend-utf8.bat`** or run:
   ```bat
   cd backend
   start-backend-utf8.bat
   ```
3. Wait until you see the server running (e.g. “Uvicorn running on ...”).

---

## Step 6: Test

1. Open in the browser: **http://127.0.0.1:8000/health/supabase**
   - Check: `anon_key_set` and `service_role_key_set` should be **true**, `reachable` should be **ok**.
2. Open your app (e.g. http://localhost:3000) and try **Sign in** again.

---

## Checklist

- [ ] Supabase → Project Settings → API: copied **Project URL**.
- [ ] Copied **anon public** key (full key starting with `eyJ`) → `SUPABASE_ANON_KEY`.
- [ ] Copied **service_role** key (full key starting with `eyJ`, **not** `sb_secret_`) → `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] In `backend/.env`: no quotes, no spaces around `=`, keys not cut off.
- [ ] Backend restarted after saving `.env`.
- [ ] Opened http://127.0.0.1:8000/health/supabase and confirmed keys set and reachable.

After this, login on localhost should work. If it still fails, send the JSON from **http://127.0.0.1:8000/health/supabase** (with keys removed) so we can see the exact error.
