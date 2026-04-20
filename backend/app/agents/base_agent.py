from app.llm.ollama_client import generate

class BaseAgent:
    def __init__(self, model: str, role: str):
        self.model = model
        self.role = role

    async def respond(self, topic: str, history: list[str]) -> str:
        history_text = "\n".join(history[-6:])  # truncate context
        prompt = self._build_prompt(topic, history_text)
        return await generate(prompt, self.model)

    def _build_prompt(self, topic: str, history: str) -> str:
        raise NotImplementedError
