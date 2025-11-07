import { FailureItem, ParseResult, failure } from './types.js';

/** MyPy error parser */
export function parseMyPy(text: string): ParseResult {
  const failures: FailureItem[] = [];
  const lines = text.split(/\r?\n/);
  // MyPy format: file.py:line:col: error: message
  const mypyRegex = /^(.+):(\d+):(\d+):\s*(error|note):\s*(.+)$/;

  for (const line of lines) {
    const match = mypyRegex.exec(line);
    if (match) {
      const [, file, lineNum, colNum, severity, message] = match;
      
      if (severity.toLowerCase() === 'error') {
        failures.push(failure('mypy', {
          path: file.trim(),
          message: message.trim(),
          severity: 'error',
          meta: {
            file: file.trim(),
            line: parseInt(lineNum),
            col: parseInt(colNum)
          }
        }));
      }
    }
  }
  
  return { framework: 'mypy', failures };
}