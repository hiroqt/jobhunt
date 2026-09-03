from typing import List, Optional
from datetime import datetime
from sqlalchemy import String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, UUIDMixin, TimestampMixin, utc_now


class Application(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "applications"

    candidate_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidate_profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), index=True, nullable=False)
    resume_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True) # noqa: F821
    
    # Kanban Stages: SAVED, QUALIFIED, APPLIED, APPLICATION_VIEWED, RECRUITER_CONTACTED, HR_SCREENING, TECHNICAL_INTERVIEW, FINAL_INTERVIEW, OFFER, REJECTED, WITHDRAWN, ARCHIVED
    status: Mapped[str] = mapped_column(String(50), default="SAVED", index=True)
    
    applied_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    salary_offered: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Contacts & Custom notes
    recruiter_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    recruiter_email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_cover_letter: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    candidate: Mapped["CandidateProfile"] = relationship("CandidateProfile", back_populates="applications") # noqa: F821
    job: Mapped["Job"] = relationship("Job", back_populates="applications") # noqa: F821
    resume: Mapped[Optional["Resume"]] = relationship("Resume", back_populates="applications") # noqa: F821
    timeline: Mapped[List["ApplicationTimeline"]] = relationship("ApplicationTimeline", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationTimeline.created_at.desc()")
    interviews: Mapped[List["Interview"]] = relationship("Interview", back_populates="application", cascade="all, delete-orphan", order_by="Interview.scheduled_at.asc()") # noqa: F821
    follow_ups: Mapped[List["FollowUp"]] = relationship("FollowUp", back_populates="application", cascade="all, delete-orphan", order_by="FollowUp.due_date.asc()") # noqa: F821
    feedback: Mapped[Optional["ApplicationFeedback"]] = relationship("ApplicationFeedback", back_populates="application", uselist=False, cascade="all, delete-orphan") # noqa: F821


class ApplicationTimeline(Base, UUIDMixin):
    __tablename__ = "application_timelines"

    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), index=True, nullable=False)
    previous_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    application: Mapped["Application"] = relationship("Application", back_populates="timeline")
