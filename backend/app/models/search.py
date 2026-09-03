from typing import List, Optional
from datetime import datetime
from sqlalchemy import String, Integer, Text, ForeignKey, JSON, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, UUIDMixin, TimestampMixin, utc_now


class JobSearch(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "job_searches"

    candidate_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidate_profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    
    # Supported sources: e.g. ["linkedin", "indeed", "jobstreet", "remoteok", "public"]
    sources: Mapped[List[str]] = mapped_column(JSON, default=lambda: ["linkedin", "indeed", "remoteok"])
    
    # Search filters
    keywords: Mapped[List[str]] = mapped_column(JSON, default=list)
    locations: Mapped[List[str]] = mapped_column(JSON, default=list)
    remote_types: Mapped[List[str]] = mapped_column(JSON, default=lambda: ["Remote"]) # Remote, Hybrid, Onsite
    employment_types: Mapped[List[str]] = mapped_column(JSON, default=lambda: ["Full-time"]) # Full-time, Contract, Part-time, Internship
    experience_levels: Mapped[List[str]] = mapped_column(JSON, default=lambda: ["Junior", "Entry Level"]) # Entry Level, Junior, Mid, Senior
    
    salary_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    
    posted_within: Mapped[str] = mapped_column(String(50), default="24_HOURS") # 24_HOURS, 7_DAYS, 30_DAYS, ANY
    industries: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    companies: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    excluded_keywords: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    schedule_frequency: Mapped[str] = mapped_column(String(50), default="MANUAL") # MANUAL, HOURLY, DAILY, WEEKLY
    
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    candidate: Mapped["CandidateProfile"] = relationship("CandidateProfile", back_populates="searches") # noqa: F821
    executions: Mapped[List["SearchExecution"]] = relationship("SearchExecution", back_populates="search", cascade="all, delete-orphan", order_by="SearchExecution.started_at.desc()")
    jobs: Mapped[List["Job"]] = relationship("Job", back_populates="search") # noqa: F821


class SearchExecution(Base, UUIDMixin):
    __tablename__ = "search_executions"

    search_id: Mapped[str] = mapped_column(String(36), ForeignKey("job_searches.id", ondelete="CASCADE"), index=True, nullable=False)
    candidate_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidate_profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    
    # Status: QUEUED, RUNNING, COMPLETED, PARTIAL_SUCCESS, FAILED
    status: Mapped[str] = mapped_column(String(50), default="QUEUED", index=True)
    
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    jobs_found: Mapped[int] = mapped_column(Integer, default=0)
    jobs_normalized: Mapped[int] = mapped_column(Integer, default=0)
    jobs_deduplicated: Mapped[int] = mapped_column(Integer, default=0)
    jobs_failed: Mapped[int] = mapped_column(Integer, default=0)
    
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logs: Mapped[Optional[List[dict]]] = mapped_column(JSON, default=list)

    # Relationships
    search: Mapped["JobSearch"] = relationship("JobSearch", back_populates="executions")
    candidate: Mapped["CandidateProfile"] = relationship("CandidateProfile") # noqa: F821


class SavedJob(Base, UUIDMixin):
    __tablename__ = "saved_jobs"

    candidate_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidate_profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), index=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    candidate: Mapped["CandidateProfile"] = relationship("CandidateProfile", back_populates="saved_jobs") # noqa: F821
    job: Mapped["Job"] = relationship("Job", back_populates="saved_jobs") # noqa: F821
