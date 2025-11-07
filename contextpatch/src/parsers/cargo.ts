import { FailureItem, ParseResult, failure } from './types.js';

/** Minimal `cargo test` parser capturing panic locations. */
export function parseCargo(text: string): ParseResult {
  const failures: FailureItem[] = [];
  // Extract test name from thread panic message and location information
  // Updated to match cargo test output format from fixture file
  const re = /thread '([^']*)' panicked at '([^']+)',\s+([^:\n]+):(\d+):(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const [, testName, message, file, line, col] = m;
    failures.push(failure('cargo', {
      path: file,
      file: file,  // For backward compatibility with tests
      test: testName,  // For backward compatibility with tests
      message: message,  // Expected by test: 'boom'
      details: `Rust panic at ${file}:${line}:${col}`,
      severity: 'error',
      line: Number(line),  // For backward compatibility with tests
      col: Number(col),    // For backward compatibility with tests
      meta: {
        test_name: testName,
        line: Number(line),
        column: Number(col)
      }
    }));
  }
  
  // Additional pattern to match different cargo output format
  if (failures.length === 0) {
    const altRe = /thread '([^']*)' panicked at .*,\s+([^:\n]+):(\d+):(\d+)\s*:\s*'([^']+)'/g;
    while ((m = altRe.exec(text))) {
      const [, testName, file, line, col, message] = m;
      failures.push(failure('cargo', {
        path: file,
        file: file,
        test: testName,
        message: message,
        details: `Rust panic at ${file}:${line}:${col}`,
        severity: 'error',
        line: Number(line),
        col: Number(col),
        meta: {
          test_name: testName,
          line: Number(line),
          column: Number(col)
        }
      }));
    }
  }
  
  // If still no matches, try a more general pattern
  if (failures.length === 0) {
    const generalRe = /panicked at '([^']+)',\s+([^:\n]+):(\d+):(\d+)/g;
    while ((m = generalRe.exec(text))) {
      const [, message, file, line, col] = m;
      // Extract test name from test module name if possible
      const testMatch = /thread '([^']*)'/.exec(text.substring(0, text.indexOf('panicked at')));
      const testName = testMatch ? testMatch[1] : 'unknown';
      
      failures.push(failure('cargo', {
        path: file,
        file: file,
        test: testName,
        message: message,
        details: `Rust panic at ${file}:${line}:${col}`,
        severity: 'error',
        line: Number(line),
        col: Number(col),
        meta: {
          test_name: testName,
          line: Number(line),
          column: Number(col)
        }
      }));
    }
  }
  
  return { framework: 'cargo', failures };
}