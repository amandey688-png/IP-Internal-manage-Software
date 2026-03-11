# Dead Man's Snitch setup

The backend pings **Dead Man's Snitch** when `/health` is called, so you get alerted if your app (or your health-check cron) stops running.

## 1. Create a Snitch

1. Go to [deadmanssnitch.com](https://deadmanssnitch.com) and sign up.
2. Click **Add a new Snitch**.
3. Set:
   - **Name**: e.g. `FMS Backend Health`
   - **Interval**: how often you expect `/health` to be hit (e.g. every 5 or 15 minutes).
   - **Notes**: optional.
4. Copy the **Snitch URL** (e.g. `https://nosnch.in/abc123xyz`).

## 2. Configure the backend

In `backend/.env` set:

```env
DEADMANS_SNITCH_URL=https://nosnch.in/your_snitch_id_here
```

Restart the backend so it picks up the new env var.

## 3. Ensure something hits `/health` on that interval

- **Option A – UptimeRobot / cron:** You already use a monitor (e.g. UptimeRobot) that GETs your backend’s `/health` every 5–15 minutes. Once `DEADMANS_SNITCH_URL` is set, each successful health check will also ping Snitch. If the monitor or the app goes down, Snitch won’t get a ping and will alert you.
- **Option B – No external monitor:** Run a cron job (or a scheduler) that GETs `https://your-backend-url/health` on the same interval as your Snitch (e.g. every 15 minutes). The backend will then ping Snitch on each request.

## How it works

- On every successful `GET /health`, the backend starts a background request to your Snitch URL.
- If `DEADMANS_SNITCH_URL` is not set or is empty, nothing is sent.
- Snitch expects a check-in before the interval expires; if it doesn’t receive one, it sends an alert (e.g. email).

No new Python packages are required; the app uses `httpx` (already in `requirements.txt`).
