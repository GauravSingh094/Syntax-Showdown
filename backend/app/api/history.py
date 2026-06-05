from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from app.auth.clerk_middleware import get_current_user
from app.memory.chromadb_client import get_user_debates, get_debate_by_id, get_all_debates

router = APIRouter()

@router.get("/history/leaderboard")
async def fetch_leaderboard():
    debates = await get_all_debates()
    
    # Calculate word/topic frequencies
    topics_freq = {}
    for d in debates:
        topic = d.get("topic", "")
        if topic:
            topics_freq[topic] = topics_freq.get(topic, 0) + 1
            
    top_topics = sorted(
        [{"topic": k, "count": v} for k, v in topics_freq.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:10]
    
    # Highest scoring debates
    scored_debates = []
    for d in debates:
        verdict = d.get("verdict", {})
        if verdict and isinstance(verdict, dict):
            scores = verdict.get("scores", {})
            if scores:
                pro_score_sum = sum(scores.get("Pro", {}).values()) if isinstance(scores.get("Pro"), dict) else 0
                opp_score_sum = sum(scores.get("Opponent", {}).values()) if isinstance(scores.get("Opponent"), dict) else 0
                total_score = pro_score_sum + opp_score_sum
                
                scored_debates.append({
                    "id": d.get("id"),
                    "topic": d.get("topic"),
                    "winner": verdict.get("winner"),
                    "total_score": total_score,
                    "timestamp": d.get("timestamp")
                })
                
    highest_scoring = sorted(
        scored_debates,
        key=lambda x: x["total_score"],
        reverse=True
    )[:10]
    
    # Model/Provider usage stats
    model_counts = {}
    for d in debates:
        model = d.get("model_used", "unknown")
        if model:
            # Split model strings if multiple used
            for m in model.split(", "):
                m_clean = m.strip().upper()
                if m_clean and m_clean != "UNKNOWN":
                    model_counts[m_clean] = model_counts.get(m_clean, 0) + 1
                    
    model_trends = sorted(
        [{"model": k, "count": v} for k, v in model_counts.items()],
        key=lambda x: x["count"],
        reverse=True
    )

    return {
        "top_topics": top_topics,
        "highest_scoring": highest_scoring,
        "model_trends": model_trends,
        "total_debates_count": len(debates)
    }

@router.get("/history")
async def fetch_history(user=Depends(get_current_user)):
    history = await get_user_debates(user.id)
    return {"history": history}

@router.get("/history/{debate_id}")
async def fetch_debate_authenticated(debate_id: str, user=Depends(get_current_user)):
    debate = await get_debate_by_id(debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")
    return {"debate": debate}

@router.get("/debate/public/{debate_id}")
async def fetch_debate_public(debate_id: str):
    debate = await get_debate_by_id(debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")
    return {"debate": debate}
