export type Failure = {
  framework: string;
  test?: string;
  file?: string;
  message: string;
  line?: number;
  col?: number;
};

export type ParseResult = {
  framework: string;
  failures: Failure[];
};

export function failure(framework: string, p: Partial<Failure>): Failure {
  return {
    framework,
    message: p.message ?? "",
    test: p.test,
    file: p.file,
    line: p.line,
    col: p.col,
  };
}
