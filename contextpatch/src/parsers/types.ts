export type FailureItem = {
  tool: string;
  path?: string;
  message: string;
  details?: string;
  severity?: 'error' | 'warning';
  meta?: Record<string, unknown>;
  // Additional properties for compatibility with current implementation
  testMessage?: string; // For JUnit failure message attribute
  line?: number;
  col?: number;
};

export type ParseResult = {
  framework: string;
  failures: FailureItem[];
};

export function failure(tool: string, p: Partial<FailureItem>): FailureItem {
  return {
    tool,
    message: p.message ?? "",
    path: p.path,
    details: p.details,
    severity: p.severity,
    meta: p.meta,
    testMessage: p.testMessage,
    line: p.line,
    col: p.col,
  };
}
