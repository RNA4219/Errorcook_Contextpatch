import { FailureItem, ParseResult, failure } from './types.js';

/** Minimal `cargo test` parser capturing panic locations. */
export function parseCargo(text: string): ParseResult {
  const failures: Failure[] = [];
  // Extract test name from thread panic message and location information
  const re = /thread '(\w+)' panicked at '([^']+)',\s+([^:\n]+):(\d+):(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const [, testName, message, file, line, col] = m;
    failures.push(failure('cargo', {
      test: testName,
      message: message,
      file: file,
      line: Number(line),
      col: Number(col),
    }));
  }
  return { framework: 'cargo', failures };
}