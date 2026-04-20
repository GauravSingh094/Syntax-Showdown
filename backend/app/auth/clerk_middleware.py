import httpx
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, jwk
from app.config.settings import settings

bearer = HTTPBearer()

async def get_jwks():
    async with httpx.AsyncClient() as client:
        r = await client.get(settings.CLERK_JWKS_URL)
        return r.json()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(bearer)):
    token = credentials.credentials
    try:
        jwks = await get_jwks()
        headers = jwt.get_unverified_header(token)
        key = next(k for k in jwks["keys"] if k["kid"] == headers["kid"])
        public_key = jwk.construct(key)
        payload = jwt.decode(token, public_key, algorithms=["RS256"])
        return type("User", (), {"id": payload["sub"]})()
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
