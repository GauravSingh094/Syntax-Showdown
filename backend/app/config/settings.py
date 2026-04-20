from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Ollama
    OLLAMA_URL: str = "http://localhost:11434"

    # HW-Friendly Models (Llama 3.2 1B is very snappy)
    PRO_MODEL: str = "llama3.2:1b"
    OPPONENT_MODEL: str = "llama3.2:1b"
    JUDGE_MODEL: str = "mistral:latest"

    # ChromaDB Cloud
    CHROMA_HOST: str = "api.trychroma.com"
    CHROMA_API_KEY: str = "dummy"
    CHROMA_TENANT: str = "dummy"
    CHROMA_DATABASE: str = "Syntax-Showdown"
    CHROMA_MAX_RECORDS: int = 1000

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 10
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # Clerk
    CLERK_SECRET_KEY: str
    CLERK_JWKS_URL: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
