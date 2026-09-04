import sys
from pathlib import Path

# Ensure project root is in sys.path so 'backend' can be imported whether run from root or backend/
_backend_dir = Path(__file__).resolve().parent.parent
_project_root = _backend_dir.parent
for _p in [str(_project_root), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)
