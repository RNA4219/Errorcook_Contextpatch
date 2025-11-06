import { Failure, ParseResult, failure } from './types.js';

/** Minimal `cargo test` parser capturing panic locations. */
export function parseCargo(text: string): ParseResult {
  const failures: Failure[] = [];
  const re = /panicked at '([^']+)',\s+([^:\n]+):(\d+):(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    failures.push(failure('cargo', {
      message: m[1],
      file: m[2],
      line: Number(m[3]),
      col: Number(m[4]),
    }));
  }
  return { framework: 'cargo', failures };
}
