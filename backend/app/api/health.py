import asyncio
from fastapi import APIRouter
from app.llm.provider_manager import llm_manager
from app.memory.chromadb_client import collection

router = APIRouter()

@router.get("/health")
async def health():
    status = {}
    
    # 1. Probe all configured LLM providers in parallel
    provider_keys = list(llm_manager.providers.keys())
    tasks = [llm_manager.providers[k].check_health() for k in provider_keys]
    
    health_results = await asyncio.gather(*tasks, return_exceptions=True)
    
    llm_status = {}
    for key, result in zip(provider_keys, health_results):
        if isinstance(result, Exception):
            llm_status[key] = {
                "status": "unreachable",
                "error": str(result),
                "latency_ms": 0,
                "model": llm_manager.providers[key].debate_model
            }
        else:
            llm_status[key] = result
            
    status["providers"] = llm_status
    
    # 2. Probe ChromaDB Cloud status
    try:
        collection.count()
        status["chromadb"] = "ok"
    except Exception as e:
        status["chromadb"] = f"unreachable: {str(e)}"
        
    status["api"] = "ok"
    return status
