import re
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
from typing import Tuple, Optional, List
import httpx

TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "refid", "trackingid", "trk", "midtoken", "trkemail", "position", "pagenum",
    "f_tpr", "sc", "from", "vjs", "tk", "fbclid", "gclid", "source", "d_source",
    "mibextid", "ref", "__cft__", "__cft__[0]", "__tn__", "rdid", "sfnsn", "paipv",
    "notif_t", "notif_id", "locale", "checkpoint_src", "mc_cid", "mc_eid"
}

KNOWN_ATS_DOMAINS = {
    "greenhouse.io", "boards.greenhouse.io", "lever.co", "jobs.lever.co",
    "myworkdayjobs.com", "ashbyhq.com", "jobs.ashbyhq.com",
    "smartrecruiters.com", "bamboohr.com", "applytojob.com", "workable.com"
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
        
        # Normalize netloc for known social and mobile subdomains
        netloc = parsed.netloc.lower()
        if netloc in ("m.facebook.com", "web.facebook.com", "mobile.facebook.com", "facebook.com"):
            netloc = "www.facebook.com"
        
        # Reconstruct canonical URL (strip trailing slash from path if present)
        clean_path = parsed.path.rstrip("/") if parsed.path != "/" else "/"
        canonical_url = urlunparse((
            parsed.scheme.lower(),
            netloc,
            clean_path,
            parsed.params,
            new_query,
            ""  # strip fragment
        ))
        
        return True, canonical_url, None
    except Exception as e:
        return False, url, f"Error parsing URL: {str(e)}"


async def resolve_redirect_chain_async(
    url: str,
    max_hops: int = 5,
    timeout_sec: float = 8.0
) -> Tuple[str, List[str], Optional[str]]:
    """
    Resolves HTTP 301/302/307/308 redirects asynchronously, recording every hop.
    Returns: (final_url, redirect_chain, primary_application_url_if_detected)
    """
    is_valid, canonical, _ = validate_and_canonicalize_url(url)
    if not is_valid:
        return url, [], None

    current_url = canonical
    chain: List[str] = [current_url]
    primary_app_url: Optional[str] = None

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }

    try:
        async with httpx.AsyncClient(timeout=timeout_sec, follow_redirects=False) as client:
            for _ in range(max_hops):
                try:
                    resp = await client.head(current_url, headers=headers)
                    if resp.status_code in (301, 302, 303, 307, 308):
                        location = resp.headers.get("location")
                        if not location:
                            break
                        # Handle relative redirects
                        if location.startswith("/"):
                            parsed_cur = urlparse(current_url)
                            location = f"{parsed_cur.scheme}://{parsed_cur.netloc}{location}"
                        
                        _, clean_loc, _ = validate_and_canonicalize_url(location)
                        current_url = clean_loc
                        chain.append(current_url)
                        
                        # Detect if location is a direct ATS domain
                        parsed_loc = urlparse(current_url)
                        if any(ats in parsed_loc.netloc.lower() for ats in KNOWN_ATS_DOMAINS):
                            primary_app_url = current_url
                    else:
                        break
                except Exception:
                    break
    except Exception:
        pass

    # If terminal URL is an ATS, set as primary_app_url
    parsed_final = urlparse(current_url)
    if any(ats in parsed_final.netloc.lower() for ats in KNOWN_ATS_DOMAINS):
        primary_app_url = current_url

    return current_url, chain, primary_app_url
