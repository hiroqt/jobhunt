from typing import List, Optional
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, UUIDMixin, TimestampMixin


class Skill(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "skills"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(50), index=True, default="General") # Frontend, Backend, Database, DevOps, Cloud, AI, Security, Soft Skills
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    synonyms: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Comma-separated or JSON list of synonyms for normalization

    # Relationships
    candidate_skills: Mapped[List["CandidateSkill"]] = relationship("CandidateSkill", back_populates="skill", cascade="all, delete-orphan") # noqa: F821
    job_skills: Mapped[List["JobSkill"]] = relationship("JobSkill", back_populates="skill", cascade="all, delete-orphan") # noqa: F821
