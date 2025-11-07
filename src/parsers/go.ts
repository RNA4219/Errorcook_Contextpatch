import { FailureItem } from '../types/FailureItem';
import { FailureParser } from './interfaces';

/**
 * Go test用パーサー
 * Go test format example:
 * --- FAIL: TestFunction (0.00s)
 *     file_test.go:15: Error message
 *     file_test.go:16: Another error message
 * FAIL
 * exit status 1
 */
export class GoParser implements FailureParser {
  parse(goOutput: string): FailureItem[] {
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

  getToolName(): string {
    return 'go';
  }

  canParse(input: string): boolean {
    // Go test形式かどうかを検出
    return input.includes('--- FAIL:') && 
           (input.includes('.go:') || input.includes('exit status'));
  }
}

// 従来の関数も引き続きエクスポート（後方互換性のため）
export function parseGoOutput(goOutput: string): FailureItem[] {
  const parser = new GoParser();
  return parser.parse(goOutput);
}