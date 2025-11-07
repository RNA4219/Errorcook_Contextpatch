export type FailureItem = {
  tool: string;
  path?: string;
  message: string;
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
    test: p.test,
    file: p.file,
    testMessage: p.testMessage,
    line: p.line,
    col: p.col,
  };
}
