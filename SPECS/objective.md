# 目的関数（エラー修正）

## Gates
- JSON妥当性（出力スキーマ適合）
- Unified Diff が適用可能（パス/ハンク整合）
- 変更行数・ファイル数の上限（例: ≤ 60行, ≤ 5ファイル）
- テスト同梱（少なくとも1つ）

## Features（0〜1）
- `patch_minimality`: 変更行数/ファイル数の正規化ペナルティ
- `test_coverage_delta`: 追加テストのカバレッジ増分（近似可）
- `repro_success`: 失敗の再現→修復 成功フラグ（0 or 1, 重み高）
- `linter_clean`: 修正後にlint/typeが clean である率
- `spec_alignment`: 失敗メッセージ/仕様への言及整合（LCS近似）
- `stability`: 同一症状に対する再実行での結果一貫性

## 合算
`score = Σ w_i * feature_i` （Gateを満たさない場合は除外）
