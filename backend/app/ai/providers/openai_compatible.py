import json
import re
from typing import Optional, List, Dict, Any
from openai import AsyncOpenAI
from backend.app.ai.base import BaseAIProvider, strip_emojis
from backend.app.schemas.job import JobCreate, JobSkillInfo
from backend.app.schemas.ai import (
    InterviewPrepResponse,
    QuestionAndStarGuide,
    ResumeTailorResponse,
    FollowUpEmailGenResponse,
    CoverLetterGenResponse
)
from backend.app.processing.normalizer import normalize_skill_name, get_skill_category, normalize_currency
from backend.app.processing.source_detector import detect_job_source
from backend.app.core.logging import logger


class OpenAICompatibleProvider(BaseAIProvider):
    def __init__(
        self,
        name: str,
        api_key: Optional[str],
        base_url: Optional[str] = None,
        model: str = "gpt-4o-mini",
        default_headers: Optional[Dict[str, str]] = None
    ):
        self._name = name
        self.api_key = api_key or "mock-key"
        self.base_url = base_url
        self.model = model
        
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            default_headers=default_headers,
            timeout=15.0,
            max_retries=1
        )

    @property
    def provider_name(self) -> str:
        return self._name

    async def extract_job_information(self, raw_text: str, source_url: Optional[str] = None) -> JobCreate:
        system_prompt = """You are an expert technical recruiter and job parser.
Analyze the provided job posting text and extract structured information in JSON format matching this schema:
{
  "title": "Exact job title",
  "company": "Company name",
  "location": "Job location or 'Remote'",
  "workplace_type": "Remote | Hybrid | Onsite",
  "employment_type": "Full-time | Contract | Part-time | Internship",
  "salary_min": null or integer (numeric amount),
  "salary_max": null or integer (numeric amount),
  "currency": "ISO 4217 code (e.g. PHP, USD, SGD, EUR, GBP). Use PHP if posting is in Philippines or uses ₱/Php/Pesos",
  "experience_level": "Entry / Junior | Mid-Level | Senior",
  "min_years_experience": integer (0 for fresh grads/junior),
  "education_requirement": "Degree required or null",
  "summary": "Concise 2-3 sentence overview of the role and mission",
  "responsibilities": ["Top 4-6 key responsibilities as clean strings"],
  "benefits": ["Key benefits/perks mentioned"],
  "required_skills": ["List of mandatory technical and domain skills required"],
  "preferred_skills": ["List of nice-to-have or bonus skills"]
}
Return ONLY pure JSON without markdown code fences or conversational filler."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Extract structured job data from this posting:\n\n{raw_text[:10000]}"}
                ],
                temperature=0.1,
                response_format={"type": "json_object"} if "llama" not in self.model.lower() else None
            )
            
            content = response.choices[0].message.content or "{}"
            # Strip markdown fences if present
            cleaned_json = re.sub(r"^```json\s*", "", content.strip(), flags=re.MULTILINE)
            cleaned_json = re.sub(r"```$", "", cleaned_json.strip(), flags=re.MULTILINE)
            
            data = json.loads(cleaned_json)
            
            skills: List[JobSkillInfo] = []
            for req in data.get("required_skills", []):
                canon = normalize_skill_name(str(req))
                if canon:
                    skills.append(JobSkillInfo(
                        name=canon,
                        category=get_skill_category(canon),
                        is_required=True,
                        years_required=data.get("min_years_experience", 0)
                    ))
                    
            for pref in data.get("preferred_skills", []):
                canon = normalize_skill_name(str(pref))
                if canon and not any(s.name == canon for s in skills):
                    skills.append(JobSkillInfo(
                        name=canon,
                        category=get_skill_category(canon),
                        is_required=False,
                        years_required=0
                    ))

            source = detect_job_source(source_url) if source_url else "Manual"

            return JobCreate(
                url=source_url,
                canonical_url=source_url,
                source=source,
                title=data.get("title", "Software Engineer"),
                company=data.get("company", "Company"),
                location=data.get("location", "Remote"),
                workplace_type=data.get("workplace_type", "Remote"),
                employment_type=data.get("employment_type", "Full-time"),
                salary_min=data.get("salary_min"),
                salary_max=data.get("salary_max"),
                currency=normalize_currency(data.get("currency", "USD")),
                experience_level=data.get("experience_level", "Entry / Junior"),
                min_years_experience=data.get("min_years_experience", 0),
                education_requirement=data.get("education_requirement"),
                raw_description=raw_text,
                summary=data.get("summary", ""),
                responsibilities=data.get("responsibilities", []),
                benefits=data.get("benefits", []),
                skills=skills
            )
        except Exception as e:
            logger.warning(f"Provider {self._name} parsing failed: {e}. Falling back to heuristic parser.")
            from backend.app.ai.providers.fallback import FallbackHeuristicProvider
            return await FallbackHeuristicProvider().extract_job_information(raw_text, source_url)

    async def generate_interview_prep(
        self,
        job_title: str,
        company: str,
        job_description: str,
        candidate_summary: Optional[str] = None
    ) -> InterviewPrepResponse:
        system_prompt = """You are a Principal Engineering Interview Coach.
Generate tailored interview preparation for a candidate applying to this specific job. Return pure JSON with:
{
  "top_technical_questions": [
    {
      "question": "Specific question testing a core requirement of this job",
      "question_type": "TECHNICAL",
      "difficulty": "Junior | Intermediate | Senior",
      "concept_tested": "Name of concept",
      "suggested_answer_points": ["Key point 1", "Key point 2"]
    }
  ],
  "top_behavioral_questions": [
    {
      "question": "Behavioral question tailored to company mission/challenges",
      "question_type": "BEHAVIORAL",
      "difficulty": "Intermediate",
      "concept_tested": "Leadership/Ownership/Conflict",
      "star_guidance": {
        "Situation": "Guidance on what situation to choose",
        "Task": "What the goal should be",
        "Action": "What specific actions to highlight",
        "Result": "What metrics/impact to conclude with"
      },
      "suggested_answer_points": ["Bullet 1", "Bullet 2"]
    }
  ],
  "questions_to_ask_interviewer": ["3 thoughtful, high-signal questions candidate should ask"],
  "key_topics_to_review": ["3 core architectural/coding topics to brush up on"]
}"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Job Title: {job_title}\nCompany: {company}\nDescription:\n{job_description[:6000]}"}
                ],
                temperature=0.3
            )
            content = response.choices[0].message.content or "{}"
            cleaned_json = re.sub(r"^```json\s*", "", content.strip(), flags=re.MULTILINE)
            cleaned_json = re.sub(r"```$", "", cleaned_json.strip(), flags=re.MULTILINE)
            data = json.loads(cleaned_json)
            
            tech_qs = [QuestionAndStarGuide(**q) for q in data.get("top_technical_questions", [])]
            behav_qs = [QuestionAndStarGuide(**q) for q in data.get("top_behavioral_questions", [])]
            
            return InterviewPrepResponse(
                job_title=job_title,
                company=company,
                top_technical_questions=tech_qs,
                top_behavioral_questions=behav_qs,
                questions_to_ask_interviewer=data.get("questions_to_ask_interviewer", []),
                key_topics_to_review=data.get("key_topics_to_review", []),
                ai_provider_used=f"{self._name} ({self.model})"
            )
        except Exception as e:
            logger.warning(f"AI interview prep generation failed on {self._name}: {e}. Using fallback.")
            from backend.app.ai.providers.fallback import FallbackHeuristicProvider
            return await FallbackHeuristicProvider().generate_interview_prep(job_title, company, job_description, candidate_summary)

    async def tailor_resume(
        self,
        job_title: str,
        company: str,
        job_description: str,
        candidate_resume_text: str
    ) -> ResumeTailorResponse:
        system_prompt = """You are an elite career strategist. Analyze the target job and candidate's resume to provide truthful, impactful tailoring suggestions without fabricating experience.
Return pure JSON matching:
{
  "suggested_summary": "Tailored 3-line professional summary highlighting relevant overlap",
  "recommended_bullet_adjustments": [
    {
      "original": "Old bullet point",
      "improved": "Rewritten bullet using action verbs + metrics + tech keywords",
      "reason": "Why this revision increases recruiter callback probability"
    }
  ],
  "targeted_skills_to_highlight": ["Top 5 skills from resume to feature prominently"],
  "cover_letter_draft": "Compelling 3-paragraph cover letter tailored to this role"
}"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Target Role: {job_title} at {company}\n\nJob Description:\n{job_description[:4000]}\n\nCandidate Resume:\n{candidate_resume_text[:4000]}"}
                ],
                temperature=0.3
            )
            content = response.choices[0].message.content or "{}"
            cleaned_json = re.sub(r"^```json\s*", "", content.strip(), flags=re.MULTILINE)
            cleaned_json = re.sub(r"```$", "", cleaned_json.strip(), flags=re.MULTILINE)
            data = json.loads(cleaned_json)
            
            return ResumeTailorResponse(
                job_title=job_title,
                company=company,
                suggested_summary=data.get("suggested_summary", ""),
                recommended_bullet_adjustments=data.get("recommended_bullet_adjustments", []),
                targeted_skills_to_highlight=data.get("targeted_skills_to_highlight", []),
                cover_letter_draft=data.get("cover_letter_draft", ""),
                ai_provider_used=f"{self._name} ({self.model})"
            )
        except Exception as e:
            logger.warning(f"AI resume tailoring failed on {self._name}: {e}. Using fallback.")
            from backend.app.ai.providers.fallback import FallbackHeuristicProvider
            return await FallbackHeuristicProvider().tailor_resume(job_title, company, job_description, candidate_resume_text)

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
        tone_directives = {
            "professional": "Authoritative, polished, executive, and balanced. Project quiet confidence and competence.",
            "impactful": "Dynamic, high-energy, and metrics-driven. Spotlight business outcomes, ROI, and engineering throughput.",
            "technical": "Architectural, rigorous, and deep. Discuss tech stack, system reliability, scaling challenges, and clean code principles.",
            "startup": "Agile, passionate, scrappy, and entrepreneurial. Highlight high ownership, rapid execution, and product-minded thinking."
        }
        chosen_tone_dir = tone_directives.get(tone.lower(), tone_directives["professional"])

        length_directives = {
            "concise": "2 tight, high-signal paragraphs (approx 200-250 words total). Recruiter friendly, no fluff.",
            "standard": "3 well-structured paragraphs (approx 300-380 words total). Opening hook, concrete achievements proof, forward-looking close.",
            "detailed": "4 comprehensive paragraphs with 2-3 bulleted metric highlights (approx 420-500 words total)."
        }
        chosen_length_dir = length_directives.get(length.lower(), length_directives["standard"])

        focus_text = f"Emphasize these key areas: {', '.join(focus_areas)}." if focus_areas else ""
        custom_text = f"Additional candidate instructions to weave in: {custom_instructions}" if custom_instructions else ""

        system_prompt = f"""You are an elite Silicon Valley executive career coach and specialized cover letter copywriter.
Craft a bespoke, high-converting cover letter tailored to the specific target job description and the candidate's verified resume.

GUIDELINES:
1. Tone Style: {chosen_tone_dir}
2. Length & Structure: {chosen_length_dir}
3. {focus_text}
4. {custom_text}
5. Avoid generic AI cliches ("I am writing to express my enthusiasm...", "I believe I am the ideal candidate..."). Start with a strong, tailored hook that demonstrates understanding of the company's domain, challenges, and goals.
6. Connect the candidate's actual projects, skills, and metrics directly to the requirements in the job description.
7. STRICT ZERO-EMOJI MANDATE: NEVER include any emojis, emoticons, or decorative symbols anywhere in the cover letter (no emojis in subject_line, salutation, body_paragraphs, bullet points, sign_off, or skills). Use 100% clean, professional executive English typography only.
8. Return pure JSON matching this exact schema:
{{
  "subject_line": "Application for [Job Title] - [Candidate Name]",
  "salutation": "Dear [Hiring Manager Name or Hiring Team at Company],",
  "body_paragraphs": [
    "Paragraph 1 text...",
    "Paragraph 2 text...",
    "Paragraph 3 text..."
  ],
  "sign_off": "Sincerely,\\n[Candidate Name]",
  "matched_skills_highlighted": ["Skill1", "Skill2", "Skill3"],
  "key_strengths_featured": ["Specific strength 1", "Specific strength 2"]
}}"""

        recipient = hiring_manager_name or f"Hiring Team at {company}"
        user_prompt = f"""TARGET OPPORTUNITY:
Title: {job_title}
Company: {company}
Addressed to: {recipient}
Job Description:
{job_description[:4500]}

CANDIDATE BACKGROUND:
Name: {candidate_name or "Candidate"}
Summary: {candidate_summary or "Experienced professional"}
Key Skills: {', '.join(candidate_skills[:15]) if candidate_skills else 'Software Engineering'}
Resume Experience Details:
{resume_text[:4500] if resume_text else 'Experience in software engineering, modern web technologies, and scalable systems.'}
"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.35
            )
            content = response.choices[0].message.content or "{}"
            cleaned_json = re.sub(r"^```json\s*", "", content.strip(), flags=re.MULTILINE)
            cleaned_json = re.sub(r"```$", "", cleaned_json.strip(), flags=re.MULTILINE)
            data = json.loads(cleaned_json)

            raw_salutation = data.get("salutation") or f"Dear Hiring Team at {company},"
            salutation = strip_emojis(raw_salutation)
            body_paragraphs = data.get("body_paragraphs", [])
            if not body_paragraphs and "cover_letter" in data:
                body_paragraphs = [p.strip() for p in data["cover_letter"].split("\n\n") if p.strip()]
            body_paragraphs = [strip_emojis(p) for p in body_paragraphs if strip_emojis(p)]

            raw_sign_off = data.get("sign_off") or f"Sincerely,\n{candidate_name or 'Candidate'}"
            sign_off = strip_emojis(raw_sign_off)
            full_letter = strip_emojis(f"{salutation}\n\n" + "\n\n".join(body_paragraphs) + f"\n\n{sign_off}")
            word_count = len(full_letter.split())
            subject_line = strip_emojis(data.get("subject_line") or f"Application for {job_title} - {candidate_name or 'Candidate'}")
            matched_skills = [strip_emojis(s) for s in data.get("matched_skills_highlighted", candidate_skills[:4]) if strip_emojis(s)]
            key_strengths = [strip_emojis(s) for s in data.get("key_strengths_featured", [f"{job_title} domain expertise", "Technical execution"]) if strip_emojis(s)]

            return CoverLetterGenResponse(
                job_title=job_title,
                company=company,
                subject_line=subject_line,
                salutation=salutation,
                cover_letter=full_letter,
                body_paragraphs=body_paragraphs,
                sign_off=sign_off,
                candidate_name=candidate_name or "Candidate",
                matched_skills_highlighted=matched_skills,
                key_strengths_featured=key_strengths,
                word_count=word_count,
                ai_provider_used=f"{self._name} ({self.model})"
            )
        except Exception as e:
            logger.warning(f"AI cover letter generation failed on {self._name}: {e}. Using heuristic fallback.")
            from backend.app.ai.providers.fallback import FallbackHeuristicProvider
            return await FallbackHeuristicProvider().generate_cover_letter(
                job_title=job_title,
                company=company,
                job_description=job_description,
                candidate_name=candidate_name,
                candidate_summary=candidate_summary,
                candidate_skills=candidate_skills,
                resume_text=resume_text,
                tone=tone,
                length=length,
                focus_areas=focus_areas,
                custom_instructions=custom_instructions,
                hiring_manager_name=hiring_manager_name
            )


    async def generate_follow_up_email(
        self,
        job_title: str,
        company: str,
        candidate_name: str,
        email_type: str,
        interviewer_name: Optional[str] = None,
        notes: Optional[str] = None
    ) -> FollowUpEmailGenResponse:
        system_prompt = """Generate a high-converting, professional, polite job follow-up email.
Return pure JSON:
{
  "subject": "Clear subject line with role and candidate name",
  "body": "Concise email body ready to copy and send"
}"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Candidate: {candidate_name}\nJob: {job_title} at {company}\nType: {email_type}\nInterviewer: {interviewer_name}\nNotes: {notes}"}
                ],
                temperature=0.3
            )
            content = response.choices[0].message.content or "{}"
            cleaned_json = re.sub(r"^```json\s*", "", content.strip(), flags=re.MULTILINE)
            cleaned_json = re.sub(r"```$", "", cleaned_json.strip(), flags=re.MULTILINE)
            data = json.loads(cleaned_json)
            
            return FollowUpEmailGenResponse(
                subject=data.get("subject", f"Following Up: {job_title} - {candidate_name}"),
                body=data.get("body", ""),
                ai_provider_used=f"{self._name} ({self.model})"
            )
        except Exception as e:
            logger.warning(f"AI follow up generation failed on {self._name}: {e}. Using fallback.")
            from backend.app.ai.providers.fallback import FallbackHeuristicProvider
            return await FallbackHeuristicProvider().generate_follow_up_email(job_title, company, candidate_name, email_type, interviewer_name, notes)

    async def parse_resume_data(self, raw_resume_text: str) -> "ParsedResumeProfile":
        from backend.app.schemas.candidate import ParsedResumeProfile, ParsedResumeSkill
        from backend.app.processing.normalizer import normalize_skill_name
        
        system_prompt = """You are an expert technical resume parser and candidate profile extractor.
Extract candidate information from the resume text and return pure JSON conforming to:
{
  "full_name": "Candidate full name",
  "email": "Email address or null",
  "headline": "Punchy professional headline (e.g. Junior Full-Stack Engineer | React & Python)",
  "summary": "Compelling 3-4 sentence professional summary synthesizing their strengths and career focus",
  "target_roles": ["Top 3-4 suggested roles based on background, e.g. Full Stack Developer, Junior Backend Developer"],
  "years_of_experience": integer (0 for fresh grad/internships, or total years),
  "education_level": "Highest degree, institution, and major",
  "portfolio_url": "Portfolio or project website URL or null",
  "github_url": "GitHub profile URL or null",
  "linkedin_url": "LinkedIn profile URL or null",
  "skills": [
    {
      "name": "Canonical skill name (e.g. React, Python, PostgreSQL, Docker)",
      "proficiency_level": "Beginner | Intermediate | Advanced | Expert",
      "years_experience": integer,
      "is_top_skill": boolean (true for top 5 primary skills)
    }
  ]
}"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Parse candidate profile and skill inventory from this resume:\n\n{raw_resume_text[:10000]}"}
                ],
                temperature=0.1
            )
            content = response.choices[0].message.content or "{}"
            cleaned_json = re.sub(r"^```json\s*", "", content.strip(), flags=re.MULTILINE)
            cleaned_json = re.sub(r"```$", "", cleaned_json.strip(), flags=re.MULTILINE)
            data = json.loads(cleaned_json)
            
            parsed_skills = []
            for s in data.get("skills", []):
                canon = normalize_skill_name(s.get("name", ""))
                if canon:
                    parsed_skills.append(ParsedResumeSkill(
                        name=canon,
                        proficiency_level=s.get("proficiency_level", "Intermediate"),
                        years_experience=s.get("years_experience", 1),
                        is_top_skill=s.get("is_top_skill", False)
                    ))

            return ParsedResumeProfile(
                full_name=data.get("full_name") or "Candidate",
                email=data.get("email"),
                headline=data.get("headline"),
                summary=data.get("summary"),
                target_roles=data.get("target_roles", []),
                years_of_experience=data.get("years_of_experience", 0),
                education_level=data.get("education_level"),
                portfolio_url=data.get("portfolio_url"),
                github_url=data.get("github_url"),
                linkedin_url=data.get("linkedin_url"),
                skills=parsed_skills
            )
        except Exception as e:
            logger.warning(f"AI resume parsing failed on {self._name}: {e}. Using fallback.")
            from backend.app.ai.providers.fallback import FallbackHeuristicProvider
            return await FallbackHeuristicProvider().parse_resume_data(raw_resume_text)
