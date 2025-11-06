// Types based on JSON schemas

export interface FailureItem {
  tool: string;
  path?: string;
  message: string;
  details?: string;
  severity?: "error" | "warning";
  meta?: Record<string, any>;
}

export interface Suspect {
  file: string;
  line?: number;
  reason: string;
}

export interface Patch {
  unified_diff: string;
  files_changed?: number;
  lines_added?: number;
  lines_removed?: number;
}

export interface Test {
  path: string;
  content: string;
  purpose?: string;
}

export interface Output {
  hypothesis: string;
  suspects: Suspect[];
  patch: Patch;
  tests: Test[];
}

// Additional types for the workflow
export interface Ranking {
  id: string;
  roi: number;
}

export interface SmellReport {
  long_functions: any[];
  deep_nesting: any[];
  dup_ratio: number;
}

export interface RefactorProposal {
  [key: string]: any;
}