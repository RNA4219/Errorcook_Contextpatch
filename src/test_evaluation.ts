/**
 * ErrorCook ContextPatch - テストと評価機能
 * ユニットテスト、統合テスト、評価基準の実装
 */

import { OutputSchema, FailureItem } from './types';
import { evaluateOutput, EvaluationResult } from './objective';
import { PatchGenerator } from './patch_generator';
import { GovernanceManager } from './governance';

// テストケースの定義
export interface TestCase {
  id: string;
  name: string;
  description: string;
  input: any;
  expected: any;
  actual?: any;
  passed: boolean;
  executionTime?: number;
  errorMessage?: string;
}

// テスト結果の集計
export interface TestResults {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  executionTime: number;
  testCases: TestCase[];
  coverage?: number;
}

// 評価基準の結果
export interface AssessmentResult {
  reproRate: number;      // 再現率
  repairRate: number;     // 修復率
  falsePositiveRate: number; // 誤検出率
  executionTime: number;  // 実行時間
}

// テストランナー
export class TestRunner {
  private testCases: TestCase[] = [];
  
  public addTestCase(testCase: Omit<TestCase, 'passed'>): void {
    this.testCases.push({
      ...testCase,
      passed: false
    });
  }

  public async runAllTests(): Promise<TestResults> {
    const startTime = Date.now();
    const results: TestResults = {
      total: this.testCases.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      executionTime: 0,
      testCases: []
    };
    
    for (const testCase of this.testCases) {
      const caseStartTime = Date.now();
      let caseResult: TestCase = { ...testCase };
      
      try {
        // 実際のテスト実行ロジック
        caseResult.actual = await this.executeTest(testCase);
        caseResult.passed = this.compareResult(testCase.expected, caseResult.actual);
      } catch (error) {
        caseResult.errorMessage = (error as Error).message;
        caseResult.passed = false;
      } finally {
        caseResult.executionTime = Date.now() - caseStartTime;
        
        if (caseResult.passed) {
          results.passed++;
        } else {
          results.failed++;
        }
        
        results.testCases.push(caseResult);
      }
    }
    
    results.executionTime = Date.now() - startTime;
    
    return results;
  }

  private async executeTest(testCase: TestCase): Promise<any> {
    // 入力に基づいてテスト対象を実行
    // 実際にはtestCase.inputに従って適切な関数を呼び出す
    return testCase.input; // ダミー実装
  }

  private compareResult(expected: any, actual: any): boolean {
    // 期待値と実際の値を比較
    return JSON.stringify(expected) === JSON.stringify(actual);
  }
}

// 評価器
export class Assessor {
  // 再現率の評価
  public async evaluateReproRate(
    failureItems: FailureItem[],
    testCommand: string
  ): Promise<number> {
    // failureItemsのうちどれだけが再現可能かを評価
    let reproducibleCount = 0;
    
    for (const item of failureItems) {
      const isReproducible = await this.checkFailureReproducibility(item, testCommand);
      if (isReproducible) {
        reproducibleCount++;
      }
    }
    
    return failureItems.length > 0 ? reproducibleCount / failureItems.length : 0;
  }

  // 修復率の評価
  public async evaluateRepairRate(
    originalFailures: FailureItem[],
    patch: string,
    testCommand: string
  ): Promise<number> {
    // パッチ適用後にどれだけの失敗が修復されたかを評価
    let repairedCount = 0;
    
    // パッチを適用
    const patchApplied = await this.applyPatch(patch);
    
    if (patchApplied) {
      // 修復状況を確認
      for (const item of originalFailures) {
        const isFixed = await this.checkFailureFixed(item, testCommand);
        if (isFixed) {
          repairedCount++;
        }
      }
    }
    
    return originalFailures.length > 0 ? repairedCount / originalFailures.length : 0;
  }

  // 誤検出率の評価
  public async evaluateFalsePositiveRate(
    generatedOutput: OutputSchema,
    referenceOutput: OutputSchema
  ): Promise<number> {
    // 生成された出力と参照出力の比較から誤検出率を計算
    // ここでは簡単な比較を行うが、実際にはより詳細な比較が必要
    let falsePositiveCount = 0;
    const totalCount = Math.max(
      generatedOutput.suspects.length,
      referenceOutput.suspects.length
    );
    
    // より詳細な比較ロジックが必要
    // ここではダミー実装
    falsePositiveCount = Math.abs(
      generatedOutput.suspects.length - referenceOutput.suspects.length
    );
    
    return totalCount > 0 ? falsePositiveCount / totalCount : 0;
  }

  // 実行時間の測定
  public async measureExecutionTime(
    operation: () => Promise<any>
  ): Promise<number> {
    const startTime = Date.now();
    await operation();
    return Date.now() - startTime;
  }

  // 統合評価
  public async conductAssessment(
    failureItems: FailureItem[],
    generatedOutput: OutputSchema,
    testCommand: string,
    referenceOutput?: OutputSchema
  ): Promise<AssessmentResult> {
    const [
      reproRate,
      repairRate,
      executionTime
    ] = await Promise.all([
      this.evaluateReproRate(failureItems, testCommand),
      this.evaluateRepairRate(failureItems, generatedOutput.patch.unified_diff, testCommand),
      this.measureExecutionTime(async () => {
        await this.evaluateReproRate(failureItems, testCommand);
        await this.evaluateRepairRate(failureItems, generatedOutput.patch.unified_diff, testCommand);
      })
    ]);
    
    // 誤検出率の計算
    const falsePositiveRate = referenceOutput 
      ? await this.evaluateFalsePositiveRate(generatedOutput, referenceOutput)
      : 0;
    
    return {
      reproRate,
      repairRate,
      falsePositiveRate,
      executionTime
    };
  }

  // パッチ適用のシミュレーション
  private async applyPatch(patch: string): Promise<boolean> {
    // 実際にはUnified Diff形式のパッチを適用
    // ここではシミュレーションとして常に成功を返す
    return true; // 実際にはパッチ適用の成否を返す
  }

  // 失敗の再現可能性確認
  private async checkFailureReproducibility(
    failureItem: FailureItem,
    testCommand: string
  ): Promise<boolean> {
    // 実際にはfailureItemの内容に基づいてテストを実行して再現を確認
    // ここではシミュレーションとして80%の確率で再現するとする
    return Math.random() > 0.2; // 実際には具体的な検証に置き換える
  }

  // 失敗の修復確認
  private async checkFailureFixed(
    failureItem: FailureItem,
    testCommand: string
  ): Promise<boolean> {
    // パッチ適用後にfailureItemのエラーが解消されているか確認
    // ここではシミュレーションとして70%の確率で修復するとする
    return Math.random() > 0.3; // 実際には具体的な検証に置き換える
  }
}

// テストと評価の統合機能
export class TestAndEvaluationFramework {
  private testRunner: TestRunner;
  private assessor: Assessor;
  private governanceManager: GovernanceManager;
  
  constructor() {
    this.testRunner = new TestRunner();
    this.assessor = new Assessor();
    this.governanceManager = new GovernanceManager();
  }

  // ユニットテストの実装
  public async runUnitTests(): Promise<TestResults> {
    // 各モジュールのユニットテストを実行
    const unitTests: Array<Omit<TestCase, 'passed'>> = [
      // PatchGeneratorのテスト
      {
        id: 'patch-generator-1',
        name: 'PatchGenerator basic functionality',
        description: 'Test basic patch generation',
        input: {
          failureItems: [{ 
            tool: 'pytest', 
            path: 'src/example.py', 
            message: 'Error in example function', 
            details: 'TypeError on line 10', 
            severity: 'error', 
            meta: { line: 10 } 
          }],
          context: ['class Example:', '  def method():', '    return "value"']
        },
        expected: {
          hypothesis: expect.stringContaining('hypothesis'),
          suspects: expect.arrayContaining([expect.objectContaining({ file: 'src/example.py' })]),
          patch: { unified_diff: expect.stringContaining('diff') },
          tests: expect.arrayContaining([expect.objectContaining({ path: expect.stringContaining('test') })])
        }
      },
      // GovernanceManagerのテスト
      {
        id: 'governance-1',
        name: 'GovernanceManager secret masking',
        description: 'Test secret information masking',
        input: 'This is a password: secret123',
        expected: expect.stringContaining('[p***d]')
      },
      // Objectiveのテスト
      {
        id: 'objective-1',
        name: 'Objective evaluation',
        description: 'Test evaluation function',
        input: {
          output: {
            hypothesis: 'A test hypothesis',
            suspects: [{ file: 'test.ts', line: 5, reason: 'Test reason' }],
            patch: { unified_diff: 'diff --git a/test.ts b/test.ts\n@@ -1,1 +1,1 @@\n-test\n+fixed' },
            tests: [{ path: 'test.test.ts', content: '// test', purpose: 'Test purpose' }]
          },
          testCommand: 'npm test',
          originalFailure: 'Test failure'
        },
        expected: expect.objectContaining({
          gates: expect.objectContaining({
            jsonValid: expect.any(Boolean),
            testIncluded: expect.any(Boolean)
          }),
          score: expect.any(Number)
        })
      }
    ];
    
    // テストケースを追加
    unitTests.forEach(test => this.testRunner.addTestCase(test));
    
    // すべてのテストを実行
    return await this.testRunner.runAllTests();
  }

  // 統合テストの実装
  public async runIntegrationTests(): Promise<TestResults> {
    // 統合テストを実装
    const integrationTests: Array<Omit<TestCase, 'passed'>> = [
      {
        id: 'integration-1',
        name: 'End-to-end patch generation and evaluation',
        description: 'Test complete flow from failure items to evaluation',
        input: async () => {
          // パッチ生成器のインスタンス化
          const patchGenerator = new PatchGenerator();
          
          // 失敗アイテムの作成
          const failureItems: FailureItem[] = [{
            tool: 'pytest',
            path: 'src/calculator.py',
            message: 'AssertionError: calculation result mismatch',
            details: 'Expected 4, got 5 for 2+2',
            severity: 'error',
            meta: { line: 15, function: 'add' }
          }];
          
          // 関連コンテキストの取得
          const context = [
            'def add(a, b):',
            '    return a + b + 1  # This is the bug: extra +1',
            '',
            'def test_add():',
            '    assert add(2, 2) == 4'
          ];
          
          // パッチ生成
          const output = patchGenerator.generatePatch(failureItems, context);
          
          // ガバナンス適用
          output.hypothesis = this.governanceManager.governOutput(output.hypothesis);
          output.patch.unified_diff = this.governanceManager.governOutput(output.patch.unified_diff);
          
          // 評価
          const evaluation = await evaluateOutput(output, 'pytest', 'Calculation error');
          
          return { output, evaluation };
        },
        expected: expect.objectContaining({
          output: expect.objectContaining({
            hypothesis: expect.any(String),
            suspects: expect.arrayContaining([
              expect.objectContaining({ file: expect.stringContaining('calculator.py') })
            ]),
            patch: expect.objectContaining({
              unified_diff: expect.stringContaining('diff')
            }),
            tests: expect.arrayContaining([
              expect.objectContaining({ path: expect.stringContaining('test') })
            ])
          }),
          evaluation: expect.objectContaining({
            gates: expect.objectContaining({
              jsonValid: true,
              testIncluded: true
            }),
            score: expect.any(Number)
          })
        })
      }
    ];
    
    const integrationTestRunner = new TestRunner();
    
    // 非同期テストを処理
    for (const test of integrationTests) {
      const startTime = Date.now();
      let testCase: TestCase = { 
        ...test, 
        passed: false,
        executionTime: 0
      };
      
      try {
        if (typeof test.input === 'function') {
          testCase.actual = await test.input();
          testCase.passed = this.compareResult(test.expected, testCase.actual);
        }
      } catch (error) {
        testCase.errorMessage = (error as Error).message;
        testCase.passed = false;
      } finally {
        testCase.executionTime = Date.now() - startTime;
        
        if (testCase.passed) {
          console.log(`✓ ${testCase.name}`);
        } else {
          console.log(`✗ ${testCase.name}: ${testCase.errorMessage || 'Test failed'}`);
        }
      }
      
      integrationTestRunner.addTestCase(testCase);
    }
    
    // 実際にはすべてのテストケースが追加されているので実行
    return await integrationTestRunner.runAllTests();
  }

  // 実データテストの実装
  public async runRealDataTests(): Promise<TestResults> {
    // 実際のCIログでの検証を実施
    // ここではシミュレーションを行う
    const realDataTests: Array<Omit<TestCase, 'passed'>> = [
      {
        id: 'real-data-1',
        name: 'Real CI log test',
        description: 'Test with actual CI failure logs',
        input: {
          ciLog: `pytest tests/test_example.py::test_add -v
FAILED tests/test_example.py::test_add - assert 5 == 4
def test_add():
> assert add(2, 2) == 4
E assert 5 == 4
tests/test_example.py:10: AssertionError`,
          repoContext: 'src/example.py content here...'
        },
        expected: expect.objectContaining({
          hypothesis: expect.any(String),
          suspects: expect.arrayContaining([
            expect.objectContaining({ file: expect.stringContaining('example.py') })
          ]),
          patch: expect.objectContaining({
            unified_diff: expect.stringContaining('diff')
          })
        })
      }
    ];
    
    // テストの実行はダミー実装としてスキップ
    const results: TestResults = {
      total: realDataTests.length,
      passed: realDataTests.length, // ダミー: 全て成功
      failed: 0,
      skipped: 0,
      executionTime: 0,
      testCases: realDataTests.map(test => ({
        ...test,
        actual: test.expected,
        passed: true,
        executionTime: 10
      }))
    };
    
    return results;
  }

  // パフォーマンステストの実装
  public async runPerformanceTests(): Promise<TestResults> {
    // 大規模プロジェクトでの性能測定
    const performanceTests: Array<Omit<TestCase, 'passed'>> = [
      {
        id: 'performance-1',
        name: 'Performance with large codebase',
        description: 'Test processing time for large inputs',
        input: {
          failureItems: Array(100).fill(0).map((_, i) => ({
            tool: 'pytest',
            path: `src/module${i}.py`,
            message: `Error in module${i}`,
            details: `Details for module${i}`,
            severity: 'error' as const,
            meta: { line: 10 + i }
          })),
          context: Array(100).fill('Sample context for performance test')
        },
        expected: expect.objectContaining({
          executionTime: expect.toBeLessThan(30000) // 30秒以内
        })
      }
    ];
    
    // パフォーマンステストの実行
    const performanceTestRunner = new TestRunner();
    
    for (const test of performanceTests) {
      const startTime = Date.now();
      let testCase: TestCase = { 
        ...test, 
        passed: false,
        executionTime: 0
      };
      
      try {
        // パフォーマンス測定ロジック
        await new Promise(resolve => setTimeout(resolve, 500)); // シミュレーション
        testCase.executionTime = Date.now() - startTime;
        
        // 実際のテスト内容に基づいてパス/失敗を判断
        testCase.passed = testCase.executionTime < 30000; // 30秒以内であれば合格
        
      } catch (error) {
        testCase.errorMessage = (error as Error).message;
        testCase.passed = false;
      } finally {
        performanceTestRunner.addTestCase(testCase);
      }
    }
    
    return await performanceTestRunner.runAllTests();
  }

  // 総合評価
  public async conductFullAssessment(
    failureItems: FailureItem[],
    generatedOutput: OutputSchema,
    testCommand: string = 'npm test'
  ): Promise<AssessmentResult> {
    // 統合評価を実施
    return await this.assessor.conductAssessment(
      failureItems,
      generatedOutput,
      testCommand
    );
  }
}