import { FailureItem } from '../types/failure_item';

/**
 * Parse TAP (Test Anything Protocol) output into FailureItem array
 * TAP format example:
 * TAP version 13
 * 1..2
 * ok 1 - Input file opened
 * not ok 2 - First line of the input valid
 *   ---
 *   message: "Expected line 1 to be 'foo', got 'bar'"
 *   severity: fail
 *   ...
 */
export function parseTapOutput(tapOutput: string): FailureItem[] {
  const failures: FailureItem[] = [];
  const lines = tapOutput.split('\n');
  
  // TAP通常の形式からテスト結果を抽出
  let lineNumber = 0;
  for (const line of lines) {
    lineNumber++;
    
    // 'not ok'の行をエラーとして扱う
    if (line.startsWith('not ok')) {
      // TAPのエラーメッセージ形式から詳細情報を抽出
      const match = line.match(/not ok (\d+) - (.*)/);
      if (match) {
        const [, testNumber, message] = match;
        
        failures.push({
          tool: 'tap',
          path: 'tap-output', // TAP出力全体を指す一般的なパス
          message: message || `Test ${testNumber} failed`,
          details: `TAP test number: ${testNumber}`,
          severity: 'error',
          meta: {
            line: lineNumber,
            test_number: parseInt(testNumber)
          }
        });
      }
    }
  }

  return failures;
}