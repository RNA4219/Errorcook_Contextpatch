# インターフェイス（I/O）

## 入力（標準化）
- `FailureItem`:
  - `tool`: "pytest" | "vitest" | "jest" | "mypy" | "eslint" | "clippy" | "cargo_test" | "go_test" | etc.
  - `path`: ファイル/テストケース位置
  - `message`: エラーメッセージ（短）
  - `details`: スタック/ログ（長）
  - `severity`: "error" | "warning"
  - `meta`: 行番号・ルールID・ハッシュ 等

## 出力（厳格JSON）
- `Hypothesis/Suspects/Patch/Tests` スキーマは `SCHEMAS/output.schema.json` を参照。
- `patch.diff`: Unified Diff（ファイル/ハンク/行）
- `tests/*`: 最小再現テスト＋回帰防止テスト（1症状=1テスト原則）
