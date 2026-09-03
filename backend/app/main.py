from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.db.session import init_db, AsyncSessionLocal
from backend.app.db.seed import seed_initial_data

import backend.app.models # noqa: F401
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed initial taxonomy
    logger.info("Starting up Job Hunt Pipeline API...")
    await init_db()
    async with AsyncSessionLocal() as session:
        try:
            await seed_initial_data(session)
        except Exception as e:
            logger.warning(f"Error seeding database: {e}")
    yield
    logger.info("Shutting down Job Hunt Pipeline API...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for Job Hunt Pipeline - Personal Job Search & Career Intelligence Platform",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    logger.exception(f"Unhandled server error on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

# Register API Routers
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
        "ai_provider": settings.DEFAULT_AI_PROVIDER
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to Job Hunt Pipeline API",
        "docs_url": "/docs",
        "version": settings.VERSION
    }
