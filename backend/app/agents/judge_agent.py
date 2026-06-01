import json

from app.llm import generate

FALLBACK_VERDICT = {
    "winner": "Undecided",
    "scores": {
        "Pro": {"logic": 0, "evidence": 0, "rebuttal": 0},
        "Opponent": {"logic": 0, "evidence": 0, "rebuttal": 0}
    },
    "pro_summary": "No summary available.",
    "opponent_summary": "No summary available.",
    "reason": "Judge evaluation failed to reach a definitive conclusion."
}

class JudgeAgent:
    def __init__(self):
        pass

    async def evaluate(self, topic: str, rounds_data: list[dict]) -> dict:
        debate_text = "\n".join(
            [f"Round {r['round']}:\nPro: {r['pro']}\nOpponent: {r['opponent']}"
             for r in rounds_data]
        )
        prompt = f"""You are an Elite Debate Adjudicator. Your task is to perform a surgical evaluation of the following debate.
        Topic: "{topic}"
        
        JUDGING RIGOR:
        1. TRUE REBUTTAL DETECTION: Do not award rebuttal points for generic disagreement. Rebuttals MUST directly address the specific claims made by the opponent.
        2. GENERIC ARGUMENT PENALTY: Penalize vague statements, lack of evidence, or "common knowledge" arguments. Prioritize specific reasoning and data-backed claims.
        3. EDGE-CASE LOGIC: For absolute topics ("always", "never"), reward the agent that identifies logical exceptions. Penalize weak defenses of unrealistic absolutes.
        4. COMPARATIVE STRENGTH: Identify the "Clash Points." Who won the most significant logical exchanges?
        5. NO NEUTRALITY: You MUST choose a winner. If it's close, the tie-breaker is the quality of the most recent rebuttal.

        SCORING MANDATE (1-10):
        - Logic: Depth, consistency, and avoidance of fallacies.
        - Evidence: Specificity, relevance, and grounding.
        - Rebuttal: Directness, dismantling of opponent's logic, and impact.

        Debate Transcript:
        {debate_text}

        Return ONLY JSON:
        {{
          "winner": "Pro" or "Opponent",
          "scores": {{
            "Pro": {{"logic": 1-10, "evidence": 1-10, "rebuttal": 1-10}},
            "Opponent": {{"logic": 1-10, "evidence": 1-10, "rebuttal": 1-10}}
          }},
          "pro_summary": "3 concise bullet points of content only",
          "opponent_summary": "3 concise bullet points of content only",
          "reason": "Identify the specific 'Clash Point' that decided the win. Mention why one rebuttal was superior to the other."
        }}"""

        for attempt in range(2):
            try:
                raw = await generate(prompt, role="Judge", format_json=True)
                
                # Robust extraction of JSON from raw response
                cleaned = raw.strip()
                # 1. Remove deepseek thinking blocks if present
                import re
                cleaned = re.sub(r"<think>.*?</think>", "", cleaned, flags=re.DOTALL).strip()
                
                # 2. Extract code blocks if markdown is used
                code_block_match = re.search(r"```json\s*(.*?)\s*```", cleaned, re.DOTALL)
                if code_block_match:
                    json_str = code_block_match.group(1).strip()
                else:
                    code_block_match_generic = re.search(r"```\s*(.*?)\s*```", cleaned, re.DOTALL)
                    if code_block_match_generic:
                        json_str = code_block_match_generic.group(1).strip()
                    else:
                        # 3. Find the first '{' and last '}'
                        first_brace = cleaned.find('{')
                        last_brace = cleaned.rfind('}')
                        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                            json_str = cleaned[first_brace:last_brace+1]
                        else:
                            json_str = cleaned

                data = json.loads(json_str)
                
                # Normalize keys if model returned lowercase
                # Patch: Summary Correction Layer (Aggressive)
                meta_patterns = ["here are", "pro argued", "opponent argued", "summarizing", "in this round", "the pro side", "the opponent side", "i have", "points are:"]
                for key in ["pro_summary", "opponent_summary"]:
                    if key in data and isinstance(data[key], str):
                        # Remove common AI meta-sentences
                        lines = data[key].split('. ')
                        filtered_lines = [l for l in lines if not any(p in l.lower() for p in meta_patterns)]
                        data[key] = ". ".join(filtered_lines)
                        
                        # Strip "Pro:" or "Opponent:" prefixes
                        data[key] = data[key].replace("Pro: ", "").replace("Opponent: ", "").strip()
                
                # Patch: Verdict-Reasoning Alignment Check
                if "scores" in data and "winner" in data:
                    pro_total = sum(data["scores"].get("Pro", {}).values())
                    opp_total = sum(data["scores"].get("Opponent", {}).values())
                    
                    # If math contradicts the winner, we trust the granular scores more
                    if pro_total > opp_total:
                        data["winner"] = "Pro"
                    elif opp_total > pro_total:
                        data["winner"] = "Opponent"
                    elif pro_total == opp_total:
                        # Tie-breaker: Rebuttal quality
                        pro_reb = data["scores"].get("Pro", {}).get("rebuttal", 0)
                        opp_reb = data["scores"].get("Opponent", {}).get("rebuttal", 0)
                        data["winner"] = "Pro" if pro_reb >= opp_reb else "Opponent"
                        if "reason" not in data or not isinstance(data["reason"], str):
                            data["reason"] = "Winner decided by tie-breaker: Rebuttal Quality."
                        else:
                            data["reason"] += " (Winner decided by tie-breaker: Rebuttal Quality)."
                
                return data
            except (json.JSONDecodeError, Exception) as e:
                if attempt == 0:
                    continue
        return FALLBACK_VERDICT
