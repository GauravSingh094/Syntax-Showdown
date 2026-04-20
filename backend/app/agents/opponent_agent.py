from app.agents.base_agent import BaseAgent
from app.config.settings import settings

class OpponentAgent(BaseAgent):
    def __init__(self):
        super().__init__(model=settings.OPPONENT_MODEL, role="Opponent")

    def _build_prompt(self, topic: str, history: str) -> str:
        return f"""You are arguing AGAINST: "{topic}"
Prior debate:\n{history}
Give a concise, persuasive counter-argument (3-5 sentences). No preamble."""
