/**
 * Standardized failure item schema for CI results
 */
export interface FailureItem {
  id: string;
  tool: string;
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  timestamp: string;
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