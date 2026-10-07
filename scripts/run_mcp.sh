#!/usr/bin/env bash
# ==============================================================================
# Job Hunt Pipeline - Model Context Protocol (MCP) Server Runner
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Activate Python Virtual Environment
VENV_PYTHON="${PROJECT_ROOT}/backend/.venv/bin/python"

if [[ ! -x "${VENV_PYTHON}" ]]; then
    echo "Error: Python executable not found at ${VENV_PYTHON}" >&2
    exit 1
fi

export PYTHONPATH="${PROJECT_ROOT}:${PROJECT_ROOT}/backend:${PYTHONPATH:-}"

# Launch MCP server in stdio mode by default
exec "${VENV_PYTHON}" -m backend.app.mcp.server "$@"
