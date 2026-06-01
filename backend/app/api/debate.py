import json, uuid, asyncio
from datetime import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.orchestrator.state import DebateState
from app.orchestrator.orchestrator import pro_node, opponent_node, judge_node
from app.auth.clerk_middleware import get_current_user
from app.core.security import validate_topic
from app.memory.chromadb_client import store_debate
from app.core.rate_limiter import check_rate_limit
from pydantic import BaseModel
from app.agents.side_agent import SideAgent
from app.llm.provider_manager import debate_calls_context

router = APIRouter()
side_agent = SideAgent()

class DebateRequest(BaseModel):
    topic: str
    rounds: int = 3 # Minimum 1 round (Pro + Opponent) required for fair adjudication
    mode: str = "classic"

@router.post("/debate")
async def start_debate(req: DebateRequest, user=Depends(get_current_user)):
    topic = validate_topic(req.topic)
    check_rate_limit(user.id)

    async def event_stream():
        debate_calls_context.set([])
        request_id = str(uuid.uuid4())
        state = DebateState(
            request_id=request_id, user_id=user.id, topic=topic,
            mode=req.mode, rounds=req.rounds, current_round=1,
            history=[], rounds_data=[], verdict=None, done=False
        )
        try:
            sides = await side_agent.get_sides(topic)
            yield f'data: {json.dumps({"type":"sides","content":sides})}\n\n'
            await asyncio.sleep(0)

            for round_num in range(1, req.rounds + 1):
                state = await pro_node(state)
                pro_text = state["rounds_data"][round_num - 1]["pro"]
                yield f'data: {json.dumps({"type":"pro","round":round_num,"content":pro_text})}\n\n'
                await asyncio.sleep(0)  # allow flush

                state = await opponent_node(state)
                opp_text = state["rounds_data"][round_num - 1]["opponent"]
                yield f'data: {json.dumps({"type":"opponent","round":round_num,"content":opp_text})}\n\n'
                await asyncio.sleep(0)

            yield f'data: {json.dumps({"type":"judge_start"})}\n\n'
            state = await judge_node(state)
            yield f'data: {json.dumps({"type":"judge","content":state["verdict"]})}\n\n'

            # Extract metrics recorded in current async context (Requirement 9)
            calls = debate_calls_context.get()
            success_calls = [c for c in calls if c["status"] == "Success"]
            providers_used = ", ".join(list(dict.fromkeys(c["provider"] for c in success_calls)))
            models_used = ", ".join(list(dict.fromkeys(c["model"] for c in success_calls)))
            total_cost = sum(c["cost"] for c in calls)
            total_latency = sum(c["latency_ms"] for c in calls)
            timestamp = datetime.utcnow().isoformat()

            await store_debate(
                user_id=user.id,
                topic=topic,
                rounds_data=state["rounds_data"],
                verdict=state["verdict"],
                provider_used=providers_used or "unknown",
                model_used=models_used or "unknown",
                timestamp=timestamp,
                cost=total_cost,
                latency_ms=total_latency
            )

            yield f'data: {json.dumps({"type":"done"})}\n\n'
        except Exception as e:
            yield f'data: {json.dumps({"type":"error","content":str(e)})}\n\n'

    return StreamingResponse(event_stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
