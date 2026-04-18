"""
Optional Redis for server-side caching (e.g. Render Redis).

Set REDIS_URL (e.g. rediss://default:...@...:6379). If unset or connection fails,
get_redis() returns None and callers should skip cache.
"""
from __future__ import annotations

import os
import threading
from typing import Any

_redis: Any = None
_redis_lock = threading.Lock()
_redis_failed = False


def get_redis():
    """Return a redis.Redis client or None if disabled / unavailable."""
    global _redis, _redis_failed
    url = (os.getenv("REDIS_URL") or "").strip()
    if not url or _redis_failed:
        return None
    with _redis_lock:
        if _redis is not None:
            return _redis
        try:
            import redis

            client = redis.Redis.from_url(url, decode_responses=True, socket_connect_timeout=2.5, socket_timeout=2.5)
            client.ping()
            _redis = client
            return _redis
        except Exception:
            _redis_failed = True
            return None


def cache_get(key: str) -> str | None:
    r = get_redis()
    if not r:
        return None
    try:
        return r.get(key)
    except Exception:
        return None


def cache_set(key: str, value: str, ttl_sec: int) -> bool:
    r = get_redis()
    if not r:
        return False
    try:
        r.setex(key, ttl_sec, value)
        return True
    except Exception:
        return False


def cache_delete(key: str) -> bool:
    r = get_redis()
    if not r:
        return False
    try:
        r.delete(key)
        return True
    except Exception:
        return False
