FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml README.md* ./backend/
RUN pip install --no-cache-dir uv && \
    uv pip install --system fastapi "uvicorn[standard]" pydantic pydantic-settings sqlalchemy aiosqlite asyncpg alembic httpx beautifulsoup4 selectolax python-dotenv openai google-genai greenlet pypdf pytest pytest-asyncio python-multipart

COPY . ./backend/

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
