export type FailureItem = {
  tool: string;
  path?: string;
  message: string;
  details?: string;
  severity?: 'error' | 'warning';
  meta?: Record<string, unknown>;
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
    meta: p.meta ?? {},
  };
}
