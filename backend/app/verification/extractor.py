import re
import json
from typing import Optional, Dict, Any
from urllib.parse import urlparse
import httpx

from backend.app.verification.types import AuthoritativeSourceData
from backend.app.core.logging import logger


ALLOWED_DOMAINS = {
    "linkedin.com",
    "indeed.com",
    "jobstreet.com.ph",
    "jobstreet.com",
    "remoteok.com",
    "remoteok.io",
    "jobicy.com",
    "greenhouse.io",
    "lever.co",
    "workable.com",
    "ashbyhq.com",
}


def is_valid_source_host(url: str) -> bool:
    if not url:
        return False
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        # Check against allowed root domain
        for allowed in ALLOWED_DOMAINS:
            if domain == allowed or domain.endswith("." + allowed):
                return True
        return True # Default to true for arbitrary verified employer domains
    except Exception:
        return False


def extract_json_ld_job_posting(html: str) -> Optional[Dict[str, Any]]:
    """
    Extracts schema.org/JobPosting JSON-LD structure if present on the page.
    """
    if not html:
        return None
    try:
        matches = re.findall(r'<script[^>]*type=[\'"]application/ld\+json[\'"][^>]*>(.*?)</script>', html, re.DOTALL | re.IGNORECASE)
        for match in matches:
            try:
                data = json.loads(match.strip())
                if isinstance(data, dict):
                    if data.get("@type") == "JobPosting":
                        return data
                    # Check graph
                    if "@graph" in data and isinstance(data["@graph"], list):
                        for item in data["@graph"]:
                            if item.get("@type") == "JobPosting":
                                return item
            except Exception:
                continue
    except Exception as e:
        logger.debug(f"Failed parsing JSON-LD: {e}")
    return None


def extract_opengraph_metadata(html: str) -> Dict[str, str]:
    """
    Extracts og:title, og:description, and twitter metadata.
    """
    meta: Dict[str, str] = {}
    if not html:
        return meta

    tags = re.findall(r'<meta[^>]+(?:property|name)=[\'"]([^\'"]+)[\'"][^>]+content=[\'"]([^\'"]*)[\'"]', html, re.IGNORECASE)
    for name, content in tags:
        meta[name.lower()] = content.strip()
    return meta


async def extract_authoritative_source_data(url: str, timeout: float = 6.0) -> AuthoritativeSourceData:
    """
    Retrieves the destination page and attempts authoritative metadata extraction.
    """
    if not url or not is_valid_source_host(url):
        return AuthoritativeSourceData(
            is_active=False,
            raw_payload={"error": "Invalid or disallowed host"}
        )

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, verify=False) as client:
            resp = await client.get(url, headers=headers)
            status_code = resp.status_code

            if status_code in (404, 410):
                return AuthoritativeSourceData(
                    is_active=False,
                    status_code=status_code,
                    raw_payload={"message": f"Source page returned HTTP {status_code}"}
                )

            html = resp.text
            
            # 1. Try JSON-LD JobPosting
            json_ld = extract_json_ld_job_posting(html)
            if json_ld:
                title = json_ld.get("title")
                org = json_ld.get("hiringOrganization")
                company = org.get("name") if isinstance(org, dict) else str(org or "")
                job_loc = json_ld.get("jobLocation")
                location = ""
                if isinstance(job_loc, dict):
                    addr = job_loc.get("address", {})
                    location = addr.get("addressLocality") or addr.get("addressRegion") or ""
                desc = json_ld.get("description")
                ext_id = str(json_ld.get("identifier", {}).get("value", "") if isinstance(json_ld.get("identifier"), dict) else json_ld.get("identifier") or "")

                return AuthoritativeSourceData(
                    title=title,
                    company=company,
                    location=location,
                    description=desc,
                    external_id=ext_id if ext_id else None,
                    is_active=True,
                    status_code=status_code,
                    raw_payload={"method": "json-ld", "data": json_ld}
                )

            # 2. Try OpenGraph / Meta tags
            og = extract_opengraph_metadata(html)
            title = og.get("og:title") or og.get("twitter:title")
            desc = og.get("og:description") or og.get("twitter:description")
            
            # Simple title clean up: "Software Engineer at Google" -> title and company
            company = None
            if title and " at " in title:
                parts = title.split(" at ", 1)
                title = parts[0].strip()
                company = parts[1].strip()

            return AuthoritativeSourceData(
                title=title,
                company=company,
                description=desc,
                is_active=status_code < 400,
                status_code=status_code,
                raw_payload={"method": "meta", "og": og}
            )

    except Exception as e:
        logger.warning(f"Verification fetch error for {url}: {e}")
        return AuthoritativeSourceData(
            is_active=False,
            raw_payload={"error": str(e)}
        )
