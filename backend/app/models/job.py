from typing import List, Optional
from sqlalchemy import String, Integer, Text, ForeignKey, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, UUIDMixin, TimestampMixin


class Job(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "jobs"

    url: Mapped[Optional[str]] = mapped_column(String(500), index=True, nullable=True)
    canonical_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    source: Mapped[str] = mapped_column(String(100), default="Manual") # LinkedIn, JobStreet, Indeed, Greenhouse, Lever, Manual
    
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
    match_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    matched_skills: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    missing_critical_skills: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    missing_preferred_skills: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)

    # Relationships
    skills: Mapped[List["JobSkill"]] = relationship("JobSkill", back_populates="job", cascade="all, delete-orphan")
    applications: Mapped[List["Application"]] = relationship("Application", back_populates="job", cascade="all, delete-orphan") # noqa: F821


class JobSkill(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "job_skills"

    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), index=True, nullable=False)
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), index=True, nullable=False)
    
    is_required: Mapped[bool] = mapped_column(Boolean, default=True) # Must-have vs Nice-to-have
    years_required: Mapped[int] = mapped_column(Integer, default=0)
    importance_weight: Mapped[int] = mapped_column(Integer, default=1) # 1-5 weighting

    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="job_skills") # noqa: F821
