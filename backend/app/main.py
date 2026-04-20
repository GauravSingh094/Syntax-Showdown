import asyncio, logging
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.llm.ollama_client import check_model_availability
from app.config.settings import settings
from app.api import debate, history, health
from app.core.logging import configure_logging

configure_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    for model in [settings.PRO_MODEL, settings.JUDGE_MODEL]:
        ok = await check_model_availability(model)
        if not ok:
            logger.warning(f"Model '{model}' unavailable on startup")
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
