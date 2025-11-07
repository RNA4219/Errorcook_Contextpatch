import { FailureItem, ParseResult, failure } from './types.js';

/** Ruff error parser */
export function parseRuff(text: string): ParseResult {
  const failures: FailureItem[] = [];
  const lines = text.split(/\r?\n/);
  // Ruff format: file.py:line:col: code message
  const ruffRegex = /^(.+):(\d+):(\d+):\s*([A-Z][A-Z0-9]+)\s*(.+)$/;

  for (const line of lines) {
    const match = ruffRegex.exec(line);
    if (match) {
      const [, file, lineNum, colNum, errorCode, message] = match;
      
      // Include all linter errors (could filter by severity if needed)
      failures.push(failure('ruff', {
        tool: 'ruff',
        path: file.trim(),
        file: file.trim(),  // For backward compatibility with tests
        message: `${errorCode}: ${message.trim()}`,
        details: `Ruff error at ${file.trim()}:${lineNum}:${colNum}`,
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
  
  return { framework: 'ruff', failures };
}