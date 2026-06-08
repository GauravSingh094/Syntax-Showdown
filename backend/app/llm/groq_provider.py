import time
import httpx
import logging
from typing import Optional
from app.llm.base import BaseLLMProvider, LLMResponse, TokenUsage
from app.config.settings import settings

logger = logging.getLogger(__name__)

class GroqProvider(BaseLLMProvider):
    def __init__(self):
        super().__init__(
            name="groq",
            debate_model="llama-3.3-70b-versatile",
            judge_model="llama-3.3-70b-versatile"
        )

    def _calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        # Llama 3.3 70B & DeepSeek-R1 70B pricing: $0.59/M input, $0.79/M output
        input_rate = 0.59 / 1_000_000
        output_rate = 0.79 / 1_000_000
        return (input_tokens * input_rate) + (output_tokens * output_rate)

    async def generate(self, prompt: str, role: str, format_json: bool = False, model: Optional[str] = None) -> LLMResponse:
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not configured")

        if not model:
            model = self.get_model(role)
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2 if role.lower() == "judge" else 0.7
        }
        
        if format_json and "deepseek" not in model.lower():
            payload["response_format"] = {"type": "json_object"}

        start_time = time.perf_counter()
        
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
        latency_ms = (time.perf_counter() - start_time) * 1000
        data = response.json()
        
        content = data["choices"][0]["message"]["content"].strip()
        usage_data = data.get("usage", {})
        
        usage = TokenUsage(
            input_tokens=usage_data.get("prompt_tokens", 0),
            output_tokens=usage_data.get("completion_tokens", 0),
            total_tokens=usage_data.get("total_tokens", 0)
        )
        
        cost = self._calculate_cost(model, usage.input_tokens, usage.output_tokens)
        
        return LLMResponse(
            content=content,
            provider=self.name,
            model=model,
            latency_ms=latency_ms,
            usage=usage,
            cost=cost
        )

    async def check_health(self) -> dict:
        if not settings.GROQ_API_KEY:
            return {"provider": self.name, "status": "unreachable", "error": "API Key Missing", "latency_ms": 0, "model": self.debate_model}
        
        start_time = time.perf_counter()
        try:
            # We run a very lightweight completion check
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": self.debate_model,
                "messages": [{"role": "user", "content": "ping"}],
                "max_tokens": 5
            }
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.post(url, json=payload, headers=headers)
                if r.status_code == 200:
                    latency = (time.perf_counter() - start_time) * 1000
                    return {"provider": self.name, "status": "ok", "latency_ms": int(latency), "model": self.debate_model}
                else:
                    return {"provider": self.name, "status": "degraded", "latency_ms": 0, "model": self.debate_model, "error": f"HTTP {r.status_code}"}
        except Exception as e:
            return {"provider": self.name, "status": "unreachable", "latency_ms": 0, "model": self.debate_model, "error": str(e)}
