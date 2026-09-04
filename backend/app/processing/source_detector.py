from urllib.parse import urlparse


def detect_job_source(url: str) -> str:
    """
    Detects the job board or ATS source platform from the job URL.
    """
    if not url:
        return "Manual"
        
    try:
        domain = urlparse(url).netloc.lower()
        
        if "linkedin.com" in domain:
            return "LinkedIn"
        elif "jobstreet" in domain:
            return "JobStreet"
        elif "indeed.com" in domain:
            return "Indeed"
        elif "greenhouse.io" in domain:
            return "Greenhouse"
        elif "lever.co" in domain:
            return "Lever"
        elif "workday.com" in domain or "myworkdayjobs.com" in domain:
            return "Workday"
        elif "workable.com" in domain:
            return "Workable"
        elif "ashbyhq.com" in domain:
            return "Ashby"
        elif "smartrecruiters.com" in domain:
            return "SmartRecruiters"
        elif "glassdoor.com" in domain:
            return "Glassdoor"
        elif "wellfound.com" in domain or "angel.co" in domain:
            return "Wellfound"
        elif any(f in domain for f in ("facebook.com", "fb.com", "fb.watch", "fb.me")):
            return "Facebook"
        elif "ziprecruiter.com" in domain:
            return "ZipRecruiter"
        else:
            return "Company Careers Page"
    except Exception:
        return "Generic Web Page"
