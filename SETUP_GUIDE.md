# FMS – Setup & Deploy in 2 Days

## Day 1: Database + Backend + Local Test

### Step 1: Database Setup (15 min)

1. Go to [Supabase](https://supabase.com) → Your Project → **SQL Editor**
2. Copy entire content of `database/SETUP_COMPLETE.sql`
3. Paste and click **Run**
4. Verify:
   ```sql
   SELECT COUNT(*) FROM public.roles;      -- Should show 3
   SELECT COUNT(*) FROM public.user_profiles;
   ```

### Step 2: Supabase Auth Settings (5 min)

1. **Authentication** → **Providers** → Email: ON
2. **Authentication** → **URL Configuration**:
   - Site URL: `http://localhost:3001` (dev) or your production URL
   - Redirect URLs: add
     - `http://localhost:3001/confirmation-success`
     - `http://localhost:3001/auth/confirm`
     - Your production URL + `/confirmation-success`
3. **Authentication** → **Email Templates** → Confirm signup: enabled

### Step 3: Backend Env (2 min)

Create `backend/.env`:
```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get keys: Supabase → **Settings** → **API**

### Step 4: Run Backend

```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 5: Run Frontend

```powershell
cd fms-frontend
npm install
npm run dev
```

### Step 6: Test Locally

1. Open http://localhost:3001
2. Register → check email → confirm → Login
3. Create ticket, view list, view detail
4. (Admin) Users list

---

## Day 2: Deploy to Production

### Option A: Vercel (Frontend) + Railway/Render (Backend)

**Frontend (Vercel):**
1. Push code to GitHub
2. Vercel → Import project → `fms-frontend`
3. Root directory: `fms-frontend`
4. Build: `npm run build`, Output: `dist`
5. Env: `VITE_API_BASE_URL=https://your-backend.railway.app`

**Backend (Railway/Render):**
1. Connect repo, root: `backend`
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
5. Add your frontend URL to CORS in `main.py`

### Option B: Single Server (VPS)

```bash
# Install Node, Python
# Build frontend
cd fms-frontend && npm run build
# Serve with nginx or serve dist/
# Run backend with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### Update Supabase Redirect URLs

Add production URLs:
- `https://your-app.vercel.app/confirmation-success`
- `https://your-app.vercel.app/auth/confirm`

### Update Backend CORS

In `backend/app/main.py`, add your production frontend URL to `allow_origins`.

---

## Quick Test Checklist

- [ ] Register new user
- [ ] Confirm email (check inbox/spam)
- [ ] Login
- [ ] Dashboard shows (may be empty)
- [ ] Create ticket
- [ ] View ticket list
- [ ] View ticket detail
- [ ] (Admin) View users list

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "User profile not found" | Run SETUP_COMPLETE.sql, ensure roles + user_profiles exist |
| No confirmation email | Supabase Auth → enable email confirmations, check SMTP |
| CORS error | Add frontend URL to backend allow_origins |
| 401 on /users/me | Check token in Authorization header, SERVICE_ROLE_KEY in backend |
| Tickets 404 | Run SETUP_COMPLETE.sql Part 2 (tickets table) |
