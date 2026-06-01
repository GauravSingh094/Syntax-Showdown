from app.agents.base_agent import BaseAgent

class OpponentAgent(BaseAgent):
    def __init__(self):
        super().__init__(model="opponent", role="Opponent")

    def _build_prompt(self, topic: str, history: str, mode: str = "classic", *args, **kwargs) -> str:
        return f"""You are arguing AGAINST: "{topic}"
Prior debate flow:\n{history}

Deconstruct the Pro agent's latest claim.
MANDATORY:
1. Use 2-3 small bullet points for your refutation.
2. Maintain a critical but professional tone.
3. No preamble."""
