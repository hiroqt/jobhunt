from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from backend.app.schemas.job import JobResponse


class TimelineEntryResponse(BaseModel):
    id: str
    application_id: str
    previous_status: Optional[str] = None
    new_status: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationBase(BaseModel):
    job_id: str
    candidate_id: Optional[str] = None
    resume_id: Optional[str] = None
    status: str = Field(default="SAVED", description="SAVED, QUALIFIED, APPLIED, APPLICATION_VIEWED, RECRUITER_CONTACTED, HR_SCREENING, TECHNICAL_INTERVIEW, FINAL_INTERVIEW, OFFER, REJECTED, WITHDRAWN, ARCHIVED")
    applied_date: Optional[datetime] = None
    salary_offered: Optional[int] = None
    recruiter_name: Optional[str] = None
    recruiter_email: Optional[str] = None
    notes: Optional[str] = None
    custom_cover_letter: Optional[str] = None


class ApplicationCreate(BaseModel):
    job_id: str
    resume_id: Optional[str] = None
    status: str = Field(default="SAVED")
    applied_date: Optional[datetime] = None
    salary_offered: Optional[int] = None
    recruiter_name: Optional[str] = None
    recruiter_email: Optional[str] = None
    notes: Optional[str] = None
    custom_cover_letter: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    applied_date: Optional[datetime] = None
    salary_offered: Optional[int] = None


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    resume_id: Optional[str] = None
    applied_date: Optional[datetime] = None
    salary_offered: Optional[int] = None
    recruiter_name: Optional[str] = None
    recruiter_email: Optional[str] = None
    notes: Optional[str] = None
    custom_cover_letter: Optional[str] = None


class ApplicationResponse(ApplicationBase):
    id: str
    created_at: datetime
    updated_at: datetime
    job: Optional[JobResponse] = None
    timeline: List[TimelineEntryResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
