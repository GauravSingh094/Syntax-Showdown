import time
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from contextvars import ContextVar

from app.config.settings import settings
from app.llm.base import BaseLLMProvider, LLMResponse, TokenUsage
from app.llm.groq_provider import GroqProvider
from app.llm.openrouter_provider import OpenRouterProvider
from app.llm.gemini_provider import GeminiProvider
from app.llm.openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)

# Context variable to track LLM call records within a single debate execution (asynchronous task)
debate_calls_context: ContextVar[List[Dict[str, Any]]] = ContextVar("debate_calls_context", default=[])

# Global counter for cumulative session cost (persists across debates for session longevity tracking)
_cumulative_session_cost: float = 0.0

class LLMProviderManager:
    def __init__(self):
        # Register all available providers
        self.providers: Dict[str, BaseLLMProvider] = {
            "groq": GroqProvider(),
            "openrouter": OpenRouterProvider(),
            "gemini": GeminiProvider(),
            "openai": OpenAIProvider()
        }
        # Order of fallback chain
        self.default_order = ["groq", "openrouter", "gemini", "openai"]

    def _get_provider_chain(self) -> List[str]:
        primary = settings.PRIMARY_PROVIDER.lower()
        if primary not in self.providers:
            primary = "groq"
            
        chain = [primary]
        for p in self.default_order:
            if p != primary:
                chain.append(p)
        return chain

    def get_cumulative_session_cost(self) -> float:
        global _cumulative_session_cost
        return _cumulative_session_cost

    async def generate(self, prompt: str, role: str, format_json: bool = False) -> str:
        """Exposes the exact compatible interface for base_agent and other clients."""
        response = await self.execute_with_failover(prompt, role, format_json)
        return response.content

    async def execute_with_failover(self, prompt: str, role: str, format_json: bool = False) -> LLMResponse:
        global _cumulative_session_cost
        chain = self._get_provider_chain()
        enable_failover = settings.ENABLE_FAILOVER
        
        last_exception = None
        
        # Calculate debate-specific metrics from context
        calls = debate_calls_context.get()
        debate_cost_so_far = sum(call.get("cost", 0.0) for call in calls)

        # Loop through the provider chain
        for idx, provider_name in enumerate(chain):
            provider = self.providers[provider_name]
            model_name = provider.get_model(role)
            start_time = datetime.utcnow()
            
            try:
                logger.info(f"Attempting LLM request using Provider: {provider_name}, Model: {model_name}, Role: {role}")
                response = await provider.generate(prompt, role, format_json=format_json)
                
                # Success! Record metrics
                end_time = datetime.utcnow()
                latency_ms = response.latency_ms
                usage = response.usage
                cost = response.cost
                
                _cumulative_session_cost += cost
                debate_cost_so_far += cost
                
                # Structured logs for observability & tokens (Requirement 2, 3, 4)
                logger.info(
                    f"\n[LLM OBSERVABILITY DIAGNOSTICS]\n"
                    f"Provider: {provider_name}\n"
                    f"Model: {model_name}\n"
                    f"Latency: {latency_ms:.1f}ms\n"
                    f"Status: Success\n"
                    f"Input Tokens: {usage.input_tokens}\n"
                    f"Output Tokens: {usage.output_tokens}\n"
                    f"Total Tokens: {usage.total_tokens}\n"
                    f"Request Cost: ${cost:.6f}\n"
                    f"Debate Cost So Far: ${debate_cost_so_far:.6f}\n"
                    f"Cumulative Session Cost: ${_cumulative_session_cost:.6f}"
                )
                
                # Append to debate context for ChromaDB metadata (Requirement 9)
                call_record = {
                    "provider": provider_name,
                    "model": model_name,
                    "latency_ms": latency_ms,
                    "cost": cost,
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": "Success"
                }
                calls.append(call_record)
                debate_calls_context.set(calls)
                
                return response
                
            except Exception as e:
                end_time = datetime.utcnow()
                latency_ms = (end_time - start_time).total_seconds() * 1000
                logger.warning(
                    f"\n[LLM OBSERVABILITY DIAGNOSTICS]\n"
                    f"Provider: {provider_name}\n"
                    f"Model: {model_name}\n"
                    f"Latency: {latency_ms:.1f}ms\n"
                    f"Status: Failed\n"
                    f"Error: {str(e)}"
                )
                
                call_record = {
                    "provider": provider_name,
                    "model": model_name,
                    "latency_ms": latency_ms,
                    "cost": 0.0,
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": "Failed",
                    "error": str(e)
                }
                calls.append(call_record)
                debate_calls_context.set(calls)
                
                last_exception = e
                
                if not enable_failover:
                    logger.error(f"Failover disabled. LLM request failed on primary provider {provider_name}.")
                    raise e
                
                # If failover is enabled and there is a next provider, audit the failover (Requirement 8)
                if idx < len(chain) - 1:
                    fallback_provider = chain[idx + 1]
                    logger.warning(
                        f"\n[FAILOVER AUDIT ALERT]\n"
                        f"Timestamp: {datetime.utcnow().isoformat()}\n"
                        f"Original Provider: {provider_name}\n"
                        f"Failure Reason: {str(e)}\n"
                        f"Fallback Provider: {fallback_provider}"
                    )
                else:
                    logger.error("All providers in the failover chain have failed.")
                    
        raise RuntimeError(f"All LLM providers failed. Last error: {str(last_exception)}")

# Expose global provider manager instance
llm_manager = LLMProviderManager()
