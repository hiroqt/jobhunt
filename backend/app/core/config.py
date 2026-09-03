from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Job Hunt Pipeline API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # Database (Default: SQLite async, easily switched to PostgreSQL via DATABASE_URL)
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./job_hunt.db",
        description="Async SQLAlchemy database connection URL (e.g. postgresql+asyncpg://user:pass@localhost:5432/jobhunt or sqlite+aiosqlite:///./job_hunt.db)"
    )
    
    # AI Provider Settings
    DEFAULT_AI_PROVIDER: str = Field(default="fallback", description="Default AI provider: gemini, nvidia, glm, groq, openai, ollama, fallback")
    
    # Google Gemini
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # NVIDIA NIM (Free tier API keys)
    NVIDIA_API_KEY: Optional[str] = None
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_MODEL: str = "meta/llama-3.3-70b-instruct"
    
    # Zhipu AI / GLM (Free/Low-cost)
    GLM_API_KEY: Optional[str] = None
    GLM_BASE_URL: str = "https://open.bigmodel.cn/api/paas/v4"
    GLM_MODEL: str = "glm-4-flash"
    
    # OpenRouter (Supports nvidia/nemotron-3-ultra-550b-a55b:free, meta-llama, deepseek, etc.)
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "nvidia/nemotron-3-ultra-550b-a55b:free"

    # OpenAI / Groq / Ollama (OpenAI-compatible generic provider)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    OLLAMA_BASE_URL: str = "http://localhost:11434/v1"
    OLLAMA_MODEL: str = "llama3.2"

    model_config = SettingsConfigDict(
        env_file=[".env", "backend/.env", "../backend/.env"],
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
