from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # LLM Router configuration
    PRIMARY_PROVIDER: str = "groq"
    ENABLE_FAILOVER: bool = True

    # Cloud LLM API Keys
    GROQ_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

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
