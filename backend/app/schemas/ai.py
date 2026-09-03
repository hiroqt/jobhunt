from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class QuestionAndStarGuide(BaseModel):
    question: str
    question_type: str = Field(..., description="TECHNICAL, BEHAVIORAL, SYSTEM_DESIGN, CULTURE")
    difficulty: str = Field(default="Intermediate", description="Junior, Intermediate, Senior")
    concept_tested: str
    star_guidance: Optional[Dict[str, str]] = None # {"Situation": "...", "Task": "...", "Action": "...", "Result": "..."}
    suggested_answer_points: List[str] = Field(default_factory=list)


class InterviewPrepRequest(BaseModel):
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    job_description: Optional[str] = None
    provider: Optional[str] = None # gemini, nvidia, glm, groq, openai, fallback


class InterviewPrepResponse(BaseModel):
    job_title: str
    company: str
    top_technical_questions: List[QuestionAndStarGuide] = Field(default_factory=list)
    top_behavioral_questions: List[QuestionAndStarGuide] = Field(default_factory=list)
    questions_to_ask_interviewer: List[str] = Field(default_factory=list)
    key_topics_to_review: List[str] = Field(default_factory=list)
    ai_provider_used: str


class ResumeTailorRequest(BaseModel):
    job_id: str
    resume_id: Optional[str] = None
    provider: Optional[str] = None


class ResumeTailorResponse(BaseModel):
    job_title: str
    company: str
    suggested_summary: str
    recommended_bullet_adjustments: List[Dict[str, str]] = Field(default_factory=list) # [{"original": "...", "improved": "...", "reason": "..."}]
    targeted_skills_to_highlight: List[str] = Field(default_factory=list)
    cover_letter_draft: str
    ai_provider_used: str


class FollowUpEmailGenRequest(BaseModel):
    application_id: str
    email_type: str = "STATUS_CHECK" # STATUS_CHECK, POST_INTERVIEW_THANK_YOU, OFFER_ACKNOWLEDGEMENT
    interviewer_name: Optional[str] = None
    topics_discussed: Optional[str] = None
    provider: Optional[str] = None


class FollowUpEmailGenResponse(BaseModel):
    subject: str
    body: str
    ai_provider_used: str
