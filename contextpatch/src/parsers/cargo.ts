import { FailureItem, ParseResult, failure } from './types.js';

/** Minimal `cargo test` parser capturing panic locations. */
export function parseCargo(text: string): ParseResult {
  const failures: FailureItem[] = [];
  // Extract test name from thread panic message and location information
  // Updated to match module paths like 'module::tests::panics'
  const re = /thread '([^']+)' panicked at '([^']+)',\s+([^:\n]+):(\d+):(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const [, testName, message, file, line, col] = m;
    failures.push(failure('cargo', {
      path: file,        // Use path for schema compliance
      file: file,        // For backward compatibility
      test: testName,
      message: message,
      line: Number(line),
      col: Number(col),
      severity: 'error',
      meta: {
        test: testName,
        line: Number(line),
        col: Number(col)
      }
    }));
  }
  }
  return { framework: 'cargo', failures };
}