from typing import Optional
from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, UUIDMixin, TimestampMixin


class FollowUp(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "follow_ups"

    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), index=True, nullable=False)
    
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    follow_up_type: Mapped[str] = mapped_column(String(50), default="Application Status Check") # Day 5 Check, Day 10 Check, Post-Interview Thank You, Custom
    
    recipient_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    recipient_email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    
    email_subject: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email_body_template: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    application: Mapped["Application"] = relationship("Application", back_populates="follow_ups") # noqa: F821
