import httpx
from typing import Tuple, Optional
from backend.app.core.logging import logger

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}


async def fetch_web_content(url: str, timeout: float = 15.0) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Asynchronously fetches the HTML content of a job listing URL with retry & timeout protection.
    Returns: (success, html_content_or_none, error_message_or_none)
    """
    try:
        async with httpx.AsyncClient(
            headers=DEFAULT_HEADERS,
            follow_redirects=True,
            timeout=timeout,
            verify=True
        ) as client:
            response = await client.get(url)
            
            if response.status_code == 200:
                return True, response.text, None
            elif response.status_code in (401, 403):
                return False, None, f"Access blocked by job board (HTTP {response.status_code}). Please paste the job description text manually."
            elif response.status_code == 404:
                return False, None, "Job posting not found (HTTP 404). It may have expired or been removed."
            else:
                return False, None, f"Failed to retrieve page (HTTP {response.status_code})"
    except httpx.TimeoutException:
        return False, None, "Request timed out while trying to reach the job posting. Please try pasting the text manually."
    except Exception as e:
        logger.warning(f"Error fetching URL {url}: {str(e)}")
        return False, None, f"Could not access job URL: {str(e)}"
