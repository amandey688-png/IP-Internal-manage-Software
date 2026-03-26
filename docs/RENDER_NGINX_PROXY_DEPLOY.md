# Deploy Render NGINX Proxy (for Backend Load Balancing)

This doc explains how to deploy the NGINX proxy service on Render so your Vercel frontend can use it as `VITE_API_URL`.

## 0) Prerequisites
- You already deployed your FastAPI backend to Render at **2+** different service domains (for example `fms-backend-a.onrender.com` and `fms-backend-b.onrender.com`).
- You have the domains for those backend services ready.

## 1) Update NGINX config (required)
Edit:
- `deploy/nginx/render-nginx.conf`

Then replace these lines with your real backend domains:
- `server fms-backend-a.onrender.com:443;`
- `server fms-backend-b.onrender.com:443;`

(Optional) Add more upstream servers if you deployed more backend instances.

## 2) Deploy proxy to Render
1. Go to Render Dashboard
2. Click **New +** → **Web Service**
3. Choose **Docker**
4. Connect your GitHub repo
5. Set **Build settings**:
   - **Root Directory:** repository root
   - **Dockerfile location:** `deploy/nginx/Dockerfile.render-proxy`
6. Set **Environment variables** (optional):
   - Usually none are required for this NGINX container.
7. Set **Service/Ports**:
   - Ensure Render routes to the container port `10000` (NGINX listens on `10000` in `deploy/nginx/render-nginx.conf`).
   - In Render UI this is typically the “Port” / “Container port” field.
8. Set **Health check**:
   - Path: `/health`
   - If Render asks for “protocol”, use HTTP.
   - Note: NGINX does not implement `/health` itself; it proxies `/health` to whichever backend service is healthy.
9. Click **Create Web Service** / **Deploy**

After deploy you will get a public URL like:
- `https://<your-proxy-name>.onrender.com`

## 3) Update Vercel frontend to use the proxy
1. Go to Vercel → your project → **Settings**
2. Find **Environment Variables**
3. Set:
   - `VITE_API_URL=https://<your-proxy-name>.onrender.com`
4. Click **Save**
5. Redeploy frontend

## 4) Test (quick checklist)
1. Open backend (example):
   - `https://<your-proxy-name>.onrender.com/health`
2. Open swagger:
   - `https://<your-proxy-name>.onrender.com/docs`
3. Login from frontend and test:
   - Fetch `/users/me`
   - Load `/dashboard` pages (or any endpoint)
4. Confirm browser Network tab shows API calls going to:
   - `https://<your-proxy-name>.onrender.com/...`

## Security / reliability notes
- Your backend has in-memory rate limiting. With multiple backend instances, rate limiting becomes “per instance”. If you plan to scale beyond 1 instance, we should move rate limiting to a shared store (Redis) for strict global limits.

