# SMTP Ports (25, 2525, 587) & Supabase Custom SMTP

## Using Different SMTP Ports

Your backend reads the port from the `SMTP_PORT` environment variable. Supported ports:

| Port | Use case |
|------|----------|
| **587** | Standard submission (STARTTLS) – default, recommended |
| **2525** | Alternative when 587 is blocked (e.g. some hosts) |
| **25** | Traditional SMTP |
| **465** | SSL/TLS from start |

### How to change port

**In Render** (backend service → Environment):
```
SMTP_PORT=2525
```

**In local `.env`**:
```
SMTP_PORT=2525
```

You only need `SMTP_PORT`; the backend uses the correct TLS mode per port.

### On Render

Render blocks ports **25, 465, 587** on the free tier. Port **2525** is not mentioned as blocked, so it might work.

If all SMTP ports fail, use **SendGrid HTTP API** instead:

```
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=aman@industryprime.com
```

---

## Supabase Custom SMTP – change port

Supabase uses its own SMTP config for **auth emails** (confirmation, reset password, etc.). This is separate from your backend checklist reminders.

### Via Supabase dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Authentication** → **SMTP**
   - Or: **Project Settings** → **Auth** → **SMTP Settings**
3. Enable **Custom SMTP** and enter:
4. Set:
   - **Host**: `smtp.postmarkapp.com` (or your provider)
   - **Port**: `2525` or `587` or `25`
   - **Username**: Postmark token (or your provider user)
   - **Password**: same token
   - **Sender email**: `noreply@yourdomain.com` or `aman@industryprime.com`

### Via Supabase Management API

```bash
# Get access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="geqcgxassdkrymzsjpoj"  # your project ref

curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "smtp_host": "smtp.postmarkapp.com",
    "smtp_port": 2525,
    "smtp_user": "your-postmark-token",
    "smtp_pass": "your-postmark-token",
    "smtp_admin_email": "aman@industryprime.com",
    "smtp_sender_name": "IP Internal Management"
  }'
```

---

## Keep backend and Supabase in sync

Use the same SMTP provider and port for both:

| Setting | Supabase Auth SMTP | Backend (Render / .env) |
|---------|--------------------|-------------------------|
| Host | smtp.postmarkapp.com | SMTP_HOST=smtp.postmarkapp.com |
| Port | 2525 (or 587) | SMTP_PORT=2525 |
| User | Postmark token | SMTP_USER=xxx |
| Password | Postmark token | SMTP_PASSWORD=xxx |
| From | aman@industryprime.com | SMTP_FROM_EMAIL=aman@industryprime.com |

---

## Quick reference

**Backend env vars:**
```
SMTP_HOST=smtp.postmarkapp.com
SMTP_PORT=2525
SMTP_USER=your-token
SMTP_PASSWORD=your-token
SMTP_FROM_EMAIL=aman@industryprime.com
```

**Supabase:** Authentication → SMTP → Port = 2525 (or 587)
