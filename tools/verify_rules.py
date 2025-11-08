#!/usr/bin/env python3
from __future__ import annotations

"""
Rule verification utility.
- Detects presence of common config files (mypy, mypy.toml, pyproject.toml, setup.cfg, tox.ini, Ruff config).
- Checks availability of common tooling (ruff, mypy, pytest) when possible.
- Exposes a small CLI and a produceable report suitable for tests.

Note: This script is intentionally lightweight and focused on visibility of project-wide rule usage.
"""
from pathlib import Path
import json
import subprocess
from typing import Dict, List, Optional

CONFIG_FILES: List[str] = [
    "pyproject.toml",
    "mypy.ini",
    "mypy.toml",
    "setup.cfg",
    "tox.ini",
    "ruff.toml",
    ".ruff.toml",
    ".ruff.yml",
]

TOOLS: List[str] = ["ruff", "mypy", "pytest"]


def locate_configs(root: Path) -> List[str]:
    """Return absolute paths to existing known config files under root."""
    found: List[str] = []
    for name in CONFIG_FILES:
        p = root / name
        if p.exists():
            found.append(str(p.resolve()))
    return found


def can_run(cmd: List[str]) -> bool:
    """Safely check if a tool is available by querying its version.
    Returns True if the command exists and returns successfully, False otherwise.
    """
    if not cmd:
        return False
    try:
        subprocess.run([cmd[0], "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except Exception:
        return False


def detect_tools() -> Dict[str, bool]:
    """Return a mapping of tool name -> availability."""
    results: Dict[str, bool] = {}
    for t in TOOLS:
        results[t] = can_run([t])
    return results


def generate_report(root_path: Optional[str] = None) -> Dict[str, object]:
    """Generate a report for the given repository root.

    If root_path is None, attempts to locate the repository root by assuming this script
    sits under <root>/tools/verify_rules.py and going two levels up.
    This behavior is kept simple for testing; production usage may enhance root discovery.
    """
    if root_path is None:
        cfg_root = Path(__file__).resolve().parents[2]
    else:
        cfg_root = Path(root_path).resolve()
    report: Dict[str, object] = {
        "root": str(cfg_root),
        "configs": locate_configs(cfg_root),
        "tools_available": detect_tools(),
    }
    return report


def main() -> None:
    import sys
    root = None
    if len(sys.argv) > 1:
        root = sys.argv[1]
    report = generate_report(root)
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
