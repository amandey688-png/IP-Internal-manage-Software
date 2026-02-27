# Fix "Cannot reach Supabase" – Step by Step

When you see **503** and "Cannot reach Supabase" on login, follow these steps in order. Your project ID: **geqcgxassdkrymzsjpoj**.

---

## Step 1: Unpause the project (most common cause)

On the **free tier**, Supabase **pauses projects after ~7 days** of no use. That’s why it "previously didn’t happen" and then starts failing.

1. Open: **https://supabase.com/dashboard**
2. Sign in and select your project (or open the link below).
3. **Direct link to your project settings:**  
   **https://supabase.com/dashboard/project/geqcgxassdkrymzsjpoj/settings/general**
4. On the **Home** or **Settings → General** page, look for:
   - **"Project is paused"** or **"Paused"**
   - A **"Restore project"** or **"Resume"** button
5. Click **Restore project** / **Resume**.
6. Wait **1–2 minutes** for the project to come back online.
7. Try logging in again from your app.

If the project was paused, this usually fixes it.

---

## Step 2: Confirm API URL and keys in Supabase

1. In Supabase Dashboard go to: **Project Settings** (gear icon) → **API**.
2. Copy these (you’ll use them in Step 3):
   - **Project URL** (e.g. `https://geqcgxassdkrymzsjpoj.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (long string starting with `eyJ...`)

   **Important:** Use the **full JWT keys** (eyJ...), **not** the short "Key ID" from Settings → JWT Keys.

---

## Step 3: Set backend `.env` correctly

1. Open the file: **`backend\.env`** (in the backend folder of this project).
2. Make sure these three lines exist and match Supabase (no extra spaces, no quotes):

   ```
   SUPABASE_URL=https://geqcgxassdkrymzsjpoj.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Replace the `...` with the **full** keys you copied from Step 2.
4. Save the file.
5. **Restart the backend** (stop uvicorn and run `start-backend-utf8.bat` again).

---

## Step 4: See the exact error (diagnostic)

1. With the **backend running**, open in your browser:  
   **http://127.0.0.1:8000/health/supabase**
2. You’ll see JSON with:
   - `reachable`: "ok" or "error"
   - `hint`: short explanation (e.g. "Connection timeout", "Unpause project")
   - `unpause_link`: link to unpause (if applicable)

Use this to confirm whether the problem is: paused project, wrong URL/keys, or network/firewall.

---

## Step 5: Firewall / antivirus (if still failing)

If the project is **not** paused and `.env` is correct but you still get 503:

1. **Windows Firewall:** Allow **Python** (or the app that runs the backend) for Private/Public network.
2. **Antivirus:** Add an exception for the backend folder or for Python, or temporarily disable to test.
3. **Network:** If you’re on a corporate/VPN network, try from another network (e.g. mobile hotspot). If it works there, your network may be blocking `*.supabase.co`.

---

## Quick checklist

- [ ] Step 1: Unpaused project in Supabase Dashboard (wait 1–2 min after restore)
- [ ] Step 2: Confirmed Project URL and anon/service_role keys in Dashboard → API
- [ ] Step 3: Updated `backend\.env` with correct URL and full JWT keys, then restarted backend
- [ ] Step 4: Opened http://127.0.0.1:8000/health/supabase and read the `hint`
- [ ] Step 5: If still failing, checked firewall/antivirus/network

After Step 1 and 3, try **Sign in** again. If it still fails, use Step 4 to see the exact error message.
