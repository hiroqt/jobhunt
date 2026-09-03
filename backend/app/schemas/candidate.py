from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from backend.app.schemas.skill import CandidateSkillResponse


class CandidateProfileBase(BaseModel):
    full_name: str = Field(default="", max_length=150)
    email: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    target_roles: List[str] = Field(default_factory=list)
    preferred_locations: List[str] = Field(default_factory=list)
    workplace_types: List[str] = Field(default_factory=list)
    min_salary: int = Field(default=0, ge=0)
    target_salary: int = Field(default=0, ge=0)
    currency: str = Field(default="USD", max_length=10)
    years_of_experience: int = Field(default=0, ge=0)
    education_level: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None



class CandidateProfileCreate(CandidateProfileBase):
    pass


class CandidateProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    target_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    workplace_types: Optional[List[str]] = None
    min_salary: Optional[int] = None
    target_salary: Optional[int] = None
    currency: Optional[str] = None
    years_of_experience: Optional[int] = None
    education_level: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None


class CandidateProfileResponse(CandidateProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime
    skills: List[CandidateSkillResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ParsedResumeSkill(BaseModel):
    name: str
    proficiency_level: str = "Intermediate"
    years_experience: int = 1
    is_top_skill: bool = False


class ParsedResumeProfile(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    target_roles: List[str] = Field(default_factory=list)
    years_of_experience: int = 0
    education_level: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    skills: List[ParsedResumeSkill] = Field(default_factory=list)
