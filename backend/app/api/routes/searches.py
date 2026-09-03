from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from backend.app.db.session import get_db, AsyncSessionLocal
from backend.app.models.search import JobSearch, SearchExecution
from backend.app.models.candidate import CandidateProfile
from backend.app.schemas.search import (
    JobSearchCreate,
    JobSearchUpdate,
    JobSearchResponse,
    SearchExecutionResponse,
    SearchRunResponse
)
from backend.app.api.dependencies import get_current_candidate
from backend.app.discovery.orchestrator import execute_search_pipeline
from backend.app.core.logging import logger

router = APIRouter(prefix="/searches", tags=["Job Discovery & Searches"])


@router.get("", response_model=List[JobSearchResponse])
async def list_searches(
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    stmt = (
        select(JobSearch)
        .where(JobSearch.candidate_id == candidate.id)
        .options(selectinload(JobSearch.executions))
        .order_by(desc(JobSearch.created_at))
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=JobSearchResponse, status_code=status.HTTP_201_CREATED)
async def create_search(
    search_data: JobSearchCreate,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    new_search = JobSearch(
        candidate_id=candidate.id,
        name=search_data.name,
        sources=search_data.sources,
        keywords=search_data.keywords,
        locations=search_data.locations,
        remote_types=search_data.remote_types,
        employment_types=search_data.employment_types,
        experience_levels=search_data.experience_levels,
        salary_min=search_data.salary_min,
        salary_max=search_data.salary_max,
        currency=search_data.currency,
        posted_within=search_data.posted_within,
        industries=search_data.industries,
        companies=search_data.companies,
        excluded_keywords=search_data.excluded_keywords,
        enabled=search_data.enabled,
        schedule_frequency=search_data.schedule_frequency,
    )
    db.add(new_search)
    await db.commit()
    await db.refresh(new_search)

    stmt = (
        select(JobSearch)
        .where(JobSearch.id == new_search.id)
        .options(selectinload(JobSearch.executions))
    )
    res = await db.execute(stmt)
    return res.scalar_one()


@router.get("/{search_id}", response_model=JobSearchResponse)
async def get_search(
    search_id: str,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    stmt = (
        select(JobSearch)
        .where(JobSearch.id == search_id, JobSearch.candidate_id == candidate.id)
        .options(selectinload(JobSearch.executions))
    )
    res = await db.execute(stmt)
    search = res.scalar_one_or_none()
    if not search:
        raise HTTPException(status_code=404, detail="Search configuration not found")
    return search


@router.patch("/{search_id}", response_model=JobSearchResponse)
async def update_search(
    search_id: str,
    update_data: JobSearchUpdate,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    stmt = (
        select(JobSearch)
        .where(JobSearch.id == search_id, JobSearch.candidate_id == candidate.id)
        .options(selectinload(JobSearch.executions))
    )
    res = await db.execute(stmt)
    search = res.scalar_one_or_none()
    if not search:
        raise HTTPException(status_code=404, detail="Search configuration not found")

    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(search, key, val)

    await db.commit()
    await db.refresh(search)
    return search


@router.delete("/{search_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_search(
    search_id: str,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    res = await db.execute(
        select(JobSearch).where(JobSearch.id == search_id, JobSearch.candidate_id == candidate.id)
    )
    search = res.scalar_one_or_none()
    if not search:
        raise HTTPException(status_code=404, detail="Search configuration not found")
    await db.delete(search)
    await db.commit()


@router.post("/{search_id}/run", response_model=SearchRunResponse)
async def trigger_search_run(
    search_id: str,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    """
    Executes search across configured source adapters, normalizes, deduplicates,
    qualifies against candidate profile, and notifies on high matches.
    """
    stmt = (
        select(JobSearch)
        .where(JobSearch.id == search_id, JobSearch.candidate_id == candidate.id)
        .options(selectinload(JobSearch.executions))
    )
    res = await db.execute(stmt)
    search = res.scalar_one_or_none()
    if not search:
        raise HTTPException(status_code=404, detail="Search configuration not found")

    execution = await execute_search_pipeline(search=search, candidate=candidate, db=db)

    return SearchRunResponse(
        execution_id=execution.id,
        search_id=search.id,
        status=execution.status,
        message=f"Search completed with status {execution.status}. Discovered {execution.jobs_found} jobs ({execution.jobs_normalized} new, {execution.jobs_deduplicated} duplicates).",
        jobs_discovered=execution.jobs_normalized,
        jobs_deduplicated=execution.jobs_deduplicated
    )


@router.get("/{search_id}/executions", response_model=List[SearchExecutionResponse])
async def list_search_executions(
    search_id: str,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    # Verify search exists
    search_res = await db.execute(
        select(JobSearch).where(JobSearch.id == search_id, JobSearch.candidate_id == candidate.id)
    )
    if not search_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Search configuration not found")

    stmt = (
        select(SearchExecution)
        .where(SearchExecution.search_id == search_id)
        .order_by(desc(SearchExecution.started_at))
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/executions/{execution_id}", response_model=SearchExecutionResponse)
async def get_execution_detail(
    execution_id: str,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    stmt = select(SearchExecution).where(
        SearchExecution.id == execution_id,
        SearchExecution.candidate_id == candidate.id
    )
    result = await db.execute(stmt)
    exec_record = result.scalar_one_or_none()
    if not exec_record:
        raise HTTPException(status_code=404, detail="Execution record not found")
    return exec_record
