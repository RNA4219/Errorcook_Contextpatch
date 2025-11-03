# ErrorCook ContextPatch 設計資料分析報告

**作成日**: 2025-11-03 17:33  
**分析対象**: プロジェクト内設計資料

## 確認した設計ファイル

### 1. docs/design.md
- **内容**: Monorepo with three packages. Local LLM friendly.
- **分析**: 非常にシンプルな構成説明
- **実装示唆**: 3パッケージ構成、ローカルLLM対応の軽量設計

### 2. SPECS/architecture.md - アーキテクチャ設計
```mermaid
パイプライン設計（5段階）:
1) Collect: 失敗ケースの抽出・正規化（FailureItem[]）
2) Narrow: 依存グラフ/Birdseye-Index で容疑ファイル/範囲を絞る
3) Prompt: LLMへ "Hypothesis/Suspects/Patch/Tests" を要求
4) Apply&Verify: パッチ適用→最小テスト実行→再現/回帰確認
5) Summarize: 結果を JSON/Markdown に統合
```

#### 入力ソース
- CI Artifacts: JUnit XML / TAP / Vitest JSON / Pytest JUnit / cargo test
- Static Reports: ESLint, ruff, mypy, clippy, CodeQL summary
- Repo Snapshot: HEAD, last green commit, changed files

#### 成果物
- errorcook.run.json … 実行スナップショット
- patch.diff … Unified Diff（最小差分）
- tests/*.py|.ts … 追加テスト
- report/*.md|.html … 人間可読レポート

### 3. SPECS/interfaces.md - インターフェイス設計
#### 入力（FailureItem標準化）
```typescript
{
  tool: "pytest" | "vitest" | "jest" | "mypy" | "eslint" | "clippy" | "cargo_test" | "go_test",
  path: string,                    // ファイル/テストケース位置
  message: string,                 // エラーメッセージ（短）
  details: string,                 // スタック/ログ（長）
  severity: "error" | "warning",
  meta: object                     // 行番号・ルールID・ハッシュ等
}
```

#### 出力（厳格JSON）
- Hypothesis/Suspects/Patch/Tests スキーマ（SCHEMAS/output.schema.json参照）
- patch.diff: Unified Diff
- tests/*: 最小再現テスト＋回帰防止テスト

### 4. workflow-cookbook-compact/docs/DESIGN.md - ワークフロー設計
#### 構成
- `docs/` : テンプレートと成果物ドキュメント、CI存在チェック
- `examples/` : 実行可能なワークフロースニペット
- `tools/` : チェックリスト生成や検証スクリプト

#### データフロー
- YAML/JSON サンプル + Markdown 記述
- 必須キー（name, inputs, outputs, retryable）保持

#### 運用
- 成功: テンプレート→要件→仕様→設計→実装→検証の順序
- 失敗: CIが欠落検知→該当ファイル作成/更新→再実行

### 5. workflow-cookbook-compact/docs/BLUEPRINT.md - 藍図テンプレート
#### 構造
1. Problem Statement（問題文）
2. Scope（スコープ: In/Out）
3. Constraints/Assumptions（制約/前提）
4. I/O Contract（入出力契約）
5. Minimal Flow（Mermaid図）
6. Interfaces（CLI/API/Files）

## 設計分析結果

### ✅ 設計の統一性
- **全体アーキテクチャ**: 5段階パイプラインで一貫
- **インターフェース**: FailureItem標準化で統一
- **出力形式**: JSON/Markdownでの構造化出力

### 🔍 実装準備完了度
- **アーキテクチャ**: 概念レベル完成、実装設計に十分
- **インターフェース**: データ構造定義完了、型安全実装可能
- **ワークフロー**: CI統合含め運用の詳細設計完了

### 📋 次ステップ方向性
1. **詳細設計**: 5段階パイプラインの各ステップ実装詳細
2. **テスト戦略**: 各段階のユニット・統合テスト設計
3. **CI統合**: 継続的統合システムの構築

## 総合評価

### 強み
- 明確な5段階パイプライン設計
- 標準化されたインターフェース定義
- CI統合運用の考慮

### 実装への示唆
- **段階的実装**: パイプラインの各段階を独立実装
- **モジュール設計**: パッケージ間依存の最小化
- **テスト駆動**: 各段階のテスト可能性を前提とした設計

**結論**: 設計資料は実装準備として十分な完成度。実装フェーズ移行準備完了。
