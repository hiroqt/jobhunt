from typing import Dict, List, Optional
from backend.app.sources.base import JobSourceAdapter, SourceHealth
from backend.app.sources.adapters.remoteok import RemoteOKAdapter
from backend.app.sources.adapters.linkedin import LinkedInAdapter
from backend.app.sources.adapters.indeed import IndeedAdapter
from backend.app.sources.adapters.jobstreet import JobStreetAdapter
from backend.app.sources.adapters.public_careers import PublicCareersAdapter
from backend.app.sources.adapters.kalibrr import KalibrrAdapter
from backend.app.sources.adapters.onlinejobs import OnlineJobsAdapter
from backend.app.sources.adapters.bossjob import BossjobAdapter
from backend.app.sources.adapters.philjobnet import PhilJobNetAdapter


class SourceRegistry:
    """
    Registry for managing all supported job source adapters.
    Ensures modularity and safe runtime discovery.
    """

    def __init__(self):
        self._adapters: Dict[str, JobSourceAdapter] = {}
        self._register_default_adapters()

    def _register_default_adapters(self):
        self.register(RemoteOKAdapter())
        self.register(LinkedInAdapter())
        self.register(IndeedAdapter())
        self.register(JobStreetAdapter())
        self.register(KalibrrAdapter())
        self.register(OnlineJobsAdapter())
        self.register(BossjobAdapter())
        self.register(PhilJobNetAdapter())
        self.register(PublicCareersAdapter())

    def register(self, adapter: JobSourceAdapter):
        self._adapters[adapter.get_source_name().lower()] = adapter

    def get_adapter(self, source_name: str) -> Optional[JobSourceAdapter]:
        return self._adapters.get(source_name.lower())

    def list_adapters(self) -> List[JobSourceAdapter]:
        return list(self._adapters.values())

    def get_source_names(self) -> List[str]:
        return list(self._adapters.keys())

    async def check_all_health(self) -> List[SourceHealth]:
        health_results: List[SourceHealth] = []
        for adapter in self._adapters.values():
            try:
                h = await adapter.health_check()
                health_results.append(h)
            except Exception as e:
                health_results.append(
                    SourceHealth(
                        source_name=adapter.get_source_name(),
                        status="DEGRADED",
                        latency_ms=0.0,
                        message=f"Health check exception: {str(e)}"
                    )
                )
        return health_results


# Global registry instance
source_registry = SourceRegistry()
