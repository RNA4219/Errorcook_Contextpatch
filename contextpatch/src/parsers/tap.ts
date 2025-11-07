import { FailureItem, ParseResult, failure } from './types.js';

/** Minimal TAP parser that extracts `not ok` lines as failures. */
export function parseTAP(input: string): ParseResult {
  const failures: FailureItem[] = [];
  const lines = input.split(/\r?\n/);
  for (const line of lines) {
    const m = /^not ok\s+\d+\s+(.*)$/.exec(line);
    if (m) {
      const details = m[1].trim();
      failures.push(failure('tap', {
        message: 'test failed',
        details: details,
        test: details,        // For wrapper function access
        severity: 'error',
        meta: {
          test: details
        }
      }));
    }
  }
  return { framework: 'tap', failures };
}