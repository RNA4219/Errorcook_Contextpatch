import { FailureItem, ParseResult, failure } from './types.js';

/** ESLint error parser for JSON output */
export function parseESLintJSON(jsonText: string): ParseResult {
  const failures: FailureItem[] = [];
  
  try {
    const eslintOutput = JSON.parse(jsonText);
    
    if (Array.isArray(eslintOutput)) {
      // Handle ESLint's JSON format where it's an array of file reports
      for (const fileReport of eslintOutput) {
        if (fileReport.filePath && Array.isArray(fileReport.messages)) {
          for (const message of fileReport.messages) {
            if (message.severity === 2) { // Only errors, not warnings
              failures.push(failure('eslint', {
                tool: 'eslint',
                path: fileReport.filePath,
                file: fileReport.filePath,  // For backward compatibility with tests
                message: `${message.ruleId || 'unknown-rule'}: ${message.message}`,
                details: `ESLint error at ${fileReport.filePath}:${message.line}:${message.column}`,
                severity: 'error',
                line: message.line,  // For backward compatibility with tests
                col: message.column,  // For backward compatibility with tests
                meta: {
                  line: message.line,
                  column: message.column
                }
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
                tool: 'eslint',
                path: fileReport.filePath,
                file: fileReport.filePath,  // For backward compatibility with tests
                message: `${message.ruleId || 'unknown-rule'}: ${message.message}`,
                details: `ESLint error at ${fileReport.filePath}:${message.line}:${message.column}`,
                severity: 'error',
                line: message.line,  // For backward compatibility with tests
                col: message.column,  // For backward compatibility with tests
                meta: {
                  line: message.line,
                  column: message.column
                }
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
          tool: 'eslint',
          path: file.trim(),
          file: file.trim(),  // For backward compatibility with tests
          message: message.trim(),
          details: `ESLint error at ${file.trim()}:${lineNum}:${colNum}`,
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
  
  return { framework: 'eslint', failures };
}

/** ESLint error parser for default output format */
export function parseESLint(text: string): ParseResult {
  const failures: FailureItem[] = [];
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
          tool: 'eslint',
          path: file.trim(),
          file: file.trim(),  // For backward compatibility with tests
          message: message.trim(),
          details: `ESLint error at ${file.trim()}:${lineNum}:${colNum}`,
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
  
  return { framework: 'eslint', failures };
}