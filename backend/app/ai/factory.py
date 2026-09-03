from typing import Optional
from backend.app.core.config import settings
from backend.app.ai.base import BaseAIProvider
from backend.app.ai.providers.fallback import FallbackHeuristicProvider
from backend.app.ai.providers.openai_compatible import OpenAICompatibleProvider
from backend.app.core.logging import logger


def get_ai_provider(provider_override: Optional[str] = None) -> BaseAIProvider:
    """
    Factory function to retrieve the configured AI provider.
    Supports:
    - 'nvidia': NVIDIA NIM (free tier e.g. meta/llama-3.3-70b-instruct, deepseek)
    - 'glm': Zhipu AI / GLM (glm-4-flash free/low-cost)
    - 'groq': Groq (fast free tier llama-3.3-70b-versatile)
    - 'gemini': Google Gemini
    - 'openai': OpenAI
    - 'ollama': Local Ollama instance
    - 'fallback': Local deterministic heuristic engine (zero API keys needed)
    """
    selected = (provider_override or settings.DEFAULT_AI_PROVIDER).lower()

    if selected == "fallback":
        return FallbackHeuristicProvider()

    if (selected == "openrouter" or selected == "nemotron") and settings.OPENROUTER_API_KEY:
        return OpenAICompatibleProvider(
            name="OpenRouter (Free Tier)",
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL,
            model=settings.OPENROUTER_MODEL,
            default_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Job Hunt Pipeline"
            }
        )
    elif selected == "nvidia" and settings.NVIDIA_API_KEY:
        return OpenAICompatibleProvider(
            name="NVIDIA NIM",
            api_key=settings.NVIDIA_API_KEY,
            base_url=settings.NVIDIA_BASE_URL,
            model=settings.NVIDIA_MODEL
        )
    elif selected == "glm" and settings.GLM_API_KEY:
        return OpenAICompatibleProvider(
            name="Zhipu GLM",
            api_key=settings.GLM_API_KEY,
            base_url=settings.GLM_BASE_URL,
            model=settings.GLM_MODEL
        )
    elif selected == "groq" and settings.GROQ_API_KEY:
        return OpenAICompatibleProvider(
            name="Groq",
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
            model=settings.GROQ_MODEL
        )
    elif selected == "openai" and settings.OPENAI_API_KEY:
        return OpenAICompatibleProvider(
            name="OpenAI",
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
            model=settings.OPENAI_MODEL
        )
    elif selected == "ollama":
        return OpenAICompatibleProvider(
            name="Ollama Local",
            api_key="ollama",
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_MODEL
        )
    elif selected == "gemini" and settings.GEMINI_API_KEY:
        # Gemini can be called via OpenAI compatibility endpoint or Google GenAI
        return OpenAICompatibleProvider(
            name="Google Gemini",
            api_key=settings.GEMINI_API_KEY,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            model=settings.GEMINI_MODEL
        )
    
    # If any specific key was provided in environment, automatically choose that over pure fallback
    if settings.OPENROUTER_API_KEY:
        return OpenAICompatibleProvider(
            name="OpenRouter (Free Tier)",
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL,
            model=settings.OPENROUTER_MODEL,
            default_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Job Hunt Pipeline"
            }
        )
    elif settings.NVIDIA_API_KEY:
        return OpenAICompatibleProvider(
            name="NVIDIA NIM",
            api_key=settings.NVIDIA_API_KEY,
            base_url=settings.NVIDIA_BASE_URL,
            model=settings.NVIDIA_MODEL
        )
    elif settings.GLM_API_KEY:
        return OpenAICompatibleProvider(
            name="Zhipu GLM",
            api_key=settings.GLM_API_KEY,
            base_url=settings.GLM_BASE_URL,
            model=settings.GLM_MODEL
        )
    elif settings.GROQ_API_KEY:
        return OpenAICompatibleProvider(
            name="Groq",
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
            model=settings.GROQ_MODEL
        )
    elif settings.GEMINI_API_KEY:
        return OpenAICompatibleProvider(
            name="Google Gemini",
            api_key=settings.GEMINI_API_KEY,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            model=settings.GEMINI_MODEL
        )

    # Safe default: Fallback heuristic rule engine
    return FallbackHeuristicProvider()
