import sys
from pathlib import Path

# Add project root to sys.path for tests
PROJECT_ROOT = Path(__file__).resolve().parents[1]  # project root (contains lib/ and tests/)
sys.path.insert(0, str(PROJECT_ROOT))
