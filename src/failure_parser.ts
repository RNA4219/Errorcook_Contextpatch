import { FailureItem } from './types/failure_item';

/**
 * Parse ESLint JSON output into FailureItem array
 */
export function parseESLintOutput(eslintOutput: any[]): FailureItem[] {
  const failures: FailureItem[] = [];

  eslintOutput.forEach(file => {
    if (file.messages && Array.isArray(file.messages)) {
      file.messages.forEach(message => {
        const severity = message.severity === 2 ? 'error' : 'warning';
        
        failures.push({
          id: `${file.filePath}-${message.line}-${message.column}`,
          tool: 'eslint',
          file: file.filePath,
          line: message.line,
          column: message.column,
          message: message.message,
          severity
        });
      });
    }
  });

  return failures;
}

/**
 * Parse Pytest output into FailureItem array
 */
export function parsePytestOutput(pytestOutput: any[]): FailureItem[] {
  const failures: FailureItem[] = [];

  pytestOutput.forEach(failure => {
    failures.push({
      id: `${failure.file}-${failure.line}`,
      tool: 'pytest',
      file: failure.file,
      line: failure.line,
      column: 0,
      message: failure.message,
      severity: 'error'
    });
  });

  return failures;
}

/**
 * Parse Clippy output into FailureItem array
 */
export function parseClippyOutput(clippyOutput: any[]): FailureItem[] {
  const failures: FailureItem[] = [];

  clippyOutput.forEach(failure => {
    const severity = failure.severity === 'error' ? 'error' : 'warning';
    
    failures.push({
      id: `${failure.file}-${failure.line}-${failure.column}`,
      tool: 'clippy',
      file: failure.file,
      line: failure.line,
      column: failure.column,
      message: failure.message,
      severity
    });
  });

  return failures;
}

/**
 * Generic parser that routes to specific parsers based on tool name
 */
export function parseFailureOutput(toolName: string, output: any[]): FailureItem[] {
  switch (toolName.toLowerCase()) {
    case 'eslint':
      return parseESLintOutput(output);
    case 'pytest':
      return parsePytestOutput(output);
    case 'clippy':
      return parseClippyOutput(output);
    default:
      throw new Error(`Unsupported tool: ${toolName}`);
  }
}