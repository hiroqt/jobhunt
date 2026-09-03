from typing import Optional, List
from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, UUIDMixin, TimestampMixin


class ApplicationFeedback(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "application_feedbacks"

    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    
    # Reason category: GHOSTED, RESUME_REJECTION, TECH_ASSESSMENT_FAILED, BEHAVIORAL_REJECTION, BETTER_CANDIDATE_SELECTED, SALARY_MISMATCH, LOCATION_MISMATCH
    outcome_reason: Mapped[str] = mapped_column(String(100), default="GHOSTED")
    raw_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # AI-extracted skill gap insights
    missing_skills: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    weakness_areas: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list) # e.g. ["System Design", "SQL Query Optimization", "Docker Networking"]
    recommended_learning: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    candidate_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    application: Mapped["Application"] = relationship("Application", back_populates="feedback") # noqa: F821
