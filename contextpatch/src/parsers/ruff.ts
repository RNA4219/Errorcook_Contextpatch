import { Failure, ParseResult, failure } from './types.js';

/** Ruff error parser */
export function parseRuff(text: string): ParseResult {
  const failures: Failure[] = [];
  const lines = text.split(/\r?\n/);
  // Ruff format: file.py:line:col: code message
  const ruffRegex = /^(.+):(\d+):(\d+):\s*([A-Z][A-Z0-9]+)\s*(.+)$/;

  for (const line of lines) {
    const match = ruffRegex.exec(line);
    if (match) {
      const [, file, lineNum, colNum, errorCode, message] = match;
      
      // Include all linter errors (could filter by severity if needed)
      failures.push(failure('ruff', {
        file: file.trim(),
        line: parseInt(lineNum),
        col: parseInt(colNum),
        message: `${errorCode}: ${message.trim()}`,
      }));
    }
  }
  
  return { framework: 'ruff', failures };
}