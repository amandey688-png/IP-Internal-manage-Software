# NGINX Load Balancer Setup (FastAPI Backend)

This setup adds NGINX in front of multiple FastAPI backend containers.

## What this gives you

- One public endpoint via NGINX
- Requests distributed across 3 backend instances
- Better concurrency and resiliency for self-hosted deployments

## Files added

- `backend/Dockerfile`
- `deploy/nginx/nginx.conf`
- `docker-compose.nginx.yml`

## Run locally or on a VM

1. Ensure Docker and Docker Compose are installed.
2. Ensure `backend/.env` exists with all backend variables.
3. From repo root, run:

```bash
docker compose -f docker-compose.nginx.yml up --build -d
```

4. Open:

- `http://localhost:8080/health`
- `http://localhost:8080/docs`

## Scale backend instances

If you want more instances, duplicate backend services in `docker-compose.nginx.yml` and add them to `deploy/nginx/nginx.conf` upstream.

## Important security note

Your app currently uses in-memory rate limiting. With multiple backend instances behind NGINX, rate limiting is per-instance. For strict global limits, move counters to shared storage (Redis).

## Render + Vercel note

Render free Web Service does not let you run a custom NGINX sidecar in the same service. Use this NGINX setup on a VM/container platform (or as a dedicated proxy service). On Render managed service, use Render URL directly as the backend entry point.
