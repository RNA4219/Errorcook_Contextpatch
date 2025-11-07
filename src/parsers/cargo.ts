import { FailureItem } from '../types/failure_item';

/**
 * Parse Cargo test output into FailureItem array
 * Cargo test format example:
 * test test_function ... FAILED
 * failures:
 * ---- test_function stdout ----
 * thread 'test_function' panicked at 'assertion failed: `(left == right)`
 *   left: `1`,
 *   right: `2`', src/lib.rs:4:5
 * 
 * failures:
 *     test_function
 */
export function parseCargoOutput(cargoOutput: string): FailureItem[] {
  const failures: FailureItem[] = [];
  const lines = cargoOutput.split('\n');
  
  let inFailuresSection = false;
  let currentTest = '';
  
  for (const line of lines) {
    // "test ... FAILED"の行を検出
    const failedMatch = line.match(/test (.+) \.\.\. FAILED/);
    if (failedMatch) {
      const testName = failedMatch[1];
      failures.push({
        tool: 'cargo',
        path: 'src', // Rustプロジェクトのデフォルトソースディレクトリ
        message: `Test ${testName} failed`,
        details: `Rust/Cargo test failure`,
        severity: 'error',
        meta: {
          test_name: testName
        }
      });
      currentTest = testName;
      continue;
    }
    
    // "failures:"セクションの開始を検出
    if (line.includes('failures:')) {
      inFailuresSection = true;
      continue;
    }
    
    // panicメッセージを検出
    if (inFailuresSection && currentTest) {
      // panicメッセージからファイルと行番号を抽出
      const panicMatch = line.match(/thread '.*' panicked at '(.+)', (.*\.rs):(\d+):(\d+)/);
      if (panicMatch) {
        const [, message, file, line, column] = panicMatch;
        
        // 既存のエントリを更新または新しいエントリを作成
        const existingFailure = failures.find(f => f.meta?.test_name === currentTest);
        if (existingFailure) {
          existingFailure.message = message;
          existingFailure.details = `Rust panic: ${message}`;
          existingFailure.path = file;
          existingFailure.meta = {
            ...existingFailure.meta,
            line: parseInt(line),
            column: parseInt(column)
          };
        } else {
          failures.push({
            tool: 'cargo',
            path: file,
            message: message,
            details: `Rust panic at ${file}:${line}:${column}`,
            severity: 'error',
            meta: {
              test_name: currentTest,
              line: parseInt(line),
              column: parseInt(column)
            }
          });
        }
      }
    }
    
    // "test result:"が見つかったら失敗セクション終了
    if (line.includes('test result:')) {
      inFailuresSection = false;
      currentTest = '';
    }
  }

  return failures;
}