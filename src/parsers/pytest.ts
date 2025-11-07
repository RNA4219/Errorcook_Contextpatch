import { FailureItem } from '../types/FailureItem';
import { FailureParser } from './interfaces';

/**
 * pytest用パーサー
 * Pytest format example:
 * ============================= test session starts ==============================
 * platform linux -- Python 3.x.x, pytest-x.x.x, py-x.x.x, pluggy-x.x.x
 * collected 2 items
 * 
 * test_example.py ..F                                                  [100%]
 * =========================== short test summary info ==========================
 * FAILED test_example.py::test_function - AssertionError: assert 1 == 2
 * ============================== 1 failed, 2 passed in 0.10s ===================
 */
export class PytestParser implements FailureParser {
  parse(pytestOutput: string): FailureItem[] {
    const failures: FailureItem[] = [];
    const lines = pytestOutput.split('\n');
    
    let inFailureSection = false;
    
    for (const line of lines) {
      // "FAILED"セクションを検出
      if (line.includes('short test summary info')) {
        inFailureSection = true;
        continue;
      }
      
      // 次のセクションが始まったら終了
      if (inFailureSection && line.trim() === '') {
        continue;
      }
      
      if (inFailureSection && line.startsWith('FAILED ')) {
        // FAILED行から情報を抽出: FAILED test_file.py::test_name - Error message
        const match = line.match(/FAILED (.*?\.py::.*?) - (.*)/);
        if (match) {
          const [, testLocation, errorMessage] = match;
          const [filePath, testName] = testLocation.split('::');
          
          failures.push({
            tool: 'pytest',
            path: filePath,
            message: errorMessage,
            details: `Pytest failure for test: ${testName}`,
            severity: 'error',
            meta: {
              test_name: testName
            }
          });
        }
      }
      
      // 次のセクションが始まったらフラグを戻す
      if (inFailureSection && (line.includes('passed') || line.includes('skipped'))) {
        break;
      }
    }

    return failures;
  }

  getToolName(): string {
    return 'pytest';
  }

  canParse(input: string): boolean {
    // pytest形式かどうかを検出
    return input.includes('FAILED') && 
           (input.includes('short test summary info') || 
            input.includes('test session starts'));
  }
}

// 従来の関数も引き続きエクスポート（後方互換性のため）
export function parsePytestOutput(pytestOutput: string): FailureItem[] {
  const parser = new PytestParser();
  return parser.parse(pytestOutput);
}