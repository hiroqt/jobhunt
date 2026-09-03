from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    UNVERIFIED = "UNVERIFIED"
    INVALID = "INVALID"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"
    REMOVED = "REMOVED"
    UNKNOWN = "UNKNOWN"


class IdentityComparison(BaseModel):
    title_similarity: float = 0.0
    company_similarity: float = 0.0
    location_similarity: float = 0.0
    external_id_match: bool = False


class AuthoritativeSourceData(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    external_id: Optional[str] = None
    is_active: bool = True
    status_code: Optional[int] = None
    raw_payload: Optional[Dict[str, Any]] = None


class VerificationResult(BaseModel):
    exists: bool = True
    status: VerificationStatus = VerificationStatus.UNVERIFIED
    confidence: float = 0.0
    canonical_url: str = ""
    external_id: Optional[str] = None
    source_data: AuthoritativeSourceData = Field(default_factory=AuthoritativeSourceData)
    identity: IdentityComparison = Field(default_factory=IdentityComparison)
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reason: str = ""
    error: Optional[str] = None
