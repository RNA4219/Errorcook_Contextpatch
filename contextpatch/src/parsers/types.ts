export type FailureItem = {
  tool: string;
  path?: string;
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

export function failure(tool: string, p: Partial<FailureItem>): FailureItem {
  return {
    tool,
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
  };
}
