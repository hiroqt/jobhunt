from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from backend.app.schemas.job import JobCreate
from backend.app.schemas.ai import InterviewPrepResponse, ResumeTailorResponse, FollowUpEmailGenResponse


class BaseAIProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the AI provider (e.g. 'gemini', 'nvidia', 'glm', 'groq', 'openai', 'fallback')"""
        pass

    @abstractmethod
    async def extract_job_information(self, raw_text: str, source_url: Optional[str] = None) -> JobCreate:
        """Extracts structured job posting fields (title, company, required/preferred skills, etc.) from raw text"""
        pass

    @abstractmethod
    async def generate_interview_prep(
        self,
        job_title: str,
        company: str,
        job_description: str,
        candidate_summary: Optional[str] = None
    ) -> InterviewPrepResponse:
        """Generates role-specific technical & behavioral interview questions with STAR answers"""
        pass

    @abstractmethod
    async def tailor_resume(
        self,
        job_title: str,
        company: str,
        job_description: str,
        candidate_resume_text: str
    ) -> ResumeTailorResponse:
        """Generates tailored resume bullet points and cover letter draft"""
        pass

    @abstractmethod
    async def generate_follow_up_email(
        self,
        job_title: str,
        company: str,
        candidate_name: str,
        email_type: str,
        interviewer_name: Optional[str] = None,
        notes: Optional[str] = None
    ) -> FollowUpEmailGenResponse:
        """Generates a professional follow-up or post-interview thank you email"""
        pass

    @abstractmethod
    async def parse_resume_data(self, raw_resume_text: str) -> "ParsedResumeProfile":
        """Extracts candidate profile fields, education, experience, and categorized skills from a resume text"""
        pass
