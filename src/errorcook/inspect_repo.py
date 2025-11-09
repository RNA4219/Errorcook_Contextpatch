from typing import Dict
import os


def detect_tools(repo_path: str) -> Dict[str, bool]:
    has_mypy_config: bool = False
    pyproject_path = os.path.join(repo_path, "pyproject.toml")
    if os.path.exists(pyproject_path):
        try:
            with open(pyproject_path, "r", encoding="utf-8") as f:
                text = f.read()
            if "[tool.mypy]" in text:
                has_mypy_config = True
        except Exception:
            pass

    has_node_tests: bool = False
    package_json_path = os.path.join(repo_path, "package.json")
    if os.path.exists(package_json_path):
        try:
            with open(package_json_path, "r", encoding="utf-8") as f:
                content = f.read().lower()
            if "jest" in content:
                has_node_tests = True
        except Exception:
            pass

    tests_dir_present: bool = False
    tests_dir = os.path.join(repo_path, "tests")
    if os.path.isdir(tests_dir):
        tests_dir_present = True

    return {
        "has_mypy_config": has_mypy_config,
        "has_node_tests": has_node_tests,
        "tests_directory_present": tests_dir_present,
    }
