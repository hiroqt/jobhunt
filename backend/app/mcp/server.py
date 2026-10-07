"""
FastMCP Server for Job Hunt Pipeline.

Provides the FastMCP server instance and registers the 8 core tools
with strong guardrails for discovering, evaluating, and tracking jobs.
"""

from typing import Any, Dict, List, Optional

try:
    from mcp.server.fastmcp import FastMCP
except (ImportError, ModuleNotFoundError):
    # mcp 2.x compatibility fallback
    from mcp.server.mcpserver import MCPServer as FastMCP

from backend.app.mcp.tools import (
    get_candidate_profile as _get_candidate_profile,
    search_jobs as _search_jobs,
    extract_job_url as _extract_job_url,
    score_job_match as _score_job_match,
    save_job_to_pipeline as _save_job_to_pipeline,
    update_application_stage as _update_application_stage,
    generate_interview_prep as _generate_interview_prep,
    generate_followup_email as _generate_followup_email,
)

mcp_server = FastMCP(
    "job-hunt-pipeline",
    instructions="Job Hunt Pipeline MCP Server for discovering, evaluating, and tracking jobs with strong guardrails.",
)


@mcp_server.tool()
async def get_candidate_profile(candidate_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetches target roles, preferred locations, workplace types, salary targets,
    and top skills from CandidateProfile/CandidateSkill.
    """
    return await _get_candidate_profile(candidate_id=candidate_id)


@mcp_server.tool()
async def search_jobs(
    query: str,
    location: Optional[str] = None,
    remote_only: bool = False,
    limit: int = 10,
) -> Dict[str, Any]:
    """
    Queries job listings using discovery orchestrator or existing database jobs.
    """
    return await _search_jobs(
        query=query,
        location=location,
        remote_only=remote_only,
        limit=limit,
    )


@mcp_server.tool()
async def extract_job_url(url: str) -> Dict[str, Any]:
    """
    Ingests external job URL, extracts content using HTML extractor / selectolax,
    runs PromptInjectionGuardrail.sanitize_untrusted_content, and extracts requirements.
    """
    return await _extract_job_url(url=url)


@mcp_server.tool()
async def score_job_match(
    job_title: str,
    company: str,
    description: str,
    skills_required: Optional[List[str]] = None,
    candidate_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Runs deterministic qualification scoring (technical skills 35%, role compatibility 25%,
    experience 15%, education 10%, workplace 10%, salary 5%) and returns score breakdown
    and decision badge (APPLY, REVIEW, SKIP).
    """
    return await _score_job_match(
        job_title=job_title,
        company=company,
        description=description,
        skills_required=skills_required,
        candidate_id=candidate_id,
    )


@mcp_server.tool()
async def save_job_to_pipeline(job_data: dict, confirm: bool = False) -> Dict[str, Any]:
    """
    Applies TieredPermissionGuardrail (confirm=True). If confirm=False, returns a dry-run preview.
    If True, saves job and creates Application in SAVED status.
    """
    return await _save_job_to_pipeline(job_data=job_data, confirm=confirm)


@mcp_server.tool()
async def update_application_stage(
    application_id: str,
    new_stage: str,
    notes: Optional[str] = None,
    confirm: bool = False,
) -> Dict[str, Any]:
    """
    Validates stage (saved, applied, screening, technical_round, final_round, offer, rejected),
    applies confirm=True guardrail. Returns dry run or updated application.
    """
    return await _update_application_stage(
        application_id=application_id,
        new_stage=new_stage,
        notes=notes,
        confirm=confirm,
    )


@mcp_server.tool()
async def generate_interview_prep(
    role_title: str,
    company: str,
    job_description: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generates role-tailored technical questions, STAR behavioral frameworks,
    and smart questions for the candidate to ask interviewers.
    """
    return await _generate_interview_prep(
        role_title=role_title,
        company=company,
        job_description=job_description,
    )


@mcp_server.tool()
async def generate_followup_email(
    application_id: Optional[str] = None,
    company: str = "Company",
    role_title: str = "Developer",
    days_since_applied: int = 5,
) -> Dict[str, Any]:
    """
    Calculates cadence recommendations (Day 5 / Day 10) and generates professional follow-up email drafts.
    """
    return await _generate_followup_email(
        application_id=application_id,
        company=company,
        role_title=role_title,
        days_since_applied=days_since_applied,
    )


if __name__ == "__main__":
    mcp_server.run(transport="stdio")
