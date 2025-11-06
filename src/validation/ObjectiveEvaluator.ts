/**
 * Objective function implementation for ErrorCook/ContextPatch
 * Based on SPECS/objective.md
 */

import { TriageResult } from '../types/failure_item';
import { SchemaValidator } from '../validation/SchemaValidator';

interface EvaluationResult {
  gatesPassed: boolean;
  features: {
    patch_minimality: number;
    test_coverage_delta: number;
    repro_success: number;
    linter_clean: number;
    spec_alignment: number;
    stability: number;
  };
  score: number;
  errors?: string[];
}

interface ObjectiveConfig {
  weights: {
    patch_minimality: number;
    test_coverage_delta: number;
    repro_success: number;
    linter_clean: number;
    spec_alignment: number;
    stability: number;
  };
  limits: {
    max_files: number;
    max_lines: number;
    max_hunks: number;
  };
}

// Default configuration
const DEFAULT_CONFIG: ObjectiveConfig = {
  weights: {
    patch_minimality: 0.15,
    test_coverage_delta: 0.15,
    repro_success: 0.25, // Higher weight as specified
    linter_clean: 0.15,
    spec_alignment: 0.15,
    stability: 0.15
  },
  limits: {
    max_files: 5,
    max_lines: 60,
    max_hunks: 10
  }
};

/**
 * Evaluates a TriageResult against the objective function
 */
class ObjectiveEvaluator {
  private config: ObjectiveConfig;
  private schemaValidator: SchemaValidator;

  constructor(config?: Partial<ObjectiveConfig>) {
    this.config = { ...DEFAULT_CONFIG };
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.schemaValidator = new SchemaValidator();
  }

  /**
   * Main evaluation function that checks gates and calculates features
   */
  evaluate(triageResult: TriageResult, originalFailures?: any[]): EvaluationResult {
    // First check Gates
    const gatesCheck = this.checkGates(triageResult);
    
    if (!gatesCheck.valid) {
      return {
        gatesPassed: false,
        features: {
          patch_minimality: 0,
          test_coverage_delta: 0,
          repro_success: 0,
          linter_clean: 0,
          spec_alignment: 0,
          stability: 0
        },
        score: 0,
        errors: gatesCheck.errors
      };
    }

    // If gates pass, calculate features
    const features = this.calculateFeatures(triageResult, originalFailures);
    
    // Calculate weighted score
    let score = 0;
    for (const [key, value] of Object.entries(features)) {
      const weight = this.config.weights[key as keyof typeof this.config.weights];
      if (weight !== undefined) {
        score += value * weight;
      }
    }

    return {
      gatesPassed: true,
      features,
      score
    };
  }

  /**
   * Check if all Gates are passed
   */
  private checkGates(triageResult: TriageResult): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Check JSON schema compliance
    const schemaValidation = this.schemaValidator.validateOutputSchema(triageResult);
    if (!schemaValidation.valid) {
      errors.push(...(schemaValidation.errors || ['JSON schema validation failed']));
    }

    // Check Unified Diff format compliance (basic check)
    if (!triageResult.patch.unified_diff || !this.isValidDiffFormat(triageResult.patch.unified_diff)) {
      errors.push('Unified Diff format is invalid');
    }

    // Check change limits
    if (triageResult.patch.files_changed && triageResult.patch.files_changed > this.config.limits.max_files) {
      errors.push(`Files changed (${triageResult.patch.files_changed}) exceeds limit (${this.config.limits.max_files})`);
    }

    if (triageResult.patch.lines_added !== undefined && 
        triageResult.patch.lines_removed !== undefined) {
      const totalLines = triageResult.patch.lines_added + triageResult.patch.lines_removed;
      if (totalLines > this.config.limits.max_lines) {
        errors.push(`Total line changes (${totalLines}) exceeds limit (${this.config.limits.max_lines})`);
      }
    }

    // Check presence of at least one test
    if (!triageResult.tests || triageResult.tests.length === 0) {
      errors.push('At least one test case is required');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Basic check for Unified Diff format
   */
  private isValidDiffFormat(diff: string): boolean {
    if (!diff || diff.length < 10) return false;
    
    // Check if diff contains required elements of unified diff format
    return diff.includes('---') && diff.includes('+++') && diff.includes('@@');
  }

  /**
   * Calculate all feature values
   */
  private calculateFeatures(triageResult: TriageResult, originalFailures?: any[]): EvaluationResult['features'] {
    return {
      patch_minimality: this.calculatePatchMinimality(triageResult),
      test_coverage_delta: this.calculateTestCoverageDelta(triageResult, originalFailures),
      repro_success: this.calculateReproSuccess(triageResult, originalFailures),
      linter_clean: this.calculateLinterClean(triageResult),
      spec_alignment: this.calculateSpecAlignment(triageResult, originalFailures),
      stability: this.calculateStability(triageResult, originalFailures)
    };
  }

  /**
   * Calculate patch minimality (1.0 for minimal, 0.0 for excessive changes)
   */
  private calculatePatchMinimality(triageResult: TriageResult): number {
    if (!triageResult.patch.files_changed || !triageResult.patch.lines_added || !triageResult.patch.lines_removed) {
      // If we don't have exact counts, use a simple metric based on diff length
      const diffLength = triageResult.patch.unified_diff.length;
      // Normalize: 0.1-1000 chars = 1.0-0.0
      return Math.max(0, Math.min(1, 1 - (diffLength / 1000)));
    }

    const totalFiles = triageResult.patch.files_changed;
    const totalLines = triageResult.patch.lines_added + triageResult.patch.lines_removed;

    // Normalize to 0-1 scale, with bonus for being well under limits
    const fileScore = 1 - (totalFiles / this.config.limits.max_files);
    const lineScore = 1 - (totalLines / this.config.limits.max_lines);

    return Math.min(1, (fileScore + lineScore) / 2);
  }

  /**
   * Calculate test coverage delta (simplified)
   */
  private calculateTestCoverageDelta(triageResult: TriageResult, originalFailures?: any[]): number {
    // For now, this is a simplified calculation
    // In a full implementation, this would connect to a coverage tool
    const numTests = triageResult.tests.length;
    return Math.min(1, numTests * 0.25); // Up to 0.25 per test, max 1.0 for 4+ tests
  }

  /**
   * Calculate reproduction success (0 or 1, with high weight as specified)
   */
  private calculateReproSuccess(triageResult: TriageResult, originalFailures?: any[]): number {
    // This would normally involve applying the patch and running tests
    // For now, return 1 if tests exist and patch seems valid
    if (triageResult.tests.length > 0 && 
        triageResult.patch.unified_diff && 
        this.isValidDiffFormat(triageResult.patch.unified_diff)) {
      return 1.0;
    }
    return 0.0;
  }

  /**
   * Calculate linter cleanliness (0 to 1)
   */
  private calculateLinterClean(triageResult: TriageResult): number {
    // This would normally involve running linters on the patched code
    // For now, return a high score if the patch is well-formed
    if (triageResult.patch.unified_diff && 
        this.isValidDiffFormat(triageResult.patch.unified_diff) &&
        triageResult.patch.unified_diff.includes('+') && 
        triageResult.patch.unified_diff.includes('-')) {
      return 0.8; // Assume 0.8 if it's a proper diff with additions/removals
    }
    return 0.5; // Default score
  }

  /**
   * Calculate alignment with original failures/specifications
   */
  private calculateSpecAlignment(triageResult: TriageResult, originalFailures?: any[]): number {
    if (!originalFailures || originalFailures.length === 0) {
      return 0.5; // Default if no original failures provided
    }

    // Calculate how many failure files are mentioned in suspects
    const failureFiles = new Set(originalFailures.map((f: any) => f.path).filter(Boolean));
    const suspectFiles = new Set(triageResult.suspects.map(s => s.file));
    
    let alignedCount = 0;
    for (const file of failureFiles) {
      if (suspectFiles.has(file)) {
        alignedCount++;
      }
    }
    
    const alignmentRatio = failureFiles.size > 0 ? alignedCount / failureFiles.size : 0;
    
    // Also check if the hypothesis contains keywords from original messages
    let keywordMatch = 0;
    if (triageResult.hypothesis && originalFailures.length > 0) {
      const hypothesis = triageResult.hypothesis.toLowerCase();
      for (const failure of originalFailures) {
        if (failure.message && hypothesis.includes(failure.message.toLowerCase().split(' ')[0])) {
          keywordMatch++;
        }
      }
    }
    
    const keywordRatio = originalFailures.length > 0 ? keywordMatch / originalFailures.length : 0;
    
    // Combine file alignment and keyword alignment
    return (alignmentRatio + keywordRatio) / 2;
  }

  /**
   * Calculate stability (consistency across multiple runs)
   */
  private calculateStability(triageResult: TriageResult, originalFailures?: any[]): number {
    // This is a simplified version - in reality, this would require multiple runs
    // For now, assume 0.8 if the solution looks comprehensive
    const completenessScore = 
      (triageResult.hypothesis.length > 30 ? 0.25 : 0) +
      (triageResult.suspects.length > 0 ? 0.25 : 0) +
      (triageResult.patch.unified_diff.length > 20 ? 0.25 : 0) +
      (triageResult.tests.length > 0 ? 0.25 : 0);
    
    return completenessScore;
  }
}

export { ObjectiveEvaluator, EvaluationResult, ObjectiveConfig };