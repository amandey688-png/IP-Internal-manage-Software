"""
Async email sender using aiosmtplib.
Supports SMTP (Postmark, etc.) with HTML content.
"""
import os
import aiosmtplib
from email.message import EmailMessage


async def send_email(to_email: str, subject: str, html_content: str, plain_fallback: str | None = None):
    """
    Send an email with HTML content.
    Uses SMTP from env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL.
    Returns True if sent, False otherwise.
    """
    to_email = (to_email or "").strip()
    if not to_email:
        return False

    smtp_host = (os.getenv("SMTP_HOST") or "").strip()
    smtp_port = int(os.getenv("SMTP_PORT") or "587")
    smtp_user = (os.getenv("SMTP_USER") or "").strip()
    smtp_pass = (os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS") or "").strip()
    smtp_from = (os.getenv("SMTP_FROM_EMAIL") or os.getenv("RESEND_FROM_EMAIL") or "").strip()

    if not all([smtp_host, smtp_user, smtp_pass, smtp_from]):
        return False

    message = EmailMessage()
    message["From"] = smtp_from
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(plain_fallback or "This email requires HTML support.")
    message.add_alternative(html_content, subtype="html")

    smtp_stream = (os.getenv("SMTP_POSTMARK_STREAM") or "").strip()
    if smtp_stream:
        message["X-PM-Message-Stream"] = smtp_stream

    use_tls = smtp_port == 465
    start_tls = smtp_port == 587 if not use_tls else False

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
        print(f"send_email error: {safe_msg}", file=sys.stderr, flush=True)
        return False
