"""
JWT auth middleware for protected routes.
Validates Bearer token and returns current user info.
"""
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.supabase_client import supabase

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """Validate JWT and return {id, email} for current user."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = credentials.credentials
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return {"id": str(user.user.id), "email": user.user.email or ""}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
