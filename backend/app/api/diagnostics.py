from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.llm.provider_manager import llm_manager

router = APIRouter()

class TestRequest(BaseModel):
    provider: str

@router.post("/llm/test")
async def test_llm_provider(req: TestRequest):
    prov = req.provider.lower().strip()
    if prov not in llm_manager.providers:
        raise HTTPException(status_code=400, detail=f"Unsupported provider '{req.provider}'. Allowed: {list(llm_manager.providers.keys())}")
    
    provider = llm_manager.providers[prov]
    health_result = await provider.check_health()
    return health_result
