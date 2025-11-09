import json
from pathlib import Path

import importlib.util\nfrom pathlib import Path\n\n# Dynamically load the target module from its file path to avoid import path issues\nmodule_path = Path(__file__).resolve().parents[1] / 'src' / 'errorcook' / 'inspect_repo.py'\nspec = importlib.util.spec_from_file_location('inspect_repo', str(module_path))\nmod = importlib.util.module_from_spec(spec)\nspec.loader.exec_module(mod)\ndetect_tools = getattr(mod, 'detect_tools')


def test_detect_tools_positive(tmp_path):
    repo = tmp_path
    # Prepare a minimal repo structure that mimics tooling hints
    (repo / "pyproject.toml").write_text("[tool.mypy]\n")
    (repo / "package.json").write_text('{"dependencies": {"jest": "^26.0.0"}}')
    (repo / "requirements.txt").write_text("")
    (repo / "tests").mkdir()
    (repo / "tests" / "test_example.py").write_text("def test_dummy(): pass\n")

    res = detect_tools(str(repo))
    assert res["has_mypy_config"] is True
    assert res["has_node_tests"] is True
    assert res["tests_directory_present"] is True


def test_detect_tools_negative(tmp_path):
    repo = tmp_path
    (repo / "pyproject.toml").write_text("")
    (repo / "package.json").write_text("{}")
    res = detect_tools(str(repo))
    assert res["has_mypy_config"] is False
    assert res["has_node_tests"] is False
    assert res["tests_directory_present"] is False
