from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class InterviewBase(BaseModel):
    application_id: str
    round_name: str = Field(default="Technical Interview", max_length=100)
    scheduled_at: Optional[datetime] = None
    interviewers: Optional[str] = None
    meeting_link: Optional[str] = None
    topics_covered: List[str] = Field(default_factory=list)
    prep_notes: Optional[str] = None
    questions_asked: List[str] = Field(default_factory=list)
    debrief_notes: Optional[str] = None
    confidence_rating: Optional[int] = Field(default=None, ge=1, le=5)
    outcome: str = Field(default="PENDING", description="PENDING, PASSED, FAILED, RESCHEDULED, CANCELLED")


class InterviewCreate(InterviewBase):
    pass


class InterviewUpdate(BaseModel):
    round_name: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    interviewers: Optional[str] = None
    meeting_link: Optional[str] = None
    topics_covered: Optional[List[str]] = None
    prep_notes: Optional[str] = None
    questions_asked: Optional[List[str]] = None
    debrief_notes: Optional[str] = None
    confidence_rating: Optional[int] = None
    outcome: Optional[str] = None


class InterviewResponse(InterviewBase):
    id: str
    created_at: datetime
    updated_at: datetime
    job_title: Optional[str] = None
    company_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
