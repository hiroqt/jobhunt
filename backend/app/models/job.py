from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import String, Integer, Text, ForeignKey, JSON, Boolean, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, UUIDMixin, TimestampMixin, utc_now


class JobPostingGroup(Base, UUIDMixin, TimestampMixin):
    """
    Represents a logical job opportunity that aggregates multi-board cross-postings.
    """
    __tablename__ = "job_posting_groups"

    canonical_title: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    canonical_company: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    primary_application_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    jobs: Mapped[List["Job"]] = relationship("Job", back_populates="group")


class Job(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "jobs"

    url: Mapped[Optional[str]] = mapped_column(String(500), index=True, nullable=True)
    canonical_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    application_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    redirect_chain: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    content_hash: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    
    external_id: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    source: Mapped[str] = mapped_column(String(100), default="Manual") # LinkedIn, JobStreet, Indeed, RemoteOK, Greenhouse, Lever, Manual
    search_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("job_searches.id", ondelete="SET NULL"), nullable=True)
    group_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("job_posting_groups.id", ondelete="SET NULL"), nullable=True)
    
    title: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    company: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, default=None)
    workplace_type: Mapped[str] = mapped_column(String(50), default="Remote") # Remote, Hybrid, Onsite
    employment_type: Mapped[str] = mapped_column(String(50), default="Full-time") # Full-time, Contract, Part-time, Internship
    
    salary_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    
    experience_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default=None) # Entry / Junior, Mid, Senior
    min_years_experience: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    education_requirement: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    raw_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    responsibilities: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    benefits: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    
    # Match Engine Output (cached against candidate profile)
    match_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # 0-100
    recommendation: Mapped[Optional[str]] = mapped_column(String(20), nullable=True) # APPLY, REVIEW, SKIP
    eligibility_status: Mapped[str] = mapped_column(String(50), default="ELIGIBLE") # ELIGIBLE, FAILED_CRITICAL_CONSTRAINT
    match_summary: Mapped[Optional[Text]] = mapped_column(Text, nullable=True)
    matched_skills: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    missing_critical_skills: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    missing_preferred_skills: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    
    is_saved: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Live URL & Status Tracking
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    link_status: Mapped[str] = mapped_column(String(50), default="ACTIVE") # ACTIVE, EXPIRED, SEARCH_QUERY, DEGRADED
    link_type: Mapped[str] = mapped_column(String(50), default="DIRECT") # DIRECT, SEARCH_QUERY, CAREERS_PAGE
    search_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    last_checked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    posted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)

    # Job Verification & Integrity Tracking (V3.0 Multi-Dimensional Trust Score)
    verification_status: Mapped[str] = mapped_column(String(50), default="UNVERIFIED", index=True) # VERIFIED, UNVERIFIED, INVALID, FAILED, EXPIRED, REMOVED
    verification_confidence: Mapped[Optional[float]] = mapped_column(nullable=True) # 0.0 to 1.0
    trust_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # 0.0 to 1.0
    trust_grade: Mapped[Optional[str]] = mapped_column(String(50), default="PROVISIONAL") # HIGH_TRUST, VERIFIED, PROVISIONAL, SUSPICIOUS
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    discovered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    first_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_changed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    field_evidence_data: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, default=list)

    # Relationships
    group: Mapped[Optional["JobPostingGroup"]] = relationship("JobPostingGroup", back_populates="jobs")
    skills: Mapped[List["JobSkill"]] = relationship("JobSkill", back_populates="job", cascade="all, delete-orphan")
    snapshots: Mapped[List["JobSourceSnapshot"]] = relationship("JobSourceSnapshot", back_populates="job", cascade="all, delete-orphan")
    changes: Mapped[List["JobChange"]] = relationship("JobChange", back_populates="job", cascade="all, delete-orphan")
    applications: Mapped[List["Application"]] = relationship("Application", back_populates="job", cascade="all, delete-orphan") # noqa: F821
    search: Mapped[Optional["JobSearch"]] = relationship("JobSearch", back_populates="jobs") # noqa: F821
    saved_jobs: Mapped[List["SavedJob"]] = relationship("SavedJob", back_populates="job", cascade="all, delete-orphan") # noqa: F821


class JobSkill(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "job_skills"

    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), index=True, nullable=False)
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), index=True, nullable=False)
    
    is_required: Mapped[bool] = mapped_column(Boolean, default=True) # Must-have vs Nice-to-have
    tier: Mapped[str] = mapped_column(String(50), default="REQUIRED") # CRITICAL, REQUIRED, PREFERRED, BONUS
    years_required: Mapped[int] = mapped_column(Integer, default=0)
    importance_weight: Mapped[int] = mapped_column(Integer, default=1) # 1-5 weighting

    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="job_skills") # noqa: F821


class JobSourceSnapshot(Base, UUIDMixin, TimestampMixin):
    """
    Immutable raw snapshot of a job page at a specific fetch run.
    """
    __tablename__ = "job_source_snapshots"

    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), index=True, nullable=False)
    raw_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    final_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    redirect_chain: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    http_status: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    content_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    raw_payload_ref: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    headers_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="snapshots")


class JobChange(Base, UUIDMixin, TimestampMixin):
    """
    Logs timestamped changes to job attributes over time (e.g. salary changes).
    """
    __tablename__ = "job_changes"

    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), index=True, nullable=False)
    change_type: Mapped[str] = mapped_column(String(50), nullable=False) # SALARY_CHANGED, REQUIREMENTS_UPDATED, STATUS_CHANGED
    previous_value: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    new_value: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="changes")
