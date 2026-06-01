import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.config.settings import settings
from app.api import debate, history, health, diagnostics
from app.core.logging import configure_logging

configure_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation checks for configured cloud API keys
    logger.info("Initializing Syntax Showdown API Backend...")
    logger.info(f"LLM Routing Configuration: Primary='{settings.PRIMARY_PROVIDER}', FailoverEnabled={settings.ENABLE_FAILOVER}")
    
    missing_keys = []
    if not settings.GROQ_API_KEY:
        missing_keys.append("GROQ_API_KEY")
    if not settings.OPENROUTER_API_KEY:
        missing_keys.append("OPENROUTER_API_KEY")
    if not settings.GEMINI_API_KEY:
        missing_keys.append("GEMINI_API_KEY")
    if not settings.OPENAI_API_KEY:
        missing_keys.append("OPENAI_API_KEY")
        
    if missing_keys:
        logger.warning(f"The following cloud provider API keys are missing in .env: {', '.join(missing_keys)}")
        logger.warning("Failing over to these providers will result in runtime errors if their respective keys are not set.")
    else:
        logger.info("All LLM cloud provider API keys loaded.")
    yield

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Syntax Showdown", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(debate.router)
app.include_router(history.router)
app.include_router(health.router)
app.include_router(diagnostics.router)
