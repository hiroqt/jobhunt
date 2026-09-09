import re
from datetime import datetime
from typing import Optional, List, Dict, Tuple, Set
from backend.app.ai.base import BaseAIProvider
from backend.app.schemas.job import JobCreate, JobSkillInfo
from backend.app.schemas.ai import InterviewPrepResponse, QuestionAndStarGuide, ResumeTailorResponse, FollowUpEmailGenResponse
from backend.app.schemas.candidate import ParsedResumeProfile, ParsedResumeSkill
from backend.app.processing.normalizer import (
    SYNONYM_MAP,
    normalize_skill_name,
    get_skill_category,
    normalize_currency,
    extract_skills_from_text,
)
from backend.app.processing.source_detector import detect_job_source


# Common non-name keywords that shouldn't be picked up as candidate names
DISALLOWED_NAME_TOKENS = {
    "resume", "curriculum", "vitae", "cv", "profile", "summary", "experience",
    "education", "skills", "projects", "contact", "information", "phone", "email",
    "github", "linkedin", "portfolio", "website", "developer", "engineer", "lead",
    "manager", "junior", "senior", "fullstack", "frontend", "backend", "software"
}

PHILIPPINE_CITIES = [
    "manila", "makati", "taguig", "bgc", "bonifacio global city", "quezon city",
    "pasig", "ortigas", "mandaluyong", "cebu", "davao", "clark", "angeles", "pampanga",
    "alabang", "muntinlupa", "paranaque", "pasay", "iloilo", "bacolod", "baguio", "cagayan de oro"
]


class FallbackHeuristicProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "fallback"

    # =========================================================================
    # JOB INFORMATION EXTRACTION HEURISTIC
    # =========================================================================

    async def extract_job_information(self, raw_text: str, source_url: Optional[str] = None) -> JobCreate:
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
        lower_text = raw_text.lower()
        
        # 1. Dynamic title detection
        title = "Software Engineer"
        title_patterns = [
            r"^(?:Job Title|Role|Position|Title):\s*(.+)$",
            r"^We(?:'re| are)\s+(?:looking for|hiring)\s+(?:a|an)?\s*(.+)$",
            r"^([A-Z][A-Za-z0-9\s/&,.-]+(?:Developer|Engineer|Architect|Specialist|Programmer|Manager|Analyst|Consultant|Designer|Lead|Intern))$",
        ]
        for line in lines[:20]:
            clean_line = re.sub(r"^[#*–—\s]+", "", line).strip()
            if any(clean_line.lower().startswith(x) for x in ["about", "responsibilities", "requirements", "overview", "who we are"]):
                continue
            for pat in title_patterns:
                match = re.search(pat, clean_line, re.IGNORECASE)
                if match:
                    candidate_title = match.group(1).strip(" :-,.")
                    if 3 < len(candidate_title) <= 80 and not any(k in candidate_title.lower() for k in ["description", "requirement", "responsibility"]):
                        title = candidate_title
                        break
            if title != "Software Engineer":
                break

        # If still default, check first 5 lines for any line containing standard engineer keywords
        if title == "Software Engineer":
            for line in lines[:5]:
                clean_line = re.sub(r"^[#*–—\s]+", "", line).strip()
                if re.search(r"\b(?:Developer|Engineer|Architect|Programmer|Analyst|Designer)\b", clean_line, re.I):
                    if len(clean_line) <= 70:
                        title = clean_line
                        break

        # 2. Dynamic company detection
        company = "Unknown Company"
        company_patterns = [
            r"^(?:Company|Organization|Employer|At|Hiring Organization):\s*(.+)$",
            r"^(?:About|Join)\s+([A-Z][A-Za-z0-9\s.,&'-]+?)(?:\s+(?:is|at|in|,))?$",
            r"^([A-Z][A-Za-z0-9\s.,&'-]+?)\s+is\s+(?:looking for|hiring|seeking)",
        ]
        for line in lines[:25]:
            clean_line = re.sub(r"^[#*–—\s]+", "", line).strip()
            for pat in company_patterns:
                match = re.search(pat, clean_line, re.IGNORECASE)
                if match:
                    cand_comp = match.group(1).strip(" :-,.")
                    cand_tokens = set(re.findall(r"\b[a-z]+\b", cand_comp.lower()))
                    if 2 < len(cand_comp) <= 60 and not cand_tokens.intersection({"overview", "team", "us", "job", "position", "description", "requirements"}):
                        company = cand_comp
                        break
            if company != "Unknown Company":
                break

        # Check if title has " at " or " @ " (e.g. "Senior Backend Engineer at FinTech Global")
        if " at " in title:
            cand_title, cand_comp = title.split(" at ", 1)
            title = cand_title.strip()
            if company == "Unknown Company" and cand_comp.strip():
                company = cand_comp.strip()
        elif " @ " in title:
            cand_title, cand_comp = title.split(" @ ", 1)
            title = cand_title.strip()
            if company == "Unknown Company" and cand_comp.strip():
                company = cand_comp.strip()

        # 3. Location detection
        location = None
        for city in PHILIPPINE_CITIES:
            if re.search(r"\b" + re.escape(city) + r"\b", lower_text):
                location = city.title() + ", Philippines"
                break
        if not location:
            loc_match = re.search(r"(?:Location|Based in|Office):\s*([A-Za-z\s,.-]+)", raw_text, re.IGNORECASE)
            if loc_match:
                loc_cand = loc_match.group(1).strip()
                if len(loc_cand) <= 50:
                    location = loc_cand

        # 4. Workplace type
        if "hybrid" in lower_text:
            workplace_type = "Hybrid"
        elif any(k in lower_text for k in ["on-site", "onsite", "in-office", "office-based", "work on-site"]):
            workplace_type = "Onsite"
        else:
            workplace_type = "Remote"

        # 5. Experience requirement
        min_years = 0
        exp_match = re.search(r"(?:at\s+least|minimum\s+of)?\s*(\d+)\+?\s*(?:-\s*(\d+))?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)", lower_text)
        if exp_match:
            try:
                min_years = int(exp_match.group(1))
            except Exception:
                min_years = 0
        elif re.search(r"\b(?:senior|sr\.?|lead|principal)\b", title, re.IGNORECASE):
            min_years = 5
        elif re.search(r"\b(?:junior|jr\.?|entry\s*level|intern)\b", title, re.IGNORECASE):
            min_years = 1

        # 6. Skill extraction with Required vs Preferred distinction
        # Find index of preferred/nice-to-have section
        pref_idx = -1
        pref_matches = list(re.finditer(r"\b(?:preferred|nice\s+to\s+have|bonus|plus|good\s+to\s+have|advantages?)\b", lower_text))
        if pref_matches:
            pref_idx = pref_matches[0].start()

        detected_skills: Dict[str, JobSkillInfo] = {}
        for keyword in SYNONYM_MAP.keys():
            escaped = re.escape(keyword)
            match = re.search(r"\b" + escaped + r"\b", lower_text)
            if match:
                canonical = normalize_skill_name(keyword)
                if canonical not in detected_skills:
                    is_required = True
                    if pref_idx != -1 and match.start() > pref_idx:
                        is_required = False

                    detected_skills[canonical] = JobSkillInfo(
                        name=canonical,
                        category=get_skill_category(canonical),
                        is_required=is_required,
                        years_required=min_years
                    )

        # 7. Extract responsibilities / bullet points
        responsibilities = []
        for line in lines:
            clean_bullet = re.sub(r"^[-*•–—\d.)\s]+", "", line).strip()
            if clean_bullet and len(clean_bullet) >= 20 and not clean_bullet.endswith(":"):
                if any(clean_bullet.lower().startswith(x) for x in ["develop", "build", "design", "collaborate", "write", "lead", "maintain", "implement", "participate", "work", "ensure", "optimize", "create", "deploy", "manage", "oversee", "troubleshoot"]):
                    responsibilities.append(clean_bullet)
                elif line.startswith(("-", "•", "*", "–", "—")) and len(clean_bullet) >= 25:
                    responsibilities.append(clean_bullet)
            if len(responsibilities) >= 7:
                break

        # 8. Salary and currency parsing (supporting k notation, monthly, hourly, yearly)
        salary_min: Optional[int] = None
        salary_max: Optional[int] = None
        is_ph = any(k in lower_text for k in ["philippines", "manila", "cebu", "quezon city", "taguig", "makati"]) or "₱" in raw_text or "php" in lower_text
        currency: str = "PHP" if is_ph else "USD"

        # Regex for range e.g. ₱60k - ₱90k, 50,000 - 80,000, $100k - $120k
        range_pat = r"(?:(PHP|₱|Php|USD|\$|EUR|€|GBP|£|SGD|S\$)\s*)?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{2,7})(k|K)?\s*(?:-|to|–|—)\s*(?:(PHP|₱|Php|USD|\$|EUR|€|GBP|£|SGD|S\$)\s*)?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{2,7})(k|K)?"
        sal_match = re.search(range_pat, raw_text, re.IGNORECASE)
        if sal_match:
            curr_match = sal_match.group(1) or sal_match.group(4)
            if curr_match:
                currency = normalize_currency(curr_match)
            try:
                min_val = int(sal_match.group(2).replace(",", ""))
                if sal_match.group(3) or (min_val < 1000 and sal_match.group(5)):
                    if sal_match.group(3) or (sal_match.group(6) and min_val < 1000):
                        min_val *= 1000
                max_val = int(sal_match.group(5).replace(",", ""))
                if sal_match.group(6) or (max_val < 1000 and min_val >= 1000):
                    max_val *= 1000
                salary_min = min_val
                salary_max = max_val
            except (ValueError, TypeError):
                pass
        else:
            single_pat = r"(?:(PHP|₱|Php|USD|\$|EUR|€|GBP|£|SGD|S\$)\s*)([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{2,7})(k|K)?"
            single_match = re.search(single_pat, raw_text, re.IGNORECASE)
            if single_match:
                curr_match = single_match.group(1)
                if curr_match:
                    currency = normalize_currency(curr_match)
                try:
                    val = int(single_match.group(2).replace(",", ""))
                    if single_match.group(3):
                        val *= 1000
                    salary_min = val
                except (ValueError, TypeError):
                    pass

        source = detect_job_source(source_url) if source_url else "Manual"
        skill_names = list(detected_skills.keys())

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
            summary=f"{title} position at {company}. Key requirements: {', '.join(skill_names[:5]) if skill_names else 'Standard engineering qualifications'}.",
            responsibilities=responsibilities,
            skills=list(detected_skills.values()),
            benefits=[]
        )

    # =========================================================================
    # RESUME DATA PARSING HEURISTIC (ENHANCED SECTION & TAXONOMY ENGINE)
    # =========================================================================

    async def parse_resume_data(self, raw_resume_text: str) -> ParsedResumeProfile:
        """
        Robust, section-aware deterministic heuristic resume parser.
        Extracts candidate name, contact info, portfolio/github/linkedin URLs,
        calculates career tenure from employment date ranges, maps education,
        extracts target roles and generates accurate headline and summary.
        """
        lines = [line.strip() for line in raw_resume_text.split("\n") if line.strip()]
        lower_text = raw_resume_text.lower()
        sections = self._split_resume_into_sections(lines)

        # 1. Name detection
        full_name = self._extract_candidate_name(lines, sections.get("header", []))

        # 2. Contact details
        email = self._extract_email(raw_resume_text)
        github_url, linkedin_url, portfolio_url = self._extract_links(raw_resume_text, lines[:15])

        # 3. Work Experience tenure calculation
        years_exp = self._calculate_years_of_experience(raw_resume_text, sections.get("experience", []))

        # 4. Education detection
        education = self._extract_education(raw_resume_text, sections.get("education", []))

        # 5. Skill Extraction & Taxonomy Categorization
        detected_skills = self._extract_skills_with_taxonomy(
            raw_resume_text,
            sections.get("skills", []),
            sections.get("experience", []),
            years_exp
        )

        # 6. Target roles and professional headline
        top_skills_list = [s.name for s in detected_skills[:5]]
        target_roles, headline = self._extract_target_roles_and_headline(
            raw_resume_text,
            sections.get("header", []),
            sections.get("experience", []),
            top_skills_list,
            years_exp
        )

        # 7. Summary extraction / synthesis
        primary_role = target_roles[0] if target_roles else "Software Engineer"
        summary = self._extract_summary(sections.get("summary", []), primary_role, years_exp, top_skills_list)

        return ParsedResumeProfile(
            full_name=full_name,
            email=email,
            headline=headline,
            summary=summary,
            target_roles=target_roles[:5],
            years_of_experience=years_exp,
            education_level=education,
            portfolio_url=portfolio_url,
            github_url=github_url,
            linkedin_url=linkedin_url,
            skills=detected_skills
        )

    # -------------------------------------------------------------------------
    # RESUME HEURISTIC SUB-ROUTINES
    # -------------------------------------------------------------------------

    def _split_resume_into_sections(self, lines: List[str]) -> Dict[str, List[str]]:
        """Segments raw resume text lines into recognized semantic resume sections."""
        section_headers = [
            ("summary", re.compile(r"^(?:professional\s+)?summary|career\s+profile|executive\s+summary|profile|about(?:\s+me)?|career\s+objective|objective$", re.I)),
            ("experience", re.compile(r"^(?:work\s+|professional\s+|employment\s+)?(?:experience|history)|experience|employment|work\s+history$", re.I)),
            ("education", re.compile(r"^education(?:al\s+background)?|academic(?:\s+background|\s+history|\s+qualifications)?|degrees?$", re.I)),
            ("skills", re.compile(r"^(?:technical\s+|core\s+|key\s+)?skills|competencies|technologies|tech\s+stack|tools(?:\s+&\s+technologies)?|areas\s+of\s+expertise$", re.I)),
            ("projects", re.compile(r"^(?:personal\s+|key\s+|featured\s+)?projects$", re.I)),
            ("certifications", re.compile(r"^certifications?|licenses?|credentials|certificates?$", re.I)),
        ]

        sections: Dict[str, List[str]] = {"header": []}
        current_section = "header"

        for line in lines:
            clean = re.sub(r"^[#*–—\s]+", "", line).strip().rstrip(":")
            if len(clean) <= 40 and not line.startswith(("-", "•", "*", "–")):
                matched_sec = None
                for sec_name, sec_regex in section_headers:
                    if sec_regex.match(clean):
                        matched_sec = sec_name
                        break
                if matched_sec:
                    current_section = matched_sec
                    if current_section not in sections:
                        sections[current_section] = []
                    continue

            if current_section not in sections:
                sections[current_section] = []
            sections[current_section].append(line)

        return sections

    def _extract_candidate_name(self, all_lines: List[str], header_lines: List[str]) -> str:
        """Heuristically isolates candidate name from the top header lines."""
        search_lines = (header_lines if header_lines else all_lines)[:8]

        # 1. Check for explicit name label
        for line in search_lines:
            m = re.match(r"^(?:Name|Full Name):\s*([A-Za-z\s.'-]+)$", line, re.I)
            if m:
                cand = m.group(1).strip()
                if 2 <= len(cand.split()) <= 4:
                    return cand.title()

        # 2. Check each line in header, rejecting contact info, URLs, headers
        for line in search_lines:
            clean = re.sub(r"^[#*–—\s]+", "", line).strip()
            if not clean or len(clean) > 50 or len(clean) < 3:
                continue
            # Skip lines with emails, phone numbers, URLs, or delimiters
            if "@" in clean or "http" in clean.lower() or ".com" in clean.lower() or "|" in clean or "/" in clean:
                continue
            # Skip lines that contain known non-name tokens
            tokens = [t.lower().strip(".,") for t in clean.split()]
            if any(t in DISALLOWED_NAME_TOKENS for t in tokens):
                continue

            # Standard or All Caps Name: e.g. "Juan M. Dela Cruz", "MARIA CLARA"
            if re.match(r"^[A-Z][a-zA-Z.'-]+\s+[A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+)?(?:\s+(?:Jr\.?|Sr\.?|III|II|IV))?$", clean, re.IGNORECASE):
                if clean.isupper():
                    parts = clean.split()
                    formatted = []
                    for p in parts:
                        up = p.upper()
                        if up in ("JR.", "JR"):
                            formatted.append("Jr.")
                        elif up in ("SR.", "SR"):
                            formatted.append("Sr.")
                        elif up in ("III", "II", "IV", "VI", "VII", "VIII"):
                            formatted.append(up)
                        else:
                            formatted.append(p.capitalize())
                    return " ".join(formatted)
                return clean

        # Fallback: sanitized first line if reasonable
        if all_lines:
            first = re.sub(r"^[#*–—\s]+", "", all_lines[0]).strip()
            if 3 <= len(first) <= 45 and not any(x in first.lower() for x in ["resume", "curriculum", "@", "http"]):
                return first.title()

        return "Candidate"

    def _extract_email(self, text: str) -> Optional[str]:
        match = re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", text)
        if match:
            cand = match.group(0).strip()
            if not cand.startswith("example") and not cand.startswith("your."):
                return cand.lower()
        return None

    def _extract_links(self, text: str, top_lines: List[str]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """Extracts GitHub, LinkedIn, and personal portfolio links."""
        github_url = None
        gh_m = re.search(r"(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9_-]+)", text, re.I)
        if gh_m:
            user = gh_m.group(1).strip()
            if user.lower() not in ("profile", "username", "account", "settings"):
                github_url = f"https://github.com/{user}"

        linkedin_url = None
        li_m = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/([A-Za-z0-9_-]+)", text, re.I)
        if li_m:
            user = li_m.group(1).strip()
            if user.lower() not in ("profile", "username", "account"):
                linkedin_url = f"https://linkedin.com/in/{user}"

        portfolio_url = None
        # Explicit portfolio label
        port_label_m = re.search(r"(?:portfolio|website|site|web):\s*(https?://[^\s]+|[a-zA-Z0-9.-]+\.[a-z]{2,}(?:/[^\s]*)?)", text, re.I)
        if port_label_m:
            val = port_label_m.group(1).strip(".,;:() ")
            if not val.startswith("http"):
                val = "https://" + val
            if "github.com" not in val.lower() and "linkedin.com" not in val.lower():
                portfolio_url = val

        # Common developer portfolio domains (.dev, .me, .io, vercel.app, etc.)
        if not portfolio_url:
            # First remove any email addresses so their domain isn't picked up as a portfolio URL
            text_without_emails = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "", text)
            # Find explicit http/https URLs that are not github or linkedin
            http_urls = re.findall(r"https?://[^\s,;|]+", text_without_emails)
            for u in http_urls:
                clean_u = u.strip(".,;:() ")
                if "github.com" not in clean_u.lower() and "linkedin.com" not in clean_u.lower():
                    portfolio_url = clean_u
                    break

            if not portfolio_url:
                port_domain_m = re.search(
                    r"\b(?:https?://)?([a-zA-Z0-9-]+\.(?:dev|me|io|app|tech|co|vercel\.app|netlify\.app|github\.io)(?:/[^\s]*)?)\b",
                    text_without_emails,
                    re.I
                )
                if port_domain_m:
                    val = port_domain_m.group(0).strip(".,;:() ")
                    if not val.startswith("http"):
                        val = "https://" + val
                    if "github.com" not in val.lower() and "linkedin.com" not in val.lower():
                        portfolio_url = val

        return github_url, linkedin_url, portfolio_url

    def _calculate_years_of_experience(self, full_text: str, experience_lines: List[str]) -> int:
        """
        Parses employment date spans (e.g. 2021 - 2024, Jan 2022 - Present)
        and explicitly stated experience to compute aggregate career years.
        """
        current_year = datetime.now().year

        # 1. Parse date ranges
        # Matches: "2020 - 2024", "2021 - Present", "Jan 2019 - March 2022", "06/2018 - 09/2021"
        date_range_pattern = r"(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2}/\d{2,4})\s*['’]?\s*)?(\b(?:19|20)\d{2}\b)\s*[-–—to]+\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2}/\d{2,4})\s*['’]?\s*)?(\b(?:19|20)\d{2}\b|Present|Current|Now|Ongoing)"
        
        target_text = "\n".join(experience_lines) if experience_lines else full_text
        matches = list(re.finditer(date_range_pattern, target_text, re.IGNORECASE))
        
        min_start_year = 9999
        max_end_year = 0
        total_range_years = 0

        for m in matches:
            try:
                start_yr = int(m.group(1))
                end_raw = m.group(2)
                end_yr = current_year if end_raw.lower() in ("present", "current", "now", "ongoing") else int(end_raw)

                if 1980 <= start_yr <= current_year and start_yr <= end_yr <= current_year + 1:
                    min_start_year = min(min_start_year, start_yr)
                    max_end_year = max(max_end_year, end_yr)
                    total_range_years += max(1, end_yr - start_yr)
            except Exception:
                continue

        computed_from_dates = 0
        if min_start_year < 9999 and max_end_year > 0:
            computed_from_dates = max_end_year - min_start_year

        # 2. Check explicit mention of experience years
        explicit_years = 0
        exp_match = re.search(
            r"(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:hands-on\s+)?(?:work\s+|professional\s+|software\s+)?experience",
            full_text,
            re.IGNORECASE
        )
        if exp_match:
            try:
                explicit_years = int(exp_match.group(1))
            except Exception:
                explicit_years = 0

        # Choose the most accurate non-zero signal
        if computed_from_dates > 0 and explicit_years > 0:
            return max(computed_from_dates, explicit_years)
        elif computed_from_dates > 0:
            return computed_from_dates
        elif explicit_years > 0:
            return explicit_years

        # If has experience section with entries but no explicit dates, estimate 1-2 years
        if len(experience_lines) >= 3:
            return 1
        return 0

    def _extract_education(self, full_text: str, education_lines: List[str]) -> Optional[str]:
        """Identifies degrees, certifications, and academic fields."""
        search_text = "\n".join(education_lines) if education_lines else full_text

        # 1. Degree & Major patterns
        degree_patterns = [
            r"((?:Bachelor(?:'s)?|Master(?:'s)?|Doctorate|Doctor|Ph\.D\.|PhD|Associate(?:'s)?|B\.S\.|M\.S\.|B\.A\.|M\.A\.|BSc|MSc|BS|MS)\s+(?:of\s+[A-Za-z\s]+|in\s+[A-Za-z\s]+))",
            r"(Bachelor\s+of\s+Science\s+in\s+[A-Za-z\s]+)",
            r"(Bachelor\s+of\s+Science\s+major\s+in\s+[A-Za-z\s]+)",
            r"(BS\s+(?:Computer\s+Science|Information\s+Technology|Software\s+Engineering|Computer\s+Engineering|Data\s+Science|Information\s+Systems))",
            r"(Computer\s+Science|Software\s+Engineering|Information\s+Technology|Computer\s+Engineering)",
        ]

        for pat in degree_patterns:
            m = re.search(pat, search_text, re.IGNORECASE)
            if m:
                matched_degree = m.group(1).strip()
                # Clean up punctuation and trailing text
                clean_degree = re.split(r"[\n,;–—|]", matched_degree)[0].strip()
                if len(clean_degree) <= 60:
                    words = clean_degree.split()
                    lower_words = {"of", "in", "and", "the", "major"}
                    return " ".join(w.lower() if w.lower() in lower_words and i != 0 else w.capitalize() for i, w in enumerate(words))

        # Check for University mention in education section
        for line in education_lines:
            if re.search(r"\b(?:University|College|Institute|Academy)\b", line, re.I):
                clean_uni = re.sub(r"^[#*–—\s]+", "", line).strip()
                if len(clean_uni) <= 60:
                    return clean_uni

        return None

    def _extract_skills_with_taxonomy(
        self,
        full_text: str,
        skills_lines: List[str],
        experience_lines: List[str],
        years_exp: int
    ) -> List[ParsedResumeSkill]:
        """
        Cross-checks full text and dedicated skills section against standardized SYNONYM_MAP.
        Accurately assigns proficiency, experience years, and is_top_skill flags.
        """
        lower_full = full_text.lower()
        skills_text = " ".join(skills_lines).lower()
        exp_text = " ".join(experience_lines).lower()

        detected_skills: Dict[str, Dict] = {}

        for synonym, canonical in SYNONYM_MAP.items():
            escaped = re.escape(synonym)
            pattern = r"\b" + escaped + r"\b"
            
            in_skills_sec = bool(re.search(pattern, skills_text))
            in_exp_sec = bool(re.search(pattern, exp_text))
            in_full = bool(re.search(pattern, lower_full))

            if in_full or in_skills_sec or in_exp_sec:
                count = len(re.findall(pattern, lower_full))
                if canonical not in detected_skills:
                    detected_skills[canonical] = {
                        "name": canonical,
                        "in_skills_sec": in_skills_sec,
                        "in_exp_sec": in_exp_sec,
                        "count": count,
                        "category": get_skill_category(canonical)
                    }
                else:
                    detected_skills[canonical]["count"] += count
                    if in_skills_sec:
                        detected_skills[canonical]["in_skills_sec"] = True
                    if in_exp_sec:
                        detected_skills[canonical]["in_exp_sec"] = True

        # Sort skills by prominence: in_skills_sec first, then frequency
        sorted_skills = sorted(
            detected_skills.values(),
            key=lambda x: (x["in_skills_sec"], x["in_exp_sec"], x["count"]),
            reverse=True
        )

        results: List[ParsedResumeSkill] = []
        for idx, item in enumerate(sorted_skills):
            is_top = idx < 5
            # Determine proficiency
            if years_exp >= 5 and (item["in_skills_sec"] or item["count"] >= 3):
                prof = "Expert"
            elif (years_exp >= 2 or item["in_skills_sec"] or item["count"] >= 2):
                prof = "Advanced"
            else:
                prof = "Intermediate"

            skill_yrs = max(1, min(years_exp, 10)) if years_exp > 0 else 1

            results.append(
                ParsedResumeSkill(
                    name=item["name"],
                    proficiency_level=prof,
                    years_experience=skill_yrs,
                    is_top_skill=is_top
                )
            )

        return results

    def _extract_target_roles_and_headline(
        self,
        full_text: str,
        header_lines: List[str],
        experience_lines: List[str],
        top_skills: List[str],
        years_exp: int
    ) -> Tuple[List[str], str]:
        """Detects job titles and target roles to formulate a professional headline."""
        lower_full = full_text.lower()
        role_candidates: List[str] = []

        # 1. Check header lines for an explicit title right under the name
        for line in header_lines[1:]:
            clean = re.sub(r"^[#*–—|\s]+", "", line).strip()
            if any(k in clean.lower() for k in ["developer", "engineer", "architect", "designer", "specialist"]):
                if len(clean) <= 60 and not any(x in clean.lower() for x in ["email", "http", "phone"]):
                    role_candidates.append(clean.split("|")[0].strip().title())
                    break

        # 2. Check for canonical role matches in text
        role_rules = [
            (r"\bfull\s*stack\b", "Full Stack Developer"),
            (r"\bfrontend\b|\breact\b|\bvue\b|\bangular\b", "Frontend Developer"),
            (r"\bbackend\b|\bpython\b|\bfastapi\b|\bdjango\b|\bnode\b", "Backend Developer"),
            (r"\bdevops\b|\bkubernetes\b|\bcloud\b|\bdocker\b", "DevOps Engineer"),
            (r"\bmobile\b|\bandroid\b|\bios\b|\bflutter\b|\breact\s+native\b", "Mobile Developer"),
            (r"\bqa\b|\btest\s+automation\b|\bquality\s+assurance\b", "QA Automation Engineer"),
            (r"\bdata\s+engineer\b|\bdata\s+science\b|\bmachine\s+learning\b", "Data Engineer"),
            (r"\bui/ux\b|\bproduct\s+designer\b", "UI/UX Designer"),
            (r"\bsoftware\s+engineer\b", "Software Engineer"),
        ]

        for pattern, role_title in role_rules:
            if re.search(pattern, lower_full):
                if role_title not in role_candidates:
                    role_candidates.append(role_title)

        if not role_candidates:
            role_candidates.append("Software Engineer")

        primary_role = role_candidates[0]

        # Seniority prefix if applicable
        level_prefix = ""
        if years_exp >= 5:
            level_prefix = "Senior "
        elif years_exp <= 1:
            level_prefix = "Junior "

        if level_prefix and not any(primary_role.startswith(p) for p in ["Senior", "Junior", "Lead"]):
            primary_role_display = f"{level_prefix}{primary_role}"
        else:
            primary_role_display = primary_role

        skills_str = ", ".join(top_skills[:3]) if top_skills else "Full Stack Engineering"
        headline = f"{primary_role_display} | {skills_str}"

        return role_candidates, headline

    def _extract_summary(
        self,
        summary_lines: List[str],
        top_role: str,
        years_exp: int,
        top_skills: List[str]
    ) -> str:
        """Extracts genuine summary text if present, or synthesizes a targeted professional summary."""
        if summary_lines:
            cleaned_lines = []
            for line in summary_lines:
                clean = re.sub(r"^[-*•–—\s]+", "", line).strip()
                if clean and not clean.lower().startswith(("summary", "profile", "objective", "about")):
                    cleaned_lines.append(clean)
            extracted = " ".join(cleaned_lines).strip()
            if len(extracted) >= 40:
                # Truncate cleanly to reasonable paragraph length
                return extracted[:400].rsplit(".", 1)[0] + "." if "." in extracted[:400] else extracted[:400]

        skills_phrase = f" specializing in {', '.join(top_skills[:4])}" if top_skills else ""
        exp_phrase = f"{years_exp}+ years of experience" if years_exp > 0 else "solid engineering foundation"
        return f"Results-driven {top_role} with {exp_phrase}{skills_phrase}. Dedicated to architecting robust, scalable web applications and collaborating effectively in modern agile environments."

    # =========================================================================
    # INTERVIEW PREP HEURISTIC (DYNAMIC SKILL-AWARE GENERATION)
    # =========================================================================

    async def generate_interview_prep(
        self,
        job_title: str,
        company: str,
        job_description: str,
        candidate_summary: Optional[str] = None
    ) -> InterviewPrepResponse:
        skills = extract_skills_from_text(job_description)
        tech_questions: List[QuestionAndStarGuide] = []

        # Dynamic technical questions based on detected technologies
        if any(s in skills for s in ["React", "Next.js", "Vue.js", "TypeScript", "JavaScript"]):
            tech_questions.append(
                QuestionAndStarGuide(
                    question=f"How do you manage client-side state, server-side caching, and render performance in modern frontend applications for {company}?",
                    question_type="TECHNICAL",
                    difficulty="Intermediate",
                    concept_tested="Frontend Architecture & React Reconciliation",
                    suggested_answer_points=[
                        "State normalization and selective subscriptions",
                        "SSR / hydration boundaries and Suspense",
                        "Network waterfalls and memoization strategy"
                    ]
                )
            )

        if any(s in skills for s in ["Python", "FastAPI", "Django", "Node.js", "Express.js", "Go", "REST API"]):
            tech_questions.append(
                QuestionAndStarGuide(
                    question=f"When designing REST API endpoints for {company}, how do you ensure zero-downtime database migrations, resilient error handling, and rate limiting?",
                    question_type="TECHNICAL",
                    difficulty="Intermediate",
                    concept_tested="Backend API Design & Distributed Resilience",
                    suggested_answer_points=[
                        "Backward-compatible schema migrations (expand and contract)",
                        "Idempotency keys and RFC 7807 problem details",
                        "Token bucket / sliding window rate limiting"
                    ]
                )
            )

        if any(s in skills for s in ["PostgreSQL", "MySQL", "SQL", "Redis", "MongoDB"]):
            tech_questions.append(
                QuestionAndStarGuide(
                    question="How would you analyze and optimize a query execution plan when dealing with slow database queries under high concurrent load?",
                    question_type="TECHNICAL",
                    difficulty="Intermediate",
                    concept_tested="Database Performance & Indexing Strategy",
                    suggested_answer_points=[
                        "Using EXPLAIN ANALYZE to identify sequential scans",
                        "Covering indexes and composite index column ordering",
                        "Connection pooling and Read Replica offloading"
                    ]
                )
            )

        # Ensure at least 3 high-yield questions
        if len(tech_questions) < 3:
            tech_questions.append(
                QuestionAndStarGuide(
                    question=f"How do you design a scalable test strategy (Unit, Integration, E2E) to maintain confidence without impeding deployment velocity at {company}?",
                    question_type="TECHNICAL",
                    difficulty="Junior",
                    concept_tested="Testing Strategies & Quality Assurance",
                    suggested_answer_points=["Pytest / Jest test suites", "Mocking external network services", "CI/CD automated regression runs"]
                )
            )

        behavioral_questions = [
            QuestionAndStarGuide(
                question=f"Tell me about a time you identified and resolved a critical production bug under tight constraints. How did you handle the situation?",
                question_type="BEHAVIORAL",
                difficulty="Intermediate",
                concept_tested="Problem Solving & Technical Resilience",
                star_guidance={
                    "Situation": "Describe the production incident, symptoms, and immediate business impact.",
                    "Task": "Clarify your individual responsibility in diagnosing the outage.",
                    "Action": "Detail specific logs inspected, reproduction steps, and the tactical fix deployed.",
                    "Result": "State quantifiable recovery metrics and automated regression safeguards added."
                },
                suggested_answer_points=["Calm incident triage", "Root cause isolation", "Long-term regression prevention"]
            ),
            QuestionAndStarGuide(
                question=f"Why are you specifically interested in contributing to {company} as a {job_title}?",
                question_type="BEHAVIORAL",
                difficulty="Junior",
                concept_tested="Company Alignment & Engineering Motivation",
                star_guidance={
                    "Situation": f"Connect your background with {company}'s problem domain and tech stack.",
                    "Task": f"Demonstrate the immediate value and velocity you will bring as a {job_title}.",
                    "Action": "Discuss proactive learning and cross-functional team collaboration.",
                    "Result": "Reiterate commitment to long-term impact and product reliability."
                },
                suggested_answer_points=[f"Interest in {company}'s technical challenges", "Alignment with modern engineering standards", "Enthusiasm for rapid growth"]
            )
        ]

        questions_to_ask = [
            f"What does a successful first 30, 60, and 90 days look like for a new {job_title} on this team?",
            "How does the engineering team balance shipping new features with reducing technical debt and optimizing performance?",
            "What is the current CI/CD deployment cadence, and how does the team conduct architectural code reviews?"
        ]

        key_topics = [
            f"Core principles of {', '.join(skills[:3]) if skills else 'modern full-stack software development'}",
            "Relational database indexing and query optimization",
            "Continuous Integration, automated testing, and clean architecture practices"
        ]

        return InterviewPrepResponse(
            job_title=job_title,
            company=company,
            top_technical_questions=tech_questions[:3],
            top_behavioral_questions=behavioral_questions,
            questions_to_ask_interviewer=questions_to_ask,
            key_topics_to_review=key_topics,
            ai_provider_used="Deterministic Heuristic Fallback Engine"
        )

    # =========================================================================
    # RESUME TAILORING HEURISTIC
    # =========================================================================

    async def tailor_resume(
        self,
        job_title: str,
        company: str,
        job_description: str,
        candidate_resume_text: str
    ) -> ResumeTailorResponse:
        skills = extract_skills_from_text(job_description)
        highlight_skills = skills[:5] if skills else ["REST API", "Database Optimization", "Git & CI/CD", "Clean Architecture"]

        return ResumeTailorResponse(
            job_title=job_title,
            company=company,
            suggested_summary=f"Results-driven {job_title} candidate with proven proficiency in {', '.join(highlight_skills[:3])}. Experienced in building scalable systems and eager to contribute to {company}'s engineering objectives.",
            recommended_bullet_adjustments=[
                {
                    "original": "Built features for web applications and fixed bugs.",
                    "improved": f"Architected and deployed modular web application features leveraging {highlight_skills[0] if highlight_skills else 'modern frameworks'}, enhancing execution speed by 35% and reducing regression defects.",
                    "reason": "Quantifies business impact with measurable metrics and high-impact action verbs."
                },
                {
                    "original": "Worked with databases and API endpoints.",
                    "improved": f"Designed and optimized relational data pipelines and REST API endpoints utilizing {highlight_skills[1] if len(highlight_skills) > 1 else 'SQL'}, reducing query latency by 40% with indexed schema designs.",
                    "reason": "Demonstrates technical depth in backend architecture, schema design, and performance discipline."
                }
            ],
            targeted_skills_to_highlight=highlight_skills,
            cover_letter_draft=f"Dear Hiring Team at {company},\n\nI am writing to express my strong enthusiasm for the {job_title} position. With a solid foundation in {', '.join(highlight_skills[:3])} and a dedication to clean code and high software reliability, I am excited about the opportunity to contribute immediately to {company}'s engineering team.\n\nThank you for your time and consideration. I welcome the opportunity to discuss how my skill set aligns with your goals.\n\nSincerely,\nCandidate",
            ai_provider_used="Deterministic Heuristic Fallback Engine"
        )

    # =========================================================================
    # FOLLOW-UP EMAIL HEURISTIC
    # =========================================================================

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
            body = f"Dear {name},\n\nThank you for taking the time to speak with me today regarding the {job_title} position at {company}. I appreciated learning more about the team's ongoing initiatives.\n\nOur discussion reinforced my enthusiasm about joining {company} and contributing to your technical roadmap. Please don't hesitate to reach out if you need any additional portfolio or background materials from my end.\n\nBest regards,\n{candidate_name}"
        else:
            subject = f"Application Status Check: {job_title} - {candidate_name}"
            body = f"Dear {name},\n\nI hope this email finds you well. I recently submitted my application for the {job_title} position at {company} and wanted to reiterate my strong enthusiasm for the role.\n\nI understand you are currently evaluating candidate applications, but I wanted to briefly check in to see if there are any updates regarding next steps in the hiring process. I would welcome the opportunity to discuss how my technical experience fits the team's needs.\n\nThank you for your time and consideration.\n\nBest regards,\n{candidate_name}"

        return FollowUpEmailGenResponse(
            subject=subject,
            body=body,
            ai_provider_used="Deterministic Heuristic Fallback Engine"
        )
