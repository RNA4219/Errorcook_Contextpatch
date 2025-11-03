# Evaluation (Acceptance Criteria)

- AC-001: 1 failure → 1 patch → 1 added test → green (TS/JS/Python/Rust minimal set).
- AC-002: token_budget ≤ 1200 (7B〜13B) でパッチ成立。
- AC-003: `.ctxpack`のみで再現可能（オフライン）。
- AC-004: NightShift は赤を撤回、緑のみコミット化。
