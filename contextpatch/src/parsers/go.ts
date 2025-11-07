import { Failure, ParseResult, failure } from './types.js';

/** Minimal `go test` parser for FAIL blocks. */
export function parseGoTest(text: string): ParseResult {
  const failures: Failure[] = [];
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
        test: currentTest,
        file: loc[1],
        line: Number(loc[2]),
        message: loc[3],
      }));
      // Note: We don't reset currentTest here to allow multiple errors per test
    }
  }
  return { framework: 'gotest', failures };
}
