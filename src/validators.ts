import Ajv from 'ajv';
import outputSchema from '../SCHEMAS/output.schema.json';
import { IOutput } from '../types';

const ajv = new Ajv();

// JSONスキーマ検証関数
export function validateOutputSchema(output: any): { isValid: boolean; errors?: any[] } {
  try {
    const validate = ajv.compile(outputSchema);
    const isValid = validate(output);
    
    if (!isValid) {
      return { isValid: false, errors: validate.errors };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, errors: [error] };
  }
}

// Unified Diffの適用可能性を検証する関数
export function validateUnifiedDiff(unifiedDiff: string): boolean {
  // 最小限のUnified Diff形式検証
  if (!unifiedDiff || typeof unifiedDiff !== 'string') {
    return false;
  }

  // diff, index, ---, +++ などの基本的なUnified Diffの要素を確認
  const hasDiffHeader = unifiedDiff.includes('diff ') || unifiedDiff.startsWith('diff ');
  const hasFileHeaders = unifiedDiff.includes('--- ') && unifiedDiff.includes('+++ ');
  const hasChangeMarkers = unifiedDiff.includes('@@ ') && (unifiedDiff.includes('+') || unifiedDiff.includes('-'));

  return hasDiffHeader && hasFileHeaders && hasChangeMarkers;
}

// 変更制限（行数・ファイル数）を検証する関数
export function validateChangeLimits(output: IOutput, maxFiles: number = 5, maxLines: number = 60): boolean {
  if (!output.patch || !output.patch.unified_diff) {
    return false;
  }

  // ファイル数の確認
  const filesChanged = output.patch.files_changed || countChangedFiles(output.patch.unified_diff);
  if (filesChanged > maxFiles) {
    return false;
  }

  // 行数の確認
  const linesAdded = output.patch.lines_added || countAddedLines(output.patch.unified_diff);
  const linesRemoved = output.patch.lines_removed || countRemovedLines(output.patch.unified_diff);
  const totalChangedLines = linesAdded + linesRemoved;
  
  return totalChangedLines <= maxLines;
}

// Unified Diffから変更ファイル数をカウント
function countChangedFiles(unifiedDiff: string): number {
  const fileHeaders = unifiedDiff.match(/^diff\s.*$/gm);
  return fileHeaders ? fileHeaders.length : 0;
}

// Unified Diffから追加行数をカウント
function countAddedLines(unifiedDiff: string): number {
  const addedLines = unifiedDiff.match(/^\+.*$/gm);
  return addedLines ? addedLines.length : 0;
}

// Unified Diffから削除行数をカウント
function countRemovedLines(unifiedDiff: string): number {
  const removedLines = unifiedDiff.match(/^-.+$/gm);
  return removedLines ? removedLines.length : 0;
}

// テスト同梱の確認
export function validateTestInclusion(output: IOutput): boolean {
  if (!output.tests || !Array.isArray(output.tests)) {
    return false;
  }

  // 少なくとも1つのテストケースが存在することを確認
  if (output.tests.length < 1) {
    return false;
  }

  // 各テストケースが適切な構造を持っていることを確認
  for (const test of output.tests) {
    if (!test.path || !test.content) {
      return false;
    }
    
    // テスト内容が最低限の長さを持っていることを確認
    if (test.content.length < 10) {
      return false;
    }
  }

  return true;
}

// すべてのGates条件を検証する関数
export function validateAllGates(output: IOutput, maxFiles: number = 5, maxLines: number = 60): { isValid: boolean; gateResults: { [key: string]: boolean } } {
  const gateResults: { [key: string]: boolean } = {
    jsonSchema: false,
    unifiedDiff: false,
    changeLimits: false,
    testInclusion: false
  };

  // JSONスキーマ検証
  const { isValid: isJsonValid } = validateOutputSchema(output);
  gateResults.jsonSchema = isJsonValid;

  // Unified Diff検証
  if (output.patch && output.patch.unified_diff) {
    gateResults.unifiedDiff = validateUnifiedDiff(output.patch.unified_diff);
  }

  // 変更制限検証
  gateResults.changeLimits = validateChangeLimits(output, maxFiles, maxLines);

  // テスト同梱検証
  gateResults.testInclusion = validateTestInclusion(output);

  const isValid = Object.values(gateResults).every(result => result);

  return { isValid, gateResults };
}