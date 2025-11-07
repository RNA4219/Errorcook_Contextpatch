import { FailureItem, ParseResult, failure } from './types.js';

/** Minimal pytest text output parser for FAILED lines. */
export function parsePytest(text: string): ParseResult {
  const failures: FailureItem[] = [];
  const re = new RegExp("^FAILED\\s+(\\S+?)::(\\S+)(?:\\s+-\\s+(.+))?$", "gm");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    failures.push(failure('pytest', {
      path: m[1],        // Use path for schema compliance
      file: m[1],        // For backward compatibility
      test: m[2],        // For wrapper function access
      message: `Test ${m[2]} failed: ${(m[3] || 'failed').trim()}`,
      severity: 'error',
      meta: {
        test: m[2],
        file: m[1]
      }
    }));
  }
  return { framework: 'pytest', failures };
}