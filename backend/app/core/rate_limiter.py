import time
from collections import defaultdict
from fastapi import HTTPException
from app.config.settings import settings

_store: dict[str, list[float]] = defaultdict(list)

def check_rate_limit(user_id: str):
    now = time.time()
    window = settings.RATE_LIMIT_WINDOW_SECONDS
    limit = settings.RATE_LIMIT_REQUESTS
    _store[user_id] = [t for t in _store[user_id] if now - t < window]
    if len(_store[user_id]) >= limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    _store[user_id].append(now)
