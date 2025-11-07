# CI テスト確認 TODO リスト

## タスク一覧
- [x] `.github/workflows/ts-ci.yml` ファイルを確認
- [x] 問題のある CLI コマンドを特定
- [x] contextpatch コマンドのパスを修正
- [x] errorcook コマンドのパスを修正
- [x] 修正内容を確認
- [x] CLI ファイル存在確認（`contextpatch/src/cli.ts`、`errorcook/src/cli.ts`）
- [x] Node.js 環境確認（v22.14.0, npm 10.9.2）
- [x] CI ワークフローのテスト実行
- [x] テスト結果の確認

## 追加のテストタスク
- [x] 修正した CLI コマンドのパスが正しいか再確認
- [x] 必要な依存関係（contextpatch、errorcook ディレクトリ）の確認
- [x] CLI コマンドのローカルテスト実行
