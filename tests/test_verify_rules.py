import json
import importlib.util
import sys
from pathlib import Path


def _load_verify_rules_module():
    base = Path(__file__).resolve()
    tools_dir = base.parent / ".." / "tools"
    # Resolve to absolute path
    tools_dir = tools_dir.resolve()
    module_path = tools_dir / "verify_rules.py"
    spec = importlib.util.spec_from_file_location("verify_rules", str(module_path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore
    return mod


def test_detect_rules_runs():
    verify_rules = _load_verify_rules_module()
    # Run the detector in a controlled temp ROOT
    import os
    old_root = os.environ.get("REPO_ROOT")
    os.environ["REPO_ROOT"] = "."
    rules = verify_rules.detect_rules(".")
    assert isinstance(rules, list)
    if old_root is not None:
        os.environ["REPO_ROOT"] = old_root
    else:
        del os.environ["REPO_ROOT"]


def test_detect_rules_parse_output_any():
    verify_rules = _load_verify_rules_module()
    rules = verify_rules.detect_rules(".")
    assert isinstance(rules, list)
