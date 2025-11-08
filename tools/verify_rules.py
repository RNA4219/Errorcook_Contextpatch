from __future__ import annotations

import json
import os
from typing import List

REPO_RULES = {
    "mypy": {"type": "py", "cmd": ["mypy", "--version"]},
    "ruff": {"type": "py", "cmd": ["ruff", "--version"]},
    "pytest": {"type": "py", "cmd": ["pytest", "--version"]},
}


def detect_rules(root: str) -> List[str]:
    present: List[str] = []
    for name, meta in REPO_RULES.items():
        try:
            import subprocess
            res = subprocess.run(meta["cmd"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
            if res.returncode == 0 and res.stdout.strip():
                present.append(name)
        except Exception:
            continue
    return present


def main() -> None:
    root = os.environ.get("REPO_ROOT", ".")
    rules = detect_rules(root)
    print(json.dumps({"detected_rules": rules}))


if __name__ == "__main__":
    main()
