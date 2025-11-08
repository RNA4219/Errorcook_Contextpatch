#!/usr/bin/env python3
import sys
import subprocess
import os


def main() -> int:
    cwd = os.getcwd()
    # Minimal CI: run only the verify_rules tests
    try:
        result = subprocess.run(
            ["pytest", "-q", "tests/test_verify_rules.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=cwd,
        )
        print(result.stdout)
        return result.returncode
    except FileNotFoundError:
        print("pytest not found. Please install pytest to run this minimal CI verification.")
        return 2


if __name__ == "__main__":
    sys.exit(main())
