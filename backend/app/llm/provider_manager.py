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

# Context variable to hold selected models per request
selected_models_context: ContextVar[Dict[str, str]] = ContextVar("selected_models_context", default={})

MODEL_MAPPINGS = {
    "groq": {
        "LLAMA-3.3": "llama-3.3-70b-versatile",
        "DEEPSEEK-R1": "llama-3.3-70b-versatile",
        "GPT-4O": "llama-3.3-70b-versatile",
        "GEMINI-2.0": "llama-3.3-70b-versatile"
    },
    "openrouter": {
        "LLAMA-3.3": "meta-llama/llama-3.3-70b-instruct",
        "DEEPSEEK-R1": "deepseek/deepseek-r1",
        "GPT-4O": "openai/gpt-4o-mini",
        "GEMINI-2.0": "google/gemini-2.5-flash",
        "CLAUDE-3.5": "anthropic/claude-3.5-sonnet"
    },
    "gemini": {
        "GEMINI-2.0": "gemini-2.5-flash",
        "LLAMA-3.3": "gemini-2.5-flash",
        "DEEPSEEK-R1": "gemini-2.5-flash",
        "GPT-4O": "gemini-2.5-flash"
    },
    "openai": {
        "GPT-4O": "gpt-4o-mini",
        "LLAMA-3.3": "gpt-4o-mini",
        "DEEPSEEK-R1": "gpt-4o-mini",
        "GEMINI-2.0": "gpt-4o-mini"
    }
}

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

    def _get_provider_chain_for_model(self, selected_model: str) -> List[str]:
        preferred = settings.PRIMARY_PROVIDER.lower()
        if selected_model == "GEMINI-2.0":
            preferred = "gemini"
        elif selected_model == "GPT-4O":
            preferred = "openai"
        elif selected_model == "CLAUDE-3.5":
            preferred = "openrouter"
        elif selected_model in ["LLAMA-3.3", "DEEPSEEK-R1"]:
            preferred = "groq"
            
        if preferred not in self.providers:
            preferred = "groq"
            
        chain = [preferred]
        for p in self.default_order:
            if p != preferred:
                chain.append(p)
        return chain

    def _resolve_model(self, provider_name: str, selected_model: str, role: str) -> str:
        provider = self.providers[provider_name]
        if not selected_model:
            return provider.get_model(role)
            
        mapping = MODEL_MAPPINGS.get(provider_name, {})
        if selected_model in mapping:
            model_id = mapping[selected_model]
            if role.lower() == "judge":
                if provider_name == "openai" and selected_model == "GPT-4O":
                    return "gpt-4o"
                elif provider_name == "gemini" and selected_model == "GEMINI-2.0":
                    return "gemini-2.5-pro"
                elif provider_name == "openrouter" and selected_model == "GPT-4O":
                    return "openai/gpt-4o"
                elif provider_name == "openrouter" and selected_model == "GEMINI-2.0":
                    return "google/gemini-2.5-pro"
            return model_id
            
        return provider.get_model(role)

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
        
        # Resolve custom model preference (Task 1)
        role_key = role.lower()
        selected_model = selected_models_context.get().get(role_key, "")
        
        chain = self._get_provider_chain_for_model(selected_model)
        enable_failover = settings.ENABLE_FAILOVER
        
        last_exception = None
        
        # Calculate debate-specific metrics from context
        calls = debate_calls_context.get()
        debate_cost_so_far = sum(call.get("cost", 0.0) for call in calls)

        # Loop through the provider chain
        for idx, provider_name in enumerate(chain):
            provider = self.providers[provider_name]
            model_name = self._resolve_model(provider_name, selected_model, role)
            start_time = datetime.utcnow()
            
            try:
                logger.info(f"Attempting LLM request using Provider: {provider_name}, Model: {model_name}, Role: {role}")
                response = await provider.generate(prompt, role, format_json=format_json, model=model_name)
                
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
