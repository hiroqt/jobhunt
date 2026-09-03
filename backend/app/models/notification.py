from typing import Optional
from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, JSON, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, UUIDMixin, utc_now


class Notification(Base, UUIDMixin):
    __tablename__ = "notifications"

    candidate_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidate_profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    
    # Notification Type: HIGH_MATCH, SEARCH_COMPLETED, INTERVIEW_REMINDER, FOLLOW_UP_DUE, SYSTEM
    type: Mapped[str] = mapped_column(String(50), default="SYSTEM", index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    data: Mapped[Optional[dict]] = mapped_column(JSON, default=dict) # e.g. {"job_id": "...", "match_score": 92}
    read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    candidate: Mapped["CandidateProfile"] = relationship("CandidateProfile", back_populates="notifications") # noqa: F821
