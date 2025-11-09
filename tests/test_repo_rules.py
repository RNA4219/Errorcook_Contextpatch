import os
import json
from tools.repo_rules import detect_repo_rules


def test_detect_minimal_repository(tmp_path):
    root = tmp_path
    # minimal project with none of the tools configured
    open(os.path.join(root, "pyproject.toml"), "w").close()
    open(os.path.join(root, "package.json"), "w").close()
    rules = detect_repo_rules(str(root))
    assert rules["mypy_strict"] is False
    assert rules["ruff_configured"] is False
    assert rules["pytest_configured"] is False
    assert rules["node_test"] is False
    assert rules["ts_esm"] is False


def test_detect_with_pyproject_and_package_json(tmp_path):
    root = tmp_path
    with open(os.path.join(root, "pyproject.toml"), "wb") as f:
        f.write(b"""
[tool.mypy]
strict = true
[tool.ruff]
""".strip())
    with open(os.path.join(root, "package.json"), "w") as f:
        f.write(json.dumps({"type": "module", "scripts": {"test": "node test.js"}}))
    rules = detect_repo_rules(str(root))
    assert rules["mypy_strict"] is True
    assert rules["ts_esm"] is True
    assert rules["node_test"] is False
