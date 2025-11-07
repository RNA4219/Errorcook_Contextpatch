import json
import os
from pathlib import Path

from tools.compliance_checker import ComplianceDetector


def test_detect_all_no_config(tmp_path: Path):
    # Create an isolated empty workspace
    root = tmp_path
    det = ComplianceDetector(str(root))
    results = det.detect_all()
    assert isinstance(results, dict)
    assert results["mypy"] is False
    assert results["ruff"] is False
    assert results["pytest"] is False
    assert results["ts_strict"] is False


def test_detect_mypy_pyproject(tmp_path: Path):
    root = tmp_path
    (root / "pyproject.toml").write_text("""[tool.mypy]\nignore_missing_imports = true\n""")
    det = ComplianceDetector(str(root))
    assert det.detect_mypy() is True


def test_detect_tsconfig_strict(tmp_path: Path):
    root = tmp_path
    (root / "tsconfig.json").write_text("""{\n  \"compilerOptions\": {\n    \"strict\": true\n  }\n}\n""")
    det = ComplianceDetector(str(root))
    assert det.detect_ts_strict() is True
