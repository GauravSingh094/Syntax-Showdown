from typing import TypedDict, Optional

class DebateState(TypedDict):
    request_id: str
    user_id: str
    topic: str
    mode: str           # "classic" | "rapid"
    rounds: int
    current_round: int
    history: list[str]
    rounds_data: list[dict]
    verdict: Optional[dict]
    done: bool
