from langgraph.graph import StateGraph, END
from app.orchestrator.state import DebateState
from app.agents.pro_agent import ProAgent
from app.agents.opponent_agent import OpponentAgent
from app.agents.judge_agent import JudgeAgent

pro = ProAgent()
opponent = OpponentAgent()
judge = JudgeAgent()

async def pro_node(state: DebateState) -> DebateState:
    response = await pro.respond(state["topic"], state["history"])
    state["history"].append(f"Pro: {response}")
    round_idx = state["current_round"] - 1
    if len(state["rounds_data"]) <= round_idx:
        state["rounds_data"].append({"round": state["current_round"], "pro": response, "opponent": ""})
    else:
        state["rounds_data"][round_idx]["pro"] = response
    return state

async def opponent_node(state: DebateState) -> DebateState:
    response = await opponent.respond(state["topic"], state["history"])
    state["history"].append(f"Opponent: {response}")
    state["rounds_data"][state["current_round"] - 1]["opponent"] = response
    state["current_round"] += 1
    return state

async def judge_node(state: DebateState) -> DebateState:
    state["verdict"] = await judge.evaluate(state["topic"], state["rounds_data"])
    state["done"] = True
    return state

def should_continue(state: DebateState) -> str:
    if state["current_round"] > state["rounds"]:
        return "judge"
    return "pro"

def build_graph():
    graph = StateGraph(DebateState)
    graph.add_node("pro", pro_node)
    graph.add_node("opponent", opponent_node)
    graph.add_node("judge", judge_node)
    graph.set_entry_point("pro")
    graph.add_edge("pro", "opponent")
    graph.add_conditional_edges("opponent", should_continue, {"pro": "pro", "judge": "judge"})
    graph.add_edge("judge", END)
    return graph.compile()

debate_graph = build_graph()
