import { Failure, ParseResult, failure } from './types.js';

/** ESLint error parser for JSON output */
export function parseESLintJSON(jsonText: string): ParseResult {
  const failures: Failure[] = [];
  
  try {
    const eslintOutput = JSON.parse(jsonText);
    
    if (Array.isArray(eslintOutput)) {
      // Handle ESLint's JSON format where it's an array of file reports
      for (const fileReport of eslintOutput) {
        if (fileReport.filePath && Array.isArray(fileReport.messages)) {
          for (const message of fileReport.messages) {
            if (message.severity === 2) { // Only errors, not warnings
              failures.push(failure('eslint', {
                file: fileReport.filePath,
                line: message.line,
                col: message.column,
                message: `${message.ruleId || 'unknown-rule'}: ${message.message}`,
              }));
            }
          }
        }
      }
    } else if (eslintOutput.results && Array.isArray(eslintOutput.results)) {
      // Handle alternative output format
      for (const fileReport of eslintOutput.results) {
        if (fileReport.filePath && Array.isArray(fileReport.messages)) {
          for (const message of fileReport.messages) {
            if (message.severity === 2) { // Only errors
              failures.push(failure('eslint', {
                file: fileReport.filePath,
                line: message.line,
                col: message.column,
                message: `${message.ruleId || 'unknown-rule'}: ${message.message}`,
              }));
            }
          }
        }
      }
    }
  } catch (e) {
    // If JSON parsing fails, try to parse as simple text format
    const lines = jsonText.split(/\r?\n/);
    const eslintRegex = /(.+):(\d+):(\d+):\s*(.*)/;
    
    for (const line of lines) {
      const match = eslintRegex.exec(line);
      if (match) {
        const [, file, lineNum, colNum, message] = match;
        failures.push(failure('eslint', {
          file: file.trim(),
          line: parseInt(lineNum),
          col: parseInt(colNum),
          message: message.trim(),
        }));
      }
    }
  }
  
  return { framework: 'eslint', failures };
}

/** ESLint error parser for default output format */
export function parseESLint(text: string): ParseResult {
  const failures: Failure[] = [];
  const lines = text.split(/\r?\n/);
  const eslintRegex = /(.+):(\d+):(\d+):\s*(?:\d+:\d+\s+)?([^\s].*)/;

  for (const line of lines) {
    const match = eslintRegex.exec(line);
    if (match) {
      const [, file, lineNum, colNum, message] = match;
      
      // Only include if it's an error (not just a warning)
      if (message.toLowerCase().includes('error') || 
          !message.toLowerCase().includes('warning')) {
        failures.push(failure('eslint', {
          file: file.trim(),
          line: parseInt(lineNum),
          col: parseInt(colNum),
          message: message.trim(),
        }));
      }
    }
  }
  
  return { framework: 'eslint', failures };
}