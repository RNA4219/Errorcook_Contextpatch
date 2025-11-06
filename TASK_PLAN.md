# CI エラー修正タスク

## 目標
GitHub Actions CI で発生しているエラー（ERR_MODULE_NOT_FOUND）を修正し、CI を正常に動作させる。

## 原因
- **本命エラー**：`npx --prefix contextpatch tsx src/cli.ts` のパスが不正
- `--prefix` は node_modules の場所を決めるだけで、スクリプトパスには影響しない
- 実際の CLI ファイルは `contextpatch/src/cli.ts` / `errorcook/src/cli.ts` にある
- 現在のコマンドはリポジトリルートを基準に `./src/cli.ts` を参照している

## 修正内容
1. `.github/workflows/ts-ci.yml` ファイルを特定
2. `tsx src/cli.ts` を `tsx contextpatch/src/cli.ts` に修正（contextpatch コマンド）
3. `tsx errorcook/src/cli.ts` に修正（errorcook コマンド）
4. lock file エラー（致命的ではない）を検討

## タスク一覧
- [ ] `.github/workflows/ts-ci.yml` ファイルを確認
- [ ] 問題のある CLI コマンドを特定
- [ ] contextpatch コマンドのパスを修正
- [ ] errorcook コマンドのパスを修正
- [ ] 修正内容を確認
- [ ] 必要に応じて lock file 問題解決も検討

## 期待される結果
CI が正常に実行され、`ERR_MODULE_NOT_FOUND` エラーが発生しなくなる。
