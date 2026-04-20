import os, uuid, json
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

async def store_debate(user_id: str, topic: str, rounds_data: list, verdict: dict):
    count = collection.count()
    if count >= settings.CHROMA_MAX_RECORDS:
        oldest = collection.get(limit=1, include=["metadatas"])
        if oldest["ids"]:
            collection.delete(ids=[oldest["ids"][0]])
    collection.add(
        documents=[json.dumps({"topic": topic, "rounds": rounds_data, "verdict": verdict})],
        metadatas=[{"user_id": user_id, "topic": topic}],
        ids=[str(uuid.uuid4())]
    )

async def get_user_debates(user_id: str) -> list:
    results = collection.get(where={"user_id": user_id}, include=["documents", "metadatas"])
    return [json.loads(d) for d in results["documents"]]
