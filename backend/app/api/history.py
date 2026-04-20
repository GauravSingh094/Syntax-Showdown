from fastapi import APIRouter, Depends
from app.auth.clerk_middleware import get_current_user
from app.memory.chromadb_client import get_user_debates

router = APIRouter()

@router.get("/history")
async def fetch_history(user=Depends(get_current_user)):
    history = await get_user_debates(user.id)
    return {"history": history}
