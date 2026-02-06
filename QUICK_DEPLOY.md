# ⚡ Quick Deploy - Go Live in 30 Minutes

**Fastest way to get your app live!**

---

## 🎯 Quick Steps

### 1. Push to GitHub (5 min)

```powershell
cd "c:\Support FMS to APPLICATION"
git checkout main
git pull origin main
git add .
git commit -m "Add deployment guides"
git push origin main
```

---

### 2. Deploy Frontend to Vercel (10 min)

1. Go to: **https://vercel.com** → Sign in with GitHub
2. Click **"Add New Project"**
3. Import: `amandey688-png/IP-Internal-manage-Software`
4. Configure:
   - **Root Directory:** `fms-frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=https://placeholder.com (update after backend deploy)
   ```
6. Click **"Deploy"**
7. **Copy your Vercel URL** → `https://your-app.vercel.app`

---

### 3. Deploy Backend to Railway (10 min)

1. Go to: **https://railway.app** → Sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select: `IP-Internal-manage-Software`
4. Configure:
   - **Root Directory:** `backend`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_ANON_KEY=your_anon_key
   DATABASE_URL=your_supabase_database_url
   ```
6. **Copy your Railway URL** → `https://your-backend.up.railway.app`

---

### 4. Update Environment Variables (5 min)

1. **Vercel:** Update `VITE_API_URL` with Railway URL
2. **Redeploy** frontend
3. **Supabase:** Add frontend URL to Auth → Redirect URLs

---

### 5. Test (5 min)

1. Open frontend URL
2. Register/Login
3. Create a ticket
4. Verify everything works

---

## ✅ Done!

**Your app is live!** 🎉

- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.up.railway.app`
- API Docs: `https://your-backend.up.railway.app/docs`

---

**Need help?** See `DEPLOYMENT_GUIDE.md` for detailed instructions.
