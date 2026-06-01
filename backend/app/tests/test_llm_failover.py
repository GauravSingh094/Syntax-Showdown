import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from app.config.settings import settings
from app.llm.base import LLMResponse, TokenUsage
from app.llm.provider_manager import LLMProviderManager, debate_calls_context
from app.main import app

client = TestClient(app)

@pytest.fixture
def mock_providers():
    with patch("app.llm.groq_provider.GroqProvider.generate", new_callable=AsyncMock) as mock_groq, \
         patch("app.llm.openrouter_provider.OpenRouterProvider.generate", new_callable=AsyncMock) as mock_or, \
         patch("app.llm.gemini_provider.GeminiProvider.generate", new_callable=AsyncMock) as mock_gemini, \
         patch("app.llm.openai_provider.OpenAIProvider.generate", new_callable=AsyncMock) as mock_openai:
        yield {
            "groq": mock_groq,
            "openrouter": mock_or,
            "gemini": mock_gemini,
            "openai": mock_openai
        }

@pytest.mark.asyncio
async def test_successful_primary_generation(mock_providers):
    # Setup successful primary (Groq)
    mock_providers["groq"].return_value = LLMResponse(
        content="This is a Groq response",
        provider="groq",
        model="llama-3.3-70b-versatile",
        latency_ms=150.0,
        usage=TokenUsage(input_tokens=10, output_tokens=5, total_tokens=15),
        cost=0.00001
    )
    
    manager = LLMProviderManager()
    debate_calls_context.set([])
    
    # Force primary to be groq and enable failover
    with patch.object(settings, "PRIMARY_PROVIDER", "groq"), \
         patch.object(settings, "ENABLE_FAILOVER", True):
        res = await manager.execute_with_failover("test prompt", "Pro")
        
        assert res.content == "This is a Groq response"
        assert res.provider == "groq"
        assert res.cost == 0.00001
        
        # Verify only Groq was called
        mock_providers["groq"].assert_called_once()
        mock_providers["openrouter"].assert_not_called()

@pytest.mark.asyncio
async def test_cascading_failover_flow(mock_providers):
    # Setup Groq to fail with a rate limit or timeout exception
    mock_providers["groq"].side_effect = RuntimeError("Groq Rate Limit Exceeded")
    
    # Setup OpenRouter to succeed
    mock_providers["openrouter"].return_value = LLMResponse(
        content="This is an OpenRouter fallback response",
        provider="openrouter",
        model="meta-llama/llama-3.3-70b-instruct",
        latency_ms=300.0,
        usage=TokenUsage(input_tokens=20, output_tokens=10, total_tokens=30),
        cost=0.00002
    )
    
    manager = LLMProviderManager()
    debate_calls_context.set([])
    
    with patch.object(settings, "PRIMARY_PROVIDER", "groq"), \
         patch.object(settings, "ENABLE_FAILOVER", True):
        res = await manager.execute_with_failover("test prompt", "Opponent")
        
        assert res.content == "This is an OpenRouter fallback response"
        assert res.provider == "openrouter"
        assert res.cost == 0.00002
        
        # Verify Groq was tried, failed, and then OpenRouter was called
        mock_providers["groq"].assert_called_once()
        mock_providers["openrouter"].assert_called_once()
        mock_providers["gemini"].assert_not_called()

@pytest.mark.asyncio
async def test_failover_disabled_behavior(mock_providers):
    # Setup Groq to fail
    mock_providers["groq"].side_effect = RuntimeError("Groq Outage")
    
    manager = LLMProviderManager()
    debate_calls_context.set([])
    
    with patch.object(settings, "PRIMARY_PROVIDER", "groq"), \
         patch.object(settings, "ENABLE_FAILOVER", False):
        
        # Should raise directly without trying fallback
        with pytest.raises(RuntimeError) as excinfo:
            await manager.execute_with_failover("test prompt", "Pro")
            
        assert "Groq Outage" in str(excinfo.value)
        mock_providers["groq"].assert_called_once()
        mock_providers["openrouter"].assert_not_called()

@pytest.mark.asyncio
async def test_total_exhaustion_failure(mock_providers):
    # Setup all providers in chain to fail
    for k in mock_providers:
        mock_providers[k].side_effect = RuntimeError(f"{k} error")
        
    manager = LLMProviderManager()
    debate_calls_context.set([])
    
    with patch.object(settings, "PRIMARY_PROVIDER", "groq"), \
         patch.object(settings, "ENABLE_FAILOVER", True):
        
        with pytest.raises(RuntimeError) as excinfo:
            await manager.execute_with_failover("test prompt", "Judge")
            
        assert "All LLM providers failed" in str(excinfo.value)
        # Verify all four were tried
        for k in mock_providers:
            mock_providers[k].assert_called_once()

def test_diagnostics_endpoint():
    # Test POST /llm/test endpoint
    with patch("app.llm.groq_provider.GroqProvider.check_health", new_callable=AsyncMock) as mock_health:
        mock_health.return_value = {
            "provider": "groq",
            "status": "ok",
            "latency_ms": 120,
            "model": "llama-3.3-70b-versatile"
        }
        
        response = client.post("/llm/test", json={"provider": "groq"})
        assert response.status_code == 200
        data = response.json()
        assert data["provider"] == "groq"
        assert data["status"] == "ok"
        assert data["latency_ms"] == 120
        assert data["model"] == "llama-3.3-70b-versatile"

def test_health_check_endpoint():
    # Test GET /health endpoint
    with patch("app.llm.groq_provider.GroqProvider.check_health", new_callable=AsyncMock) as mock_groq, \
         patch("app.llm.openrouter_provider.OpenRouterProvider.check_health", new_callable=AsyncMock) as mock_or, \
         patch("app.llm.gemini_provider.GeminiProvider.check_health", new_callable=AsyncMock) as mock_gemini, \
         patch("app.llm.openai_provider.OpenAIProvider.check_health", new_callable=AsyncMock) as mock_openai, \
         patch("app.memory.chromadb_client.collection.count") as mock_chroma:
        
        mock_groq.return_value = {"provider": "groq", "status": "ok", "latency_ms": 100, "model": "llama"}
        mock_or.return_value = {"provider": "openrouter", "status": "ok", "latency_ms": 200, "model": "llama"}
        mock_gemini.return_value = {"provider": "gemini", "status": "ok", "latency_ms": 150, "model": "gemini"}
        mock_openai.return_value = {"provider": "openai", "status": "ok", "latency_ms": 180, "model": "gpt"}
        mock_chroma.return_value = 50
        
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["api"] == "ok"
        assert data["chromadb"] == "ok"
        assert "providers" in data
        assert data["providers"]["groq"]["status"] == "ok"
        assert data["providers"]["gemini"]["latency_ms"] == 150
