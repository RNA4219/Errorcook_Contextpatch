[Problem Summary]
{{failure_summary}}

[CI excerpt]
{{ci_snippet}}

[Context Files]
{{file_snippets}}

[Repo Map]
{{repo_birdseye}}

[Limits]
max_patch_hunks = {{limits.max_patch_hunks}}
token_budget    = {{limits.token_budget}}

[Instructions]
1) Identify the most likely root cause (≤ 4 sentences).
2) List 1–5 suspects with file path and optional line; explain briefly.
3) Provide a **unified diff** that changes only what is necessary. Keep hunks ≤ max_patch_hunks.
4) Add 1 minimal test (Vitest preferred) under `tests/` or `__tests__/` that reproduces and verifies the fix.
5) Do not touch package.json or lock files.

[Output]
Return **only one JSON** that conforms to `prompts/common/output_schema.json` with keys:
- hypothesis (string)
- suspects (array of {file,line?,reason})
- patch { unified_diff, hunk_count }
- tests (array of { path, content, purpose? })
