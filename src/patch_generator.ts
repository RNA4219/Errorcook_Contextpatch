/**
 * ErrorCook ContextPatch - パッチ生成機能
 * Unified Diff形式でのパッチ生成と、症状別テストの自動生成
 */

import { OutputSchema, FailureItem } from './types';

// パッチ生成の設定
export interface PatchGenerationConfig {
  maxChangeLines: number;    // 最大変更行数 (デフォルト: 60)
  maxAffectedFiles: number;  // 最大影響ファイル数 (デフォルト: 5)
  safetyMode: boolean;       // 安全モード (より保守的な変更)
}

// パッチ生成器
export class PatchGenerator {
  private config: PatchGenerationConfig;
  
  constructor(config?: Partial<PatchGenerationConfig>) {
    this.config = {
      maxChangeLines: config?.maxChangeLines ?? 60,
      maxAffectedFiles: config?.maxAffectedFiles ?? 5,
      safetyMode: config?.safetyMode ?? false
    };
  }

  // パッチの生成
  public generatePatch(
    failureItems: FailureItem[],
    relevantContext: string[]
  ): OutputSchema {
    // 各failureItemに基づいてパッチ候補を生成
    const suspects = this.identifySuspects(failureItems);
    
    // パッチの生成 (Unified Diff形式)
    const unifiedDiff = this.createUnifiedDiff(failureItems, relevantContext);
    
    // テストケースの生成
    const tests = this.generateTests(failureItems);
    
    // 仮説の生成
    const hypothesis = this.generateHypothesis(failureItems, unifiedDiff);
    
    return {
      hypothesis,
      suspects,
      patch: {
        unified_diff: unifiedDiff
      },
      tests
    };
  }

  // 疑わしいファイルの特定
  private identifySuspects(failureItems: FailureItem[]): Array<{file: string, line: number, reason: string}> {
    const suspects: Array<{file: string, line: number, reason: string}> = [];
    
    for (const item of failureItems) {
      // failureItemからファイル名と行番号を抽出
      const filePath = item.path;
      const lineNo = item.meta?.line || 0;
      
      // 原因の推測
      let reason = `Failure in ${item.tool}: ${item.message}`;
      if (item.details) {
        reason += ` - ${item.details.substring(0, 100)}...`; // 最初の100文字のみ
      }
      
      suspects.push({
        file: filePath,
        line: lineNo,
        reason
      });
    }
    
    return suspects;
  }

  // Unified Diff形式のパッチ生成
  private createUnifiedDiff(failureItems: FailureItem[], context: string[]): string {
    // 実際にはfailureItemsやcontextを解析して具体的な変更を作成する
    // ここでは例としてテンプレートを返す
    
    // ヘッダ情報の構築
    const headerInfo = this.buildHeaderInfo(failureItems);
    
    // ハンク情報の構築
    const hunkInfo = this.buildHunkInfo(failureItems, context);
    
    // Unified Diff形式で構築
    return `diff --git ${headerInfo.oldFile} ${headerInfo.newFile}
--- ${headerInfo.oldFile}
+++ ${headerInfo.newFile}
@@ -${hunkInfo.startLine},${hunkInfo.oldLength} +${hunkInfo.startLine},${hunkInfo.newLength} @@
${hunkInfo.diffLines.join('\n')}`;
  }

  // ヘッダ情報の構築
  private buildHeaderInfo(failureItems: FailureItem[]): { oldFile: string, newFile: string } {
    // 最初のfailureItemからファイル情報を取得
    const firstFailure = failureItems[0];
    const filePath = firstFailure?.path || 'unknown';
    
    return {
      oldFile: `a/${filePath}`,
      newFile: `b/${filePath}`
    };
  }

  // ハンク情報の構築
  private buildHunkInfo(failureItems: FailureItem[], context: string[]): {
    startLine: number,
    oldLength: number,
    newLength: number,
    diffLines: string[]
  } {
    // 実際にはfailureItemの内容とcontextから具体的な変更を抽出する
    // ここでは例として簡単な置換を示す
    
    // 変更開始行 (例: 10行目から)
    const startLine = 10;
    
    // 元の行数と新しい行数 (例: 3行を4行に変更)
    const oldLength = 3;
    const newLength = 4;
    
    // ハンクの内容 (例: 1行削除、2行追加)
    const diffLines = [
      ' class ExampleClass:',
      '-    def problematic_method(self):',
      '-        return "buggy result"',
      '+    def fixed_method(self):',
      '+        return "correct result"'
    ];
    
    return {
      startLine,
      oldLength,
      newLength,
      diffLines
    };
  }

  // テストケースの生成
  private generateTests(failureItems: FailureItem[]): Array<{path: string, content: string, purpose: string}> {
    const tests = [];
    
    for (let i = 0; i < failureItems.length; i++) {
      const item = failureItems[i];
      
      // 各failureItemに応じたテストを生成
      const testPath = this.deriveTestPath(item.path);
      const testContent = this.createTestContent(item, i);
      const purpose = this.deriveTestPurpose(item);
      
      tests.push({
        path: testPath,
        content: testContent,
        purpose
      });
    }
    
    // 回帰防止用の追加テストを生成 (オプション)
    if (this.config.safetyMode) {
      const regressionTest = this.createRegressionTest(failureItems);
      if (regressionTest) {
        tests.push(regressionTest);
      }
    }
    
    return tests;
  }

  // テストファイルパスの導出
  private deriveTestPath(sourcePath: string): string {
    // ソースパスからテストパスを導出 (例: src/example.ts -> tests/example.test.ts)
    if (sourcePath.includes('/src/')) {
      return sourcePath.replace('/src/', '/tests/').replace(/\.(t|j)s$/, '.test.$1s');
    } else {
      // パスがsrcを含まない場合はtestsディレクトリ直下に配置
      const fileName = sourcePath.split('/').pop() || 'unknown';
      return `tests/${fileName.replace(/\.(t|j)s$/, '.test.$1s')}`;
    }
  }

  // テスト内容の作成
  private createTestContent(item: FailureItem, index: number): string {
    // 失敗の内容に応じたテストを作成
    const testPurpose = item.message || `Test for failure at ${item.path}`;
    
    // テスト言語の選択 (ツール名から判断)
    switch (item.tool) {
      case 'pytest':
        return this.createPythonTest(testPurpose, item, index);
      case 'jest':
        return this.createJSTest(testPurpose, item, index);
      case 'mocha':
        return this.createJSTest(testPurpose, item, index);
      default:
        return this.createGenericTest(testPurpose, item, index);
    }
  }

  // Python用テストの作成
  private createPythonTest(purpose: string, item: FailureItem, index: number): string {
    return `import pytest
from ${item.path.replace('/','.')}.replace('.py','') import *  # 実際には適切にimport

def test_failure_${index}_generated():
    """${purpose} - Generated test for failure reproduction"""
    # Actual test implementation based on failure details
    result = None  # 修正対象関数の呼び出し
    # expected = ?  # 期待される結果
    # assert result == expected
    pass  # 実際の検証ロジックはfailureItemの内容に応じて実装
`;
  }

  // JavaScript/TypeScript用テストの作成
  private createJSTest(purpose: string, item: FailureItem, index: number): string {
    return `describe('Generated test for failure', () => {
  test('${purpose}', () => {
    // Actual test implementation based on failure details
    // const result = require('../${item.path}'); // 実際には適切にimport
    // expect(result).toBe(...); // 期待される結果
    // 実際の検証ロジックはfailureItemの内容に応じて実装
  });
});`;
  }

  // 汎用テストの作成
  private createGenericTest(purpose: string, item: FailureItem, index: number): string {
    return `// Generated test for: ${purpose}
// Tool: ${item.tool}
// Path: ${item.path}
// Implementation depends on the specific failure and codebase structure
// This is a placeholder for the actual test content`;
  }

  // テスト目的の導出
  private deriveTestPurpose(item: FailureItem): string {
    return `Test for ${item.tool} failure: ${item.message.substring(0, 50)}${item.message.length > 50 ? '...' : ''}`;
  }

  // 回帰防止テストの作成
  private createRegressionTest(failureItems: FailureItem[]): {path: string, content: string, purpose: string} | null {
    if (failureItems.length === 0) return null;
    
    const firstFailurePath = failureItems[0].path;
    const regressionTestPath = this.deriveTestPath(firstFailurePath);
    const regressionTestPurpose = 'Regression prevention test';
    
    // 回帰防止テストの内容
    const regressionTestContent = `// Regression prevention test
// Ensures that the previously fixed issue doesn't reoccur
// Tests multiple scenarios to prevent regression`;
    
    return {
      path: regressionTestPath,
      content: regressionTestContent,
      purpose: regressionTestPurpose
    };
  }

  // 仮説の生成
  private generateHypothesis(failureItems: FailureItem[], patch: string): string {
    if (failureItems.length === 0) {
      return "No failures provided for hypothesis generation";
    }
    
    const tools = [...new Set(failureItems.map(item => item.tool))].join(', ');
    const messagePreview = failureItems[0].message.substring(0, 80);
    
    return `Hypothesis: The failures in ${tools} are likely caused by a logic error at ${failureItems[0].path}. 
    The error message "${messagePreview}" suggests an issue with data handling or function implementation. 
    The proposed patch modifies the problematic function to address this issue.`;
  }
}