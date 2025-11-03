# ErrorCook ContextPatch 実装計画書

**作成日**: 2025-11-03 17:33  
**対象フェーズ**: v0.1 → v0.3実装計画

## 1. 開発環境設定計画

### 1.1 基本環境
- **Node.js**: TypeScript実装のベース環境
- **依存関係管理**: 各パッケージ（contextpatch/、errorcook/、ctxpack-spec/）独立管理
- **ビルドツール**: tsconfig.jsonに基づく型安全なビルド

### 1.2 LLM統合環境
- **ローカルLLM対応**: 7-14Bモデルでの動作保証
- **API設定**: OpenAI/Claude等の外部API対応（オプション）
- **トークン制限**: input:500/output:256-300トークン制約遵守

### 1.3 品質保証ツール
- **ESLint**: コード品質管理
- **型システム**: TypeScript厳格型チェック
- **テストフレームワーク**: Jest（各パッケージ既定）

## 2. 優先順位付けとロードマップ

### 2.1 v0.1 フェーズ（基盤実装）【最優先】
```markdown
🎯 目標: 基本パイプライン動作保証
┌─ Phase 1-1: 入力処理基盤
│  ├─ FailureItemスキーマ実装
│  ├─ 基本パーサ（TAP/JUnit/pytest/Go/Cargo）
│  └─ 入力検証システム
├─ Phase 1-2: LLM処理基盤
│  ├─ プロンプトテンプレート実装
│  ├─ JSON出力パース
│  └─ 基本エラー処理
├─ Phase 1-3: 出力生成
│  ├─ Unified Diff生成
│  ├─ 基本レポート出力
│  └─ ファイル保存システム
└─ Phase 1-4: 統合テスト
   └─ エンドツーエンドフロー検証
```

### 2.2 v0.2 フェーズ（機能拡張）
```markdown
🎯 目標: 実用性向上とパフォーマンス最適化
┌─ Phase 2-1: パーサ拡張
│  ├─ ESLint/ruff/mypy/clippy対応
│  ├─ エラー分類と優先順位付け
│  └─ パフォーマンス最適化
├─ Phase 2-2: LLM統合強化
│  ├─ ワークフロー cookbook 統合
│  ├─ ROI評価システム
│  └─ バッチ処理対応
├─ Phase 2-3: テスト自動生成
│  ├─ 言語別テストテンプレート
│  ├─ 回帰テスト生成
│  └─ テスト実行統合
└─ Phase 2-4: CI/CD統合
   └─ GitHub Actions/Jenkins連携
```

### 2.3 v0.3 フェーズ（高度機能）
```markdown
🎯 目標: 知的修正と学習機能
┌─ Phase 3-1: 知的エラー解析
│  ├─ 依存関係グラフ解析
│  ├─ Birdseye-Index 統合
│  └─ エラー重要度評価
├─ Phase 3-2: 学習・改善
│  ├─ 修正履歴学習
│  ├─ パターン認識
│  └─ フィードバックループ
├─ Phase 3-3: 拡張性強化
│  ├─ プラグインアーキテクチャ
│  ├─ カスタムルール対応
│  └─ API エンドポイント
└─ Phase 3-4: 運用最適化
   └─ 監視・メトリクス・ダッシュボード
```

## 3. タスクの詳細化

### 3.1 パッケージ別実装計画

#### ContextPatch パッケージ
```yaml
目的: 失敗解析とパッチ生成の中核
主要機能:
  - detect: 失敗検出・分類
  - triage: 原因分析・仮説立案
  - patch: 最小パッチ生成
  - validate: 出力検証
  - summarize: 結果統合
  - package: 成果物打包

技術実装:
  - パーサ: 5形式対応（TAP/JUnit/pytest/Go/Cargo）
  - LLM統合: プロンプト処理・JSONパース
  - 差分生成: Unified Diff形式
  - 検証: スキーマ適合・Gate通過確認
```

#### ErrorCook パッケージ
```yaml
目的: エラー解析とランキング
主要機能:
  - smell: エラー嗅覚検出
  - rank: 重要度ランキング
  - propose: 修正提案
  - validate: 品質検証
  - nightshift: バッチ処理

技術実装:
  - パターン認識: エラー分類ロジック
  - スコアリング: 重み付き評価システム
  - バッチ処理: 大規模プロジェクト対応
  - レポート: 実行統計・分析
```

#### CtxPack Spec パッケージ
```yaml
目的: コンテキストパッケージ仕様
主要機能:
  - スキーマ定義: JSON仕様管理
  - 検証: 入力・出力適合性確認
  - 例管理: テストケース・サンプル保持

技術実装:
  - JSON Schema: 厳密な型定義
  - バリデーション: 実行時型チェック
  - -fixture管理: テストデータ管理
```

### 3.2 共通基盤実装

#### CLI システム
```typescript
interface CLI {
  commands: {
    'contextpatch detect': CIログ解析
    'contextpatch triage': 原因分析
    'contextpatch patch': パッチ生成
    'contextpatch validate': 出力検証
    'errorcook smell': エラー嗅覚
    'errorcook rank': ランキング
  }
  options: {
    '--input': 入力ファイル/ディレクトリ
    '--output': 出力ディレクトリ
    '--config': 設定ファイルパス
    '--verbose': 詳細ログ出力
  }
}
```

#### 設定システム
```typescript
interface Config {
  llm: {
    provider: 'openai' | 'claude' | 'local'
    model: string
    maxTokens: { input: 500, output: 300 }
  }
  processing: {
    maxFiles: number
    maxChanges: number // ≤60行
    parallelism: number
  }
  validation: {
    schemaStrict: boolean
    gateEnforcement: boolean
  }
}
```

### 3.3 テスト戦略

#### ユニットテスト
```markdown
Coverage Target: ≥90%
┌─ パーサテスト
│  ├─ 各形式（TAP/JUnit/pytest/Go/Cargo）
│  ├─ エラーケース・エッジケース
│  └─ スキーマ適合性
├─ LLM統合テスト
│  ├─ プロンプト生成・送信
│  ├─ レスポンスパース
│  └─ エラー処理
├─ 出力生成テスト
│  ├─ Unified Diff生成
│  ├─ JSON構造確認
│  └─ ファイル出力
└─ 統合テスト
   └─ 5段階パイプライン全体
```

#### 統合テスト
```markdown
Test Scenarios:
├─ エンドツーエンド: CI失敗→パッチ適用→検証完了
├─ 実データテスト: 実際のプロジェクトCIログ
├─ パフォーマンステスト: 大規模リポジトリ対応
└─ 回帰テスト: 修正後の機能劣化防止
```

## 4. 品質基準とGate

### 4.1 技術Gate
- **型安全性**: TypeScript strict mode 100%準拠
- **テストカバレッジ**: ≥90% statement coverage
- **Lint適合**: ESLint 0 error/warning
- **ドキュメント**: API仕様100%ドキュメント化

### 4.2 機能Gate
- **JSON妥当性**: SCHEMAS/output.schema.json 100%適合
- **Unified Diff適用**: 100%適用可能
- **変更制限**: ≤60行, ≤5ファイル遵守
- **テスト同梱**: 最低1テストケース生成

### 4.3 性能Gate
- **処理時間**: 単一ジョブ ≤5分
- **メモリ使用**: ≤2GB RAM
- **トークン制限**: input/output制約遵守
- **並行処理**: 最大5ジョブ同時実行

## 5. リスク管理と緩和策

### 5.1 技術リスク
| リスク | 確率 | 影響 | 緩和策 |
|--------|------|------|--------|
| LLM API制限 | 中 | 高 | ローカルLLM対応・キャッシュ |
| メモリ不足 | 低 | 中 | ストリーミング処理・チャンク分割 |
| スキーマ不整合 | 中 | 中 | 厳密なバリデーション・テスト |

### 5.2 スケジュールリスク
| リスク | 確率 | 影響 | 緩和策 |
|--------|------|------|--------|
| 依存関係遅延 | 低 | 高 | 早期統合・Mock実装 |
| 仕様変更 | 中 | 中 | モジュール設計・接口抽象化 |
| 品質問題 | 低 | 高 | テスト駆動開発・継続的検証 |

## 6. 成功指標

### 6.1 技術指標
- **可用性**: 99%+  uptime
- **精度**: 80%+ 失敗修正成功率
- **速度**: 平均2分以内処理完了
- **品質**: 0 критическихバグ

### 6.2 運用指標
- **ユーザビリティ**: CLI直感的操作
- **保守性**:  нов機能追加 ≤1日
- **拡張性**: 新パーサ追加 ≤2日
- **ドキュメント**: 新しい機能も24時間以内ドキュメント化

---

**計画承認基準**: 全Gateクリア・リスク評価完了・資源確保確認済み  
**次ステップ**: v0.1 Phase 1-1 開始（FailureItemスキーマ実装）
