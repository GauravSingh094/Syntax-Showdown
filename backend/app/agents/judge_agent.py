import json
from app.agents.base_agent import BaseAgent
from app.config.settings import settings
from app.llm.ollama_client import generate

FALLBACK_VERDICT = {
    "winner": "Pro",
    "scores": {
        "Pro": {"logic": 5, "evidence": 5, "clarity": 5},
        "Opponent": {"logic": 5, "evidence": 5, "clarity": 5}
    },
    "reason": "Judge evaluation failed. Scores are equal by default."
}

class JudgeAgent:
    def __init__(self):
        self.model = settings.JUDGE_MODEL

    async def evaluate(self, topic: str, rounds_data: list[dict]) -> dict:
        debate_text = "\n".join(
            [f"Round {r['round']}:\nPro: {r['pro']}\nOpponent: {r['opponent']}"
             for r in rounds_data]
        )
        prompt = f"""You are a debate judge. Evaluate this debate on topic: "{topic}"

{debate_text}

Return ONLY valid JSON. No markdown, no explanation, no extra text.
Use EXACTLY this structure:
{{
  "winner": "Pro" or "Opponent",
  "scores": {{
    "Pro": {{"logic": 0-10, "evidence": 0-10, "clarity": 0-10}},
    "Opponent": {{"logic": 0-10, "evidence": 0-10, "clarity": 0-10}}
  }},
  "reason": "Brief explanation under 100 words"
}}"""

        for attempt in range(2):
            try:
                raw = await generate(prompt, self.model)
                # Strip markdown fences if present
                clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                return json.loads(clean)
            except (json.JSONDecodeError, Exception) as e:
                if attempt == 0:
                    continue  # retry once
        return FALLBACK_VERDICT
