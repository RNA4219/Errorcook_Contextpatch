[Problem Summary]
{{failure_summary}}

[Pytest/JUnit excerpt]
{{ci_snippet}}

[Context Files]
{{file_snippets}}

[Repo Map]
{{repo_birdseye}}

[Limits]
max_patch_hunks = {{limits.max_patch_hunks}}
token_budget    = {{limits.token_budget}}

[Instructions]
1) Hypothesis: concise root cause.
2) Suspects: 1–5 entries {file,line?,reason}.
3) Patch: a unified diff (only python sources or tests) with ≤ max_patch_hunks.
4) Tests: add a pytest file under `tests/` that fails before and passes after the patch.
5) Avoid heavy refactors; no new deps; keep code idiomatic.

[Output]
Return only JSON following `prompts/common/output_schema.json`.
