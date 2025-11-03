import { Failure, ParseResult, failure } from './types';

/** Minimal pytest text output parser for FAILED lines. */
export function parsePytest(text: string): ParseResult {
  const failures: Failure[] = [];
  const re = /^FAILED\s+(\S+?)::(\S+)(?:\s+-\s+(.+))?$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    failures.push(failure('pytest', {
      file: m[1],
      test: m[2],
      message: (m[3] || 'failed').trim(),
    }));
  }
  return { framework: 'pytest', failures };
}
