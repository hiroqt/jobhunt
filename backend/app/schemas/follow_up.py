from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class FollowUpBase(BaseModel):
    application_id: str
    due_date: datetime
    follow_up_type: str = Field(default="Application Status Check", max_length=50)
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    email_subject: Optional[str] = None
    email_body_template: Optional[str] = None
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None


class FollowUpCreate(FollowUpBase):
    pass


class FollowUpUpdate(BaseModel):
    due_date: Optional[datetime] = None
    follow_up_type: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    email_subject: Optional[str] = None
    email_body_template: Optional[str] = None
    is_completed: Optional[bool] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None


class FollowUpResponse(FollowUpBase):
    id: str
    created_at: datetime
    updated_at: datetime
    job_title: Optional[str] = None
    company_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
