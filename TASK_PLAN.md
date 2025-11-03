# 📋 実装タスクプラン (Day8 / workflow-cookbook 構成互換)

## Phase 1: スキーマ整備 (failure_item, config, output)
### タスク 1: failure_item.schema.json の確認とレビュー
- **intent_id**: INT-002
- **type**: implementation
- **title**: failure_itemスキーマの検証と整合性確認
- **depends_on**: []
- **deliverables**: 
  - `SCHEMAS/failure_item.schema.json` のレビュー結果
  - レビューに従った更新（必要があれば）
- **priority**: high
- **criteria**:
  - schemaがJSON Schema Draft-07準拠であること
  - 必須フィールド `tool`, `message` が正しく定義されていること
  - `severity` のenum値が "error", "warning" であることが確認できること
- **notes**:
  - このスキーマはエラー分析フローの出力に使用されるため、完全性が重要

### タスク 2: config.schema.json のレビューと整合性確認
- **intent_id**: INT-003
- **type**: implementation
- **title**: configスキーマの検証と整合性確認
- **depends_on**: []
- **deliverables**: 
  - `SCHEMAS/config.schema.json` のレビュー結果
  - レビューに従った更新（必要があれば）
- **priority**: high
- **criteria**:
  - schemaがJSON Schema Draft-07準拠であること
  - 必須フィールド `objective`, `limits`, `artifacts` が正しく定義されていること
  - 各フィールドの型、制約が仕様と一致すること
- **notes**:
  - このスキーマはプロジェクト設定に使用されるため、完全性と整合性が重要

### タスク 3: output.schema.json のレビューと整合性確認
- **intent_id**: INT-004
- **type**: implementation
- **title**: outputスキーマの検証と整合性確認
- **depends_on**: []
- **deliverables**: 
  - `SCHEMAS/output.schema.json` のレビュー結果
  - レビューに従った更新（必要があれば）
- **priority**: high
- **criteria**:
  - schemaがJSON Schema Draft-07準拠であること
  - 必須フィールド `hypothesis`, `suspects`, `patch`, `tests` が正しく定義されていること
  - 各フィールドの型、制約が仕様と一致すること
- **notes**:
  - このスキーマはエラー修正の出力形式に使用されるため、完全性が重要

## Phase 2: プロンプト設計 (guardrails, triage)
### タスク 4: guardrails.md の確認と整合性レビュー
- **intent_id**: INT-005
- **type**: implementation
- **title**: Guardrailsの整合性確認
- **depends_on**: 
  - ["INT-002", "INT-003", "INT-004"]
- **deliverables**: 
  - `docs/GUARDRAILS.md` のレビュー結果
  - 整合性が確認されたGuardrails内容の更新（必要があれば）
- **priority**: high
- **criteria**:
  - プロンプトとスキーマが一致していること
  - 実装の制約とガイドラインが明確に記述されていること
- **notes**:
  - Guardrailsはプロジェクト全体の行動指針であり、実装の基準となる

### タスク 5: triage.md の確認と整合性レビュー
- **intent_id**: INT-006
- **type**: implementation
- **title**: triageプロンプトの整合性確認
- **depends_on**: 
  - ["INT-002", "INT-003", "INT-004"]
- **deliverables**: 
  - `prompts/triage.md` のレビュー結果
  - レビューに従った更新（必要があれば）
- **priority**: high
- **criteria**:
  - プロンプトの入力/出力形式が明確に定義されていること
  - 必須フィールド・制約がスキーマと一致していること
- **notes**:
  - triageプロンプトはエラー分析の中心となるため、完全性が重要

## Phase 3: 設定統合 (budget.yaml, errorcook.yaml)
### タスク 6: budget.yaml の確認と整合性レビュー
- **intent_id**: INT-007
- **type**: implementation
- **title**: ROIとトークン制限の確認
- **depends_on**: 
  - ["INT-002", "INT-003", "INT-004"]
- **deliverables**: 
  - `config/budget.yaml` のレビュー結果
  - レビューに従った更新（必要があれば）
- **priority**: high
- **criteria**:
  - ROIとトークン制限がプロジェクト要件と一致していること
  - 各設定項目の説明が明確であること
- **notes**:
  - このファイルはワークフローのリソース管理に使用される

### タスク 7: errorcook.yaml の確認と整合性レビュー
- **intent_id**: INT-008
- **type**: implementation
- **title**: プロジェクト設定ファイルの確認
- **depends_on**: 
  - ["INT-002", "INT-003", "INT-004"]
- **deliverables**: 
  - `examples/configs/errorcook.yaml` のレビュー結果
  - レビューに従った更新（必要があれば）
- **priority**: medium
- **criteria**:
  - 設定ファイルがプロジェクト要件と一致していること
  - 各設定項目の説明が明確であること
- **notes**:
  - この設定はエラー修正プロセスの実行に使用される

## Phase 4: 実行レシピ実装 (recipes/*.yaml)
### タスク 8: req_to_srs_roi.yaml の確認とレビュー
- **intent_id**: INT-009
- **type**: implementation
- **title**: ROI評価付き要件分解レシピの確認
- **depends_on**: 
  - ["INT-002", "INT-003", "INT-004"]
- **deliverables**: 
  - `recipes/req_to_srs_roi.yaml` のレビュー結果
  - レビューに従った更新（必要があれば）
- **priority**: high
- **criteria**:
  - レシピがプロジェクト要件と一致していること
  - 出力スキーマが適切であることが確認できること
- **notes**:
  - このレシピは要件分析の中心となる

### タスク 9: birdseye_summary.yaml の確認とレビュー
- **intent_id**: INT-010
- **type**: implementation
- **title**: Birdseyeサマリーレシピの確認
- **depends_on**: 
  - ["INT-002", "INT-003", "INT-004"]
- **deliverables**: 
  - `recipes/birdseye_summary.yaml` のレビュー結果
  - レビューに従った更新（必要があれば）
- **priority**: medium
- **criteria**:
  - レシピがプロジェクト要件と一致していること
  - 出力スキーマが適切であることが確認できること
- **notes**:
  - このレシピはプロジェクト全体の可視化に使用される

### タスク 10: srs_scope_plan.yaml の確認とレビュー
- **intent_id**: INT-011
- **type**: implementation
- **title**: SRSスコープ計画レシピの確認
- **depends_on**: 
  - ["INT-002", "INT-003", "INT-004"]
- **deliverables**: 
  - `recipes/srs_scope_plan.yaml` のレビュー結果
  - レビューに従った更新（必要があれば）
- **priority**: medium
- **criteria**:
  - レシピがプロジェクト要件と一致していること
  - 出力スキーマが適切であることが確認できること
- **notes**:
  - このレシピはスコープ管理の中心となる

### タスク 11: srs_to_design_roi.yaml の確認とレビュー
- **intent_id**: INT-012
- **type**: implementation
- **title**: SRSから設計へのROI評価レシピの確認
- **depends_on**: 
  - ["INT-002", "INT-003", "INT-004"]
- **deliverables**: 
  - `recipes/srs_to_design_roi.yaml` のレビュー結果
  - レビューに従った更新（必要があれば）
- **priority**: medium
- **criteria**:
  - レシピがプロジェクト要件と一致していること
  - 出力スキーマが適切であることが確認できること
- **notes**:
  - このレシピは設計プロセスに使用される

---

## 🧭 Critical Path (Phase 1〜2)
以下のタスクはすべての後続タスクの前提となるため、優先的に実施する必要があります：
1. `INT-002` (failure_item.schema.jsonの確認)
2. `INT-003` (config.schema.jsonの確認)
3. `INT-004` (output.schema.jsonの確認)
4. `INT-005` (guardrails.mdの確認)
5. `INT-006` (triage.mdの確認)

## ⚙️ 並列可能タスク
以下のタスクは相互依存がなく、同時に実施可能です：
- `INT-007` (budget.yamlの確認)
- `INT-008` (errorcook.yamlの確認)
- `INT-009` (req_to_srs_roi.yamlの確認)
- `INT-010` (birdseye_summary.yamlの確認)
- `INT-011` (srs_scope_plan.yamlの確認)
- `INT-012` (srs_to_design_roi.yamlの確認)

## 🔗 全体整合性保証
- 各タスクは `failure_item.schema.json`, `config.schema.json`, `output.schema.json` に依存し、それらが正しく定義されていることを前提としています。
- `Guardrails.md` と `triage.md` はプロジェクト全体の行動指針であり、スキーマとの整合性を保つ必要があります。
- レシピファイルはプロジェクトの要件に従って設計されており、すべての出力形式がスキーマと一致する必要があります。
```