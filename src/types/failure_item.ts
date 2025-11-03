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
 * Triage result from LLM analysis
 */
export interface TriageResult {
  id: string;
  classification: string;
  rootCause: string;
  fixRecommendation: string;
  timestamp: string;
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
