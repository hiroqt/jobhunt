import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException, status
from backend.app.core.config import settings
from backend.app.core.logging import logger


class InMemoryRateLimiter:
    """
    Sliding window in-memory rate limiter for AI operations.
    Limits requests per client (identified by X-Session-ID header, X-Forwarded-For, or client IP).
    Does not expose sensitive system metrics or API keys.
    """
    def __init__(self, requests_per_minute: int = 20):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        self._history: Dict[str, List[float]] = defaultdict(list)

    def _get_client_id(self, request: Request) -> str:
        # Check X-Session-ID header or session_id cookie first
        session_id = request.headers.get("x-session-id") or request.cookies.get("session_id")
        if session_id:
            return f"session:{session_id}"
        
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
            return f"ip:{ip}"
        
        return f"ip:{request.client.host if request.client else '127.0.0.1'}"

    async def __call__(self, request: Request):
        now = time.time()
        client_id = self._get_client_id(request)
        cutoff = now - self.window_seconds

        # Prune old timestamps
        self._history[client_id] = [ts for ts in self._history[client_id] if ts > cutoff]
        timestamps = self._history[client_id]

        limit = getattr(settings, "AI_RATE_LIMIT_PER_MINUTE", self.requests_per_minute)

        if len(timestamps) >= limit:
            oldest = timestamps[0]
            retry_after = max(1, int(self.window_seconds - (now - oldest)))
            logger.warning(
                f"Rate limit exceeded for {client_id}: {len(timestamps)}/{limit} req/min. "
                f"Path: {request.url.path}. Retry after {retry_after}s."
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit reached ({limit} AI requests per minute). Please try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )

        timestamps.append(now)


ai_rate_limiter = InMemoryRateLimiter(requests_per_minute=20)
