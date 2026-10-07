"""
FastAPI MCP (Model Context Protocol) Route & Server-Sent Events (SSE) Integration.

Exposes:
- `GET /mcp/info`: Metadata & healthcheck endpoint detailing server version, transport endpoints,
  registered tools, and active guardrails policies.
- `GET /mcp/sse`: Server-Sent Events stream for MCP client connections (Cursor, remote clients).
- `POST /mcp/messages`: JSON-RPC message endpoint paired with the SSE transport stream.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, status
from starlette.types import Scope, Receive, Send

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.mcp.server import mcp_server

try:
    from mcp.server.transport_security import TransportSecuritySettings
except ImportError:
    TransportSecuritySettings = None  # type: ignore

router = APIRouter(prefix="/mcp", tags=["MCP"])

# Configure security settings to allow local connections
_security_settings = (
    TransportSecuritySettings(enable_dns_rebinding_protection=False)
    if TransportSecuritySettings
    else None
)

# Underlying Starlette SSE application created from the FastMCP server instance
sse_app = mcp_server.sse_app(
    sse_path="/sse",
    message_path="/messages/",
    transport_security=_security_settings,
)


@router.get("/info", summary="MCP Server Metadata & Guardrail Policies")
async def get_mcp_info() -> Dict[str, Any]:
    """
    Returns MCP server status, version, transport endpoints, registered tools,
    and active guardrail security policies.
    """
    try:
        tools = await mcp_server.list_tools()
        tool_names = [t.name for t in tools]
        tools_metadata = [
            {
                "name": t.name,
                "description": (t.description or "").strip(),
            }
            for t in tools
        ]
    except Exception as e:
        logger.warning(f"Error enumerating MCP tools: {e}")
        tool_names = [
            "get_candidate_profile",
            "search_jobs",
            "extract_job_url",
            "score_job_match",
            "save_job_to_pipeline",
            "update_application_stage",
            "generate_interview_prep",
            "generate_followup_email",
        ]
        tools_metadata = []

    return {
        "status": "active",
        "server": mcp_server.name,
        "version": settings.VERSION,
        "transport": {
            "sse": f"{settings.API_V1_STR}/mcp/sse",
            "messages": f"{settings.API_V1_STR}/mcp/messages/",
            "stdio_script": "scripts/run_mcp.sh",
        },
        "guardrail_policies": {
            "prompt_injection_defense": True,
            "qualification_threshold": {
                "enabled": True,
                "min_score": 60.0,
                "blocked_badges": ["SKIP", "REJECT", "UNQUALIFIED"],
            },
            "tiered_permissions": {
                "read_actions": "Autonomous",
                "mutation_actions": "Explicit confirmation required (confirm=True)",
            },
        },
        "tools_count": len(tool_names),
        "tools": tool_names,
        "tools_details": tools_metadata,
    }


@router.api_route("/sse", methods=["GET", "HEAD"], summary="MCP Server-Sent Events (SSE) Stream")
async def mcp_sse_endpoint(request: Request):
    """
    SSE stream endpoint for Model Context Protocol clients.
    Bridges incoming GET/HEAD requests to the FastMCP ASGI SSE transport.
    """
    scope = dict(request.scope)
    scope["path"] = "/sse"
    scope["raw_path"] = b"/sse"
    return await sse_app(scope, request.receive, request._send)


@router.api_route(
    "/messages",
    methods=["GET", "POST", "OPTIONS"],
    summary="MCP SSE Client Messages Endpoint",
)
@router.api_route(
    "/messages/{path:path}",
    methods=["GET", "POST", "OPTIONS"],
    include_in_schema=False,
)
async def mcp_messages_endpoint(request: Request, path: str = ""):
    """
    JSON-RPC POST endpoint for client messages paired with an active SSE session.
    """
    scope = dict(request.scope)
    msg_path = f"/messages/{path}" if path else "/messages/"
    if not msg_path.endswith("/") and not path:
        msg_path += "/"
    scope["path"] = msg_path
    scope["raw_path"] = msg_path.encode()
    return await sse_app(scope, request.receive, request._send)
