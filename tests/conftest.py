import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
# Ensure project root and tools dir are on PYTHONPATH for imports like `verify_rules`
paths = [str(PROJECT_ROOT), str(PROJECT_ROOT / 'tools')]
for p in paths:
    if p not in sys.path:
        sys.path.insert(0, p)
