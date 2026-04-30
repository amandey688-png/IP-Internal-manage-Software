"""
Send one test email using backend/.env (same path as uvicorn).

Usage (from repository root or backend/):
  cd backend
  python scripts/test_smtp.py
  python scripts/test_smtp.py recipient@example.com

Recipient defaults to SMTP_TEST_TO, then SMTP_FROM_EMAIL, from .env
"""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path


def main() -> None:
    backend_root = Path(__file__).resolve().parent.parent
    os.chdir(backend_root)
    if str(backend_root) not in sys.path:
        sys.path.insert(0, str(backend_root))

    from dotenv import load_dotenv

    load_dotenv(backend_root / ".env")

    to = (sys.argv[1] if len(sys.argv) > 1 else "").strip()
    if not to:
        to = (os.getenv("SMTP_TEST_TO") or os.getenv("SMTP_FROM_EMAIL") or "").strip()
    if not to:
        print("Usage: python scripts/test_smtp.py you@example.com")
        print("Or set SMTP_FROM_EMAIL or SMTP_TEST_TO in backend/.env")
        sys.exit(1)

    async def run() -> bool:
        from app.utils.email import send_email

        return await send_email(
            to_email=to,
            subject="FMS: SMTP test (scripts/test_smtp.py)",
            html_content="<p>If you see this HTML, <strong>SMTP/API email works</strong>.</p>",
            plain_fallback="SMTP test OK (plain).",
        )

    ok = asyncio.run(run())
    if ok:
        print(f"SUCCESS — test email sent to {to!r}. Check inbox/spam.")
    else:
        print("FAILED — send_email returned False. Read stderr for [email] / SMTP errors.")
        print("Tip: For SMTP providers like Postmark/Brevo, leave SENDGRID_API_KEY unset.")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
