import { FailureItem, ParseResult, failure } from './types.js';

/** Minimal `cargo test` parser capturing panic locations. */
export function parseCargo(text: string): ParseResult {
  const failures: FailureItem[] = [];
  const re = /panicked at '([^']+)',\s+([^:\n]+):(\d+):(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    failures.push(failure('cargo', {
      path: m[2],
      message: m[1],
      severity: 'error',
      meta: {
        line: Number(m[3]),
        col: Number(m[4]),
        file: m[2]
      }
    }));
  }
  return { framework: 'cargo', failures };
}