import json
from app.llm import generate

class SideAgent:
    def __init__(self):
        pass

    async def get_sides(self, topic: str) -> dict:
        prompt = f"""Analyze the debate topic: "{topic}"
        Identify the two opposing sides.
        If the topic is in "X vs Y" format:
        - Side 1 (Pro): X
        - Side 2 (Opponent): Y
        
        If the topic is a statement:
        - Side 1 (Pro): In Favor
        - Side 2 (Opponent): In Opposition
 
        Return ONLY JSON in this format:
        {{
          "pro": "Description of the Pro side",
          "opponent": "Description of the Opponent side"
        }}
        """
        try:
            raw = await generate(prompt, role="Pro", format_json=True)
            return json.loads(raw)
        except Exception:
            return {"pro": "In Favor", "opponent": "In Opposition"}
