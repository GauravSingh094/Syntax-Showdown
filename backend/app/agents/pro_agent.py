from app.agents.base_agent import BaseAgent
from app.config.settings import settings

class ProAgent(BaseAgent):
    def __init__(self):
        super().__init__(model=settings.PRO_MODEL, role="Pro")

    def _build_prompt(self, topic: str, history: str) -> str:
        return f"""You are arguing IN FAVOR of: "{topic}"
Prior debate:\n{history}
Give a concise, persuasive argument (3-5 sentences). No preamble."""
