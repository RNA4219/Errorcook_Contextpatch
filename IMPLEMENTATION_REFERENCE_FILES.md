# ErrorCook ContextPatch 実装参照ファイル一覧

**更新日**: 2025-11-03 17:44  
**目的**: 実装フェーズで参照すべきファイルの包括的ガイド

## 1. タスクプラン作成に必要なファイル

### Errorcook_Contextpatch内（workflow-cookbook-compact以外）の上位2つ：

#### 1.1 `README.md`
- **概要**: プロジェクト全体の仕様と目的を定義したメイン仕様書
- **要点**: CIテスト失敗の再現→最小修正パッチ提案→テスト同梱→再検証フロー
- **入力**: CI失敗ログ（lint/type/test/build/security）、最小コンテキスト
- **出力**: JSON（hypothesis/suspects/patch/tests）、Unified Diff、最小テスト、実行レポート

#### 1.2 `SPECS/objective.md`
- **概要**: 目的関数、エラー修正の評価基準とGatesを定義
- **Gates（必須条件）**:
  - JSON妥当性（出力スキーマ適合）
  - Unified Diff適用可能（パス/ハンク整合）
  - 変更行数≤60行、ファイル数≤5ファイル
  - テスト同梱（少なくとも1つ）
- **Features（0-1評価指標）**: patch_minimality, test_coverage_delta, repro_success等

### workflow-cookbook-compact内のファイル2つ：

#### 1.3 `docs/downsized_cookbook_summary.md`
- **概要**: ワークフロー全体の概要と推奨フローをまとめた確認シート
- **要点**: 要約→要件→設計を少ターンで完遂する軽量ワークフロー
- **制約**: CPU≈500トークン、7B≈1,000トークン、ROI_BUDGET管理

#### 1.4 `recipes/summarize.yaml`
- **概要**: LLM用YAMLレシピの例で、データ構造とプロンプト設計の参考
- **構成**: recipe, version, description, inputs, outputs, budget, steps
- **入力**: markdownテキスト
- **出力**: 5つのbullet pointsを持つJSON
- **budget**: input 500トークン、output 256トークン

## 2. 実装実行に必要なファイル

### Errorcook_Contextpatch内（workflow-cookbook-compact以外）の上位2つ：

#### 2.1 `SCHEMAS/config.schema.json`
- **概要**: 入力設定のJSONスキーマ定義
- **必須項目**:
  ```json
  {
    "objective": {},           // o1kのObjective相当（参照）
    "limits": {                // 処理制限
      "max_files": 5,         // 最大ファイル数
      "max_lines": 60,        // 最大行数
      "timeout_sec": 900      // タイムアウト（秒）
    },
    "artifacts": {             // アーティファクト管理
      "ci_dir": "...",        // CIディレクトリ
      "repo_root": "...",     // レポルート
      "birdseye_index": "..." // Birdseye索引
    }
  }
  ```

#### 2.2 `prompts/triage.md`
- **概要**: エラー分析と修正提案のためのプロンプトテンプレート
- **役割**: 熟練のコード修復エンジニア
- **入力**: FailureItem[]、関連ソース抜粋、依存関係ヒント
- **タスク**: JSON形式での出力（hypothesis、suspects、patch、tests）
- **制約**:
  - パッチは最小限（大規模リライト禁止）
  - テストは1症状=1テスト、回帰防止に1つ追加可
  - 絶対パスや機密情報の出力禁止

### workflow-cookbook-compact内のファイル2つ：

#### 2.3 `config/budget.yaml`
- **概要**: トークン制限とモデルプロファイルの設定
- **ROI設定**:
  ```yaml
  roi:
    default_budget: 40
    notes: "Override via ROI_BUDGET env variable"
  tokens:
    cpu_small: 500
    7b_gpu: 1000
    cheap_api: 1200
  ```

#### 2.4 `recipes/req_to_srs_roi.yaml`
- **概要**: ROI評価付き要件分解レシピの実装例
- **機能**: requirementsをROIスコア付きstoriesに変換
- **ROI計算式**: `(value * confidence) / (effort * max(risk,1))`
- **budget**: input 800トークン、output 512トークン

## 3. 追加で重要な参照ファイル

### 3.1 スキーマ定義関連

#### `SCHEMAS/failure_item.schema.json`
- **概要**: 失敗アイテムの標準化スキーマ
- **構造**:
  ```json
  {
    "tool": "string",           // "pytest"|"mypy"|"eslint"等
    "path": "string",           // ファイル/テストケース位置
    "message": "string",        // エラーメッセージ（短）
    "details": "string",        // スタック/ログ（長）
    "severity": "error|warning", // エラー重要度
    "meta": {}                  // 行番号・ルールID等
  }
  ```

#### `SCHEMAS/output.schema.json`
- **概要**: 出力スキーマ（hypothesis/suspects/patch/tests構造）
- **必須フィールド**:
  ```json
  {
    "hypothesis": "string",     // 失敗原因の仮説（20文字以上）
    "suspects": [               // 嫌疑ファイル配列
      {"file": "string", "line": number, "reason": "string"}
    ],
    "patch": {                  // Unified Diff情報
      "unified_diff": "string"  // Unified Diff形式（10文字以上）
    },
    "tests": [                  // テストケース（最低1つ）
      {"path": "string", "content": "string", "purpose": "string"}
    ]
  }
  ```

### 3.2 プロンプト設計関連

#### `prompts/common/guardrails.md`
- **概要**: セキュリティ制約・プロンプト設計指針
- **重要な制約**:
  - スコープは失敗関連ファイル/関数のみ
  - 破壊的操作（fs.rm -rf / 権限変更等）を禁止
  - 依存追加・ロックファイル更新は禁止
  - Unified Diffのみでのパッチ返答
  - 厳密なJSONのみ出力（説明・Markdown無）

#### `examples/configs/errorcook.yaml`
- **概要**: エラークック設定の実装例
- **重要な設定**:
  ```yaml
  limits: { max_files: 5, max_lines: 60, timeout_sec: 900 }
  objective:
    requireJson: true
    jsonSchemaPath: SCHEMAS/output.schema.json
    min_len: 100
    max_len: 4000
    required_sections: ["hypothesis","suspects","patch","tests"]
    weights:
      json_field_coverage: 1.0
      length_fit: 0.2
      keyword_coverage: 0.3
    keywords: ["tests","unified diff","suspects"]
  ```

## 4. 実装時の参照順序

### 4.1 基本実装パターン
1. **スキーマ確認** → `SCHEMAS/`内の3つのスキーマファイル
2. **プロンプト設計** → `prompts/`内のguardrailsとtriage
3. **設定パターン** → `examples/configs/errorcook.yaml`
4. **ワークフロー統合** → `workflow-cookbook-compact/config/`と`recipes/`

### 4.2 実装チェックリスト
- [ ] FailureItemの標準化実装確認
- [ ] LLMプロンプトテンプレートの統合
- [ ] 出力スキーマ適合性の検証
- [ ] トークン制限とROI予算管理の適用
- [ ] GateとFeatures評価システムの実装

---

**使用上の注意**: 各ファイルは相互に関連し合っており、単独ではなく全体として参照する必要があります。特にスキーマ定義、プロンプト設計、設定ファイルの間で整合性を保つことが重要です。
