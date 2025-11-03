# RUNBOOK（Cookbook Compact 併用手順・仕様）
1. CI失敗アーティファクトの収集（保存場所パス規約）
2. `FailureItem[]` への正規化（アダプタの仕様に準拠）
3. 疑似依存解析（Birdseye Index or 近傍ファイル規則）でコンテキスト圧縮
4. LLMへプロンプト（テンプレ: `PROMPTS/triage.md`, `PROMPTS/patch.md`）
5. 出力JSONをスキーマ検証（Gate）
6. `patch.diff` を仮適用→最小テスト実行→全テストサブセット→必要なら広げる
7. `errorcook.run.json` とレポートを保存（再現性）
