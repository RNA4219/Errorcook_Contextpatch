import os
import json
from typing import Any, Dict

try:
    import tomllib  # Python 3.11+
except Exception:
    try:
        import tomli as tomllib  # type: ignore
    except Exception:
        tomllib = None  # type: ignore


def _load_toml(path: str) -> Dict[str, Any]:
    if tomllib is None:
        return {}
    try:
        with open(path, "rb") as f:
            return tomllib.load(f) or {}
    except Exception:
        return {}


def _load_json(path: str) -> Dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f) or {}
    except Exception:
        return {}


def _read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def detect_repo_rules(project_root: str) -> Dict[str, bool]:
    """Detect repository configuration rules from common files.

    Returns booleans:
      - mypy_strict, ruff_configured, pytest_configured, node_test, ts_esm
    """
    rules: Dict[str, bool] = {
        "mypy_strict": False,
        "ruff_configured": False,
        "pytest_configured": False,
        "node_test": False,
        "ts_esm": False,
    }

    pyproject_path = os.path.join(project_root, "pyproject.toml")
    if os.path.exists(pyproject_path):
        data = _load_toml(pyproject_path) or {}
        tool = data.get("tool", {}) if isinstance(data.get("tool"), dict) else {}
        if isinstance(tool, dict):
            mypy_section = tool.get("mypy")
            if isinstance(mypy_section, dict) and mypy_section.get("strict") is True:
                rules["mypy_strict"] = True
            if isinstance(tool.get("ruff"), dict) or "ruff" in tool:
                rules["ruff_configured"] = True
            if "pytest" in tool or (isinstance(tool, dict) and isinstance(tool.get("pytest"), dict)):
                rules["pytest_configured"] = True
        if os.path.exists(os.path.join(project_root, "pytest.ini")):
            rules["pytest_configured"] = True
        for fname in ("requirements.txt", "requirements-dev.txt"):
            p = os.path.join(project_root, fname)
            if os.path.exists(p):
                try:
                    text = _read_text(p)
                    if "pytest" in text:
                        rules["pytest_configured"] = True
                    if "ruff" in text:
                        rules["ruff_configured"] = True
                except Exception:
                    pass

    # Fallback simple toml-like checks when toml parser is unavailable or insufficient
    if not any(rules.values()):  # if nothing detected yet, try simple text checks
        try:
            if os.path.exists(pyproject_path):
                text = _read_text(pyproject_path)
                if "[tool.mypy]" in text and "strict" in text:
                    if "true" in text:
                        rules["mypy_strict"] = True
                if "[tool.ruff]" in text or "ruff" in text:
                    rules["ruff_configured"] = True
        except Exception:
            pass

    package_json_path = os.path.join(project_root, "package.json")
    if os.path.exists(package_json_path):
        data = _load_json(package_json_path) or {}
        scripts = data.get("scripts", {}) if isinstance(data.get("scripts"), dict) else {}
        if isinstance(scripts, dict):
            for script in scripts.values():
                if isinstance(script, str) and ("node:test" in script or "node --test" in script or "npm test" in script):
                    rules["node_test"] = True
                    break
        if data.get("type") == "module":
            rules["ts_esm"] = True
        tsconfig_path = os.path.join(project_root, "tsconfig.json")
        if os.path.exists(tsconfig_path):
            try:
                tsdata = _load_json(tsconfig_path) or {}
                compiler_opts = tsdata.get("compilerOptions", {}) if isinstance(tsdata, dict) else {}
                module_opt = str(compiler_opts.get("module", "")).lower()
                if "es" in module_opt:
                    rules["ts_esm"] = True
            except Exception:
                pass

    return rules

