import { FailureItem, ParseResult, failure } from './types.js';

/** Minimal `go test` parser for FAIL blocks. */
export function parseGoTest(text: string): ParseResult {
  const failures: FailureItem[] = [];
  const lines = text.split(/\r?\n/);
  let currentTest: string | undefined;
  for (const line of lines) {
    const start = /^--- FAIL: (\S+)/.exec(line);
    if (start) { 
      currentTest = start[1]; 
      continue; 
    }
    const loc = /^\s+(.+?):(\d+):\s+(.*)$/.exec(line);
    if (loc && currentTest) {
      failures.push(failure('gotest', {
        path: loc[1],        // Use path for schema compliance
        file: loc[1],        // For backward compatibility
        test: currentTest,   // For wrapper function access
        message: loc[3],
        line: Number(loc[2]), // For wrapper function access
        severity: 'error',
        meta: {
          test: currentTest,
          file: loc[1],
          line: Number(loc[2])
        }
      }));
      // Note: We don't reset currentTest here to allow multiple errors per test
    }
  }
  return { framework: 'gotest', failures };
}