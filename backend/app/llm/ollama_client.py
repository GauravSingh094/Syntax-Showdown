import httpx
import asyncio
import logging
from app.config.settings import settings

logger = logging.getLogger(__name__)

def _get_timeout(model: str) -> float:
    # Large models can take a while to load on first run
    return 180.0

async def generate(prompt: str, model: str, retries: int = 3) -> str:
    timeout = _get_timeout(model)
    for attempt in range(retries):
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    f"{settings.OLLAMA_URL}/api/generate",
                    json={"model": model, "prompt": prompt, "stream": False}
                )
                response.raise_for_status()
                data = response.json()
                result = data.get("response", "").strip()
                if not result:
                    raise ValueError("Empty response from Ollama")
                return result
        except Exception as e:
            logger.warning(f"Ollama attempt {attempt+1}/{retries} failed: {e}")
            if attempt < retries - 1:
                # Exponential backoff or just a longer wait
                await asyncio.sleep(5.0)
    raise RuntimeError(f"Ollama failed after {retries} attempts for model {model}")

async def check_model_availability(model: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"{settings.OLLAMA_URL}/api/tags")
            models = [m["name"] for m in r.json().get("models", [])]
            if model not in models:
                logger.warning(f"Model '{model}' not found in Ollama")
                return False
            return True
    except Exception as e:
        logger.error(f"Ollama health check failed: {e}")
        return False
