# Share This Software on Localhost with a Client (Without Going Live)

Use a **tunnel** so your client can open your app in their browser while it still runs on your machine. No deployment needed.

---

## Option 1: ngrok (recommended)

### 1. Install ngrok

- Download: https://ngrok.com/download (or `choco install ngrok` on Windows)
- Sign up at https://ngrok.com (free) and get your auth token; then run: `ngrok config add-authtoken YOUR_TOKEN`

### 2. Start your app locally

- **Terminal 1 – Backend**
  ```bash
  cd backend
  uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
  ```
- **Terminal 2 – Frontend**
  ```bash
  cd fms-frontend
  npm run dev
  ```
  Note the frontend port (e.g. **3001**).

### 3. Create two tunnels

- **Terminal 3 – Tunnel for backend**
  ```bash
  ngrok http 8000
  ```
  Copy the **HTTPS** URL (e.g. `https://abc123.ngrok-free.app`). This is your **backend public URL**.

- **Terminal 4 – Tunnel for frontend**
  ```bash
  ngrok http 3001
  ```
  Copy the **HTTPS** URL (e.g. `https://xyz789.ngrok-free.app`). This is your **frontend public URL** (give this to the client).

### 4. Point frontend to the backend tunnel

Create `fms-frontend/.env.local` (or edit it) with the **backend** ngrok URL:

```env
VITE_API_BASE_URL=https://abc123.ngrok-free.app
```

Replace `https://abc123.ngrok-free.app` with the URL from **Terminal 3**.

Restart the frontend (Terminal 2: stop with Ctrl+C, then run `npm run dev` again).

### 5. Allow the frontend tunnel in CORS

Set the **frontend** ngrok URL in backend CORS.

**Option A – Environment variable (recommended)**

In `backend/.env` add (use the URL from **Terminal 4**):

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://xyz789.ngrok-free.app
```

Or add only the new one:

```env
CORS_ORIGIN=https://xyz789.ngrok-free.app
```

Restart the backend (Terminal 1).

**Option B – Command line**

```bash
cd backend
set CORS_ORIGIN=https://xyz789.ngrok-free.app
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

(On PowerShell use `$env:CORS_ORIGIN="https://xyz789.ngrok-free.app"` before the uvicorn command.)

### 6. Share with the client

Send the **frontend** ngrok URL (from Terminal 4) to the client, e.g.:

`https://xyz789.ngrok-free.app`

They open it in their browser and use the app; API calls go to your backend through the other tunnel.

**Important:**  
- Keep all four terminals (backend, frontend, backend tunnel, frontend tunnel) running while the client is using it.  
- Free ngrok URLs change each time you restart ngrok. After a restart, update `VITE_API_BASE_URL` and `CORS_ORIGIN` with the new URLs and restart frontend and backend.

---

## Option 2: localtunnel (no signup)

```bash
# Install once
npm install -g localtunnel

# Tunnel frontend (e.g. port 3001)
lt --port 3001
# Gives a URL like https://something.loca.lt

# In another terminal, tunnel backend
lt --port 8000
```

Then do the same as with ngrok: set `VITE_API_BASE_URL` to the **backend** tunnel URL, add the **frontend** tunnel URL to backend CORS, restart frontend and backend, and share the **frontend** tunnel URL with the client.

---

## Quick checklist

| Step | What to do |
|------|------------|
| 1 | Backend running on port 8000 |
| 2 | Frontend running (e.g. port 3001) |
| 3 | Tunnel for 8000 → backend public URL |
| 4 | Tunnel for 3001 → frontend public URL |
| 5 | `fms-frontend/.env.local`: `VITE_API_BASE_URL=<backend public URL>` |
| 6 | Backend CORS includes `<frontend public URL>` |
| 7 | Restart frontend and backend |
| 8 | Send **frontend public URL** to the client |

Nothing is deployed; everything stays on your machine and is only visible via the tunnel URLs while the tunnels are running.
