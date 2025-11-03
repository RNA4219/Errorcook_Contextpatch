# アーキテクチャ（概念）
```
Inputs
 ├─ CI Artifacts: JUnit XML / TAP / Vitest JSON / Pytest JUnit / cargo test
 ├─ Static Reports: ESLint, ruff, mypy, clippy, CodeQL summary
 └─ Repo Snapshot: HEAD, last green commit, changed files

Pipeline (spec)
 1) Collect: 失敗ケースの抽出・正規化（共通イベント：FailureItem[]）
 2) Narrow: 依存グラフ/Birdseye-Index で容疑ファイル/範囲を絞る
 3) Prompt: LLMへ "Hypothesis/Suspects/Patch/Tests" を要求（制約プロンプト）
 4) Apply&Verify: パッチ適用→最小テスト実行→再現/回帰確認
 5) Summarize: 結果を JSON/Markdown に統合

Artifacts
 ├─ errorcook.run.json  … 実行スナップショット
 ├─ patch.diff          … Unified Diff（最小差分）
 ├─ tests/*.py|.ts      … 追加テスト
 └─ report/*.md|.html   … 人間可読レポート
```
