# ContextPatch / ErrorCook — Specification Bundle v0.1

**目的**: CIテスト失敗の再現→最小修正パッチ提案→テスト同梱→再検証 までを、ローカルLLM + Workflow Cookbook Compact で回すための**仕様のみ**を収録（実装なし）。

更新日: 2025-11-01

## 概要
- 入力: CI失敗ログ（lint/type/test/build/security）、最小コンテキスト（差分/関連ファイル）
- 出力: JSON（hypothesis/suspects/patch/tests）、Unified Diff、最小テスト、実行レポート
- 目的関数: 形式適合・最小差分・テスト通過・回帰抑止（追加テスト）
- 倫理/安全: ToS順守・機密出力の抑制・責任ある自動修正フロー
