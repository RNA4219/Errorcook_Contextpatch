/**
 * Standardized failure item schema for CI results (compliant with SCHEMAS/failure_item.schema.json)
 */
export interface FailureItem {
  tool: string;
  path?: string;
  message: string;
  details?: string;
  severity: 'error' | 'warning';
  meta?: Record<string, any>;
}

/**
 * Triage result from LLM analysis (compliant with SCHEMAS/output.schema.json)
 */
export interface TriageResult {
  hypothesis: string;
  suspects: Array<{
    file: string;
    line?: number;
    reason: string;
  }>;
  patch: {
    unified_diff: string;
    files_changed?: number;
    lines_added?: number;
    lines_removed?: number;
  };
  tests: Array<{
    path: string;
    content: string;
    purpose: string;
  }>;
  id?: string;
  classification?: string;
  rootCause?: string;
  fixRecommendation?: string;
  timestamp?: string;
}

/**
 * ROI analysis for failure items
 */
export interface ROIAnalysis {
  totalCost: number;
  estimatedSavings: number;
  roi: number;
  analysis: {
    failureId: string;
    cost: number;
    savings: number;
  }[];
}