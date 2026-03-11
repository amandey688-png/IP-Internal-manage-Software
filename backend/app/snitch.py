"""
Dead Man's Snitch integration (https://deadmanssnitch.com).
Ping your Snitch URL when a job runs so you get alerted if it doesn't run.
Set DEADMANS_SNITCH_URL in .env to enable (e.g. https://nosnch.in/xxxxxxxx).
"""
import os
import threading
import httpx


def ping_snitch():
    """
    Ping Dead Man's Snitch URL if DEADMANS_SNITCH_URL is set.
    Runs in a daemon thread so it never blocks the caller.
    """
    url = (os.getenv("DEADMANS_SNITCH_URL") or "").strip()
    if not url or not url.startswith("https://"):
        return
    def _do_ping():
        try:
            httpx.get(url, timeout=10)
        except Exception:
            pass
    t = threading.Thread(target=_do_ping, daemon=True)
    t.start()
