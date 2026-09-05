from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class JobSkillInfo(BaseModel):
    name: str
    category: str = "General"
    is_required: bool = True
    tier: str = "REQUIRED"  # CRITICAL, REQUIRED, PREFERRED, BONUS
    years_required: int = 0


class JobBase(BaseModel):
    url: Optional[str] = None
    canonical_url: Optional[str] = None
    application_url: Optional[str] = None
    redirect_chain: List[str] = Field(default_factory=list)
    content_hash: Optional[str] = None
    external_id: Optional[str] = None
    source: str = "Manual"
    search_id: Optional[str] = None
    group_id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=200)
    company: str = Field(..., min_length=1, max_length=200)
    location: Optional[str] = None
    workplace_type: str = "Remote"
    employment_type: str = "Full-time"
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "USD"
    experience_level: Optional[str] = None
    min_years_experience: Optional[int] = 0
    education_requirement: Optional[str] = None
    raw_description: Optional[str] = None
    summary: Optional[str] = None
    responsibilities: List[str] = Field(default_factory=list)
    benefits: List[str] = Field(default_factory=list)
    is_saved: bool = False
    
    # Link liveness & verification status
    is_active: bool = True
    link_status: str = "ACTIVE" # ACTIVE, EXPIRED, SEARCH_QUERY, DEGRADED
    link_type: str = "DIRECT" # DIRECT, SEARCH_QUERY, CAREERS_PAGE
    search_url: Optional[str] = None
    last_checked_at: Optional[datetime] = None
    posted_at: Optional[datetime] = None
    
    # Verification and Data Integrity fields
    verification_status: str = "UNVERIFIED" # VERIFIED, UNVERIFIED, INVALID, FAILED, EXPIRED, REMOVED
    verification_confidence: Optional[float] = None
    trust_score: Optional[float] = None
    trust_grade: Optional[str] = "PROVISIONAL"
    verified_at: Optional[datetime] = None
    discovered_at: Optional[datetime] = None
    first_seen_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    last_changed_at: Optional[datetime] = None
    field_evidence_data: List[Dict[str, Any]] = Field(default_factory=list)


class JobCreate(JobBase):
    skills: List[JobSkillInfo] = Field(default_factory=list)


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    workplace_type: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: Optional[str] = None
    experience_level: Optional[str] = None
    min_years_experience: Optional[int] = None
    education_requirement: Optional[str] = None
    summary: Optional[str] = None
    responsibilities: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    is_saved: Optional[bool] = None
    is_active: Optional[bool] = None
    link_status: Optional[str] = None
    link_type: Optional[str] = None
    search_url: Optional[str] = None
    verification_status: Optional[str] = None
    verification_confidence: Optional[float] = None
    trust_score: Optional[float] = None
    trust_grade: Optional[str] = None
    verified_at: Optional[datetime] = None


class JobExtractRequest(BaseModel):
    url: Optional[str] = None
    raw_text: Optional[str] = None
    provider: Optional[str] = None # gemini, nvidia, glm, groq, openai, fallback


class JobResponse(JobBase):
    id: str
    match_score: Optional[int] = None
    recommendation: Optional[str] = None
    eligibility_status: Optional[str] = "ELIGIBLE"
    match_summary: Optional[str] = None
    matched_skills: List[str] = Field(default_factory=list)
    missing_critical_skills: List[str] = Field(default_factory=list)
    missing_preferred_skills: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LinkVerificationResponse(BaseModel):
    job_id: str
    url: Optional[str] = None
    canonical_url: Optional[str] = None
    application_url: Optional[str] = None
    is_active: bool = True
    link_status: str = "ACTIVE"
    link_type: str = "DIRECT"
    search_url: Optional[str] = None
    search_fallback_url: Optional[str] = None
    status_code: Optional[int] = None
    checked_at: Optional[datetime] = None
    last_checked_at: Optional[datetime] = None
    message: Optional[str] = None
    trust_score: Optional[float] = None
    trust_grade: Optional[str] = None
