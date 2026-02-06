# Email SMTP Setup – Step-by-Step Guide

**File:** `EMAIL_SMTP_SETUP.md`  
Use this guide to configure **custom SMTP** in Supabase so your app can send **confirmation emails**, **password reset**, and **invites** reliably (especially for production).

---

## Why set up custom SMTP?

Supabase’s **default** email service:

- Sends **only to pre-authorized** team emails (or you get “Email address not authorized”).
- Is **rate-limited** (e.g. ~2 emails per hour).
- Has **no SLA** and is **not for production**.

With **custom SMTP** you can:

- Send to **any** user email.
- Avoid the default rate limit (Supabase may still apply a limit; you can adjust in Rate Limits).
- Use a proper provider (deliverability, support, logs).

---

## Overview

1. Choose an SMTP provider and get credentials.
2. In Supabase: **Authentication** → **SMTP** → enable custom SMTP and enter those credentials.
3. (Optional) Adjust rate limits and test.

---

## Step 1: Choose an SMTP provider

Use any provider that supports SMTP. Examples:

| Provider   | Notes |
|-----------|--------|
| **Resend** | Simple API, good docs, [Supabase SMTP guide](https://resend.com/docs/send-with-supabase-smtp). |
| **Brevo** (ex-Sendinblue) | Free tier, SMTP. |
| **SendGrid** (Twilio) | SMTP and API. |
| **AWS SES** | Cheap, requires AWS account; use SMTP. |
| **Postmark** | Good for transactional email. |
| **Gmail / Google Workspace** | Use “App password” + SMTP (see below). |

Pick one and get: **host**, **port**, **username**, **password**, and a **sender email** (e.g. `no-reply@yourdomain.com` or your Gmail).

---

## Step 2: Get SMTP credentials

### Option A: Resend (recommended for quick setup)

1. Sign up at [resend.com](https://resend.com).
2. Add and verify your domain (or use their sandbox domain for testing).
3. Go to **API Keys** → create an API key.
4. For **SMTP** in Resend:
   - **Host:** `smtp.resend.com`
   - **Port:** `465` (SSL) or `587` (TLS)
   - **User:** `resend`
   - **Password:** your **API key** (not your account password).
   - **From:** use a verified domain, e.g. `no-reply@yourdomain.com`.

### Option B: Gmail / Google Workspace

1. Turn on **2-Step Verification** for your Google account.
2. Create an **App password**: [Google Account → Security → App passwords](https://myaccount.google.com/apppasswords).
3. Use:
   - **Host:** `smtp.gmail.com`
   - **Port:** `587` (TLS)
   - **User:** your full Gmail (e.g. `you@gmail.com`)
   - **Password:** the 16-character **App password**
   - **From:** same Gmail (or your Workspace address).

### Option C: Brevo (Sendinblue)

1. Sign up at [brevo.com](https://www.brevo.com).
2. **SMTP & API** → **SMTP**: note server, port, and create an SMTP key.
3. Use:
   - **Host:** e.g. `smtp-relay.brevo.com`
   - **Port:** `587`
   - **User:** your Brevo login email
   - **Password:** SMTP key from Brevo.

---

## Step 3: Open Supabase SMTP settings

1. Go to [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your **project**.
3. In the left sidebar: **Authentication**.
4. Open the **SMTP** section (or **Providers** / **Settings** depending on UI; look for “SMTP” or “Custom SMTP”).
   - Direct link pattern: `https://supabase.com/dashboard/project/<YOUR_PROJECT_REF>/auth/smtp`

---

## Step 4: Enable and fill custom SMTP

1. Find **“Enable Custom SMTP”** (or “Use custom SMTP”) and **turn it ON**.
2. Fill in the form (labels may vary slightly):

| Field (Supabase)     | What to enter |
|----------------------|----------------|
| **Sender email**     | From address (e.g. `no-reply@yourdomain.com` or `you@gmail.com`). Must be allowed by your provider. |
| **Sender name**      | Name shown in inbox (e.g. `Your App Name` or `FMS`). |
| **Host**             | SMTP host (e.g. `smtp.resend.com`, `smtp.gmail.com`). |
| **Port**             | Usually `587` (TLS) or `465` (SSL). |
| **Username**         | SMTP username (e.g. `resend` for Resend, or full Gmail). |
| **Password**         | SMTP password or API key (e.g. Resend API key, Gmail App password). |

3. **Save** the settings.

---

## Step 5: (Optional) Adjust rate limits

After enabling custom SMTP, Supabase may still apply a default rate limit (e.g. 30 emails/hour).

1. In the dashboard: **Authentication** → **Rate Limits** (or **Auth** → **Rate Limits**).
2. Find **Email** or **SMTP** rate limit and set a value suitable for your app (e.g. 100/hour for production).
3. Save.

---

## Step 6: Confirm Auth and redirect URLs

So that **confirmation links** work:

1. **Authentication** → **URL Configuration** (or **Settings**).
2. **Site URL:** your app URL (e.g. `http://localhost:3001` for dev, `https://yourdomain.com` for prod).
3. **Redirect URLs:** add at least:
   - `http://localhost:3001/confirmation-success`
   - `http://localhost:3001/auth/confirm`
   - For production: `https://yourdomain.com/confirmation-success` and `https://yourdomain.com/auth/confirm`.
4. **Authentication** → **Providers** → **Email**: ensure **“Enable email confirmations”** is ON if you want signup confirmation.

---

## Step 7: Test email delivery

1. **Register a new user** from your app (use an email you can access).
2. Check inbox (and spam).
3. You should receive the **Confirm signup** email with a link.
4. Click the link; it should redirect to your app (e.g. `/confirmation-success`).

If nothing arrives:

- Check **Authentication** → **Logs** (Auth logs) for send errors.
- Verify SMTP credentials (host, port, user, password).
- For Gmail: use an **App password**, not your normal password.
- For Resend: use **API key** as password and a **verified** sender address.

---

## Checklist

- [ ] SMTP provider account created and credentials obtained (host, port, user, password).
- [ ] Supabase: **Authentication** → **SMTP** → **Enable Custom SMTP** = ON.
- [ ] Sender email, sender name, host, port, username, password filled and saved.
- [ ] Redirect URLs and Site URL set for dev/production.
- [ ] “Enable email confirmations” turned on (if you use confirmation).
- [ ] Test: register → receive email → click link → redirects to app.

---

## Quick reference: where things are in Supabase

| What              | Where |
|------------------|--------|
| Custom SMTP      | **Authentication** → **SMTP** (or Auth settings → SMTP). |
| Redirect URLs    | **Authentication** → **URL Configuration**. |
| Email confirmations | **Authentication** → **Providers** → **Email**. |
| Auth logs        | **Authentication** → **Logs** (or **Auth Logs**). |
| Rate limits      | **Authentication** → **Rate Limits**. |

---

## Troubleshooting

| Problem | What to check |
|--------|----------------|
| “Email address not authorized” | Custom SMTP not enabled, or still using default (only team emails). Enable custom SMTP and save. |
| No email received | Auth logs for errors; spam folder; correct SMTP credentials and port (587/465). |
| Gmail “Less secure app” / login blocked | Do **not** use normal password. Use **2-Step Verification** + **App password**. |
| Resend not sending | Sender must be from verified domain; password = **API key**. |
| Link in email goes to wrong URL | Fix **Redirect URLs** and **Site URL** in Supabase Auth. |

---

## More info

- [Supabase: Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Resend + Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp)
- Project email confirmation flow: `SUPABASE_EMAIL_SETUP.md`, `READY_TEST_PRODUCTION.md`
