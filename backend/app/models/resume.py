from typing import Optional, List
from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, UUIDMixin, TimestampMixin


class Resume(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "resumes"

    candidate_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidate_profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    
    title: Mapped[str] = mapped_column(String(150), default="Master Resume") # Full-Stack Focus, Frontend Focus, Backend Focus
    version_tag: Mapped[str] = mapped_column(String(50), default="v1.0")
    
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    skills: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    experience_bullets: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    project_bullets: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    
    is_primary: Mapped[bool] = mapped_column(default=True)

    # Relationships
    candidate: Mapped["CandidateProfile"] = relationship("CandidateProfile", back_populates="resumes") # noqa: F821
    applications: Mapped[List["Application"]] = relationship("Application", back_populates="resume") # noqa: F821
