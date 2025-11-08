# Lightweight repository compliance checker scaffold
"""compliance_checker: basic scaffolding to ensure repository adheres to project rules.

This module provides a pluggable framework for running checks aligned with project
policies described in IMPLEMENTATION_REFERENCE_FILES.md and docs/downsized_cookbook_summary.md.

Note: This is a minimal viable scaffold to enable test-driven development of the
compliance tooling without introducing public API changes.
"""

from __future__ import annotations

from typing import Protocol, List


class Checker(Protocol):
    def run(self) -> bool:  # True if compliant, False otherwise
        ...


class MypyChecker:
    def run(self) -> bool:
        # Placeholder: in real implementation would run mypy locally
        return True


class RuffChecker:
    def run(self) -> bool:
        # Placeholder: in real implementation would run ruff locally
        return True


def all_compliant(checks: List[Checker]) -> bool:
    """Return True if all provided checks report compliance."""
    for c in checks:
        if not c.run():
            return False
    return True


def main() -> int:
    # Simple demonstration entrypoint
    checks: List[Checker] = [MypyChecker(), RuffChecker()]
    ok = all_compliant(checks)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
