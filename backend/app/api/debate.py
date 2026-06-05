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
from app.llm.provider_manager import debate_calls_context, selected_models_context
from typing import Optional

router = APIRouter()
side_agent = SideAgent()

class DebateRequest(BaseModel):
    topic: str
    rounds: int = 3
    mode: str = "classic"
    pro_model: Optional[str] = "LLAMA-3.3"
    opponent_model: Optional[str] = "DEEPSEEK-R1"
    judge_model: Optional[str] = "GEMINI-2.0"

def _sse(payload: dict) -> str:
    """Emit one SSE event and log it to stdout."""
    raw = json.dumps(payload)
    print(f"[SSE EVENT] >>> {raw}", flush=True)
    return f"data: {raw}\n\n"

@router.post("/debate")
async def start_debate(req: DebateRequest, user=Depends(get_current_user)):
    topic = validate_topic(req.topic)
    check_rate_limit(user.id)

    async def event_stream():
        debate_calls_context.set([])
        selected_models_context.set({
            "pro": req.pro_model or "LLAMA-3.3",
            "opponent": req.opponent_model or "DEEPSEEK-R1",
            "judge": req.judge_model or "GEMINI-2.0"
        })
        request_id = str(uuid.uuid4())
        state = DebateState(
            request_id=request_id, user_id=user.id, topic=topic,
            mode=req.mode, rounds=req.rounds, current_round=1,
            history=[], rounds_data=[], verdict=None, done=False
        )
        print(f"\n[DEBATE START] topic={topic!r} rounds={req.rounds}", flush=True)
        try:
            sides = await side_agent.get_sides(topic)
            print(f"[SIDES] {sides}", flush=True)
            yield _sse({
                "id": f"sides-{request_id}",
                "role": "sides",
                "content": json.dumps(sides),
                "round": 0,
                "provider": "system",
                "timestamp": datetime.utcnow().isoformat()
            })
            await asyncio.sleep(0)

            for round_num in range(1, req.rounds + 1):
                print(f"\n[ROUND {round_num}] Generating PRO...", flush=True)
                yield _sse({
                    "id": f"gen-pro-{round_num}",
                    "role": "generating",
                    "content": "pro",
                    "round": round_num,
                    "provider": req.pro_model or "LLAMA-3.3",
                    "timestamp": datetime.utcnow().isoformat()
                })
                await asyncio.sleep(0.05)
                state = await pro_node(state)
                pro_msg = state["rounds_data"][-1]
                print(f"[PRO R{round_num}] length={len(pro_msg['content'])} content={pro_msg['content'][:120]!r}", flush=True)
                yield _sse(pro_msg)
                await asyncio.sleep(0.05)

                print(f"[ROUND {round_num}] Generating OPPONENT...", flush=True)
                yield _sse({
                    "id": f"gen-opponent-{round_num}",
                    "role": "generating",
                    "content": "opponent",
                    "round": round_num,
                    "provider": req.opponent_model or "DEEPSEEK-R1",
                    "timestamp": datetime.utcnow().isoformat()
                })
                await asyncio.sleep(0.05)
                state = await opponent_node(state)
                opp_msg = state["rounds_data"][-1]
                print(f"[OPP R{round_num}] length={len(opp_msg['content'])} content={opp_msg['content'][:120]!r}", flush=True)
                yield _sse(opp_msg)
                await asyncio.sleep(0.05)

            print(f"\n[JUDGE] Starting evaluation...", flush=True)
            yield _sse({
                "id": f"judge-start-{request_id}",
                "role": "judge_start",
                "content": "",
                "round": req.rounds,
                "provider": "system",
                "timestamp": datetime.utcnow().isoformat()
            })
            yield _sse({
                "id": f"gen-judge-{request_id}",
                "role": "generating",
                "content": "judge",
                "round": req.rounds,
                "provider": req.judge_model or "GEMINI-2.0",
                "timestamp": datetime.utcnow().isoformat()
            })
            await asyncio.sleep(0.05)
            state = await judge_node(state)
            print(f"[JUDGE] verdict keys={list(state['verdict'].keys()) if state['verdict'] else 'None'}", flush=True)
            yield _sse({
                "id": f"judge-verdict-{request_id}",
                "role": "judge",
                "content": json.dumps(state["verdict"]),
                "round": req.rounds,
                "provider": req.judge_model or "GEMINI-2.0",
                "timestamp": datetime.utcnow().isoformat()
            })

            calls = debate_calls_context.get()
            success_calls = [c for c in calls if c["status"] == "Success"]
            providers_used = ", ".join(list(dict.fromkeys(c["provider"] for c in success_calls)))
            models_used = ", ".join(list(dict.fromkeys(c["model"] for c in success_calls)))
            total_cost = sum(c["cost"] for c in calls)
            total_latency = sum(c["latency_ms"] for c in calls)
            timestamp = datetime.utcnow().isoformat()

            await store_debate(
                user_id=user.id, topic=topic, rounds_data=state["rounds_data"],
                verdict=state["verdict"], provider_used=providers_used or "unknown",
                model_used=models_used or "unknown", timestamp=timestamp,
                cost=total_cost, latency_ms=total_latency
            )

            print(f"[DEBATE DONE] total_cost={total_cost:.6f} total_latency={total_latency:.1f}ms", flush=True)
            yield _sse({
                "id": f"done-{request_id}",
                "role": "done",
                "content": "",
                "round": req.rounds,
                "provider": "system",
                "timestamp": datetime.utcnow().isoformat()
            })
        except Exception as e:
            print(f"[DEBATE ERROR] {e}", flush=True)
            yield _sse({
                "id": f"error-{request_id}",
                "role": "error",
                "content": str(e),
                "round": 0,
                "provider": "system",
                "timestamp": datetime.utcnow().isoformat()
            })

    return StreamingResponse(event_stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

