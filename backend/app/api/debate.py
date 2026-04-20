import json, uuid, asyncio
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.orchestrator.state import DebateState
from app.orchestrator.orchestrator import pro_node, opponent_node, judge_node, debate_graph
from app.auth.clerk_middleware import get_current_user
from app.core.security import validate_topic
from app.memory.chromadb_client import store_debate
from app.core.rate_limiter import check_rate_limit
from pydantic import BaseModel

router = APIRouter()

class DebateRequest(BaseModel):
    topic: str
    rounds: int = 3
    mode: str = "classic"

@router.post("/debate")
async def start_debate(req: DebateRequest, user=Depends(get_current_user)):
    topic = validate_topic(req.topic)
    check_rate_limit(user.id)

    async def event_stream():
        request_id = str(uuid.uuid4())
        state = DebateState(
            request_id=request_id, user_id=user.id, topic=topic,
            mode=req.mode, rounds=req.rounds, current_round=1,
            history=[], rounds_data=[], verdict=None, done=False
        )
        try:
            for round_num in range(1, req.rounds + 1):
                state = await pro_node(state)
                pro_text = state["rounds_data"][round_num - 1]["pro"]
                yield f'data: {json.dumps({"type":"pro","round":round_num,"content":pro_text})}\n\n'
                await asyncio.sleep(0)  # allow flush

                state = await opponent_node(state)
                opp_text = state["rounds_data"][round_num - 1]["opponent"]
                yield f'data: {json.dumps({"type":"opponent","round":round_num,"content":opp_text})}\n\n'
                await asyncio.sleep(0)

            state = await judge_node(state)
            yield f'data: {json.dumps({"type":"judge","content":state["verdict"]})}\n\n'

            await store_debate(user_id=user.id, topic=topic,
                               rounds_data=state["rounds_data"], verdict=state["verdict"])

            yield f'data: {json.dumps({"type":"done"})}\n\n'
        except Exception as e:
            yield f'data: {json.dumps({"type":"error","content":str(e)})}\n\n'

    return StreamingResponse(event_stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
