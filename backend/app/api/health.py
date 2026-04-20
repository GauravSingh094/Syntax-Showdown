from fastapi import APIRouter
import httpx
from app.config.settings import settings
from app.memory.chromadb_client import collection

router = APIRouter()

@router.get("/health")
async def health():
    status = {}
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{settings.OLLAMA_URL}/api/tags")
            status["ollama"] = "ok" if r.status_code == 200 else "degraded"
    except:
        status["ollama"] = "unreachable"
    try:
        collection.count()
        status["chromadb"] = "ok"
    except:
        status["chromadb"] = "unreachable"
    status["api"] = "ok"
    return status
