import { FailureItem } from '../types/failure_item';

/**
 * Parse Go test output into FailureItem array
 * Go test format example:
 * --- FAIL: TestFunction (0.00s)
 *     file_test.go:15: Error message
 *     file_test.go:16: Another error message
 * FAIL
 * exit status 1
 */
export function parseGoOutput(goOutput: string): FailureItem[] {
  const failures: FailureItem[] = [];
  const lines = goOutput.split('\n');
  
  let currentTest = '';
  let currentFile = '';
  
  for (const line of lines) {
    // "--- FAIL:"の行を検出
    const failMatch = line.match(/--- FAIL: (.+) \(.+\)/);
    if (failMatch) {
      currentTest = failMatch[1];
      continue;
    }
    
    // ファイル名と行番号、エラーメッセージの形式を検出
    const errorMatch = line.match(/(\S+\.go):(\d+): (.+)/);
    if (errorMatch && currentTest) {
      const [, file, lineNum, message] = errorMatch;
      currentFile = file;
      
      failures.push({
        tool: 'go',
        path: file,
        message: message,
        details: `Go test failure in ${currentTest}`,
        severity: 'error',
        meta: {
          test_name: currentTest,
          line: parseInt(lineNum)
        }
      });
    }
    
    // "FAIL"の行でテストスイートの失敗情報を追加
    if (line.trim() === 'FAIL') {
      if (currentFile && currentTest) {
        // 上記のエラーが既に追加されているため、ここでは追加しない
        currentTest = '';
        currentFile = '';
      }
    }
  }

  return failures;
}