// ErrorCook ContextPatch Types

// Failure Item Schema
export interface FailureItem {
  tool: string;           // "pytest" | "mypy" | "eslint" etc.
  path: string;           // File/test case location
  message: string;        // Short error message
  details: string;        // Stack/log details
  severity: 'error' | 'warning'; // Error importance
  meta: {
    [key: string]: any;   // Line numbers, rule IDs, etc.
  };
}

// Output Schema
export interface OutputSchema {
  hypothesis: string;     // Failure cause hypothesis
  suspects: Array<{      // Suspect files array
    file: string;
    line: number;
    reason: string;
  }>;
  patch: {               // Unified Diff info
    unified_diff: string;
  };
  tests: Array<{         // Test cases (at least 1)
    path: string;
    content: string;
    purpose: string;
  }>;
}

// Evaluation Result Types
export interface EvaluationResult {
  gates: Gates;
  features: Features;
  score: number;
  report: string;
}

export interface Gates {
  jsonValid: boolean;
  unifiedDiffApplicable: boolean;
  changeLimit: boolean;
  testIncluded: boolean;
}

export interface Features {
  patchMinimality: number;
  testCoverageDelta: number;
  reproSuccess: boolean;
  linterClean: boolean;
  specAlignment: number;
  stability: number;
}