from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class SkillBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(default="General", max_length=50)
    description: Optional[str] = None
    synonyms: Optional[str] = None


class SkillCreate(SkillBase):
    pass


class SkillUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    synonyms: Optional[str] = None


class SkillResponse(SkillBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateSkillBase(BaseModel):
    skill_id: Optional[str] = None
    skill_name: Optional[str] = None
    skill_category: Optional[str] = None
    proficiency_level: str = Field(default="Intermediate", description="Beginner, Intermediate, Advanced, Expert")
    years_experience: int = Field(default=1, ge=0)
    is_top_skill: bool = False
    notes: Optional[str] = None


class CandidateSkillCreate(CandidateSkillBase):
    pass



class CandidateSkillResponse(CandidateSkillBase):
    id: str
    candidate_id: str
    skill_name: Optional[str] = None
    skill_category: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
