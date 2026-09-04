import httpx
from typing import Tuple, Optional
from backend.app.core.logging import logger

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "sec-ch-ua": '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-User": "?1",
    "Sec-Fetch-Dest": "document",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

FACEBOOK_HEADERS = {
    "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}


async def fetch_web_content(url: str, timeout: float = 15.0) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Asynchronously fetches the HTML content of a job listing URL with retry & timeout protection.
    Optimized for bot-restricted job boards and social platforms (Facebook, LinkedIn, etc.).
    Returns: (success, html_content_or_none, error_message_or_none)
    """
    is_facebook = any(h in url.lower() for h in ("facebook.com", "fb.com", "fb.watch", "fb.me"))
    primary_headers = FACEBOOK_HEADERS if is_facebook else DEFAULT_HEADERS
    secondary_headers = DEFAULT_HEADERS if is_facebook else FACEBOOK_HEADERS

    async def _try_fetch(headers: dict) -> Tuple[bool, Optional[str], Optional[int], Optional[str]]:
        try:
            async with httpx.AsyncClient(
                headers=headers,
                follow_redirects=True,
                timeout=timeout,
                verify=False
            ) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    return True, response.text, response.status_code, None
                return False, None, response.status_code, f"HTTP {response.status_code}"
        except httpx.TimeoutException:
            return False, None, 408, "Request timed out while trying to reach the job posting."
        except Exception as e:
            return False, None, 500, str(e)

    # 1. Primary Attempt
    success, html, status_code, err_msg = await _try_fetch(primary_headers)
    if success and html:
        return True, html, None

    # 2. Automatic Fallback Retry with secondary headers if blocked or rejected
    if status_code in (400, 401, 403, 405, 406, 500, None):
        success2, html2, status_code2, _ = await _try_fetch(secondary_headers)
        if success2 and html2:
            return True, html2, None

    # Determine user-friendly error message
    if is_facebook:
        return False, None, "Facebook requires authentication to view this post. Please paste the job description text manually."
    elif status_code in (401, 403):
        return False, None, f"Access blocked by job board (HTTP {status_code}). Please paste the job description text manually."
    elif status_code == 404:
        return False, None, "Job posting not found (HTTP 404). It may have expired or been removed."
    else:
        return False, None, err_msg or f"Failed to retrieve page (HTTP {status_code})"
