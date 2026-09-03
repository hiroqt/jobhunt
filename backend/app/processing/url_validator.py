import re
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
from typing import Tuple, Optional


TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "refid", "trackingid", "trk", "midtoken", "trkemail", "position", "pagenum",
    "f_tpr", "sc", "from", "vjs", "tk", "fbclid", "gclid", "source"
}


def validate_and_canonicalize_url(url: str) -> Tuple[bool, str, Optional[str]]:
    """
    Validates a job URL, cleans tracking parameters, and returns canonicalized URL.
    Returns: (is_valid, cleaned_url, error_message)
    """
    if not url or not isinstance(url, str):
        return False, "", "URL is empty or invalid"
    
    url = url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        url = "https://" + url

    try:
        parsed = urlparse(url)
        if not parsed.netloc or "." not in parsed.netloc or " " in parsed.netloc or "@" in parsed.netloc:
            return False, url, "Invalid domain in URL"
        
        # Clean tracking query parameters
        query_params = parse_qs(parsed.query, keep_blank_values=False)
        cleaned_params = {k: v for k, v in query_params.items() if k.lower() not in TRACKING_PARAMS}
        new_query = urlencode(cleaned_params, doseq=True)
        
        # Reconstruct canonical URL (strip trailing slash from path if present)
        clean_path = parsed.path.rstrip("/") if parsed.path != "/" else "/"
        canonical_url = urlunparse((
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            clean_path,
            parsed.params,
            new_query,
            "" # strip fragment
        ))
        
        return True, canonical_url, None
    except Exception as e:
        return False, url, f"Error parsing URL: {str(e)}"
