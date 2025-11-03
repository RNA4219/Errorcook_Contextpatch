# Guardrails (global)

- Scopeは失敗に関連するファイル/関数のみ。**無関係な改変を禁止**。
- 破壊的操作（fs.rm -rf / 権限変更 / ネットワークアクセス / secrets 参照）を禁止。
- 依存追加・ロックファイル更新は**禁止**（テストファイル追加は可）。
- **Unified Diffのみ**でパッチを返す（`--- a/...` / `+++ b/...` / `@@` を含む）。
- **最大Hunks数を超えない**（`{{limits.max_patch_hunks}}`）。
- コーディング規約を尊重（ESM/TypeScript、PEP8、Rust 2021）。
- 出力は**厳密なJSONのみ**（前後に一切の説明やMarkdownを付けない）。
