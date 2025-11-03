# ErrorCook ContextPatch 実装TODOリスト

## プロジェクト概要
- **目的**: CIテスト失敗の再現→最小修正パッチ提案→テスト同梱→再検証フロー
- **入力**: CI失敗ログ（lint/type/test/build/security）、最小コンテキスト  
- **出力**: JSON（hypothesis/suspects/patch/tests）、Unified Diff、最小テスト、実行レポート

## 実装ステップ

### Phase 1: 基礎理解と準備
- [x] プロジェクト構造の理解
- [x] スキーマ定義の確認と整合性チェック
- [x] 型定義の修正（failure_item.schema.json準拠）
- [x] 既存の実装状況把握

### Phase 2: FailureParser 実装
- [x] parsers/failure_parser.ts の実装（スキーマ準拠更新）
- [x] 各種CIツール（pytest, mypy, eslint等）の失敗ログ解析
- [x] FailureItem標準化の実装
- [x] パーサーテストの作成
- [ ] テストの実行と検証

### Phase 3: FailureAnalysis 実装  
- [ ] workflows/failure_analysis_with_parser.ts の実装
- [ ] LLMプロンプト統合（prompts/triage.mdベース）
- [ ] 出力スキーマ適合性の実装
- [ ] ROI予算管理の統合
- [ ] アナリシスワークフローのテスト

### Phase 4: 統合と設定
- [ ] 設定ファイル（config.schema.json）の実装確認
- [ ] プロンプトテンプレートの統合
- [ ] ガードレール（prompts/common/guardrails.md）の適用
- [ ] 出力検証機能の実装

### Phase 5: テストと検証
- [ ] 統合テストの作成
- [ ] 実際のCI失敗ログでのテスト
- [ ] スキーマ検証のテスト
- [ ] パフォーマンステスト（トークン制限内）

### Phase 6: ドキュメントと最終化
- [ ] 実装ドキュメントの更新
- [ ] 使用例の追加
- [ ] 最終動作確認
- [ ] 成果物の整理

## 技術的制約
- **トークン制限**: CPU≈500、7B≈1,000、cheap_api≈1,200
- **ファイル制限**: 最大5ファイル、最大60行
- **出力要件**: 厳密なJSON、Unified Diff形式
- **セキュリティ**: 絶対パス禁止、破壊的操作禁止

## 参照ファイル
- IMPLEMENTATION_REFERENCE_FILES.md（実装ガイド）
- workflow-cookbook-compact/docs/downsized_cookbook_summary.md（ワークフロー概要）
- SCHEMAS/*.json（スキーマ定義）
- prompts/*.md（プロンプトテンプレート）

---
**作成日**: 2025-11-04  
**優先度**: Phase 2（FailureParser実装）から開始
