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
        path: loc[1],
        file: loc[1],  // For backward compatibility with tests
        test: currentTest,  // For backward compatibility with tests
        message: loc[3],
        details: `Go test failure in ${currentTest}`,
        severity: 'error',
        line: Number(loc[2]),  // For backward compatibility with tests
        meta: {
          test_name: currentTest,
          line: Number(loc[2])
        }
      }));
      // Note: We don't reset currentTest here to allow multiple errors per test
    }
  }
  return { framework: 'gotest', failures };
}