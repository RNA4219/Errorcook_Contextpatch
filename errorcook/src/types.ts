/**
 * Core types for ErrorCook
 */

// Smell detection results
interface SmellReport {
  long_functions: string[];
  deep_nesting: string[];
  dup_ratio: number;
}

// Ranking information for smells
interface SmellRanking {
  id: string;
  roi: number; // Return on investment for fixing
}

// Refactor proposal
interface RefactorProposal {
  id: string;
  title: string;
  description: string;
  files: string[];
  estimatedEffort: number; // Effort score
}

// Generic failure item (from context with other modules)
interface FailureItem {
  type: string;
  location?: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, unknown>;
}

// Analysis result
interface AnalysisResult {
  smells: SmellReport;
  rankings: SmellRanking[];
  proposals: RefactorProposal[];
}

// Validation result
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ErrorCook processing result
interface ErrorCookResult {
  analysis: AnalysisResult;
  status: 'success' | 'partial' | 'failed';
  message?: string;
}

// Configuration for processing
interface ProcessConfig {
  inputFile?: string;
  outputDir?: string;
  verbose?: boolean;
  maxFiles?: number;
  maxChanges?: number;
}

export type { 
  SmellReport, 
  SmellRanking, 
  RefactorProposal, 
  FailureItem, 
  AnalysisResult, 
  ValidationResult, 
  ErrorCookResult, 
  ProcessConfig 
};
