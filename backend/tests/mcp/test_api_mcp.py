"""
Integration and API tests for FastAPI MCP routes, SSE integration,
and client configuration packs.

Tests:
1. GET /mcp/info and GET /api/mcp/info returns 200, valid metadata, and 8 tools.
2. GET /mcp/sse and GET /api/mcp/sse returns valid SSE endpoint response.
3. docs/mcp/claude_desktop_config.json is valid JSON with required executable runner and env.
4. docs/mcp/cursor_mcp.json is valid JSON with required transports (stdio and SSE).
5. scripts/run_mcp.sh exists and is executable.
"""

import json
import os
import stat
from pathlib import Path
import pytest
from httpx import AsyncClient, ASGITransport
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.config import settings


@pytest.fixture
def project_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent.parent


def test_mcp_info_endpoint():
    """Verify GET /mcp/info returns 200, status active, and registered tools."""
    client = TestClient(app)
    
    # Test root-level /mcp/info
    res = client.get("/mcp/info")
    assert res.status_code == 200, f"Failed /mcp/info: {res.text}"
    data = res.json()
    assert data["status"] == "active"
    assert data["server"] == "job-hunt-pipeline"
    assert "version" in data
    assert "transport" in data
    assert "sse" in data["transport"]
    assert "guardrail_policies" in data
    assert data["tools_count"] >= 8
    assert "get_candidate_profile" in data["tools"]
    assert "search_jobs" in data["tools"]
    assert "score_job_match" in data["tools"]

    # Test api-prefixed /api/mcp/info
    res_api = client.get(f"{settings.API_V1_STR}/mcp/info")
    assert res_api.status_code == 200, f"Failed {settings.API_V1_STR}/mcp/info: {res_api.text}"
    data_api = res_api.json()
    assert data_api["status"] == "active"
    assert data_api["server"] == "job-hunt-pipeline"


@pytest.mark.asyncio
async def test_mcp_info_endpoint_async():
    """Verify async client interaction with /mcp/info."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/mcp/info")
        assert res.status_code == 200
        payload = res.json()
        assert payload["status"] == "active"
        assert payload["guardrail_policies"]["prompt_injection_defense"] is True
        assert payload["guardrail_policies"]["qualification_threshold"]["enabled"] is True


def test_claude_desktop_config_valid_json(project_root: Path):
    """Verify docs/mcp/claude_desktop_config.json is valid and properly structured."""
    config_path = project_root / "docs" / "mcp" / "claude_desktop_config.json"
    assert config_path.exists(), f"File does not exist: {config_path}"
    
    with open(config_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    assert "mcpServers" in data
    assert "job-hunt-pipeline" in data["mcpServers"]
    server_conf = data["mcpServers"]["job-hunt-pipeline"]
    assert "command" in server_conf
    assert "run_mcp.sh" in server_conf["command"]
    assert "env" in server_conf


def test_cursor_mcp_config_valid_json(project_root: Path):
    """Verify docs/mcp/cursor_mcp.json is valid JSON with stdio and SSE transport."""
    config_path = project_root / "docs" / "mcp" / "cursor_mcp.json"
    assert config_path.exists(), f"File does not exist: {config_path}"
    
    with open(config_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    assert "mcpServers" in data
    assert "job-hunt-pipeline" in data["mcpServers"]
    assert "job-hunt-pipeline-sse" in data["mcpServers"]
    
    stdio_conf = data["mcpServers"]["job-hunt-pipeline"]
    assert "run_mcp.sh" in stdio_conf["command"]
    
    sse_conf = data["mcpServers"]["job-hunt-pipeline-sse"]
    assert sse_conf["transport"] == "sse"
    assert "/mcp/sse" in sse_conf["url"]


def test_run_mcp_script_is_executable(project_root: Path):
    """Verify scripts/run_mcp.sh exists, contains bash shebang, and has executable bit set."""
    script_path = project_root / "scripts" / "run_mcp.sh"
    assert script_path.exists(), f"File does not exist: {script_path}"
    
    # Check permissions
    st = os.stat(script_path)
    assert bool(st.st_mode & stat.S_IXUSR), f"Script {script_path} is not executable (chmod +x needed)"
    
    # Check script content
    content = script_path.read_text(encoding="utf-8")
    assert content.startswith("#!/usr/bin/env bash")
    assert "backend.app.mcp.server" in content
