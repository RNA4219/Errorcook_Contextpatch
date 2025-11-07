import { FailureItem, ParseResult, failure } from './types.js';

/** Minimal pytest text output parser for FAILED lines. */
export function parsePytest(text: string): ParseResult {
  const failures: FailureItem[] = [];
  const re = new RegExp("^FAILED\\s+(\\S+?)::(\\S+)(?:\\s+-\\s+(.+))?$", "gm");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    failures.push(failure('pytest', {
      path: m[1],
      file: m[1],  // For backward compatibility with tests
      test: m[2],  // For backward compatibility with tests
      message: `Test ${m[2]} failed: ${(m[3] || 'failed').trim()}`,  // For backward compatibility with src/parsers/pytest.test.ts
      details: `Pytest failure for test: ${m[2]}`,  // For backward compatibility with tests
      severity: 'error',
      meta: {
        test: m[2],  // For backward compatibility with tests
        file: m[1]   // For backward compatibility with tests
      }
    }));
  }
  return { framework: 'pytest', failures };
}