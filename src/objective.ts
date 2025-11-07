/**
 * ErrorCook ContextPatch Objective and Evaluation Functions
 * Gates: 必須条件
 * Features: 評価指標
 */

import { OutputSchema } from './types';

// Gates: 必須条件
export interface Gates {
  jsonValid: boolean;           // JSONがスキーマに適合
  unifiedDiffApplicable: boolean; // Unified Diffが適用可能
  changeLimit: boolean;         // 変更行数≤60行、ファイル数≤5ファイル
  testIncluded: boolean;        // テストが少なくとも1つ同梱されている
}

// Features: 評価指標
export interface Features {
  patchMinimality: number;      // 変更の最小性 (0.0-1.0)
  testCoverageDelta: number;    // テストカバレッジ増分 (0.0-1.0)
  reproSuccess: boolean;        // 失敗の再現→修復成功 (重要度高)
  linterClean: boolean;         // 修正後のlint/type clean
  specAlignment: number;        // 仕様との整合度 (0.0-1.0)
  stability: number;            // 再実行結果の一貫性 (0.0-1.0)
}

// 評価結果
export interface EvaluationResult {
  gates: Gates;
  features: Features;
  score: number;
  report: string;
}

// JSONスキーマ検証
export function validateJsonSchema(output: any): boolean {
  try {
    // 実際にはスキーマファイルを読み込んで検証する
    // ここでは簡単な構造チェックを行う
    const requiredFields = ['hypothesis', 'suspects', 'patch', 'tests'];
    return requiredFields.every(field => output.hasOwnProperty(field));
  } catch (e) {
    return false;
  }
}

// Unified Diff適用可能性検証
export function isUnifiedDiffApplicable(unifiedDiff: string): boolean {
  // Unified Diff形式であることを確認
  // ファイルパスとハンク形式の整合性を確認
  const lines = unifiedDiff.split('\n');
  let hasHeader = false;
  let hasHunk = false;
  
  for (const line of lines) {
    if (line.startsWith('--- ') || line.startsWith('+++ ')) {
      hasHeader = true;
    } else if (line.startsWith('@@ ')) {
      hasHunk = true;
    }
  }
  
  return hasHeader && hasHunk;
}

// 変更制限チェック (≤60行, ≤5ファイル)
export function checkChangeLimit(unifiedDiff: string): boolean {
  const lines = unifiedDiff.split('\n');
  const addedLines = lines.filter(line => line.startsWith('+')).length;
  const removedLines = lines.filter(line => line.startsWith('-')).length;
  const totalChangedLines = addedLines + removedLines;
  
  // ファイル数の確認 - diffヘッダの出現回数
  const fileCount = lines.filter(line => 
    line.startsWith('diff --git ') || 
    (line.startsWith('--- ') && !line.includes('/dev/null'))
  ).length;
  
  return totalChangedLines <= 60 && fileCount <= 5;
}

// テスト同梱チェック
export function hasTestsIncluded(tests: any[]): boolean {
  return Array.isArray(tests) && tests.length > 0;
}

// 変更の最小性評価
export function calculatePatchMinimality(unifiedDiff: string): number {
  const lines = unifiedDiff.split('\n');
  const addedLines = lines.filter(line => line.startsWith('+')).length;
  const removedLines = lines.filter(line => line.startsWith('-')).length;
  const totalChangedLines = addedLines + removedLines;
  
  // 最小性スコア: 変更が少なければ高いスコア
  // 60行=0点、0行=1点の線形評価
  return Math.max(0, (60 - totalChangedLines) / 60);
}

// テストカバレッジ増分計算（シミュレーション）
export function calculateTestCoverageDelta(): number {
  // 実際にはテストカバレッジツールと連携して計算
  // ここではシミュレーションとしてランダム値を返す
  return Math.random();  // 実装時は具体的な計算方法に置き換える
}

// 失敗の再現→修復成功評価
export async function evaluateReproSuccess(
  originalFailure: string, 
  patch: string, 
  testCommand: string
): Promise<boolean> {
  // 実際にはパッチ適用前の状態でテストを実行し、
  // パッチ適用後に同じテストが通るかを確認
  // ここではシミュレーション
  return Math.random() > 0.5;  // 実装時は具体的な検証に置き換える
}

// 修正後のlint/type clean評価
export async function evaluateLinterClean(patch: string): Promise<boolean> {
  // 実際にはパッチ適用後にlint/typeチェックを実行
  // ここではシミュレーション
  return Math.random() > 0.3;  // 実装時は具体的な検証に置き換える
}

// 仕様との整合度評価
export function calculateSpecAlignment(
  failureMessage: string, 
  patch: string
): number {
  // 失敗メッセージとパッチの内容を比較し、整合度を計算
  // ここでは単純なキーワード一致度としてシミュレーション
  const failureKeywords = failureMessage.toLowerCase().split(/\W+/);
  const patchKeywords = patch.toLowerCase().split(/\W+/);
  
  const matches = failureKeywords.filter(keyword => 
    patchKeywords.includes(keyword) && keyword.length > 3
  ).length;
  
  return Math.min(1.0, matches / Math.max(1, failureKeywords.length));
}

// 再実行結果の一貫性評価
export function calculateStability(): number {
  // 同じ入力に対して同じ出力が得られるかの評価
  // ここではシミュレーションとして一定の値を返す
  return 0.9;  // 実装時は具体的な計算方法に置き換える
}

// 目的関数 - 評価の中心
export async function evaluateOutput(
  output: OutputSchema,
  testCommand: string = 'npm test',
  originalFailure: string = ''
): Promise<EvaluationResult> {
  // Gatesの評価
  const gates: Gates = {
    jsonValid: validateJsonSchema(output),
    unifiedDiffApplicable: isUnifiedDiffApplicable(output.patch?.unified_diff || ''),
    changeLimit: checkChangeLimit(output.patch?.unified_diff || ''),
    testIncluded: hasTestsIncluded(output.tests || [])
  };

  // すべてのGatesがTrueでない場合は評価を中断
  const allGatesPassed = Object.values(gates).every(gate => gate);
  if (!allGatesPassed) {
    return {
      gates,
      features: {
        patchMinimality: 0,
        testCoverageDelta: 0,
        reproSuccess: false,
        linterClean: false,
        specAlignment: 0,
        stability: 0
      },
      score: 0,
      report: `Gates check failed: ${Object.entries(gates)
        .filter(([_, passed]) => !passed)
        .map(([name, _]) => name)
        .join(', ')}`
    };
  }

  // Featuresの評価
  const features: Features = {
    patchMinimality: calculatePatchMinimality(output.patch?.unified_diff || ''),
    testCoverageDelta: calculateTestCoverageDelta(),
    reproSuccess: await evaluateReproSuccess(
      originalFailure, 
      output.patch?.unified_diff || '', 
      testCommand
    ),
    linterClean: await evaluateLinterClean(output.patch?.unified_diff || ''),
    specAlignment: calculateSpecAlignment(
      originalFailure,
      output.patch?.unified_diff || ''
    ),
    stability: calculateStability()
  };

  // スコア計算 (重み付き合計)
  // 各featureの重みは暫定的に均等とします。実際には要件に応じて調整
  const weights = {
    patchMinimality: 1.0,
    testCoverageDelta: 1.0,
    reproSuccess: 2.0,  // 重要度高
    linterClean: 1.5,
    specAlignment: 1.0,
    stability: 0.5
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const weightedScore = 
    (features.patchMinimality * weights.patchMinimality +
     features.testCoverageDelta * weights.testCoverageDelta +
     (features.reproSuccess ? 1 : 0) * weights.reproSuccess +
     (features.linterClean ? 1 : 0) * weights.linterClean +
     features.specAlignment * weights.specAlignment +
     features.stability * weights.stability) / totalWeight;

  // 評価レポートの作成
  const report = `
Gates:
- JSON Valid: ${gates.jsonValid}
- Unified Diff Applicable: ${gates.unifiedDiffApplicable}
- Change Limit: ${gates.changeLimit}
- Test Included: ${gates.testIncluded}

Features:
- Patch Minimality: ${features.patchMinimality.toFixed(2)}
- Test Coverage Delta: ${features.testCoverageDelta.toFixed(2)}
- Repro Success: ${features.reproSuccess}
- Linter Clean: ${features.linterClean}
- Spec Alignment: ${features.specAlignment.toFixed(2)}
- Stability: ${features.stability.toFixed(2)}

Overall Score: ${weightedScore.toFixed(2)}
  `.trim();

  return {
    gates,
    features,
    score: weightedScore,
    report
  };
}