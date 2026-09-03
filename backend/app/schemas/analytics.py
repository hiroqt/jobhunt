from typing import List, Dict, Any
from pydantic import BaseModel, Field


class FunnelStageMetric(BaseModel):
    stage: str
    count: int
    conversion_rate_pct: float


class SkillGapFrequency(BaseModel):
    skill_name: str
    category: str
    missing_count: int
    percentage_of_rejections: float
    learning_recommendation: str


class SourceMetric(BaseModel):
    source: str
    applications_count: int
    interviews_count: int
    offers_count: int
    interview_rate_pct: float


class DashboardOverview(BaseModel):
    total_applications: int
    active_applications: int
    interviews_scheduled: int
    follow_ups_due: int
    offers_received: int
    response_rate_pct: float
    interview_conversion_rate_pct: float
    average_match_score: float
    recent_activity_count: int
    funnel: List[FunnelStageMetric] = Field(default_factory=list)
    top_skill_gaps: List[SkillGapFrequency] = Field(default_factory=list)
    source_breakdown: List[SourceMetric] = Field(default_factory=list)
