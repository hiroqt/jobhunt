from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class SourcePolicy(BaseModel):
    allowed: bool = True
    requires_auth: bool = False
    max_requests_per_minute: int = 60
    supports_search: bool = True
    supports_details: bool = True
    supports_pagination: bool = True
    description: str = ""


class SourceHealth(BaseModel):
    source_name: str
    status: str = "HEALTHY" # HEALTHY, DEGRADED, UNAVAILABLE
    latency_ms: float = 0.0
    last_checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message: Optional[str] = None


class JobSearchQuery(BaseModel):
    keywords: List[str] = Field(default_factory=list)
    locations: List[str] = Field(default_factory=list)
    remote_types: List[str] = Field(default_factory=list)
    employment_types: List[str] = Field(default_factory=list)
    experience_levels: List[str] = Field(default_factory=list)
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "USD"
    posted_within: str = "24_HOURS"
    limit: int = 20


class RawJob(BaseModel):
    external_id: Optional[str] = None
    source: str
    title: str
    company: str
    location: Optional[str] = None
    url: str
    workplace_type: Optional[str] = "Remote"
    employment_type: Optional[str] = "Full-time"
    experience_level: Optional[str] = "Junior"
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: Optional[str] = "USD"
    description: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    posted_at: Optional[datetime] = None
    raw_data: Optional[Dict[str, Any]] = None


class NormalizedJobData(BaseModel):
    external_id: Optional[str] = None
    source: str
    title: str
    company: str
    location: Optional[str] = None
    url: str
    canonical_url: str
    workplace_type: str = "Remote"
    employment_type: str = "Full-time"
    experience_level: Optional[str] = "Junior"
    min_years_experience: int = 0
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "USD"
    raw_description: str = ""
    summary: str = ""
    skills: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    benefits: List[str] = Field(default_factory=list)
    is_active: bool = True
    link_status: str = "ACTIVE" # ACTIVE, EXPIRED, SEARCH_QUERY, DEGRADED
    link_type: str = "DIRECT" # DIRECT, SEARCH_QUERY, CAREERS_PAGE
    search_url: Optional[str] = None
    posted_at: Optional[datetime] = None
    
    # Verification and Data Integrity tracking
    verification_status: str = "UNVERIFIED"
    verification_confidence: Optional[float] = None
    verified_at: Optional[datetime] = None
    raw_data: Optional[Dict[str, Any]] = None


class JobSourceAdapter(ABC):
    """
    Abstract interface for all independent job source adapters.
    Ensures source logic is strictly decoupled from the core application.
    """

    @abstractmethod
    def get_source_name(self) -> str:
        """Unique lowercase identifier e.g. 'linkedin', 'indeed', 'jobstreet', 'remoteok'"""
        pass

    @abstractmethod
    def get_display_name(self) -> str:
        """Human-readable display name e.g. 'LinkedIn'"""
        pass

    @abstractmethod
    def get_policy(self) -> SourcePolicy:
        """Source policy and capability configuration"""
        pass

    @abstractmethod
    async def validate_configuration(self) -> bool:
        """Validate credentials / environment setup for this provider"""
        pass

    @abstractmethod
    async def search(self, query: JobSearchQuery) -> List[RawJob]:
        """Execute search on the job source and return raw listings"""
        pass

    @abstractmethod
    def normalize(self, raw_job: RawJob) -> NormalizedJobData:
        """Transform source-specific raw listing into canonical representation"""
        pass

    @abstractmethod
    async def health_check(self) -> SourceHealth:
        """Run health check against the provider endpoint"""
        pass
