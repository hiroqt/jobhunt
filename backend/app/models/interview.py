from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, Integer, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, UUIDMixin, TimestampMixin


class Interview(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "interviews"

    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), index=True, nullable=False)
    
    # Stage: Recruiter Screening, HR Interview, Technical Interview, Coding Assessment, System Design, Behavioral, Final Round
    round_name: Mapped[str] = mapped_column(String(100), default="Technical Interview")
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    interviewers: Mapped[Optional[str]] = mapped_column(String(255), nullable=True) # Names & Titles
    meeting_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Prep & Questions
    topics_covered: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    prep_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    questions_asked: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    debrief_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Evaluation
    confidence_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # 1-5
    outcome: Mapped[Optional[str]] = mapped_column(String(50), default="PENDING") # PENDING, PASSED, FAILED, RESCHEDULED, CANCELLED

    # Relationships
    application: Mapped["Application"] = relationship("Application", back_populates="interviews") # noqa: F821
