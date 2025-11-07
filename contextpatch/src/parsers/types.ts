export type FailureItem = {
  tool: string;
  path?: string;      // Schema-compliant field
  message: string;
  details?: string;
  severity?: 'error' | 'warning';
  meta?: {
    [key: string]: any;
  };
  testMessage?: string; // For JUnit failure message attribute
  line?: number;
  col?: number;
  // For backward compatibility with existing tests
  file?: string;
  test?: string;
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
    path: p.path,
    file: p.file,
    test: p.test,
    details: p.details,
    severity: p.severity,
    meta: p.meta,
    testMessage: p.testMessage,
    line: p.line,
    col: p.col,
    test: p.test,
  };
}
