import os, uuid, json
from datetime import datetime
import chromadb
from dotenv import load_dotenv
from app.config.settings import settings

load_dotenv()

client = chromadb.CloudClient(
    api_key=settings.CHROMA_API_KEY,
    tenant=settings.CHROMA_TENANT,
    database=settings.CHROMA_DATABASE,
)
collection = client.get_or_create_collection("debates")

async def store_debate(
    user_id: str,
    topic: str,
    rounds_data: list,
    verdict: dict,
    provider_used: str = "unknown",
    model_used: str = "unknown",
    timestamp: str = "",
    cost: float = 0.0,
    latency_ms: float = 0.0
):
    count = collection.count()
    if count >= settings.CHROMA_MAX_RECORDS:
        oldest = collection.get(limit=1, include=["metadatas"])
        if oldest["ids"]:
            collection.delete(ids=[oldest["ids"][0]])
            
    if not timestamp:
        timestamp = datetime.utcnow().isoformat()
        
    collection.add(
        documents=[json.dumps({"topic": topic, "rounds": rounds_data, "verdict": verdict})],
        metadatas=[{
            "user_id": user_id,
            "topic": topic,
            "provider_used": provider_used,
            "model_used": model_used,
            "timestamp": timestamp,
            "cost": float(cost),
            "latency_ms": float(latency_ms)
        }],
        ids=[str(uuid.uuid4())]
    )

async def get_user_debates(user_id: str) -> list:
    results = collection.get(where={"user_id": user_id}, include=["documents", "metadatas"])
    return [json.loads(d) for d in results["documents"]]
