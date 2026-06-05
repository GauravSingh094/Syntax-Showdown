import ast
import json
import re
import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional
from app.llm.provider_manager import llm_manager

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Provider failover chain specifically for judge (independent of debate agents)
# Groq → OpenRouter → Gemini → OpenAI
# ─────────────────────────────────────────────────────────────────────────────
JUDGE_PROVIDER_CHAIN = ["groq", "openrouter", "gemini", "openai"]

# ─────────────────────────────────────────────────────────────────────────────
# Structured failure audit log — stored in module-level list for session
# ─────────────────────────────────────────────────────────────────────────────
_judge_failure_log: list = []


def get_judge_failure_log() -> list:
    """Exposes accumulated judge failure records for diagnostics / API access."""
    return _judge_failure_log


def _record_judge_failure(attempt: int, provider: str, error: str, raw_output: Optional[str] = None):
    """Append a structured failure entry to the session audit log."""
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "attempt": attempt,
        "provider": provider,
        "error": error,
        "raw_output_preview": (raw_output[:500] if raw_output else None),
    }
    _judge_failure_log.append(record)
    logger.warning(
        f"[JUDGE FAILURE AUDIT] attempt={attempt} provider={provider} "
        f"error={error!r} raw_preview={record['raw_output_preview']!r}"
    )


class JudgeAgent:
    def __init__(self):
        pass

    # ─────────────────────────────────────────────────────────────────────────
    # Layer 1 – Raw JSON extraction and structural repair
    # ─────────────────────────────────────────────────────────────────────────
    def _repair_unescaped_quotes(self, json_str: str) -> str:
        """Finds and escapes unescaped double quotes inside value fields of known keys."""
        # 1. Repair scalar string keys
        for key in ["winner", "reason", "reasoning", "summary"]:
            try:
                key_pattern = re.compile(rf'"{key}"\s*:\s*"')
                idx = 0
                while True:
                    match = key_pattern.search(json_str, idx)
                    if not match:
                        break
                    
                    start_val_idx = match.end()
                    rest = json_str[start_val_idx:]
                    
                    best_end = -1
                    for m in re.finditer(r'"', rest):
                        quote_idx = m.start()
                        # Ensure this quote is not already escaped
                        if quote_idx > 0 and rest[quote_idx - 1] == '\\':
                            continue
                        after_quote = rest[quote_idx + 1:].strip()
                        if after_quote.startswith(',') or after_quote.startswith('}'):
                            best_end = quote_idx
                            break
                    
                    if best_end != -1:
                        val_content = rest[:best_end]
                        # Normalize all quotes to escaped
                        clean_val = val_content.replace('\\"', '"').replace('"', '\\"')
                        
                        before = json_str[:start_val_idx]
                        after = json_str[start_val_idx + best_end:]
                        json_str = f"{before}{clean_val}{after}"
                        
                        idx = start_val_idx + len(clean_val) + 1
                    else:
                        idx = start_val_idx
            except Exception as e:
                logger.error(f"[JSON REPAIR] Error repairing scalar key '{key}': {e}")
                
        # 2. Repair array keys
        for key in ["pro_summary", "opponent_summary"]:
            try:
                key_pattern = re.compile(rf'"{key}"\s*:\s*\[')
                idx = 0
                while True:
                    match = key_pattern.search(json_str, idx)
                    if not match:
                        break
                    
                    array_start_idx = match.end()
                    rest = json_str[array_start_idx:]
                    bracket_match = re.search(r'\]', rest)
                    if not bracket_match:
                        break
                    
                    array_end_relative = bracket_match.start()
                    array_content = rest[:array_end_relative]
                    
                    items = []
                    current_pos = 0
                    while current_pos < len(array_content):
                        start_quote = array_content.find('"', current_pos)
                        if start_quote == -1:
                            break
                        if start_quote > 0 and array_content[start_quote - 1] == '\\':
                            current_pos = start_quote + 1
                            continue
                            
                        item_rest = array_content[start_quote + 1:]
                        best_item_end = -1
                        for m in re.finditer(r'"', item_rest):
                            quote_idx = m.start()
                            if quote_idx > 0 and item_rest[quote_idx - 1] == '\\':
                                continue
                            after_quote = item_rest[quote_idx + 1:].strip()
                            if after_quote.startswith(',') or not after_quote:
                                best_item_end = quote_idx
                                break
                        
                        if best_item_end != -1:
                            item_val = item_rest[:best_item_end]
                            clean_item = item_val.replace('\\"', '"').replace('"', '\\"')
                            items.append(f'"{clean_item}"')
                            current_pos = start_quote + 1 + best_item_end + 1
                        else:
                            item_val = item_rest
                            clean_item = item_val.replace('\\"', '"').replace('"', '\\"')
                            items.append(f'"{clean_item}"')
                            break
                    
                    rebuilt_array = ", ".join(items)
                    before = json_str[:array_start_idx]
                    after = json_str[array_start_idx + array_end_relative:]
                    json_str = f"{before}{rebuilt_array}{after}"
                    
                    idx = array_start_idx + len(rebuilt_array) + 1
            except Exception as e:
                logger.error(f"[JSON REPAIR] Error repairing array key '{key}': {e}")
                
        return json_str

    # ─────────────────────────────────────────────────────────────────────────
    # Layer 1 – Raw JSON extraction and structural repair
    # ─────────────────────────────────────────────────────────────────────────
    def _clean_and_repair_json(self, raw: str) -> str:
        """Robust multi-pass extraction and repair of JSON from raw LLM response.
        
        Returns a JSON string. Raises ValueError if all repair strategies fail.
        """
        logger.debug(f"[JSON REPAIR] Input length={len(raw)} chars")
        cleaned = raw.strip()

        # Pass 1: Strip DeepSeek / chain-of-thought thinking blocks
        cleaned = re.sub(r"<think>.*?</think>", "", cleaned, flags=re.DOTALL).strip()

        # Pass 2: Extract markdown fenced code blocks
        code_block_match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.DOTALL)
        if code_block_match:
            json_str = code_block_match.group(1).strip()
            logger.debug("[JSON REPAIR] Extracted from markdown code fence")
        else:
            # Pass 3: Find outermost JSON object bounds
            first_brace = cleaned.find("{")
            last_brace = cleaned.rfind("}")
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                json_str = cleaned[first_brace : last_brace + 1]
                logger.debug(f"[JSON REPAIR] Extracted brace-bounded JSON [{first_brace}:{last_brace}]")
            else:
                json_str = cleaned
                logger.debug("[JSON REPAIR] No brace bounds found — using raw cleaned string")

        # Pass 4a: Try ast.literal_eval for single-quoted Python dict syntax
        # This correctly handles nested structures like {'Pro': {'logic': 9}}
        # which the regex approach cannot reliably handle
        if "'" in json_str and '"' not in json_str[:20]:
            try:
                parsed = ast.literal_eval(json_str)
                result = json.dumps(parsed)
                logger.debug("[JSON REPAIR] Successfully parsed via ast.literal_eval (single-quote fix)")
                return result
            except Exception as e:
                logger.debug(f"[JSON REPAIR] ast.literal_eval failed: {e} — falling through to regex repair")

        # Pass 4b: Regex-based single-quote → double-quote for simpler cases
        # Replace 'key': with "key": (only simple alphanumeric keys)
        json_str = re.sub(r"\'(\w[\w\s]*?)\'\s*:", r'"\1":', json_str)
        # Replace : 'value' with : "value" — only for scalar non-nested values
        json_str = re.sub(r":\s*\'([^\'{}[\]]*?)\'", r': "\1"', json_str)

        # Pass 5: Remove trailing commas (objects and arrays)
        json_str = re.sub(r",\s*\}", "}", json_str)
        json_str = re.sub(r",\s*\]", "]", json_str)

        # Pass 6: Remove JavaScript-style comments
        json_str = re.sub(r"//[^\n]*", "", json_str)
        json_str = re.sub(r"/\*.*?\*/", "", json_str, flags=re.DOTALL)

        # Pass 6b: Repair unescaped double quotes inside value fields of known keys
        json_str = self._repair_unescaped_quotes(json_str)

        # Pass 7: Balance unclosed brackets for truncated responses
        open_curly = json_str.count("{")
        close_curly = json_str.count("}")
        open_square = json_str.count("[")
        close_square = json_str.count("]")

        if open_square > close_square:
            json_str += "]" * (open_square - close_square)
            logger.debug(f"[JSON REPAIR] Appended {open_square - close_square} missing ']'")
        if open_curly > close_curly:
            json_str += "}" * (open_curly - close_curly)
            logger.debug(f"[JSON REPAIR] Appended {open_curly - close_curly} missing '}}'")

        return json_str

    # ─────────────────────────────────────────────────────────────────────────
    # Layer 2 – Schema validation + normalization
    # ─────────────────────────────────────────────────────────────────────────
    def _normalize_and_repair_schema(self, data: dict) -> dict:
        """Validates, cleans, and standardizes the parsed judge verdict JSON
        to fit the strict response schema. Fills missing fields rather than
        raising exceptions."""

        # ── Scores ────────────────────────────────────────────────────────────
        if "scores" not in data or not isinstance(data["scores"], dict):
            logger.debug("[SCHEMA REPAIR] 'scores' missing — injecting defaults")
            data["scores"] = {
                "Pro": {"logic": 5, "evidence": 5, "rebuttal": 5},
                "Opponent": {"logic": 5, "evidence": 5, "rebuttal": 5},
            }

        for side in ["Pro", "Opponent"]:
            if side not in data["scores"] or not isinstance(data["scores"][side], dict):
                logger.debug(f"[SCHEMA REPAIR] '{side}' scores missing — injecting defaults")
                data["scores"][side] = {"logic": 5, "evidence": 5, "rebuttal": 5}

            side_scores = data["scores"][side]
            normalized_scores = {}
            for m in ["logic", "evidence", "rebuttal"]:
                val = None
                if m in side_scores:
                    val = side_scores[m]
                elif m == "rebuttal" and "clarity" in side_scores:
                    val = side_scores["clarity"]
                    logger.debug(f"[SCHEMA REPAIR] Mapped 'clarity' → 'rebuttal' for {side}")
                elif m == "rebuttal" and "rebuttals" in side_scores:
                    val = side_scores["rebuttals"]
                    logger.debug(f"[SCHEMA REPAIR] Mapped 'rebuttals' → 'rebuttal' for {side}")
                elif m == "evidence" and "sources" in side_scores:
                    val = side_scores["sources"]
                    logger.debug(f"[SCHEMA REPAIR] Mapped 'sources' → 'evidence' for {side}")

                try:
                    normalized_scores[m] = max(1, min(10, int(float(val)))) if val is not None else 5
                except (ValueError, TypeError):
                    logger.debug(f"[SCHEMA REPAIR] Could not coerce {side}.{m}={val!r} — using 5")
                    normalized_scores[m] = 5

            data["scores"][side] = normalized_scores

        # ── Summaries ─────────────────────────────────────────────────────────
        meta_patterns = [
            "here are", "pro argued", "opponent argued", "summarizing",
            "in this round", "the pro side", "the opponent side", "i have",
            "points are:", "following are", "below are"
        ]
        for key in ["pro_summary", "opponent_summary"]:
            if key not in data or not data[key]:
                logger.debug(f"[SCHEMA REPAIR] '{key}' missing — using placeholder")
                data[key] = ["No summary points available."]
            elif isinstance(data[key], str):
                cleaned_str = data[key].replace("Pro: ", "").replace("Opponent: ", "").strip()
                lines = [l.strip() for l in cleaned_str.split(".") if l.strip()]
                filtered = [l for l in lines if not any(p in l.lower() for p in meta_patterns)]
                data[key] = filtered if filtered else [cleaned_str]
            elif isinstance(data[key], list):
                cleaned_list = []
                for s in data[key]:
                    if isinstance(s, str):
                        cs = s.replace("Pro: ", "").replace("Opponent: ", "").strip()
                        if cs and not any(p in cs.lower() for p in meta_patterns):
                            cleaned_list.append(cs)
                data[key] = cleaned_list if cleaned_list else ["Key argument point presented during the rounds."]

        # ── Winner ────────────────────────────────────────────────────────────
        pro_total = sum(data["scores"]["Pro"].values())
        opp_total = sum(data["scores"]["Opponent"].values())
        pro_reb = data["scores"]["Pro"]["rebuttal"]
        opp_reb = data["scores"]["Opponent"]["rebuttal"]

        if "winner" not in data or data["winner"] not in ["Pro", "Opponent"]:
            logger.debug("[SCHEMA REPAIR] 'winner' missing/invalid — deriving from scores")
            if pro_total > opp_total:
                data["winner"] = "Pro"
            elif opp_total > pro_total:
                data["winner"] = "Opponent"
            else:
                data["winner"] = "Pro" if pro_reb >= opp_reb else "Opponent"
        else:
            # Re-verify arithmetic consistency
            if pro_total > opp_total and data["winner"] != "Pro":
                logger.debug("[SCHEMA REPAIR] Correcting winner mismatch → Pro")
                data["winner"] = "Pro"
            elif opp_total > pro_total and data["winner"] != "Opponent":
                logger.debug("[SCHEMA REPAIR] Correcting winner mismatch → Opponent")
                data["winner"] = "Opponent"
            elif pro_total == opp_total:
                data["winner"] = "Pro" if pro_reb >= opp_reb else "Opponent"

        # ── Reason / Reasoning ────────────────────────────────────────────────
        if "reasoning" not in data or not isinstance(data["reasoning"], str) or not data["reasoning"].strip():
            if "reason" in data and isinstance(data["reason"], str) and data["reason"].strip():
                data["reasoning"] = data["reason"]
            else:
                data["reasoning"] = (
                    f"Winner decided by comparative metrics scoring alignment. "
                    f"Aggregate scores: Pro={pro_total}/30, Opponent={opp_total}/30."
                )
        else:
            if "reason" not in data or not isinstance(data["reason"], str) or not data["reason"].strip():
                data["reason"] = data["reasoning"]

        if "reason" not in data or not isinstance(data["reason"], str) or not data["reason"].strip():
            data["reason"] = data["reasoning"]

        # ── Summary ───────────────────────────────────────────────────────────
        if "summary" not in data or not data["summary"]:
            pro_sum = data.get("pro_summary", [])
            opp_sum = data.get("opponent_summary", [])
            pro_str = " ".join(pro_sum) if isinstance(pro_sum, list) else str(pro_sum)
            opp_str = " ".join(opp_sum) if isinstance(opp_sum, list) else str(opp_sum)
            data["summary"] = f"Pro: {pro_str} | Opponent: {opp_str}"

        return data

    # ─────────────────────────────────────────────────────────────────────────
    # Layer 3 – Heuristic verdict (all providers exhausted)
    # ─────────────────────────────────────────────────────────────────────────
    def _normalize_rounds_data(self, rounds_data: list) -> list:
        """Ensure rounds_data is a list of standardized message dicts.
        If it's in the old list-of-round-dicts format, convert it.
        """
        normalized = []
        for item in rounds_data:
            if not isinstance(item, dict):
                continue
            if "role" in item and "content" in item:
                # Already standardized message dict
                normalized.append(item)
            elif "round" in item and ("pro" in item or "opponent" in item):
                # Old round dict format: {"round": 1, "pro": "...", "opponent": "..."}
                rnd = item.get("round", 1)
                if "pro" in item and item["pro"]:
                    normalized.append({
                        "id": f"old-pro-{rnd}",
                        "role": "pro",
                        "content": item["pro"],
                        "round": rnd,
                        "provider": "unknown",
                        "timestamp": ""
                    })
                if "opponent" in item and item["opponent"]:
                    normalized.append({
                        "id": f"old-opponent-{rnd}",
                        "role": "opponent",
                        "content": item["opponent"],
                        "round": rnd,
                        "provider": "unknown",
                        "timestamp": ""
                    })
        return normalized

    def _generate_heuristic_verdict(self, topic: str, rounds_data: list, failure_reason: str) -> dict:
        """Fallback Heuristic Verdict Engine: analyzes debate history locally
        when ALL API providers and retries have been exhausted."""
        logger.warning(
            f"[HEURISTIC ENGINE] All LLM providers exhausted. "
            f"Executing local evaluation engine. Failure: {failure_reason!r}"
        )

        norm_rounds = self._normalize_rounds_data(rounds_data)
        pro_text = " ".join([m["content"] for m in norm_rounds if m["role"] == "pro"]).lower()
        opp_text = " ".join([m["content"] for m in norm_rounds if m["role"] == "opponent"]).lower()

        pro_words = pro_text.split()
        opp_words = opp_text.split()
        pro_word_count = len(pro_words)
        opp_word_count = len(opp_words)

        evidence_keywords = [
            "evidence", "data", "study", "research", "statistics", "percent",
            "fact", "source", "prove", "analysis", "demonstrate", "report",
            "survey", "experiment", "according", "findings",
        ]
        logic_keywords = [
            "therefore", "logical", "consequently", "because", "leads to",
            "contradict", "fallacy", "premise", "conclusion", "valid", "invalid",
            "reason", "thus", "implies", "infer",
        ]
        rebuttal_keywords = [
            "however", "but", "opponent", "contrary", "misleading", "flaw",
            "incorrect", "nevertheless", "refute", "disagree", "claims", "address",
            "counter", "dispute", "challenge", "rebut",
        ]

        pro_ev = sum(pro_text.count(w) for w in evidence_keywords)
        pro_log = sum(pro_text.count(w) for w in logic_keywords)
        pro_reb = sum(pro_text.count(w) for w in rebuttal_keywords)
        opp_ev = sum(opp_text.count(w) for w in evidence_keywords)
        opp_log = sum(opp_text.count(w) for w in logic_keywords)
        opp_reb = sum(opp_text.count(w) for w in rebuttal_keywords)

        pro_scores = {
            "logic": max(1, min(10, int(5 + (pro_word_count / 180) + pro_log * 0.4))),
            "evidence": max(1, min(10, int(5 + pro_ev * 0.8))),
            "rebuttal": max(1, min(10, int(5 + pro_reb * 0.8))),
        }
        opp_scores = {
            "logic": max(1, min(10, int(5 + (opp_word_count / 180) + opp_log * 0.4))),
            "evidence": max(1, min(10, int(5 + opp_ev * 0.8))),
            "rebuttal": max(1, min(10, int(5 + opp_reb * 0.8))),
        }

        pro_total = sum(pro_scores.values())
        opp_total = sum(opp_scores.values())

        if pro_total > opp_total:
            winner = "Pro"
        elif opp_total > pro_total:
            winner = "Opponent"
        else:
            winner = "Pro" if pro_scores["rebuttal"] >= opp_scores["rebuttal"] else "Opponent"

        def extract_sentences(rounds: list, side: str) -> list:
            sentences = []
            norm_rounds = self._normalize_rounds_data(rounds)
            for m in norm_rounds:
                if m["role"] != side:
                    continue
                text = m["content"]
                for s in re.split(r"\. |\? |\! ", text):
                    clean = s.strip().replace("- ", "").replace("* ", "")
                    if 25 < len(clean) < 130 and not clean.lower().startswith("round"):
                        sentences.append(clean)
                    if len(sentences) >= 3:
                        break
                if len(sentences) >= 3:
                    break
            while len(sentences) < 3:
                sentences.append(f"Presented analytical claims regarding the {side} side of the argument.")
            return sentences[:3]

        pro_summary = extract_sentences(rounds_data, "pro")
        opp_summary = extract_sentences(rounds_data, "opponent")

        reason = (
            f"Adjudicated via dynamic local text heuristics (LLM provider failure: {failure_reason}). "
            f"Winner decided on argument volume, evidence frequency, and rebuttal density. "
            f"Pro: {pro_word_count} words, {pro_ev} evidence triggers (Score {pro_total}/30). "
            f"Opponent: {opp_word_count} words, {opp_ev} evidence triggers (Score {opp_total}/30)."
        )

        return {
            "winner": winner,
            "scores": {"Pro": pro_scores, "Opponent": opp_scores},
            "pro_summary": pro_summary,
            "opponent_summary": opp_summary,
            "reason": reason,
            "reasoning": reason,
            "summary": f"Pro: {' '.join(pro_summary)} | Opponent: {' '.join(opp_summary)}",
        }

    # ─────────────────────────────────────────────────────────────────────────
    # Core evaluate() — judge-specific provider rotation + 3 retries each
    # ─────────────────────────────────────────────────────────────────────────
    async def evaluate(self, topic: str, rounds_data: list) -> dict:
        """
        Evaluate the debate and ALWAYS return a verdict.

        Reliability ladder:
          1. Try each provider in JUDGE_PROVIDER_CHAIN (Groq → OpenRouter → Gemini → OpenAI)
          2. Each provider gets up to RETRIES_PER_PROVIDER attempts with backoff
          3. Each attempt: raw log → JSON repair → schema validation
          4. If all providers fail → heuristic verdict from debate history
          5. If heuristic crashes → deterministic safe verdict (never the old error message)
        """
        RETRIES_PER_PROVIDER = 3
        BACKOFF_BASE_SECONDS = 1.5

        norm_rounds = self._normalize_rounds_data(rounds_data)
        rounds = {}
        for r in norm_rounds:
            rnd = r.get("round", 1)
            if rnd not in rounds:
                rounds[rnd] = {"pro": "", "opponent": ""}
            role = r.get("role", "")
            if role in ["pro", "opponent"]:
                rounds[rnd][role] = r.get("content", "")
        
        debate_text = "\n".join(
            [f"Round {rnd}:\nPro: {data['pro']}\nOpponent: {data['opponent']}"
             for rnd, data in sorted(rounds.items())]
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

        Return ONLY valid JSON — no explanation, no markdown, no preamble:
        {{
          "winner": "Pro" or "Opponent",
          "scores": {{
            "Pro": {{"logic": 1-10, "evidence": 1-10, "rebuttal": 1-10}},
            "Opponent": {{"logic": 1-10, "evidence": 1-10, "rebuttal": 1-10}}
          }},
          "pro_summary": ["Point 1", "Point 2", "Point 3"],
          "opponent_summary": ["Point 1", "Point 2", "Point 3"],
          "reason": "Identify the specific 'Clash Point' that decided the win. Mention why one rebuttal was superior to the other."
        }}"""

        last_error = "No providers attempted"
        global_attempt = 0

        logger.info(
            f"[JUDGE PIPELINE START] Topic: {topic!r} | "
            f"Rounds: {len(rounds_data)} | "
            f"Provider chain: {JUDGE_PROVIDER_CHAIN}"
        )

        # ── Layer 1+2+3: Provider rotation with per-provider retries ──────────
        for provider_name in JUDGE_PROVIDER_CHAIN:
            provider = llm_manager.providers.get(provider_name)
            if provider is None:
                logger.warning(f"[JUDGE PIPELINE] Provider '{provider_name}' not registered — skipping")
                continue

            for attempt in range(RETRIES_PER_PROVIDER):
                global_attempt += 1
                raw_response: Optional[str] = None

                try:
                    logger.info(
                        f"[JUDGE PIPELINE] Provider={provider_name} | "
                        f"Attempt={attempt + 1}/{RETRIES_PER_PROVIDER} | "
                        f"Global attempt #{global_attempt}"
                    )

                    # Direct provider call (bypasses shared manager to give judge
                    # its own independent failover path)
                    llm_response = await provider.generate(
                        prompt, role="Judge", format_json=True
                    )
                    raw_response = llm_response.content

                    # ── RAW OUTPUT LOG ─────────────────────────────────────────
                    logger.info(
                        f"[RAW JUDGE OUTPUT] Provider={provider_name} "
                        f"Attempt={global_attempt} Length={len(raw_response)}:\n"
                        f"{raw_response[:2000]}"
                    )

                    # ── JSON Repair Layer ──────────────────────────────────────
                    json_str = self._clean_and_repair_json(raw_response)

                    # ── Detect Malformed JSON before parse ────────────────────
                    if not json_str.strip().startswith("{"):
                        raise ValueError(
                            f"Repaired string does not start with '{{'. "
                            f"First 100 chars: {json_str[:100]!r}"
                        )

                    # ── Parse ──────────────────────────────────────────────────
                    parsed_data = json.loads(json_str)

                    # ── Schema Validation + Normalization ─────────────────────
                    verdict = self._normalize_and_repair_schema(parsed_data)

                    # ── Final integrity gate ───────────────────────────────────
                    assert verdict["winner"] in ["Pro", "Opponent"], "winner not Pro/Opponent"
                    for side in ["Pro", "Opponent"]:
                        for metric in ["logic", "evidence", "rebuttal"]:
                            v = verdict["scores"][side][metric]
                            assert isinstance(v, int) and 1 <= v <= 10, \
                                f"{side}.{metric}={v} out of range"
                    assert isinstance(verdict.get("pro_summary"), list) and len(verdict["pro_summary"]) >= 1
                    assert isinstance(verdict.get("opponent_summary"), list) and len(verdict["opponent_summary"]) >= 1
                    assert isinstance(verdict.get("reason"), str) and verdict["reason"].strip()
                    assert isinstance(verdict.get("reasoning"), str) and verdict["reasoning"].strip()
                    assert isinstance(verdict.get("summary"), str) and verdict["summary"].strip()

                    logger.info(
                        f"[JUDGE PIPELINE SUCCESS] Provider={provider_name} "
                        f"GlobalAttempt={global_attempt} Winner={verdict['winner']}"
                    )
                    return verdict

                except Exception as e:
                    last_error = str(e)
                    _record_judge_failure(
                        attempt=global_attempt,
                        provider=provider_name,
                        error=last_error,
                        raw_output=raw_response,
                    )

                    # Exponential backoff before next attempt (except last)
                    if attempt < RETRIES_PER_PROVIDER - 1:
                        wait = BACKOFF_BASE_SECONDS * (2 ** attempt)
                        logger.info(f"[JUDGE PIPELINE] Backing off {wait:.1f}s before retry...")
                        await asyncio.sleep(wait)

            logger.warning(
                f"[JUDGE PIPELINE] Provider '{provider_name}' exhausted all "
                f"{RETRIES_PER_PROVIDER} attempts. Moving to next provider."
            )

        # ── Layer 4: Heuristic Verdict ────────────────────────────────────────
        logger.error(
            f"[JUDGE PIPELINE] ALL {len(JUDGE_PROVIDER_CHAIN)} providers exhausted "
            f"({global_attempt} total attempts). Engaging heuristic engine."
        )
        try:
            verdict = self._generate_heuristic_verdict(topic, rounds_data, last_error)
            logger.info(
                f"[JUDGE HEURISTIC SUCCESS] Winner={verdict['winner']} "
                f"(local text analysis, all LLM providers failed)"
            )
            return verdict

        except Exception as heuristic_error:
            # ── Layer 5: Absolute safe fallback — deterministic, never fails ──
            logger.critical(
                f"[JUDGE CRITICAL] Heuristic engine failed: {heuristic_error}. "
                f"Engaging absolute deterministic fallback."
            )
            # Deterministic coin flip based on text length (always produces valid verdict)
            norm_rounds = self._normalize_rounds_data(rounds_data)
            pro_len = sum(len(m["content"]) for m in norm_rounds if m["role"] == "pro")
            opp_len = sum(len(m["content"]) for m in norm_rounds if m["role"] == "opponent")
            fallback_winner = "Pro" if pro_len >= opp_len else "Opponent"

            return {
                "winner": fallback_winner,
                "scores": {
                    "Pro": {"logic": 5, "evidence": 5, "rebuttal": 5},
                    "Opponent": {"logic": 5, "evidence": 5, "rebuttal": 5},
                },
                "pro_summary": [
                    "Arguments were presented across multiple rounds.",
                    "Pro side engaged with the topic comprehensively.",
                    "Logical structure was maintained throughout.",
                ],
                "opponent_summary": [
                    "Counter-arguments were raised against the Pro stance.",
                    "Opponent challenged core premises of the debate.",
                    "Rebuttal attempts were made in each round.",
                ],
                "reason": (
                    f"Verdict determined by deterministic fallback (all LLM providers and "
                    f"heuristic engine failed). Winner assigned based on argument volume. "
                    f"Root failure: {last_error}"
                ),
                "reasoning": (
                    f"Verdict determined by deterministic fallback (all LLM providers and "
                    f"heuristic engine failed). Winner assigned based on argument volume. "
                    f"Root failure: {last_error}"
                ),
                "summary": (
                    "Pro: Arguments were presented across multiple rounds. Pro side engaged with "
                    "the topic comprehensively. Logical structure was maintained throughout. | "
                    "Opponent: Counter-arguments were raised against the Pro stance. Opponent "
                    "challenged core premises of the debate. Rebuttal attempts were made in each round."
                ),
            }
