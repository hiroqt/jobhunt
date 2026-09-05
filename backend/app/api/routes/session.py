from typing import Optional
from fastapi import APIRouter, Request, Query
from backend.app.db.session_manager import session_manager
from backend.app.core.logging import logger

router = APIRouter(prefix="/session", tags=["Session"])


@router.post("/reset")
async def reset_session(
    request: Request,
    session_id: Optional[str] = Query(None)
):
    """
    Instantly purges all data (resumes, searches, applications, candidate profile)
    for the calling session.
    """
    sid = session_id or request.headers.get("x-session-id") or "guest_default"
    await session_manager.purge_session(sid)
    logger.info(f"User requested session reset: {sid}")
    return {
        "status": "reset_successful",
        "session_id": sid,
        "message": "All session data has been completely wiped."
    }


@router.get("/status")
async def get_session_status(request: Request):
    """Returns status and metrics for the current ephemeral session."""
    sid = request.headers.get("x-session-id") or "guest_default"
    return {
        "session_id": sid,
        "active_sessions_count": session_manager.get_active_session_count(),
        "mode": "stateless_ephemeral_guest"
    }
