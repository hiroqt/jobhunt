from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class NotificationResponse(BaseModel):
    id: str
    candidate_id: str
    type: str # HIGH_MATCH, SEARCH_COMPLETED, INTERVIEW_REMINDER, FOLLOW_UP_DUE, SYSTEM
    title: str
    message: str
    data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
    total_count: int


class NotificationUpdate(BaseModel):
    read: Optional[bool] = True
