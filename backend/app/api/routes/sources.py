from typing import List
from fastapi import APIRouter
from backend.app.sources.registry import source_registry
from backend.app.schemas.search import SourceInfoResponse

router = APIRouter(prefix="/sources", tags=["Job Sources & Health"])


@router.get("", response_model=List[SourceInfoResponse])
async def list_sources():
    """
    Returns registered source adapters with their capabilities, policies, and live health status.
    """
    adapters = source_registry.list_adapters()
    health_list = await source_registry.check_all_health()
    health_map = {h.source_name: h for h in health_list}

    responses: List[SourceInfoResponse] = []
    for adapter in adapters:
        name = adapter.get_source_name()
        policy = adapter.get_policy()
        health = health_map.get(name)

        status_str = health.status if health else "HEALTHY"
        latency = health.latency_ms if health else 0.0
        msg = health.message if health else "Operational"

        responses.append(
            SourceInfoResponse(
                source_name=name,
                display_name=adapter.get_display_name(),
                status=status_str,
                latency_ms=latency,
                message=msg,
                allowed=policy.allowed,
                requires_auth=policy.requires_auth,
                max_requests_per_minute=policy.max_requests_per_minute,
                supports_search=policy.supports_search,
                supports_details=policy.supports_details,
                supports_pagination=policy.supports_pagination,
                description=policy.description,
            )
        )

    return responses
