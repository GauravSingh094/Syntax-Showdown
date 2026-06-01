from typing import AsyncIterator
from app.llm.provider_manager import llm_manager, debate_calls_context

async def generate(prompt: str, role: str, format_json: bool = False) -> str:
    """Unified API for agents to generate completion from LLM Router with failover."""
    return await llm_manager.generate(prompt, role, format_json=format_json)

async def stream(prompt: str, role: str, format_json: bool = False) -> AsyncIterator[str]:
    """Exposes streaming capability for future agent token-by-token processing."""
    response = await llm_manager.execute_with_failover(prompt, role, format_json=format_json)
    # Since we are using standard REST completions, we yield the complete text in a single block
    # to preserve existing SSE and round-level structure perfectly.
    yield response.content
