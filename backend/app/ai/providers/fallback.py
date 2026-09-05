import re
from typing import Optional, List, Dict
from backend.app.ai.base import BaseAIProvider
from backend.app.schemas.job import JobCreate, JobSkillInfo
from backend.app.schemas.ai import InterviewPrepResponse, QuestionAndStarGuide, ResumeTailorResponse, FollowUpEmailGenResponse
from backend.app.processing.normalizer import SYNONYM_MAP, normalize_skill_name, get_skill_category, normalize_currency
from backend.app.processing.source_detector import detect_job_source


class FallbackHeuristicProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "fallback"

    async def extract_job_information(self, raw_text: str, source_url: Optional[str] = None) -> JobCreate:
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
        
        # Dynamic title detection
        title = lines[0][:100] if lines else "Job Posting"
        company = "Unknown Company"
        location = None
        workplace_type = "Remote"
        
        # Scan for title
        title_patterns = [
            r"^(?:Job Title|Role|Position):\s*(.+)$",
            r"^([A-Z][A-Za-z0-9\s/]+(?:Developer|Engineer|Architect|Specialist|Programmer|Manager|Analyst))$",
        ]
        for line in lines[:15]:
            for pat in title_patterns:
                match = re.search(pat, line, re.IGNORECASE)
                if match:
                    title = match.group(1).strip()
                    break

        # Scan for company
        company_patterns = [
            r"^(?:Company|Organization|Employer|At):\s*(.+)$",
            r"^About\s+([A-Z][A-Za-z0-9\s.,]+)$",
        ]
        for line in lines[:20]:
            for pat in company_patterns:
                match = re.search(pat, line, re.IGNORECASE)
                if match:
                    company = match.group(1).strip()
                    break

        # Check workplace type
        lower_text = raw_text.lower()
        if "hybrid" in lower_text:
            workplace_type = "Hybrid"
        elif "on-site" in lower_text or "onsite" in lower_text or "in-office" in lower_text:
            workplace_type = "Onsite"
        else:
            workplace_type = "Remote"

        # Check experience requirement
        min_years = 0
        exp_match = re.search(r"(\d+)\+?\s*(?:-\s*(\d+))?\s*(?:years?|yrs?)\s+(?:of\s+)?experience", lower_text)
        if exp_match:
            try:
                min_years = int(exp_match.group(1))
            except Exception:
                min_years = 0

        # Scan for skills mentioned in text
        detected_skills: Dict[str, JobSkillInfo] = {}
        for keyword in SYNONYM_MAP.keys():
            # word boundary search
            escaped = re.escape(keyword)
            if re.search(r"\b" + escaped + r"\b", lower_text):
                canonical = normalize_skill_name(keyword)
                if canonical not in detected_skills:
                    # check if near 'nice to have' or 'preferred'
                    is_required = True
                    if "preferred" in lower_text or "nice to have" in lower_text:
                        pref_idx = max(lower_text.find("preferred"), lower_text.find("nice to have"))
                        keyword_idx = lower_text.find(keyword)
                        if keyword_idx > pref_idx and pref_idx != -1:
                            is_required = False
                    
                    detected_skills[canonical] = JobSkillInfo(
                        name=canonical,
                        category=get_skill_category(canonical),
                        is_required=is_required,
                        years_required=min_years
                    )

        # Extract responsibilities / bullet points
        responsibilities = []
        for line in lines:
            if line.startswith(("-", "•", "*", "–")) and len(line) > 15:
                responsibilities.append(line.lstrip("-•*– ").strip())
            if len(responsibilities) >= 6:
                break

        # Check salary and currency
        salary_min: Optional[int] = None
        salary_max: Optional[int] = None
        currency: str = "PHP" if any(k in lower_text for k in ["philippines", "manila", "cebu", "quezon city", "taguig", "makati"]) or "₱" in raw_text else "USD"

        # Look for salary range patterns:
        salary_pattern = r"(?:(PHP|₱|Php|USD|\$|EUR|€|GBP|£)\s*)?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,7})\s*(?:-|to|–)\s*(?:(PHP|₱|Php|USD|\$|EUR|€|GBP|£)\s*)?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,7})"
        sal_match = re.search(salary_pattern, raw_text, re.IGNORECASE)
        if sal_match:
            curr_match = sal_match.group(1) or sal_match.group(3)
            if curr_match:
                currency = normalize_currency(curr_match)
            try:
                salary_min = int(sal_match.group(2).replace(",", ""))
                salary_max = int(sal_match.group(4).replace(",", ""))
            except ValueError:
                pass
        else:
            single_pattern = r"(?:(PHP|₱|Php|USD|\$|EUR|€|GBP|£)\s*)([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,7})"
            single_match = re.search(single_pattern, raw_text, re.IGNORECASE)
            if single_match:
                curr_match = single_match.group(1)
                if curr_match:
                    currency = normalize_currency(curr_match)
                try:
                    salary_min = int(single_match.group(2).replace(",", ""))
                except ValueError:
                    pass

        source = detect_job_source(source_url) if source_url else "Manual"

        return JobCreate(
            url=source_url,
            canonical_url=source_url,
            source=source,
            title=title,
            company=company,
            location=location,
            workplace_type=workplace_type,
            employment_type="Full-time",
            experience_level="Junior" if min_years <= 2 else ("Senior" if min_years >= 5 else "Mid-Level"),
            min_years_experience=min_years,
            salary_min=salary_min,
            salary_max=salary_max,
            currency=currency,
            raw_description=raw_text,
            summary=f"{title} position at {company}. Requires familiarity with {', '.join(list(detected_skills.keys())[:4]) if detected_skills else 'specified domain requirements'}.",
            responsibilities=responsibilities,
            skills=list(detected_skills.values()),
            benefits=[]
        )


    async def generate_interview_prep(
        self,
        job_title: str,
        company: str,
        job_description: str,
        candidate_summary: Optional[str] = None
    ) -> InterviewPrepResponse:
        return InterviewPrepResponse(
            job_title=job_title,
            company=company,
            top_technical_questions=[
                QuestionAndStarGuide(
                    question=f"How would you design a scalable REST API or service architecture for a core feature at {company}?",
                    question_type="TECHNICAL",
                    difficulty="Intermediate",
                    concept_tested="API Design & Architecture",
                    suggested_answer_points=["Resource modeling & HTTP status codes", "Database indexing & pagination", "Error handling and authentication"]
                ),
                QuestionAndStarGuide(
                    question="Describe how you diagnose and fix a slow query or frontend rendering performance bottleneck.",
                    question_type="TECHNICAL",
                    difficulty="Intermediate",
                    concept_tested="Performance Optimization & Profiling",
                    suggested_answer_points=["Chrome DevTools / EXPLAIN ANALYZE", "Network waterfall & payload sizes", "State management re-render avoidance"]
                ),
                QuestionAndStarGuide(
                    question="How do you structure tests (Unit, Integration, E2E) to maintain high test coverage without slowing development velocity?",
                    question_type="TECHNICAL",
                    difficulty="Junior",
                    concept_tested="Testing Strategies & Quality Assurance",
                    suggested_answer_points=["Pytest / Jest test suites", "Mocking external network services", "CI/CD automated regression runs"]
                )
            ],
            top_behavioral_questions=[
                QuestionAndStarGuide(
                    question=f"Tell me about a time you faced a difficult technical bug with a tight deadline. How did you resolve it?",
                    question_type="BEHAVIORAL",
                    difficulty="Intermediate",
                    concept_tested="Problem Solving & Resilience",
                    star_guidance={
                        "Situation": "Describe the production issue or roadblock and its business impact.",
                        "Task": "Define your role and what needed to be achieved.",
                        "Action": "Detail the debugging steps, logs checked, and fix implemented.",
                        "Result": "State the quantifiable positive outcome and post-mortem safeguards."
                    },
                    suggested_answer_points=["Calm triage & communication", "Root cause isolation", "Long-term regression prevention"]
                ),
                QuestionAndStarGuide(
                    question=f"Why do you want to join {company} specifically for this {job_title} role?",
                    question_type="BEHAVIORAL",
                    difficulty="Junior",
                    concept_tested="Company Alignment & Motivation",
                    star_guidance={
                        "Situation": f"Connect your background with {company}'s mission and engineering stack.",
                        "Task": "Demonstrate the immediate value you can contribute as a junior developer.",
                        "Action": "Share passion for continuous learning and team collaboration.",
                        "Result": "Reiterate enthusiasm for long-term growth with the team."
                    },
                    suggested_answer_points=[f"Interest in {company}'s product problem domain", "Alignment with modern tech stack", "Commitment to rapid learning"]
                )
            ],
            questions_to_ask_interviewer=[
                f"What does the onboarding process look like for a new {job_title} in their first 30-60-90 days?",
                "How does the engineering team handle code reviews, CI/CD, and deployment cadences?",
                "What are the biggest technical challenges the team is planning to tackle in the next two quarters?"
            ],
            key_topics_to_review=[
                "Core language fundamentals and async runtime behavior",
                "Relational schema design and indexing fundamentals",
                "Clean code principles, Git workflows, and API documentation"
            ],
            ai_provider_used="Deterministic Heuristic Fallback Engine"
        )

    async def tailor_resume(
        self,
        job_title: str,
        company: str,
        job_description: str,
        candidate_resume_text: str
    ) -> ResumeTailorResponse:
        return ResumeTailorResponse(
            job_title=job_title,
            company=company,
            suggested_summary=f"Results-oriented {job_title} candidate with strong foundation in full-stack engineering, clean architecture, and continuous integration. Eager to contribute to {company}'s engineering initiatives.",
            recommended_bullet_adjustments=[
                {
                    "original": "Built features for web applications and fixed bugs.",
                    "improved": f"Architected and deployed responsive full-stack features, enhancing application responsiveness by 35% and reducing regression defects.",
                    "reason": "Quantifies business impact with metrics and action-oriented verbs."
                },
                {
                    "original": "Worked with databases and API endpoints.",
                    "improved": "Designed normalized relational schemas and optimized REST API endpoints with automated unit testing and caching.",
                    "reason": "Demonstrates technical depth in backend architecture and testing discipline."
                }
            ],
            targeted_skills_to_highlight=["REST API", "Database Optimization", "Git & CI/CD", "Clean Architecture"],
            cover_letter_draft=f"Dear Hiring Team at {company},\n\nI am writing to express my strong interest in the {job_title} position. With a solid foundation in modern software engineering, clean code principles, and rapid problem-solving, I am excited about the opportunity to contribute to your team.\n\nThank you for your time and consideration. I look forward to discussing how my skills align with {company}'s goals.\n\nSincerely,\nCandidate",
            ai_provider_used="Deterministic Heuristic Fallback Engine"
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
        name = interviewer_name or "Hiring Team"
        if email_type == "POST_INTERVIEW_THANK_YOU":
            subject = f"Thank You - {job_title} Interview - {candidate_name}"
            body = f"Dear {name},\n\nThank you for taking the time to speak with me today about the {job_title} role at {company}. I really enjoyed learning more about the team's current projects.\n\nOur conversation reinforced my excitement about joining {company} and contributing to your technical initiatives. Please let me know if you need any additional information from my end.\n\nBest regards,\n{candidate_name}"
        else:
            subject = f"Application Status Check: {job_title} - {candidate_name}"
            body = f"Dear {name},\n\nI hope this email finds you well. I recently submitted my application for the {job_title} position at {company} and wanted to reiterate my enthusiasm for the role.\n\nI understand you are likely reviewing many applications, but I wanted to check in and see if there are any updates regarding the hiring process. I would welcome the opportunity to discuss how my experience fits the team's needs.\n\nThank you for your time,\n{candidate_name}"

        return FollowUpEmailGenResponse(
            subject=subject,
            body=body,
            ai_provider_used="Deterministic Heuristic Fallback Engine"
        )

    async def parse_resume_data(self, raw_resume_text: str) -> "ParsedResumeProfile":
        from backend.app.schemas.candidate import ParsedResumeProfile, ParsedResumeSkill
        
        lines = [line.strip() for line in raw_resume_text.split("\n") if line.strip()]
        lower_text = raw_resume_text.lower()
        
        # 1. Name detection
        full_name = lines[0][:60] if lines else ""
        for line in lines[:5]:
            if re.match(r"^[A-Z][a-zA-Z.'-]+\s+[A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+)?$", line):
                full_name = line
                break

        # 2. Email detection
        email = None
        email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", raw_resume_text)
        if email_match:
            email = email_match.group(0)

        # 3. Links detection
        github_url = None
        github_match = re.search(r"(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9_-]+", raw_resume_text, re.IGNORECASE)
        if github_match:
            github_url = github_match.group(0)
            if not github_url.startswith("http"):
                github_url = "https://" + github_url

        linkedin_url = None
        linkedin_match = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[A-Za-z0-9_-]+", raw_resume_text, re.IGNORECASE)
        if linkedin_match:
            linkedin_url = linkedin_match.group(0)
            if not linkedin_url.startswith("http"):
                linkedin_url = "https://" + linkedin_url

        # 4. Education detection
        education = None
        edu_patterns = [
            r"((?:Bachelor|Master|Doctor|Ph\.D\.|B\.S\.|M\.S\.|B\.A\.|Associate)\s+(?:of|in)?\s+[A-Za-z\s]+)",
            r"(Computer Science|Software Engineering|Information Technology|Computer Engineering)"
        ]
        for pat in edu_patterns:
            m = re.search(pat, raw_resume_text, re.IGNORECASE)
            if m:
                education = m.group(1).strip()
                break

        # 5. Experience calculation
        years_exp = 0
        exp_m = re.search(r"(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience", lower_text)
        if exp_m:
            try:
                years_exp = int(exp_m.group(1))
            except Exception:
                years_exp = 0

        # 6. Skill extraction
        detected_skills: Dict[str, ParsedResumeSkill] = {}
        for keyword in SYNONYM_MAP.keys():
            escaped = re.escape(keyword)
            if re.search(r"\b" + escaped + r"\b", lower_text):
                canonical = normalize_skill_name(keyword)
                if canonical not in detected_skills:
                    detected_skills[canonical] = ParsedResumeSkill(
                        name=canonical,
                        proficiency_level="Advanced" if years_exp >= 3 else "Intermediate",
                        years_experience=max(1, years_exp),
                        is_top_skill=len(detected_skills) < 5
                    )

        # 7. Target roles
        target_roles = []
        if "full stack" in lower_text or "fullstack" in lower_text:
            target_roles.append("Full Stack Developer")
        if "frontend" in lower_text or "react" in lower_text:
            target_roles.append("Frontend Developer")
        if "backend" in lower_text or "python" in lower_text or "fastapi" in lower_text:
            target_roles.append("Backend Developer")
        if not target_roles and ("software" in lower_text or "developer" in lower_text or "engineer" in lower_text):
            target_roles.append("Software Engineer")

        top_role = target_roles[0] if target_roles else "Software Engineer"
        headline = f"{top_role} | {', '.join(list(detected_skills.keys())[:3]) if detected_skills else 'Engineering'}"
        summary = f"Engineering professional with verified background in {', '.join(list(detected_skills.keys())[:5]) if detected_skills else 'software development'}."

        return ParsedResumeProfile(
            full_name=full_name,
            email=email,
            headline=headline,
            summary=summary,
            target_roles=target_roles[:4],
            years_of_experience=years_exp,
            education_level=education,
            portfolio_url=github_url,
            github_url=github_url,
            linkedin_url=linkedin_url,
            skills=list(detected_skills.values())
        )

