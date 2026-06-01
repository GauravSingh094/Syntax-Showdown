from app.agents.base_agent import BaseAgent

class ProAgent(BaseAgent):
    def __init__(self):
        super().__init__(model="pro", role="Pro")

    def _build_prompt(self, topic: str, history: str, mode: str = "classic", *args, **kwargs) -> str:
        return f"""You are arguing IN FAVOR of: "{topic}"
Prior debate flow:\n{history}

Respond to the latest counter-point. 
MANDATORY: 
1. Use 2-3 small bullet points for your core arguments.
2. Be concise and intellectual. 
3. No preamble."""
