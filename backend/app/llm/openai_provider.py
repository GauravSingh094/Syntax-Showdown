import time
import httpx
import logging
from app.llm.base import BaseLLMProvider, LLMResponse, TokenUsage
from app.config.settings import settings

logger = logging.getLogger(__name__)

class OpenAIProvider(BaseLLMProvider):
    def __init__(self):
        super().__init__(
            name="openai",
            debate_model="gpt-4o-mini",
            judge_model="gpt-4o"
        )

    def _calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        # OpenAI pricing rates
        if "gpt-4o-mini" in model:
            # GPT-4o-mini rate: $0.15/M input, $0.60/M output
            input_rate = 0.15 / 1_000_000
            output_rate = 0.60 / 1_000_000
        else:
            # GPT-4o rate: $2.50/M input, $10.00/M output
            input_rate = 2.50 / 1_000_000
            output_rate = 10.00 / 1_000_000
        return (input_tokens * input_rate) + (output_tokens * output_rate)

    async def generate(self, prompt: str, role: str, format_json: bool = False) -> LLMResponse:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured")

        model = self.get_model(role)
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2 if role.lower() == "judge" else 0.7
        }
        
        if format_json:
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
        if not settings.OPENAI_API_KEY:
            return {"provider": self.name, "status": "unreachable", "error": "API Key Missing", "latency_ms": 0, "model": self.debate_model}
        
        start_time = time.perf_counter()
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
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
