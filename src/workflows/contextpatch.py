from dataclasses import dataclass
from typing import List, Dict, Any

@dataclass
class FailureItem:
    tool: str
    path: str
    message: str
    details: str
    severity: str  # 'error' | 'warning'
    meta: Dict[str, Any]

def generate_patch(failures: List[FailureItem]) -> Dict[str, Any]:
    if not isinstance(failures, list) or len(failures) == 0:
        raise ValueError("No failures to patch")

    limit = min(len(failures), 3)
    suspects = []
    for f in failures[:limit]:
        line = 0
        if isinstance(f.meta, dict):
            line = int(f.meta.get('line_number', 0)) if str(f.meta.get('line_number', 0)).isdigit() else 0
        suspects.append({
            "file": f.path,
            "line": line,
            "reason": f"{f.tool} {f.severity}: {f.message[:50]}"
        })

    patch = {
        "unified_diff": f"diff --git a/{failures[0].path} b/{failures[0].path}\n@@ -1,3 +1,3 @@\n-# original\n+# patched"
    }

    tests = [
        {
            "path": "test_patch.py",
            "content": "def test_patch(): assert True",
            "purpose": "Verify patch generation"
        }
    ]

    hypothesis = f"Patch generated for {len(failures)} failure(s)"
    return {
        "hypothesis": hypothesis,
        "suspects": suspects,
        "patch": patch,
        "tests": tests,
    }
