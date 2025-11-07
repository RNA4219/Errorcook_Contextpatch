from __future__ import annotations

import json
import os
from typing import Dict, Optional

try:
    import tomllib  # Python 3.11+
except Exception:  # pragma: no cover
    tomllib = None  # type: ignore


class ComplianceDetector:
    """Repository compliance detector for Python/TS/pytest configurations.

    Detects commonly used config signals for mypy, ruff, pytest and TypeScript `tsconfig.json`.
    The checks are intentionally lightweight and rely on presence of config files and
    simple content checks to avoid external dependencies.
    """

    def __init__(self, root_path: str):
        self.root_path = os.path.abspath(root_path)

    def _join(self, *parts: str) -> str:
        return os.path.join(self.root_path, *parts)

    def _exists(self, relative_path: str) -> bool:
        return os.path.exists(self._join(relative_path))

    def _read_text(self, relative_path: str) -> str:
        with open(self._join(relative_path), encoding="utf-8") as f:
            return f.read()

    def _read_bytes(self, relative_path: str) -> bytes:
        with open(self._join(relative_path), mode="rb") as f:
            return f.read()

    # --- Python config checks ---
    def has_mypy_config(self) -> bool:
        # mypy.ini at root
        if self._exists("mypy.ini"):
            return True
        # pyproject.toml may contain [tool.mypy] or [mypy]
        if self._exists("pyproject.toml"):
            py = self._join("pyproject.toml")
            try:
                if tomllib:
                    with open(py, "rb") as f:
                        data = tomllib.load(f)
                    tool = data.get("tool", {})
                    if "mypy" in tool:
                        return True
                    if "mypy" in data:
                        return True
                else:
                    text = self._read_text("pyproject.toml")
                    if "[tool.mypy]" in text or "[mypy]" in text:
                        return True
            except Exception:
                pass
        # setup.cfg with [mypy]
        if self._exists("setup.cfg"):
            if "[mypy]" in self._read_text("setup.cfg"):
                return True
        return False

    def detect_mypy(self) -> bool:
        return self.has_mypy_config()

    # --- Ruff config checks ---
    def has_ruff_config(self) -> bool:
        if self._exists("pyproject.toml"):
            py = self._join("pyproject.toml")
            try:
                if tomllib:
                    with open(py, "rb") as f:
                        data = tomllib.load(f)
                    tool = data.get("tool", {})
                    if "ruff" in tool:
                        return True
                    if "ruff" in data:
                        return True
                else:
                    text = self._read_text("pyproject.toml")
                    if "[tool.ruff]" in text or "[ruff]" in text:
                        return True
            except Exception:
                pass
        # Common alternate locations
        for fname in (".ruff.toml", "ruff.toml", "ruff.conf"):
            if self._exists(fname):
                return True
        return False

    def detect_ruff(self) -> bool:
        return self.has_ruff_config()

    # --- PyTest config checks ---
    def has_pytest_config(self) -> bool:
        if self._exists("pytest.ini"):
            return True
        if self._exists("pyproject.toml"):
            py = self._join("pyproject.toml")
            try:
                if tomllib:
                    with open(py, "rb") as f:
                        data = tomllib.load(f)
                    tool = data.get("tool", {})
                    # pytest options can appear under [tool.pytest.ini_options]
                    if "pytest" in tool or "ini_options" in data:
                        return True
                else:
                    text = self._read_text("pyproject.toml")
                    if "[tool.pytest.ini_options]" in text:
                        return True
            except Exception:
                pass
        return False

    def detect_pytest(self) -> bool:
        return self.has_pytest_config()

    # --- TypeScript config checks ---
    def has_tsconfig(self) -> bool:
        return self._exists("tsconfig.json")

    def detect_ts_strict(self) -> bool:
        ts_path = self._join("tsconfig.json")
        if not os.path.exists(ts_path):
            return False
        try:
            with open(ts_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            compiler = data.get("compilerOptions", {})
            return bool(compiler.get("strict", False))
        except Exception:
            return False

    # Convenience wrappers
    def detect_all(self) -> Dict[str, bool]:
        return {
            "mypy": self.detect_mypy(),
            "ruff": self.detect_ruff(),
            "pytest": self.detect_pytest(),
            "ts_strict": self.detect_ts_strict(),
        }
