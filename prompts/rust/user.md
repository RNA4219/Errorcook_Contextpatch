[Problem Summary]
{{failure_summary}}

[cargo test excerpt]
{{ci_snippet}}

[Context Files]
{{file_snippets}}

[Repo Map]
{{repo_birdseye}}

[Limits]
max_patch_hunks = {{limits.max_patch_hunks}}
token_budget    = {{limits.token_budget}}

[Instructions]
1) Hypothesis: 2–4 sentences.
2) Suspects: 1–5 entries {file,line?,reason}.
3) Patch: unified diff for `.rs` files only, ≤ max_patch_hunks.
4) Tests: add/modify a minimal `#[test]` in the appropriate module to verify the fix.
5) Do not change Cargo.toml/Cargo.lock.

[Output]
Only JSON following `prompts/common/output_schema.json`.
