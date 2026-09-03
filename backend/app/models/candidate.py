from typing import List, Optional
from sqlalchemy import String, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, UUIDMixin, TimestampMixin


class CandidateProfile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "candidate_profiles"

    full_name: Mapped[str] = mapped_column(String(150), default="")
    email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    headline: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Target preferences
    target_roles: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    preferred_locations: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    workplace_types: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    min_salary: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    target_salary: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    
    # Experience & Education background
    years_of_experience: Mapped[int] = mapped_column(Integer, default=0)
    education_level: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default=None)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Relationships
    skills: Mapped[List["CandidateSkill"]] = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    applications: Mapped[List["Application"]] = relationship("Application", back_populates="candidate", cascade="all, delete-orphan") # noqa: F821
    resumes: Mapped[List["Resume"]] = relationship("Resume", back_populates="candidate", cascade="all, delete-orphan") # noqa: F821
    searches: Mapped[List["JobSearch"]] = relationship("JobSearch", back_populates="candidate", cascade="all, delete-orphan") # noqa: F821
    saved_jobs: Mapped[List["SavedJob"]] = relationship("SavedJob", back_populates="candidate", cascade="all, delete-orphan") # noqa: F821
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="candidate", cascade="all, delete-orphan", order_by="Notification.created_at.desc()") # noqa: F821


class CandidateSkill(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "candidate_skills"

    candidate_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidate_profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), index=True, nullable=False)
    
    proficiency_level: Mapped[str] = mapped_column(String(50), default="Intermediate") # Beginner, Intermediate, Advanced, Expert
    years_experience: Mapped[int] = mapped_column(Integer, default=1)
    is_top_skill: Mapped[bool] = mapped_column(default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    candidate: Mapped["CandidateProfile"] = relationship("CandidateProfile", back_populates="skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="candidate_skills") # noqa: F821
