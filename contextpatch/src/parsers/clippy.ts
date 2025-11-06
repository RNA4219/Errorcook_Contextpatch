import { Failure, ParseResult, failure } from './types.js';

/** Clippy error parser */
export function parseClippy(text: string): ParseResult {
  const failures: Failure[] = [];
  const lines = text.split(/\r?\n/);
  // Look for Clippy error patterns
  let currentFile: string | undefined;
  let currentLine: number | undefined;
  let currentMessage: string | undefined;
  
  // Clippy often has JSON output but may have regular format too
  try {
    // Try parsing as JSON lines first (Cargo format)
    for (const line of lines) {
      if (line.trim().startsWith('{')) {
        try {
          const jsonLine = JSON.parse(line);
          if (jsonLine.reason === 'compiler-message' && jsonLine.message.level === 'error') {
            const primarySpan = jsonLine.message.spans.find((s: any) => s.is_primary);
            if (primarySpan) {
              failures.push(failure('clippy', {
                file: primarySpan.file_name,
                line: primarySpan.line_start,
                col: primarySpan.column_start,
                message: jsonLine.message.message,
              }));
            }
          }
        } catch (e) {
          // Not JSON, continue to regex parsing
        }
      }
    }
  } catch (e) {
    // Ignore JSON errors and continue with regex parsing
  }

  // If no JSON format found, use regex patterns for common Clippy output
  if (failures.length === 0) {
    const clippyRegex = /^(.+):(\d+):(\d+):\s*(\d+:\d+\s+)?(.+)$/;

    for (const line of lines) {
      const match = clippyRegex.exec(line);
      if (match) {
        const [, file, lineNum, colNum, , message] = match;
        
        // Check if this looks like a clippy error (has clippy-specific lints)
        if (message.toLowerCase().includes('clippy') || 
            message.toLowerCase().includes('lint') ||
            isClippyRelated(message)) {
          failures.push(failure('clippy', {
            file: file.trim(),
            line: parseInt(lineNum),
            col: parseInt(colNum),
            message: message.trim(),
          }));
        }
      }
    }
  }
  
  return { framework: 'clippy', failures };
}

// Helper function to identify clippy-related messages
function isClippyRelated(message: string): boolean {
  const clippyKeywords = [
    'assert', 'debug', 'doc', 'enum', 'float', 'if', 'let', 'loop', 'match',
    'mem', 'needless', 'redundant', 'unwrap', 'expect', 'todo', 'panic',
    'unused', 'deprecated', 'temporary', 'mutable', 'clippy'
  ];
  
  return clippyKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
}