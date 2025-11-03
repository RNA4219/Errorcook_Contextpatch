/**
 * Analysis result types for CI failure workflow
 */

export interface TriageResult {
  id: string;
  classification: string;
  rootCause: string;
  fixRecommendation: string;
  timestamp: string;
}

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