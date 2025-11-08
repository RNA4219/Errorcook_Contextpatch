import json
import os
from pathlib import Path
import subprocess
import sys
import inspect

import pytest

from verify_rules import generate_report, locate_configs


def test_locate_configs_empty(tmp_path: Path):
    root = tmp_path / "repo"
    root.mkdir()
    cfgs = locate_configs(root)
    assert isinstance(cfgs, list)
    # no configs exist yet
    assert cfgs == []


def test_generate_report_with_no_configs(tmp_path: Path, monkeypatch):
    root = tmp_path / "repo2"
    root.mkdir()
    rep = generate_report(str(root))
    assert isinstance(rep, dict)
    assert isinstance(rep.get("configs"), list)


def test_tool_detection_basic(tmp_path: Path, monkeypatch):
    root = tmp_path / "repo3"
    root.mkdir()
    rep = generate_report(str(root))
    tools = rep.get("tools_available", {})
    # The test environment may or may not have tools installed; ensure keys exist
    for t in ["ruff", "mypy", "pytest"]:
        assert t in tools
