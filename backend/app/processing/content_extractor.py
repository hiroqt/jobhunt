import re
import json
from typing import Optional, Dict, Any
from bs4 import BeautifulSoup

AUTH_WALL_PATTERNS = [
    "log in or sign up to view",
    "see posts, photos and more on facebook",
    "log in to facebook",
    "mag-log in o mag-sign up",
    "makakita ng mga post, litrato at marami pa sa facebook",
    "you must log in to continue",
    "sign up for facebook",
    "join facebook to connect",
    "sign in with linkedin",
    "please log in to continue",
    "login required to view this post",
]


def is_auth_wall_text(text: str) -> bool:
    """
    Checks if extracted text represents an authentication or login wall
    rather than genuine job posting details.
    """
    if not text:
        return False
    lower = text.lower().strip()
    # Check if any auth wall pattern matches
    for pattern in AUTH_WALL_PATTERNS:
        if pattern in lower:
            # If the entire text is very short (< 300 chars) or matches login boilerplate
            if len(lower) < 350 or ("log in" in lower and "password" in lower):
                return True
    return False


def extract_readable_job_text(html: str) -> str:
    """
    Cleans raw HTML by removing scripts, stylesheets, navigation, headers, and footers,
    extracts rich OpenGraph, JSON-LD, and meta tags, and returns clean, structured
    readable text for AI analysis.
    """
    if not html:
        return ""

    try:
        soup = BeautifulSoup(html, "html.parser")
        
        # 1. Harvest OpenGraph and Meta tags before decomposing head
        meta_title = None
        meta_desc = None
        
        og_title = soup.find("meta", property=re.compile(r"^(?:og:title|twitter:title)$", re.I))
        if og_title and og_title.get("content"):
            meta_title = og_title["content"].strip()
            
        og_desc = soup.find("meta", property=re.compile(r"^(?:og:description|twitter:description)$", re.I))
        if not og_desc:
            og_desc = soup.find("meta", attrs={"name": re.compile(r"^description$", re.I)})
        if og_desc and og_desc.get("content"):
            meta_desc = og_desc["content"].strip()

        # 2. Harvest JSON-LD JobPosting schema if present
        json_ld_text = ""
        for script in soup.find_all("script", attrs={"type": re.compile(r"application/ld\+json", re.I)}):
            try:
                data = json.loads(script.string or "")
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if isinstance(item, dict):
                        target = item
                        if "@graph" in item and isinstance(item["@graph"], list):
                            for g in item["@graph"]:
                                if isinstance(g, dict) and g.get("@type") == "JobPosting":
                                    target = g
                                    break
                        if target.get("@type") == "JobPosting":
                            parts = []
                            if target.get("title"):
                                parts.append(f"Job Title: {target['title']}")
                            hiring_org = target.get("hiringOrganization")
                            if isinstance(hiring_org, dict) and hiring_org.get("name"):
                                parts.append(f"Company: {hiring_org['name']}")
                            if target.get("description"):
                                parts.append(f"Description:\n{target['description']}")
                            if parts:
                                json_ld_text = "\n\n".join(parts)
                                break
            except Exception:
                continue

        # 3. Remove noisy elements from body
        for element in soup(["script", "style", "nav", "footer", "header", "noscript", "svg", "iframe", "button", "input", "form"]):
            element.decompose()
            
        # Target common job posting containers if present
        job_container = (
            soup.find(class_=re.compile(r"job[-_]?description|job[-_]?details|description|content|posting", re.I))
            or soup.find(id=re.compile(r"job[-_]?description|job[-_]?details|description|content|posting", re.I))
            or soup.find("article")
            or soup.find("main")
            or soup.body
            or soup
        )
        
        # Extract text with line breaks preserved
        body_text = job_container.get_text(separator="\n", strip=True) if job_container else ""
        
        # Combine extracted sections
        combined_parts = []
        if json_ld_text:
            combined_parts.append(json_ld_text)
        
        # Include meta title and description if useful and not auth wall
        if meta_title and not is_auth_wall_text(meta_title):
            combined_parts.append(f"Title: {meta_title}")
        if meta_desc and not is_auth_wall_text(meta_desc):
            combined_parts.append(f"Summary / Post Content:\n{meta_desc}")
            
        if body_text and not is_auth_wall_text(body_text):
            combined_parts.append(body_text)

        # Fallback if combined_parts is empty but body_text exists
        if not combined_parts and body_text:
            combined_parts.append(body_text)

        full_text = "\n\n".join(combined_parts)
        
        # Clean excessive consecutive newlines and spaces
        cleaned_text = re.sub(r"\n{3,}", "\n\n", full_text)
        cleaned_text = re.sub(r"[ \t]+", " ", cleaned_text)
        
        # Limit to reasonable token length for AI analysis (~12,000 characters max)
        return cleaned_text[:12000].strip()
    except Exception:
        # Fallback to simple regex strip
        text = re.sub(r"<[^>]+>", " ", html)
        return re.sub(r"\s+", " ", text)[:12000].strip()

