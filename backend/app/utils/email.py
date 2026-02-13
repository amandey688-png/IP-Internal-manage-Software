"""
Async email sender.
- Postmark HTTP API: works on Render (use POSTMARK_SERVER_TOKEN).
- SendGrid HTTP API: works on Render (use SENDGRID_API_KEY).
- SMTP: for localhost/dev (Postmark, etc.).

Supported SMTP ports (via SMTP_PORT env):
  587  - default, STARTTLS
  2525 - alternative when 587 blocked
  25   - traditional SMTP, STARTTLS
  465  - SSL from start
"""
import os

try:
    import httpx
except ImportError:
    httpx = None


async def send_email(to_email: str, subject: str, html_content: str, plain_fallback: str | None = None):
    """
    Send an email with HTML content.
    Order: Postmark API -> SendGrid API -> SMTP.
    Returns True if sent, False otherwise.
    """
    to_email = (to_email or "").strip()
    if not to_email:
        return False

    plain = (plain_fallback or "This email requires HTML support.").strip()

    # 1. Postmark HTTP API - works on Render (same token as SMTP)
    postmark_token = (os.getenv("POSTMARK_SERVER_TOKEN") or os.getenv("SMTP_USER") or "").strip()
    from_email = (os.getenv("SMTP_FROM_EMAIL") or "").strip()
    smtp_host_check = (os.getenv("SMTP_HOST") or "").lower()
    use_postmark_api = postmark_token and httpx and from_email and (
        os.getenv("POSTMARK_SERVER_TOKEN") or "postmark" in smtp_host_check
    )
    if use_postmark_api:
        try:
            from_val = f"IP Internal Management <{from_email}>"
            stream = (os.getenv("SMTP_POSTMARK_STREAM") or "outbound").strip()
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    "https://api.postmarkapp.com/email",
                    headers={
                        "X-Postmark-Server-Token": postmark_token,
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                    json={
                        "From": from_val,
                        "To": to_email,
                        "Subject": subject,
                        "TextBody": plain,
                        "HtmlBody": html_content,
                        "MessageStream": stream,
                    },
                )
                if resp.status_code == 200:
                    try:
                        data = resp.json() if resp.content else {}
                        if data.get("ErrorCode", 0) == 0:
                            return True
                    except Exception:
                        pass
                _log(f"Postmark API error: {resp.status_code} {resp.text[:200]}")
        except Exception as e:
            _log(f"Postmark API error: {e}")
        return False

    # 2. SendGrid HTTP API - works on Render
    sg_key = (os.getenv("SENDGRID_API_KEY") or "").strip()
    sg_from = (os.getenv("SENDGRID_FROM_EMAIL") or os.getenv("SMTP_FROM_EMAIL") or "").strip()
    sg_name = (os.getenv("SENDGRID_FROM_NAME") or "IP Internal Management").strip()
    if sg_key and httpx and sg_from:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    headers={"Authorization": f"Bearer {sg_key}", "Content-Type": "application/json"},
                    json={
                        "personalizations": [{"to": [{"email": to_email}]}],
                        "from": {"email": sg_from, "name": sg_name},
                        "subject": subject,
                        "content": [
                            {"type": "text/plain", "value": plain},
                            {"type": "text/html", "value": html_content},
                        ],
                    },
                )
                if resp.status_code in (200, 202):
                    return True
                _log(f"SendGrid API error: {resp.status_code} {resp.text[:200]}")
        except Exception as e:
            _log(f"SendGrid API error: {e}")
        return False

    # 3. SMTP fallback (localhost/dev - blocked on Render free tier)
    import aiosmtplib
    from email.message import EmailMessage

    smtp_host = (os.getenv("SMTP_HOST") or "").strip()
    smtp_port = int(os.getenv("SMTP_PORT") or "587")
    smtp_user = (os.getenv("SMTP_USER") or "").strip()
    smtp_pass = (os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS") or "").strip()
    smtp_from = (os.getenv("SMTP_FROM_EMAIL") or "").strip()

    if not all([smtp_host, smtp_user, smtp_pass, smtp_from]):
        _log("send_email: set POSTMARK_SERVER_TOKEN (or SENDGRID_API_KEY) for Render, or SMTP vars for localhost")
        return False

    message = EmailMessage()
    message["From"] = smtp_from
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(plain)
    message.add_alternative(html_content, subtype="html")

    smtp_stream = (os.getenv("SMTP_POSTMARK_STREAM") or "").strip()
    if smtp_stream:
        message["X-PM-Message-Stream"] = smtp_stream

    # Port 465 = SSL from start; 587, 2525, 25 = STARTTLS
    use_tls = smtp_port == 465
    start_tls = smtp_port in (587, 2525, 25) if not use_tls else False

    try:
        await aiosmtplib.send(
            message,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_pass,
            use_tls=use_tls,
            start_tls=start_tls,
        )
        return True
    except Exception as e:
        import sys
        safe_msg = str(e).encode("ascii", errors="replace").decode("ascii")
        print(f"send_email SMTP error: {safe_msg}", file=sys.stderr, flush=True)
        return False


def _log(msg: str):
    import sys
    print(f"[email] {msg}", file=sys.stderr, flush=True)
