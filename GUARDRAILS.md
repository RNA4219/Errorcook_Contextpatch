# Guardrails
- Enforce `limits.max_files`, `limits.max_patch_hunks`, `token_budget`.
- Deny dangerous proposals (e.g., `fs.rm -rf`, raw SQL concat, setuid changes) unless explicitly allowed.
