import { Failure, ParseResult, failure } from './types.js';

/** MyPy error parser */
export function parseMyPy(text: string): ParseResult {
  const failures: Failure[] = [];
  const lines = text.split(/\r?\n/);
  // MyPy format: file.py:line:col: error: message
  const mypyRegex = /^(.+):(\d+):(\d+):\s*(error|note):\s*(.+)$/;

  for (const line of lines) {
    const match = mypyRegex.exec(line);
    if (match) {
      const [, file, lineNum, colNum, severity, message] = match;
      
      if (severity.toLowerCase() === 'error') {
        failures.push(failure('mypy', {
          file: file.trim(),
          line: parseInt(lineNum),
          col: parseInt(colNum),
          message: message.trim(),
        }));
      }
    }
  }
  
  return { framework: 'mypy', failures };
}