from enum import Enum
from typing import Optional, Dict, Any, List
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


class FreshnessClassification(str, Enum):
    FRESH = "FRESH"       # < 7 days
    RECENT = "RECENT"     # 7-14 days
    STALE = "STALE"       # 14-30 days
    UNKNOWN = "UNKNOWN"   # Missing reliable timestamp
    EXPIRED = "EXPIRED"   # Confirmed closed


class FieldCertainty(str, Enum):
    VERIFIED = "VERIFIED"  # >= 0.90
    LIKELY = "LIKELY"      # 0.75 - 0.89
    INFERRED = "INFERRED"  # 0.50 - 0.74
    UNKNOWN = "UNKNOWN"    # < 0.50


class JobFieldEvidence(BaseModel):
    field_name: str
    extracted_value: Any
    source_layer: str  # "JSON_LD", "OPENGRAPH", "DOM_SELECTOR", "PLAYWRIGHT", "AI_SEMANTIC", "REGEX_FALLBACK"
    confidence: float = 0.0
    evidence_text: Optional[str] = None
    field_certainty: FieldCertainty = FieldCertainty.UNKNOWN


class JobTrustScore(BaseModel):
    source_authority: float = Field(default=0.85, ge=0.0, le=1.0)
    identity_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    content_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    freshness_confidence: float = Field(default=0.6, ge=0.0, le=1.0)
    availability_confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    overall_trust_score: float = Field(default=0.0, ge=0.0, le=1.0)
    trust_grade: str = "PROVISIONAL"  # HIGH_TRUST, VERIFIED, PROVISIONAL, SUSPICIOUS
    freshness_classification: FreshnessClassification = FreshnessClassification.UNKNOWN


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
    trust_score: JobTrustScore = Field(default_factory=JobTrustScore)
    field_evidence: List[JobFieldEvidence] = Field(default_factory=list)
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reason: str = ""
    error: Optional[str] = None
