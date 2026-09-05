from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class SkillMatchDetail(BaseModel):
    skill_name: str
    is_required: bool
    candidate_has: bool
    candidate_proficiency: Optional[str] = None
    candidate_years: int = 0
    status: str = Field(..., description="MATCH, PARTIAL, MISSING")
    tier: str = Field(default="REQUIRED", description="CRITICAL, REQUIRED, PREFERRED, BONUS")


class MatchBreakdown(BaseModel):
    technical_skills_score: float = Field(..., ge=0, le=100)  # 35%
    role_compatibility_score: float = Field(..., ge=0, le=100)  # 25%
    experience_score: float = Field(..., ge=0, le=100)  # 15%
    education_score: float = Field(..., ge=0, le=100)  # 10%
    location_score: float = Field(..., ge=0, le=100)  # 10%
    other_score: float = Field(..., ge=0, le=100)  # 5%
    eligibility_status: str = Field(default="ELIGIBLE", description="ELIGIBLE or FAILED_CRITICAL_CONSTRAINT")
    critical_constraint_failed: bool = False
    hard_requirement_reason: Optional[str] = None


class MatchResult(BaseModel):
    job_id: str
    candidate_id: str
    overall_score: int = Field(..., ge=0, le=100)
    recommendation: str = Field(..., description="APPLY, REVIEW, SKIP")
    summary: str
    qualification_fit: Optional[str] = None  # Replaces coarse "ATS callback probability"
    eligibility_status: str = "ELIGIBLE"
    breakdown: MatchBreakdown
    skills_detail: List[SkillMatchDetail] = Field(default_factory=list)
    matched_skills: List[str] = Field(default_factory=list)
    missing_critical_skills: List[str] = Field(default_factory=list)
    missing_preferred_skills: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    actionable_advice: List[str] = Field(default_factory=list)
