FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir uv && \
    uv pip install --system fastapi "uvicorn[standard]" pydantic pydantic-settings sqlalchemy aiosqlite asyncpg alembic httpx beautifulsoup4 selectolax python-dotenv openai google-genai greenlet python-multipart

COPY . .

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
