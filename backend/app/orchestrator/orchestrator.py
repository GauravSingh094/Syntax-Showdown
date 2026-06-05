from langgraph.graph import StateGraph, END
from app.orchestrator.state import DebateState
from app.agents.pro_agent import ProAgent
from app.agents.opponent_agent import OpponentAgent
from app.agents.judge_agent import JudgeAgent

# Removed global instances to allow for dynamic reloading

def check_debate_validity(state: DebateState):
    """Detects if the debate has sufficient conflict. Raises ValueError if not."""
    if state["current_round"] == 1 and len(state["rounds_data"]) > 0:
        pro_msg = next((m for m in state["rounds_data"] if m.get("round") == 1 and m.get("role") == "pro"), None)
        opp_msg = next((m for m in state["rounds_data"] if m.get("round") == 1 and m.get("role") == "opponent"), None)
        
        if pro_msg and opp_msg:
            pro = pro_msg["content"].lower()
            opp = opp_msg["content"].lower()
            
            # Concession check
            concession_terms = ["i agree", "valid point", "you are correct", "fair enough", "we agree"]
            if any(term in opp for term in concession_terms):
                raise ValueError("INVALID DEBATE: Opponent conceded in the first round. Debate terminated due to lack of conflict.")
                
            # Semantic overlap check (simplified)
            pro_words = set(w for w in pro.split() if len(w) > 4)
            opp_words = set(w for w in opp.split() if len(w) > 4)
            if len(pro_words & opp_words) / max(len(pro_words), 1) > 0.6:
                raise ValueError("INVALID DEBATE: Extreme semantic overlap detected. Agents are repeating each other.")

async def pro_node(state: DebateState) -> DebateState:
    import uuid
    from datetime import datetime
    from app.llm.provider_manager import selected_models_context
    
    pro = ProAgent()
    response = await pro.respond(state["topic"], state["history"])
    state["history"].append(f"Pro: {response}")
    
    provider = selected_models_context.get().get("pro", "unknown")
    msg = {
        "id": f"msg-{uuid.uuid4()}",
        "role": "pro",
        "content": response,
        "round": state["current_round"],
        "provider": provider,
        "timestamp": datetime.utcnow().isoformat()
    }
    state["rounds_data"].append(msg)
    return state

async def opponent_node(state: DebateState) -> DebateState:
    import uuid
    from datetime import datetime
    from app.llm.provider_manager import selected_models_context
    
    opponent = OpponentAgent()
    response = await opponent.respond(state["topic"], state["history"])
    state["history"].append(f"Opponent: {response}")
    
    provider = selected_models_context.get().get("opponent", "unknown")
    msg = {
        "id": f"msg-{uuid.uuid4()}",
        "role": "opponent",
        "content": response,
        "round": state["current_round"],
        "provider": provider,
        "timestamp": datetime.utcnow().isoformat()
    }
    state["rounds_data"].append(msg)
    
    # Check for Invalid Debate (Lack of Conflict) after round 1
    check_debate_validity(state)
    
    state["current_round"] += 1
    return state

async def judge_node(state: DebateState) -> DebateState:
    judge = JudgeAgent()
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
