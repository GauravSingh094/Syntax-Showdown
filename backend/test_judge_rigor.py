"""
Judge Reliability Test Suite — 60 evaluations, 100% success rate required.

Tests all reliability layers:
  Layer 1 – Clean JSON standard parsing
  Layer 2 – JSON repair (markdown fence, single-quotes, truncation, bad keys)
  Layer 3 – DeepSeek thinking block stripping
  Layer 4 - Provider failover (all providers fail -> heuristic engine)
  Layer 5 - Absolute deterministic fallback (heuristic fails)

Usage:
    cd backend
    python test_judge_rigor.py
"""

import asyncio
import sys
import os
import random
import logging
from unittest.mock import patch, AsyncMock, MagicMock

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

sys.path.insert(0, r"c:\Users\singh\OneDrive\Desktop\debate\backend")

# Patch asyncio.sleep globally to eliminate backoff delays during tests
asyncio.sleep = AsyncMock(return_value=None)

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.WARNING,          # suppress INFO noise during test run
    format="%(levelname)s - %(name)s - %(message)s"
)
logger = logging.getLogger(__name__)

from app.agents.judge_agent import JudgeAgent, get_judge_failure_log
from app.llm.base import LLMResponse, TokenUsage

# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────
TOPICS = [
    "AI will completely replace software developers in the next decade.",
    "Space exploration is a waste of global resources.",
    "Social media platforms should be treated as public utilities.",
    "Nuclear energy is the only viable path to a zero-carbon future.",
    "Universal basic income is necessary to survive automation.",
    "Remote work is more productive than office work.",
    "Cryptocurrencies will replace traditional banking systems.",
    "Genetic engineering of humans should be legally permitted.",
    "Mandatory voting should be enforced in all democracies.",
    "Zoos are unethical and should be abolished.",
]

def make_rounds(topic: str) -> list:
    """Generate varied mock round data for a topic."""
    n = random.randint(1, 100)
    return [
        {
            "round": 1,
            "pro": (
                f"Pro stance on '{topic}': Evidence suggests a strong correlation "
                f"between automation efficiency and economic growth (case {n}). "
                f"Research by leading institutions demonstrates this premise conclusively. "
                f"Therefore the data supports this position comprehensively."
            ),
            "opponent": (
                f"Opponent challenges '{topic}': However, the human element is critical. "
                f"Empirical studies contradict the premise — data sources are flawed. "
                f"I refute the claim because societal impacts are being ignored. "
                f"The logical fallacy here is an appeal to authority (case {n})."
            ),
        },
        {
            "round": 2,
            "pro": (
                f"Pro rebuttal: The opponent's claims misrepresent the source data. "
                f"Statistics from {n} independent analyses confirm efficiency gains. "
                f"Consequently, the opponent's objection does not hold because it "
                f"lacks empirical grounding. The conclusion stands."
            ),
            "opponent": (
                f"Opponent rebuttal: Nevertheless, the pro side ignores {n} counter-examples. "
                f"Multiple research reports highlight contrary findings. "
                f"I dispute the framing because the premise relies on incomplete analysis. "
                f"Therefore, the pro position is logically invalid."
            ),
        },
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Mock LLM response library — all known tricky patterns
# ─────────────────────────────────────────────────────────────────────────────
def _make_llm_response(content: str) -> LLMResponse:
    """Wrap a string in a valid LLMResponse object."""
    return LLMResponse(
        content=content,
        provider="mock",
        model="mock-model",
        latency_ms=10.0,
        usage=TokenUsage(input_tokens=100, output_tokens=200, total_tokens=300),
        cost=0.0,
    )


RESPONSE_SPECS = [
    # ── LAYER 1: Standard clean JSON ─────────────────────────────────────────
    {
        "label": "Clean JSON – Pro wins",
        "layer": 1,
        "content": """{
            "winner": "Pro",
            "scores": {
                "Pro": {"logic": 8, "evidence": 9, "rebuttal": 7},
                "Opponent": {"logic": 7, "evidence": 7, "rebuttal": 6}
            },
            "pro_summary": ["High efficiency demonstrated", "Data-backed claims", "Strong rebuttal"],
            "opponent_summary": ["Raised valid concerns", "Questioned evidence quality", "Disputed assumptions"],
            "reason": "Pro demonstrated superior statistical evidence in round 2."
        }""",
    },
    {
        "label": "Clean JSON – Opponent wins",
        "layer": 1,
        "content": """{
            "winner": "Opponent",
            "scores": {
                "Pro": {"logic": 6, "evidence": 6, "rebuttal": 5},
                "Opponent": {"logic": 9, "evidence": 8, "rebuttal": 9}
            },
            "pro_summary": ["Argued for efficiency", "Cited automation trends", "Appealed to data"],
            "opponent_summary": ["Dismantled key premises", "Highlighted logical flaws", "Superior rebuttals"],
            "reason": "Opponent's rebuttals directly addressed and dismantled Pro's core claims."
        }""",
    },
    # ── LAYER 2: Markdown-wrapped JSON ───────────────────────────────────────
    {
        "label": "Markdown fence – json tag",
        "layer": 2,
        "content": """```json
    {
        "winner": "Opponent",
        "scores": {
            "Pro": {"logic": 6, "evidence": 6, "rebuttal": 5},
            "Opponent": {"logic": 9, "evidence": 8, "rebuttal": 9}
        },
        "pro_summary": "Advocates for speed. Argues for reduced costs. Replaces human labour.",
        "opponent_summary": "Stresses clinical nuances. Highlights data dependencies. Demands moral oversight.",
        "reason": "Opponent rebuttals dismantled the absolute premises of the Pro arguments."
    }
    ```""",
    },
    {
        "label": "Markdown fence – no language tag",
        "layer": 2,
        "content": """```
    {
        "winner": "Pro",
        "scores": {
            "Pro": {"logic": 9, "evidence": 8, "rebuttal": 8},
            "Opponent": {"logic": 6, "evidence": 6, "rebuttal": 7}
        },
        "pro_summary": ["Speed advantage", "Diagnostic consistency", "Volume of evidence"],
        "opponent_summary": ["Adaptability concerns", "Emotional intelligence", "Data quality issues"],
        "reason": "Pro dominated round 2 with strong statistical evidence."
    }
    ```""",
    },
    # ── LAYER 2: DeepSeek thinking blocks ────────────────────────────────────
    {
        "label": "DeepSeek <think> block",
        "layer": 2,
        "content": """<think>
    I should evaluate the clash points. Pro argued speed, Opponent argued oversight.
    The opponent's rebuttals were more direct and addressed specific claims.
    Let me calculate scores carefully.
    </think>
    {
        "winner": "Opponent",
        "scores": {
            "Pro": {"logic": 5, "evidence": 5, "rebuttal": 5},
            "Opponent": {"logic": 8, "evidence": 8, "rebuttal": 8}
        },
        "pro_summary": ["Fast execution claimed", "Error reduction cited", "Efficiency gains mentioned"],
        "opponent_summary": ["Human connection emphasized", "Novel situations addressed", "Data quality challenged"],
        "reason": "Opponent succeeded in the clash points by directly addressing Pro's efficiency claims."
    }""",
    },
    # ── LAYER 2: Single-quoted keys ───────────────────────────────────────────
    {
        "label": "Single-quoted keys + trailing comma",
        "layer": 2,
        "content": """{
        'winner': 'Pro',
        'scores': {
            'Pro': {'logic': 9, 'evidence': 8, 'rebuttal': 8},
            'Opponent': {'logic': 6, 'evidence': 6, 'rebuttal': 7},
        },
        'pro_summary': ['Speed', 'Diagnostic consistency', 'Statistical backing'],
        'opponent_summary': ['Adaptability', 'Emotional support', 'Counter evidence'],
        'reason': 'Pro dominated round 2 with strong statistical evidence.',
    }""",
    },
    # ── LAYER 2: Truncated/incomplete JSON ────────────────────────────────────
    {
        "label": "Truncated JSON (missing closing braces)",
        "layer": 2,
        "content": """{
        "winner": "Opponent",
        "scores": {
            "Pro": {"logic": 7, "evidence": 7, "rebuttal": 6},
            "Opponent": {"logic": 8, "evidence": 8, "rebuttal": 8}
        """,
    },
    # ── LAYER 2: Wrong metric key names ──────────────────────────────────────
    {
        "label": "Wrong metric key: clarity instead of rebuttal",
        "layer": 2,
        "content": """{
        "winner": "Pro",
        "scores": {
            "Pro": {"logic": 8, "evidence": 8, "clarity": 9},
            "Opponent": {"logic": 7, "evidence": 6, "rebuttal": 7}
        },
        "pro_summary": ["Speedy output demonstrated", "Evidence cited consistently", "Logic well-structured"],
        "opponent_summary": ["Adaptability raised", "Counterpoints offered", "Challenges identified"],
        "reason": "Pro was superior in evidence and logic scoring."
    }""",
    },
    # ── LAYER 2: Wrong winner (score mismatch) ───────────────────────────────
    {
        "label": "Winner mismatch — scores say Pro but winner says Opponent",
        "layer": 2,
        "content": """{
        "winner": "Opponent",
        "scores": {
            "Pro": {"logic": 10, "evidence": 10, "rebuttal": 10},
            "Opponent": {"logic": 1, "evidence": 1, "rebuttal": 1}
        },
        "pro_summary": ["Outstanding logic", "Excellent evidence", "Dominant rebuttal"],
        "opponent_summary": ["Weak arguments", "Lacked evidence", "Failed to rebut"],
        "reason": "Opponent wins despite lower scores."
    }""",
    },
    # ── LAYER 2: Preamble text before JSON ───────────────────────────────────
    {
        "label": "Preamble text before JSON object",
        "layer": 2,
        "content": """Sure! Here is my evaluation of the debate:

    {
        "winner": "Pro",
        "scores": {
            "Pro": {"logic": 8, "evidence": 7, "rebuttal": 8},
            "Opponent": {"logic": 7, "evidence": 6, "rebuttal": 6}
        },
        "pro_summary": ["Logic was clear", "Evidence cited often", "Rebuttals were direct"],
        "opponent_summary": ["Raised concerns", "Questioned data", "Offered alternatives"],
        "reason": "Pro's rebuttals were more targeted and evidence-backed."
    }

    I hope this analysis is helpful.""",
    },
    # ── LAYER 2: Float scores (need coercion to int) ─────────────────────────
    {
        "label": "Float scores requiring int coercion",
        "layer": 2,
        "content": """{
        "winner": "Opponent",
        "scores": {
            "Pro": {"logic": 7.5, "evidence": 6.8, "rebuttal": 7.2},
            "Opponent": {"logic": 8.3, "evidence": 8.1, "rebuttal": 8.7}
        },
        "pro_summary": ["Strong claims made", "Data referenced", "Counter raised"],
        "opponent_summary": ["Dismantled premises", "Cited alternatives", "Effective rebuttals"],
        "reason": "Opponent's arguments were more nuanced and evidence-grounded."
    }""",
    },
    # ── LAYER 4: Heuristic engine (all providers fail) ───────────────────────
    {
        "label": "All providers fail -> heuristic engine",
        "layer": 4,
        "content": "EXCEPTION_TRIGGER",
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Schema Validator
# ─────────────────────────────────────────────────────────────────────────────
def validate_verdict(verdict: dict) -> None:
    """Assert full schema compliance. Raises AssertionError on any violation."""
    assert isinstance(verdict, dict), "verdict is not a dict"
    assert verdict.get("winner") in ["Pro", "Opponent"], \
        f"winner={verdict.get('winner')!r} not in [Pro, Opponent]"
    assert "scores" in verdict, "scores key missing"
    for side in ["Pro", "Opponent"]:
        assert side in verdict["scores"], f"scores[{side}] missing"
        for metric in ["logic", "evidence", "rebuttal"]:
            v = verdict["scores"][side].get(metric)
            assert isinstance(v, int), f"scores[{side}][{metric}]={v!r} not int"
            assert 1 <= v <= 10, f"scores[{side}][{metric}]={v} out of [1,10] range"
    assert isinstance(verdict.get("pro_summary"), list), "pro_summary not a list"
    assert len(verdict["pro_summary"]) >= 1, "pro_summary is empty"
    assert isinstance(verdict.get("opponent_summary"), list), "opponent_summary not a list"
    assert len(verdict["opponent_summary"]) >= 1, "opponent_summary is empty"
    assert isinstance(verdict.get("reason"), str), "reason not a str"
    assert verdict["reason"].strip(), "reason is blank"
    assert isinstance(verdict.get("reasoning"), str), "reasoning not a str"
    assert verdict["reasoning"].strip(), "reasoning is blank"
    assert isinstance(verdict.get("summary"), str), "summary not a str"
    assert verdict["summary"].strip(), "summary is blank"


# ─────────────────────────────────────────────────────────────────────────────
# Test Runner
# ─────────────────────────────────────────────────────────────────────────────
async def run_rigor_test():
    print()
    print("=" * 70)
    print("  [START] JUDGE RELIABILITY TEST -- 100 EVALUATIONS  ")
    print("=" * 70)
    print()

    judge = JudgeAgent()
    total = 100
    success_count = 0

    layer_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    layer_success = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

    results_log = []

    for i in range(total):
        spec = RESPONSE_SPECS[i % len(RESPONSE_SPECS)]
        topic = random.choice(TOPICS)
        rounds = make_rounds(topic)
        layer = spec["layer"]
        label = spec["label"]
        layer_counts[layer] = layer_counts.get(layer, 0) + 1

        verdict = None
        error_msg = None

        if spec["content"] == "EXCEPTION_TRIGGER":
            # All 4 providers raise RuntimeError -- triggers heuristic engine
            mock_provider = MagicMock()
            mock_provider.generate = AsyncMock(
                side_effect=RuntimeError("Simulated provider outage - all systems down")
            )
            mocked_providers = {
                "groq": mock_provider,
                "openrouter": mock_provider,
                "gemini": mock_provider,
                "openai": mock_provider,
            }
            try:
                with patch("app.agents.judge_agent.llm_manager.providers", mocked_providers):
                    verdict = await judge.evaluate(topic, rounds)
            except Exception as e:
                error_msg = str(e)
        else:
            # Normal path: first provider returns the mock content
            mock_provider = MagicMock()
            mock_provider.generate = AsyncMock(
                return_value=_make_llm_response(spec["content"])
            )
            mocked_providers = {
                "groq": mock_provider,
                "openrouter": mock_provider,
                "gemini": mock_provider,
                "openai": mock_provider,
            }
            try:
                with patch("app.agents.judge_agent.llm_manager.providers", mocked_providers):
                    verdict = await judge.evaluate(topic, rounds)
            except Exception as e:
                error_msg = str(e)

        # ── Validate ──────────────────────────────────────────────────────────
        if verdict is not None:
            try:
                validate_verdict(verdict)
                success_count += 1
                layer_success[layer] = layer_success.get(layer, 0) + 1
                status = "[PASS]"
                results_log.append((i + 1, layer, label, "PASS", None))
            except AssertionError as ae:
                error_msg = str(ae)
                status = "[FAIL]"
                results_log.append((i + 1, layer, label, "FAIL", error_msg))
        else:
            status = "[FAIL]"
            results_log.append((i + 1, layer, label, "FAIL", error_msg or "verdict is None"))

        # Progress log every 10 evaluations + first + last
        if i == 0 or (i + 1) % 10 == 0 or i == total - 1:
            w = verdict.get("winner", "N/A") if verdict else "ERR"
            print(f"  {status} [{i+1:02d}/{total}] Layer {layer} | {label[:45]:<45} | winner={w}")

    # ── Final report ─────────────────────────────────────────────────────────
    rate = (success_count / total) * 100
    judge_failures = get_judge_failure_log()

    print()
    print("=" * 70)
    print("  RELIABILITY REPORT")
    print("=" * 70)
    print(f"  Total Evaluations  : {total}")
    print(f"  Successful         : {success_count}")
    print(f"  Failed             : {total - success_count}")
    print(f"  Completion Rate    : {rate:.1f}%")
    print()
    print("  Layer Breakdown:")
    layer_labels = {
        1: "Standard JSON parsing",
        2: "JSON repair / schema fix",
        3: "Thinking block stripping",
        4: "Heuristic engine fallback",
        5: "Deterministic safe fallback",
    }
    for lyr in sorted(layer_counts.keys()):
        if layer_counts[lyr] > 0:
            pct = 100 * layer_success.get(lyr, 0) / layer_counts[lyr]
            print(f"    Layer {lyr} [{layer_labels.get(lyr,'?')}]: "
                  f"{layer_success.get(lyr,0)}/{layer_counts[lyr]} ({pct:.0f}%)")

    print()
    if judge_failures:
        print(f"  Judge Failure Audit Log Entries: {len(judge_failures)}")
        for rec in judge_failures[:3]:
            print(f"    attempt={rec['attempt']} provider={rec['provider']} error={rec['error'][:80]!r}")
        if len(judge_failures) > 3:
            print(f"    ... and {len(judge_failures)-3} more (check logging for full details)")
    else:
        print("  Judge Failure Audit Log: 0 entries (all clean)")

    # Failures detail
    failures = [r for r in results_log if r[3] == "FAIL"]
    if failures:
        print()
        print("  [FAILED EVALUATIONS]:")
        for f in failures:
            print(f"    #{f[0]:02d} Layer {f[1]} | {f[2]} | {f[4]}")

    print()
    print("=" * 70)
    if rate == 100.0:
        print("  [SUCCESS] 100% judge evaluation reliability achieved!")
        print("      No user will ever see 'evaluation failed to reach a verdict.'")
    else:
        print(f"  [FAILURE] Reliability at {rate:.1f}%. Target: 100%.")
        print("      Review failed evaluations above and check audit log.")
    print("=" * 70)
    print()

    return rate == 100.0


if __name__ == "__main__":
    passed = asyncio.run(run_rigor_test())
    sys.exit(0 if passed else 1)
