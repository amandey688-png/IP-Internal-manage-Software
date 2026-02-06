# 🚀 Complete Deployment Guide - Go Live Step by Step

This guide will help you deploy your FMS application to production (go live).

**Tech Stack:**
- **Frontend**: React + Vite + TypeScript
- **Backend**: FastAPI (Python 3.11+)
- **Database**: Supabase (already cloud-hosted)
- **Storage**: Supabase Storage (already cloud-hosted)

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All code is committed to GitHub
- [ ] All tests pass locally
- [ ] Environment variables are documented
- [ ] Database migrations are ready
- [ ] Supabase project is set up and configured
- [ ] Domain name is ready (optional)

---

## Part 1: Push Current Changes to GitHub

### Step 1.1: Commit and Push Current Branch

```powershell
cd "c:\Support FMS to APPLICATION"

# Check current status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Add: Deployment guide and fix CodeRabbit extension documentation"

# Push to GitHub
git push origin review/full-project-code-review
```

### Step 1.2: Create Pull Request and Merge to Main

1. **Go to GitHub:** https://github.com/amandey688-png/IP-Internal-manage-Software/pulls
2. **Click "New pull request"**
3. **Set:**
   - Base: `main` ←
   - Compare: `review/full-project-code-review` →
4. **Title:** `Deployment: Add deployment guide and documentation fixes`
5. **Click "Create pull request"**
6. **Wait for CodeRabbit review** (if configured)
7. **Merge PR** when CodeRabbit check is green ✅

### Step 1.3: Switch to Main Locally

```powershell
git checkout main
git pull origin main
```

---

## Part 2: Deploy Frontend (React + Vite)

### Option A: Deploy to Vercel (Recommended)

#### Step 2.1: Prepare Frontend for Production

1. **Check environment variables:**
   - Create `.env.production` in `fms-frontend/` folder:
   ```env
   VITE_API_URL=https://your-backend-url.com
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Update API URL in code** (if hardcoded):
   - Search for `http://localhost:8000` and replace with environment variable

#### Step 2.2: Deploy to Vercel

1. **Go to:** https://vercel.com
2. **Sign up/Login** with GitHub
3. **Click "Add New Project"**
4. **Import your repository:** `amandey688-png/IP-Internal-manage-Software`
5. **Configure:**
   - **Framework Preset:** Vite
   - **Root Directory:** `fms-frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

6. **Environment Variables:**
   - Add all variables from `.env.production`
   - `VITE_API_URL` = your backend URL (will set after backend deployment)
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

7. **Click "Deploy"**
8. **Wait for deployment** (2-3 minutes)
9. **Copy your Vercel URL** (e.g., `https://your-app.vercel.app`)

#### Step 2.3: Configure Custom Domain (Optional)

1. In Vercel dashboard → **Settings** → **Domains**
2. Add your domain (e.g., `app.yourdomain.com`)
3. Follow DNS configuration instructions
4. SSL certificate is automatic

---

### Option B: Deploy to Netlify

1. **Go to:** https://www.netlify.com
2. **Sign up/Login** with GitHub
3. **Click "Add new site"** → **"Import an existing project"**
4. **Connect GitHub** and select your repository
5. **Configure:**
   - **Base directory:** `fms-frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `fms-frontend/dist`
6. **Add environment variables** (same as Vercel)
7. **Deploy**

---

## Part 3: Deploy Backend (FastAPI)

### Option A: Deploy to Railway (Recommended)

#### Step 3.1: Prepare Backend for Production

1. **Create `Procfile`** in `backend/` folder:
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

2. **Create `runtime.txt`** in `backend/` folder:
   ```
   python-3.11.0
   ```

3. **Create `railway.json`** (optional, for Railway):
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

#### Step 3.2: Deploy to Railway

1. **Go to:** https://railway.app
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository:** `IP-Internal-manage-Software`
6. **Configure:**
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

7. **Add Environment Variables:**
   - Click on your service → **Variables**
   - Add:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     SUPABASE_ANON_KEY=your_anon_key
     DATABASE_URL=your_supabase_database_url
     PORT=8000
     ```

8. **Deploy**
9. **Copy your Railway URL** (e.g., `https://your-app.up.railway.app`)

#### Step 3.3: Update CORS Settings

In your FastAPI backend (`backend/app/main.py`), ensure CORS allows your frontend domain:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend.vercel.app",  # Your Vercel URL
        "http://localhost:5173",  # Keep for local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit and redeploy after this change.

---

### Option B: Deploy to Render

1. **Go to:** https://render.com
2. **Sign up/Login** with GitHub
3. **Click "New +"** → **"Web Service"**
4. **Connect GitHub** and select your repository
5. **Configure:**
   - **Name:** `fms-backend`
   - **Root Directory:** `backend`
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. **Add environment variables** (same as Railway)
7. **Deploy**

---

### Option C: Deploy to AWS Lambda (Advanced)

For serverless deployment, you'll need to:
1. Use Mangum or similar ASGI adapter
2. Package dependencies
3. Configure API Gateway
4. Set up environment variables in Lambda

---

## Part 4: Update Environment Variables

### Step 4.1: Update Frontend Environment Variables

1. **Go to Vercel/Netlify dashboard**
2. **Settings** → **Environment Variables**
3. **Update `VITE_API_URL`** with your backend URL:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```
4. **Redeploy** frontend

### Step 4.2: Verify Backend Environment Variables

Ensure all backend environment variables are set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`

---

## Part 5: Database Setup (Supabase)

### Step 5.1: Verify Supabase Configuration

1. **Go to:** https://supabase.com/dashboard
2. **Select your project**
3. **Verify:**
   - Database is running
   - All migrations are applied
   - RLS policies are enabled
   - Storage buckets are configured
   - Email templates are set up

### Step 5.2: Update Supabase Settings

1. **Settings** → **API**
   - Copy `Project URL` → use as `SUPABASE_URL`
   - Copy `anon public` key → use as `SUPABASE_ANON_KEY`
   - Copy `service_role` key → use as `SUPABASE_SERVICE_ROLE_KEY`

2. **Settings** → **Auth**
   - Add your frontend URL to **Site URL**
   - Add frontend URL to **Redirect URLs**

---

## Part 6: Testing Production Deployment

### Step 6.1: Test Frontend

1. **Open your frontend URL** (e.g., `https://your-app.vercel.app`)
2. **Check:**
   - Page loads correctly
   - No console errors
   - API calls work
   - Authentication works

### Step 6.2: Test Backend

1. **Open:** `https://your-backend.railway.app/docs` (FastAPI Swagger UI)
2. **Test endpoints:**
   - Health check endpoint
   - Authentication endpoints
   - API endpoints

### Step 6.3: Test Full Flow

1. **Register a new user**
2. **Login**
3. **Create a ticket**
4. **Upload attachment**
5. **Check real-time updates**

---

## Part 7: Post-Deployment Configuration

### Step 7.1: Set Up Monitoring

1. **Vercel Analytics** (built-in)
2. **Sentry** for error tracking (optional)
3. **Uptime monitoring** (UptimeRobot, Pingdom)

### Step 7.2: Set Up Backups

1. **Supabase:** Automatic daily backups (already enabled)
2. **Database:** Export schema regularly
3. **Code:** GitHub is your backup

### Step 7.3: Performance Optimization

1. **Enable CDN** (Vercel/Netlify handles this)
2. **Optimize images** (use Supabase Storage CDN)
3. **Enable caching** headers
4. **Monitor API response times**

---

## Part 8: Domain Setup (Optional)

### Step 8.1: Configure Custom Domain

1. **Buy domain** (Namecheap, GoDaddy, etc.)
2. **In Vercel:**
   - Settings → Domains → Add domain
   - Follow DNS instructions
   - SSL is automatic

3. **Update environment variables:**
   - Update `VITE_API_URL` if backend has custom domain
   - Update Supabase redirect URLs

---

## 🚨 Troubleshooting

### Frontend Issues

| Problem | Solution |
|---------|----------|
| **Build fails** | Check build logs, ensure all dependencies are in `package.json` |
| **API calls fail** | Verify `VITE_API_URL` is correct, check CORS settings |
| **Environment variables not working** | Ensure variables start with `VITE_` prefix for Vite |

### Backend Issues

| Problem | Solution |
|---------|----------|
| **Deployment fails** | Check logs, verify `requirements.txt` is correct |
| **500 errors** | Check environment variables, verify Supabase connection |
| **CORS errors** | Update CORS origins to include frontend URL |

### Database Issues

| Problem | Solution |
|---------|----------|
| **Connection errors** | Verify `DATABASE_URL` is correct |
| **RLS blocking queries** | Check RLS policies, verify user roles |
| **Migration errors** | Run migrations manually in Supabase SQL editor |

---

## 📊 Deployment Checklist

- [ ] Code pushed to GitHub main branch
- [ ] Frontend deployed (Vercel/Netlify)
- [ ] Backend deployed (Railway/Render)
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Supabase configured
- [ ] Frontend URL added to Supabase redirect URLs
- [ ] All endpoints tested
- [ ] Authentication flow tested
- [ ] File upload tested
- [ ] Real-time updates tested
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Documentation updated with production URLs

---

## 🔗 Quick Links

- **GitHub Repo:** https://github.com/amandey688-png/IP-Internal-manage-Software
- **Vercel:** https://vercel.com
- **Railway:** https://railway.app
- **Render:** https://render.com
- **Supabase:** https://supabase.com/dashboard

---

## 📝 Notes

- **Free tiers available** for all platforms (with limitations)
- **Upgrade plans** for production workloads
- **Monitor usage** to avoid unexpected costs
- **Set up alerts** for downtime or errors

---

**Your Production URLs:**
- Frontend: `https://your-app.vercel.app` (update after deployment)
- Backend: `https://your-backend.railway.app` (update after deployment)
- API Docs: `https://your-backend.railway.app/docs` (update after deployment)

---

**Next Steps After Deployment:**
1. Share production URLs with your team
2. Set up monitoring and alerts
3. Configure backups
4. Plan for scaling as usage grows
