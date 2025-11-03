# GitHub Actions ワークフロー修正TODO

## 問題概要
- GitHub Actionsワークフローで `contextpatch` と `errorcook` ディレクトリが見つからないエラー
- Matrix strategyで複数のpkg（contextpatch, errorcook）を実行時の問題

## タスクリスト
- [ ] Matrix strategyパッケージの実行順序を確認
- [ ] 現在のワークフローステップの構造を分析
- [ ] ディレクトリ指定の問題を特定
- [ ] 適切なパス解決にワークフローを修正
- [ ] テスト случаевでワークフローの修正を検証

## 技術的な問題点
1. Matrix strategy使用時のパッケージディレクトリ解決
2. 失敗時の.ctpack生成ステップのパス問題
3. `npm --prefix` とcdコマンドの組み合わせ問題

## 修正が必要なファイル
- `.github/workflows/ts-ci.yml`

## 期待される結果
- すべてのMatrix packages（contextpatch, errorcook）で正常に動作
- 失敗時の.ctpack生成が適切に機能
