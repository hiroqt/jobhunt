import re
from bs4 import BeautifulSoup


def extract_readable_job_text(html: str) -> str:
    """
    Cleans raw HTML by removing scripts, stylesheets, navigation, headers, and footers,
    and returns clean, structured markdown-like readable text for the parser.
    """
    if not html:
        return ""

    try:
        soup = BeautifulSoup(html, "html.parser")
        
        # Remove noisy elements
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
        text = job_container.get_text(separator="\n", strip=True)
        
        # Clean excessive consecutive newlines and spaces
        cleaned_text = re.sub(r"\n{3,}", "\n\n", text)
        cleaned_text = re.sub(r"[ \t]+", " ", cleaned_text)
        
        # Limit to reasonable token length for AI analysis (~10,000 characters max)
        return cleaned_text[:12000].strip()
    except Exception:
        # Fallback to simple regex strip
        text = re.sub(r"<[^>]+>", " ", html)
        return re.sub(r"\s+", " ", text)[:12000].strip()
