# Job Hunt Pipeline (V2.0)

> **Personal Job Search & Career Intelligence Platform**  
> Designed for Fresh Graduates, Junior Developers, and Career Switchers to turn job hunting into a structured, feedback-driven engineering pipeline.

---

## ⚡ Key Highlights & Capabilities

- **Python Job Processing Pipeline**: Automatic URL canonicalization, anti-tracking cleaner, HTML content extractor (`BeautifulSoup` / `selectolax`), and AI requirements extraction.
- **Deterministic Match Engine**: Weighted multi-dimensional qualification scoring:
  - Technical Skills (35%)
  - Role Compatibility (25%)
  - Experience Gap (15%)
  - Education (10%)
  - Workplace Type & Location (10%)
  - Salary & Other (5%)
- **Transparent Decision Badges**: `APPLY` (High match), `REVIEW` (Transferable skills needed), `SKIP` (Low callback probability / high mismatch).
- **Multi-Provider AI Abstraction**:
  - **NVIDIA NIM** (Free tier models e.g. `meta/llama-3.3-70b-instruct`, DeepSeek R1)
  - **Zhipu AI / GLM** (`glm-4-flash` free/low-cost)
  - **Groq** (`llama-3.3-70b-versatile`)
  - **Google Gemini** (`gemini-2.5-flash`)
  - **OpenAI** (`gpt-4o-mini`)
  - **Deterministic Local Heuristic / Regex Engine** (100% free, runs offline with zero API keys)
- **Interactive Kanban Pipeline**: Drag & drop applications across `Saved` → `Applied` → `Screening` → `Technical Round` → `Final Round` → `Offer`.
- **AI Interview Prep Studio**: Role-tailored technical questions, STAR method behavioral answer blueprints, and high-impact questions to ask interviewers.
- **Zero-Ghosting Follow-Up Cadence**: Auto-calculated Day 5 and Day 10 status check reminders with one-click AI email draft generation.
- **Career Intelligence & Skill Gap Analytics**: Visual funnel conversion rates and aggregated recurring skill gaps across applications.

---

## 🚀 Quick Start Guide

### 1. Start the Backend (FastAPI + Python 3.11+)

```bash
cd backend
# Create virtual environment with uv or python venv
uv venv
source .venv/bin/activate

# Install dependencies
uv pip install -r <(uv pip compile pyproject.toml) || uv pip install fastapi "uvicorn[standard]" pydantic pydantic-settings sqlalchemy aiosqlite asyncpg alembic httpx beautifulsoup4 selectolax python-dotenv openai google-genai greenlet python-multipart pytest pytest-asyncio

# Start the FastAPI server
uvicorn backend.app.main:app --reload --port 8000
```

FastAPI server runs at `http://localhost:8000`.  
Interactive API Swagger Docs: `http://localhost:8000/docs`

### 2. Start the Frontend (Next.js 15 + React 19 + TypeScript)

```bash
cd frontend
# Install dependencies
npm install --legacy-peer-deps

# Start Next.js development server
npm run dev
```

Next.js frontend runs at `http://localhost:3000`.

---

## 🐳 Docker Deployment (One-Command Launch)

To start PostgreSQL, FastAPI backend, and Next.js frontend together:

```bash
docker-compose up --build
```

---

## 🧪 Running Tests

### Backend Unit & Integration Tests

```bash
cd backend
.venv/bin/pytest
```

---

## 📖 Product & Architecture Specification

- **Technical Architecture & Processing Guide**: [docs/TECHNICAL_PROCESSING_GUIDE.md](file:///Users/arnel/Projects/job_hunt_pipeline/docs/TECHNICAL_PROCESSING_GUIDE.md)
- **51-Section PRD & ARD Specification**: [docs/PRD_ARD.md](file:///Users/arnel/Projects/job_hunt_pipeline/docs/PRD_ARD.md)
- **Job Verification Specification**: [docs/job_hunt_pipeline_job_verification_implementation.md](file:///Users/arnel/Projects/job_hunt_pipeline/docs/job_hunt_pipeline_job_verification_implementation.md)
