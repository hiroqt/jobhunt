import sys
import asyncio
from pathlib import Path

# Ensure project root is on sys.path regardless of execution directory
_app_dir = Path(__file__).resolve().parent
_backend_dir = _app_dir.parent
_project_root = _backend_dir.parent
for _p in [str(_project_root), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.db.session import init_db
from backend.app.db.session_manager import session_manager

import backend.app.models # noqa: F401
from backend.app.api.routes.session import router as session_router
from backend.app.api.routes.candidates import router as candidates_router
from backend.app.api.routes.jobs import router as jobs_router
from backend.app.api.routes.searches import router as searches_router
from backend.app.api.routes.sources import router as sources_router
from backend.app.api.routes.notifications import router as notifications_router
from backend.app.api.routes.matching import router as matching_router
from backend.app.api.routes.applications import router as applications_router
from backend.app.api.routes.interviews import router as interviews_router
from backend.app.api.routes.follow_ups import router as follow_ups_router
from backend.app.api.routes.ai import router as ai_router
from backend.app.api.routes.analytics import router as analytics_router


async def _periodic_session_cleanup():
    while True:
        try:
            await asyncio.sleep(600) # Every 10 minutes
            await session_manager.cleanup_expired_sessions(max_idle_seconds=3600)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.warning(f"Error during periodic session cleanup: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize ephemeral session engine
    logger.info("Starting up Job Hunt Pipeline API (Stateless Ephemeral Session Mode)...")
    await init_db()
    cleanup_task = asyncio.create_task(_periodic_session_cleanup())
    yield
    cleanup_task.cancel()
    logger.info("Shutting down Job Hunt Pipeline API...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for Job Hunt Pipeline - Ephemeral Guest & Stateless Career Intelligence Platform",
    lifespan=lifespan
)

# Configure CORS (Supports Vercel deployments, custom domains, and local development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    logger.exception(f"Unhandled server error on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

# Register API Routers
app.include_router(session_router, prefix=settings.API_V1_STR)
app.include_router(candidates_router, prefix=settings.API_V1_STR)
app.include_router(jobs_router, prefix=settings.API_V1_STR)
app.include_router(searches_router, prefix=settings.API_V1_STR)
app.include_router(sources_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(matching_router, prefix=settings.API_V1_STR)
app.include_router(applications_router, prefix=settings.API_V1_STR)
app.include_router(interviews_router, prefix=settings.API_V1_STR)
app.include_router(follow_ups_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "ephemeral_guest_stateless",
        "active_guest_sessions": session_manager.get_active_session_count(),
        "ai_provider": settings.DEFAULT_AI_PROVIDER
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to Job Hunt Pipeline API (Stateless Ephemeral Mode)",
        "docs_url": "/docs",
        "version": settings.VERSION
    }
