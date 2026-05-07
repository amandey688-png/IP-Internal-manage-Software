# Keepalive Setup for Render Free Tier

## Why this is needed

Render free web services go to sleep after a period of inactivity to save resources. The next incoming request has to wake the container first, which causes a cold-start delay (often several seconds). A lightweight periodic health ping keeps the service warm so user-facing requests do not pay that startup penalty.

## UptimeRobot setup (free, every 5 minutes)

Use this to ping:

`https://<RENDER_URL>/health`

Steps:

1. Sign in to [UptimeRobot](https://uptimerobot.com/) and click **Add New Monitor**.
2. Set:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Support FMS Backend Keepalive`
   - **URL (or IP)**: `https://<RENDER_URL>/health`
   - **Monitoring Interval**: `5 minutes`
   - **HTTP Method**: `GET`
3. Leave auth/body fields empty (health endpoint is unauthenticated).
4. Save the monitor.
5. Wait for 1-2 checks and confirm status is **Up**.

## cron-job.org alternative (free, supports 1-minute intervals)

Use this same URL:

`https://<RENDER_URL>/health`

Steps:

1. Sign in to [cron-job.org](https://cron-job.org/).
2. Click **Create cronjob**.
3. Set:
   - **Title**: `Support FMS Health Ping`
   - **Address (URL)**: `https://<RENDER_URL>/health`
   - **Request method**: `GET`
   - **Schedule mode**: `Simple`
   - **Execution interval**: `Every 5 minutes` (or `Every 1 minute` if you want stricter warm-up)
   - **Timeout**: keep default (or 30s)
4. Save and activate the job.
5. Verify recent executions return HTTP 200.

## Important placeholder note

Replace `<RENDER_URL>` with your real Render backend domain, for example:

`https://your-service-name.onrender.com/health`

## Troubleshooting

- If health checks fail, verify CORS is not blocking unauthenticated `GET` requests.
- Confirm `/health` returns HTTP 200 in under 500 ms.
- Open `https://<RENDER_URL>/health` directly in browser and confirm JSON response.
- If you still see failures, check Render logs for startup errors or crashes during boot.
