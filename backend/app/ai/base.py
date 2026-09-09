import re
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from backend.app.schemas.job import JobCreate
from backend.app.schemas.ai import (
    InterviewPrepResponse,
    ResumeTailorResponse,
    FollowUpEmailGenResponse,
    CoverLetterGenResponse
)

EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport & map symbols
    "\U0001F1E0-\U0001F1FF"  # flags
    "\U00002702-\U000027B0"  # dingbats
    "\U0001F900-\U0001F9FF"  # supplemental symbols and pictographs
    "\U0001FA70-\U0001FAFF"  # symbols and pictographs extended-a
    "\U00002600-\U000026FF"  # miscellaneous symbols
    "\U0000FE00-\U0000FE0F"  # variation selectors
    "\U00002300-\U000023FF"  # miscellaneous technical
    "\U00002B50-\U00002B55"  # stars & shapes
    "]+",
    flags=re.UNICODE
)


def strip_emojis(text: str) -> str:
    """Removes any emojis, emoticons, and decorative pictographs from text."""
    if not text:
        return ""
    cleaned = EMOJI_PATTERN.sub("", text)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"[ \t]+\n", "\n", cleaned)
    cleaned = re.sub(r"\n[ \t]+", "\n", cleaned)
    cleaned = re.sub(r" ([,\.!\?:;])", r"\1", cleaned)
    return cleaned.strip()



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
    async def generate_cover_letter(
        self,
        job_title: str,
        company: str,
        job_description: str,
        candidate_name: str,
        candidate_summary: str,
        candidate_skills: List[str],
        resume_text: str,
        tone: str = "professional",
        length: str = "standard",
        focus_areas: Optional[List[str]] = None,
        custom_instructions: Optional[str] = None,
        hiring_manager_name: Optional[str] = None
    ) -> CoverLetterGenResponse:
        """Generates a curated, custom, ATS-optimized cover letter tailored to the job description and candidate resume"""
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
