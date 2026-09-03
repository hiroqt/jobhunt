from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class JobSkillInfo(BaseModel):
    name: str
    category: str = "General"
    is_required: bool = True
    years_required: int = 0


class JobBase(BaseModel):
    url: Optional[str] = None
    canonical_url: Optional[str] = None
    source: str = "Manual"
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


class JobExtractRequest(BaseModel):
    url: Optional[str] = None
    raw_text: Optional[str] = None
    provider: Optional[str] = None # gemini, nvidia, glm, groq, openai, fallback


class JobResponse(JobBase):
    id: str
    match_score: Optional[int] = None
    recommendation: Optional[str] = None
    match_summary: Optional[str] = None
    matched_skills: List[str] = Field(default_factory=list)
    missing_critical_skills: List[str] = Field(default_factory=list)
    missing_preferred_skills: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
