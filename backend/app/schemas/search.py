from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from backend.app.schemas.job import JobResponse


class JobSearchBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    sources: List[str] = Field(default_factory=lambda: ["linkedin", "jobstreet", "kalibrr", "onlinejobs", "indeed", "remoteok", "bossjob", "philjobnet"])
    keywords: List[str] = Field(default_factory=list)
    locations: List[str] = Field(default_factory=list)
    remote_types: List[str] = Field(default_factory=lambda: ["Remote"])
    employment_types: List[str] = Field(default_factory=lambda: ["Full-time"])
    experience_levels: List[str] = Field(default_factory=lambda: ["Junior", "Entry Level"])
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "USD"
    posted_within: str = "24_HOURS"
    industries: List[str] = Field(default_factory=list)
    companies: List[str] = Field(default_factory=list)
    excluded_keywords: List[str] = Field(default_factory=list)
    enabled: bool = True
    schedule_frequency: str = "MANUAL" # MANUAL, HOURLY, DAILY, WEEKLY


class JobSearchCreate(JobSearchBase):
    pass


class JobSearchUpdate(BaseModel):
    name: Optional[str] = None
    sources: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    remote_types: Optional[List[str]] = None
    employment_types: Optional[List[str]] = None
    experience_levels: Optional[List[str]] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: Optional[str] = None
    posted_within: Optional[str] = None
    industries: Optional[List[str]] = None
    companies: Optional[List[str]] = None
    excluded_keywords: Optional[List[str]] = None
    enabled: Optional[bool] = None
    schedule_frequency: Optional[str] = None


class SearchExecutionResponse(BaseModel):
    id: str
    search_id: str
    candidate_id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    jobs_found: int = 0
    jobs_normalized: int = 0
    jobs_deduplicated: int = 0
    jobs_failed: int = 0
    error: Optional[str] = None
    logs: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class JobSearchResponse(JobSearchBase):
    id: str
    candidate_id: str
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    executions: List[SearchExecutionResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class SearchRunResponse(BaseModel):
    execution_id: str
    search_id: str
    status: str
    message: str
    jobs_discovered: int = 0
    jobs_deduplicated: int = 0


class SavedJobResponse(BaseModel):
    id: str
    candidate_id: str
    job_id: str
    notes: Optional[str] = None
    created_at: datetime
    job: Optional[JobResponse] = None

    model_config = ConfigDict(from_attributes=True)


class SourceInfoResponse(BaseModel):
    source_name: str
    display_name: str
    status: str
    latency_ms: float
    message: Optional[str] = None
    allowed: bool
    requires_auth: bool
    max_requests_per_minute: int
    supports_search: bool
    supports_details: bool
    supports_pagination: bool
    description: str
