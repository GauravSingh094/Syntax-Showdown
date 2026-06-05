import time
from collections import defaultdict
from fastapi import HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.config.settings import settings

# User-level rate limiting store (accessed in /api/debate)
_store: dict[str, list[float]] = defaultdict(list)

def check_rate_limit(user_id: str):
    now = time.time()
    window = settings.RATE_LIMIT_WINDOW_SECONDS
    limit = settings.RATE_LIMIT_REQUESTS
    
    # Filter request timestamps within the window
    _store[user_id] = [t for t in _store[user_id] if now - t < window]
    
    if len(_store[user_id]) >= limit:
        oldest = _store[user_id][0]
        retry_after = int(window - (now - oldest))
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Too many requests.",
            headers={"Retry-After": str(retry_after)}
        )
    _store[user_id].append(now)


# Global IP-based Rate Limiter Middleware (Rule 2)
class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        # Store requests as dict of client_ip -> list of timestamps
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Skip OPTIONS preflight requests to avoid blocking standard CORS handshake
        if request.method == "OPTIONS":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        path = request.url.path

        # Determine limits & window based on endpoint category
        if "/debate" in path or "/llm/test" in path:
            # AI and LLM proxy endpoints: 10 requests per minute per IP
            limit = 10
            window = 60
        else:
            # General API: 60 requests per minute per IP
            limit = 60
            window = 60

        # Filter out expired request timestamps
        self.requests[client_ip] = [t for t in self.requests[client_ip] if now - t < window]

        if len(self.requests[client_ip]) >= limit:
            oldest = self.requests[client_ip][0]
            retry_after = int(window - (now - oldest))
            # Return HTTP 429 Too Many Requests response with Retry-After header
            return Response(
                content='{"detail": "Rate limit exceeded. Please try again later."}',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                headers={
                    "Retry-After": str(retry_after),
                    "Content-Type": "application/json"
                }
            )

        self.requests[client_ip].append(now)
        return await call_next(request)
