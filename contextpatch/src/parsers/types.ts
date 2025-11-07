export type FailureItem = {
  tool: string;
  path?: string;      // Schema-compliant field
  message: string;
  details?: string;
  severity?: 'error' | 'warning';
  meta?: {
    [key: string]: any;
  };
  // Fields for backward compatibility with existing tests
  file?: string;      // Alias for path
  test?: string;      // Test name
  testMessage?: string; // For JUnit failure message attribute
  line?: number;
  col?: number;
};

export type ParseResult = {
  framework: string;
  failures: FailureItem[];
};

// The failure function creates a FailureItem that conforms to the schema while maintaining backward compatibility
export function failure(tool: string, p: Partial<FailureItem>): FailureItem {
  return {
    tool,
    path: p.path,           // Schema-compliant field
    file: p.file || p.path, // Backward compatibility: use p.file if provided, otherwise use path
    message: p.message ?? "",
    details: p.details,
    severity: p.severity,
    meta: p.meta,
    // Additional fields
    testMessage: p.testMessage,
    line: p.line,
    col: p.col,
    test: p.test,
  };
}
