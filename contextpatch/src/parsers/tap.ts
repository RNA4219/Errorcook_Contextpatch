import { Failure, ParseResult, failure } from './types';

/** Minimal TAP parser that extracts `not ok` lines as failures. */
export function parseTAP(input: string): ParseResult {
  const failures: Failure[] = [];
  const lines = input.split(/\r?\n/);
  for (const line of lines) {
    const m = /^not ok\s+\d+\s+(.*)$/.exec(line);
    if (m) {
      failures.push(failure('tap', { test: m[1].trim(), message: 'test failed' }));
    }
  }
  return { framework: 'tap', failures };
}
