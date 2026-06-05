import time
from typing import Optional, AsyncIterator
from pydantic import BaseModel

class TokenUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0

class LLMResponse(BaseModel):
    content: str
    provider: str
    model: str
    latency_ms: float
    usage: TokenUsage
    cost: float

class BaseLLMProvider:
    def __init__(self, name: str, debate_model: str, judge_model: str):
        self.name = name
        self.debate_model = debate_model
        self.judge_model = judge_model

    def get_model(self, role: str) -> str:
        if role.lower() == "judge":
            return self.judge_model
        return self.debate_model

    async def generate(self, prompt: str, role: str, format_json: bool = False, model: Optional[str] = None) -> LLMResponse:
        raise NotImplementedError("Subclasses must implement generate")

    async def check_health(self) -> dict:
        raise NotImplementedError("Subclasses must implement check_health")
