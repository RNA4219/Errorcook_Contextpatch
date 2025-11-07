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
          tool: 'mypy',
          path: file.trim(),
          file: file.trim(),  // For backward compatibility with tests
          message: message.trim(),
          details: `MyPy error at ${file.trim()}:${lineNum}:${colNum}`,
          severity: 'error',
          line: parseInt(lineNum),  // For backward compatibility with tests
          col: parseInt(colNum),    // For backward compatibility with tests
          meta: {
            line: parseInt(lineNum),
            column: parseInt(colNum)
          }
        }));
      }
    }
  }
  
  return { framework: 'mypy', failures };
}