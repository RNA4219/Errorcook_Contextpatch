CI minimal verification plan
- Purpose: verify rules with minimal scope using pytest on tests/test_verify_rules.py
- Tools: pytest
- Steps:
  1. Ensure dependencies installed (pytest)
  2. Run: python ci_min_verify.py
  3. Expect exit code 0 for pass, non-zero for failure
- Outputs: prints pytest output; CI can parse return code for status
- Notes: This does not replace full CI, but provides a quick green-path check.