/**
 * Analysis result types for CI failure workflow
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

/**
 * Evaluation features for scoring (compliant with SPECS/objective.md)
 */
export interface EvaluationFeatures {
  patch_minimality: number;    // 0-1 score based on lines/files changed
  test_coverage_delta: number; // 0-1 score for test coverage improvement
  repro_success: number;       // 0-1 flag for successful reproduction and fix
  linter_clean: number;        // 0-1 flag for clean linting after fix
  spec_alignment: number;      // 0-1 score for alignment with failure specs
  stability: number;          // 0-1 flag for result consistency across runs
}

/**
 * Gate evaluation results (compliant with SPECS/objective.md)
 */
export interface GateResults {
  json_validity: boolean;       // JSON schema compliance
  unified_diff_applicable: boolean; // Unified diff can be applied
  line_count_limit: boolean;   // ≤60 lines changed
  file_count_limit: boolean;   // ≤5 files changed
  test_included: boolean;      // At least one test included
}

/**
 * Complete evaluation result
 */
export interface EvaluationResult {
  gates: GateResults;
  features: EvaluationFeatures;
  final_score: number;
  passed_gates: string[];
  failed_gates: string[];
}