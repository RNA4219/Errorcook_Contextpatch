# Downsized Cookbook Summary

**Version**: 1.0  
**Date**: 2025-11-07  
**Purpose**: Workflow Cookbook Compactの軽量版として、要約→要件→設計の少ターンで完遂する軽量ワークフローを提供

## 概要

Downsized Cookbookは、大規模なWorkflow Cookbook Compactを軽量化したバージョンです。CPU≈500トークン、7B≈1,000トークンの制限下でも動作可能なように設計されています。

## 推奨フロー

1. **要約(Summarize)**: 入力テキストを5箇条の要点で要約 (recipes/summarize.yaml参照)
2. **要件(Requirements)**: ROI指標(value/effort/risk/confidence)を用いた要件分解
3. **設計(SRS)**: ROIスコア付きのソフトウェア要件仕様書作成

## 制約と予算管理

- **CPUモデル**: 入力500トークン、出力256トークン
- **7Bモデル**: 入力1000トークン、出力512トークン  
- **予算管理**: ROI_BUDGET環境変数で制御可能
- **最大反復**: 3回まで

## 使用例

- エラーログの要約と分析
- 修正提案のROI評価
- 最小実装計画の作成

## 参考レシピ構造

- recipe: レシピ名
- version: レシピバージョン
- description: 機能概要
- inputs: 入力データ構造
- outputs: 出力データ構造
- budget: トークン予算
- steps: 処理ステップ

## 連携コンポーネント

- ErrorCook/ContextPatchとの連携を前提に設計
- 軽量LLMでも処理可能なワークフローを構成