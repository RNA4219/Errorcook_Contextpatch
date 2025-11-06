/**
 * Objective function evaluator for ErrorCook
 * Implements the gates and features as defined in SPECS/objective.md
 */

import { AnalysisResult, ErrorCookResult, ValidationResult } from './types';

interface ObjectiveResult {
  gatesPassed: boolean;
  features: Features;
  score: number;
  details?: string[];
}

interface Features {
  patch_minimality: number;
  test_coverage_delta: number;
  repro_success: number;
  linter_clean: number;
  spec_alignment: number;
  stability: number;
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
    timeout_sec: number;
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
    timeout_sec: 900
  }
};

class ObjectiveEvaluator {
  private config: ObjectiveConfig;

  constructor(config?: Partial<ObjectiveConfig>) {
    this.config = { ...DEFAULT_CONFIG };
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Evaluate an ErrorCook result against the objective function
   */
  evaluate(result: ErrorCookResult, originalFailures?: any[]): ObjectiveResult {
    // First check if all gates pass
    const gatesValidation = this.checkGates(result);
    
    if (!gatesValidation.gatesPassed) {
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
        details: gatesValidation.details
      };
    }

    // Calculate feature values if gates pass
    const features = this.calculateFeatures(result, originalFailures);
    
    // Calculate weighted score
    let score = 0;
    for (const [featureName, value] of Object.entries(features)) {
      const weight = this.config.weights[featureName as keyof typeof this.config.weights];
      if (weight !== undefined) {
        score += value * weight;
      }
    }

    return {
      gatesPassed: true,
      features,
      score,
      details: [`Score: ${score.toFixed(3)}`]
    };
  }

  /**
   * Check if all gates are satisfied
   */
  private checkGates(result: ErrorCookResult): { gatesPassed: boolean; details?: string[] } {
    const details: string[] = [];

    // Gate 1: Status must be success
    if (result.status !== 'success') {
      details.push(`Status is ${result.status}, expected success`);
    }

    // Gate 2: Analysis must exist and have required fields
    if (!result.analysis) {
      details.push('Analysis is missing');
    } else {
      if (!result.analysis.smells) {
        details.push('Smells analysis is missing');
      }
      if (!result.analysis.rankings) {
        details.push('Rankings are missing');
      }
      if (!result.analysis.proposals) {
        details.push('Proposals are missing');
      }
    }

    // Gate 3: If proposals exist, they must be reasonable (at least 1 proposal)
    if (result.analysis && result.analysis.proposals && result.analysis.proposals.length === 0) {
      details.push('No refactor proposals generated');
    }

    return {
      gatesPassed: details.length === 0,
      details: details.length > 0 ? details : undefined
    };
  }

  /**
   * Calculate feature values
   */
  private calculateFeatures(result: ErrorCookResult, originalFailures?: any[]): Features {
    return {
      patch_minimality: this.calculatePatchMinimality(result),
      test_coverage_delta: this.calculateTestCoverageDelta(result),
      repro_success: this.calculateReproSuccess(result),
      linter_clean: this.calculateLinterClean(result),
      spec_alignment: this.calculateSpecAlignment(result, originalFailures),
      stability: this.calculateStability(result)
    };
  }

  /**
   * Calculate patch minimality score
   */
  private calculatePatchMinimality(result: ErrorCookResult): number {
    if (!result.analysis || !result.analysis.proposals) {
      return 0;
    }

    // Calculate based on number of files affected and effort
    let totalFiles = 0;
    let totalEffort = 0;
    let proposalCount = 0;

    for (const proposal of result.analysis.proposals) {
      if (Array.isArray(proposal.files)) {
        totalFiles += proposal.files.length;
      }
      totalEffort += proposal.estimatedEffort || 0;
      proposalCount++;
    }

    // Normalize to 0-1, with bonus for fewer files/effort per proposal
    if (proposalCount === 0) return 0;

    const avgFilesPerProposal = totalFiles / proposalCount;
    const avgEffortPerProposal = totalEffort / proposalCount;

    // Score based on how close to optimal values
    // Want fewer files per proposal and lower effort
    const fileScore = Math.max(0, 1 - (avgFilesPerProposal / this.config.limits.max_files));
    const effortScore = Math.max(0, 1 - (avgEffortPerProposal / 8)); // Assume max reasonable effort is 8

    return (fileScore + effortScore) / 2;
  }

  /**
   * Calculate test coverage delta
   */
  private calculateTestCoverageDelta(result: ErrorCookResult): number {
    // In ErrorCook context, this might relate to how many smells are addressed
    if (!result.analysis || !result.analysis.proposals) {
      return 0;
    }

    // Higher score if more smells are targeted by proposals
    const numProposals = result.analysis.proposals.length;
    
    // Return score based on number of proposals (max 1.0 for 5+ proposals)
    return Math.min(1.0, numProposals * 0.2); // 0.2 per proposal, max 1.0
  }

  /**
   * Calculate reproduction success
   */
  private calculateReproSuccess(result: ErrorCookResult): number {
    // In ErrorCook context, this is how well the proposals address the detected smells
    if (!result.analysis || !result.analysis.smells || !result.analysis.proposals) {
      return 0;
    }

    // Calculate how many smells are addressed by proposals
    const totalSmells = 
      (result.analysis.smells.long_functions?.length || 0) + 
      (result.analysis.smells.deep_nesting?.length || 0);
    
    const numProposals = result.analysis.proposals.length;

    // If we have proposals for detected smells, give higher score
    if (totalSmells === 0) {
      // If no smells detected but we have a successful analysis, we'll still give some score
      return result.analysis.proposals.length > 0 ? 0.7 : 0.3;
    }

    // Calculate ratio of proposals to smells (should be roughly 1:1 or proposals > smells)
    const proposalToSmellRatio = numProposals / Math.max(1, totalSmells);
    return Math.min(1.0, Math.max(0.1, proposalToSmellRatio));
  }

  /**
   * Calculate linter clean score
   */
  private calculateLinterClean(result: ErrorCookResult): number {
    // In ErrorCook context, this might be how well proposals follow best practices
    if (!result.analysis || !result.analysis.proposals) {
      return 0;
    }

    let validProposals = 0;
    for (const proposal of result.analysis.proposals) {
      // A valid proposal has all required fields
      if (proposal.id && proposal.title && proposal.description && Array.isArray(proposal.files)) {
        validProposals++;
      }
    }

    const validRatio = result.analysis.proposals.length > 0 
      ? validProposals / result.analysis.proposals.length 
      : 0;

    return validRatio;
  }

  /**
   * Calculate specification alignment
   */
  private calculateSpecAlignment(result: ErrorCookResult, originalFailures?: any[]): number {
    if (!originalFailures || originalFailures.length === 0) {
      // If no original failures, return based on quality of smells detected
      if (!result.analysis?.smells) return 0.3;
      
      const smellCount = 
        (result.analysis.smells.long_functions?.length || 0) + 
        (result.analysis.smells.deep_nesting?.length || 0);
      
      // Higher score if more smells detected
      return Math.min(1.0, smellCount * 0.1); // 0.1 per smell detected
    }

    // Calculate alignment between original failures and detected smells/proposals
    let matchingCount = 0;
    
    for (const failure of originalFailures) {
      if (failure.location) {
        // Check if any proposal addresses this location
        for (const proposal of result.analysis.proposals) {
          if (proposal.files.some(file => file.includes(failure.location))) {
            matchingCount++;
            break;
          }
        }
      }
    }

    return originalFailures.length > 0 
      ? Math.min(1.0, matchingCount / originalFailures.length)
      : 0.5;
  }

  /**
   * Calculate stability score
   */
  private calculateStability(result: ErrorCookResult): number {
    // Stability could be measured by consistency of ROI values or 
    // how well-justified the proposals are
    if (!result.analysis || !result.analysis.rankings) {
      return 0;
    }

    // Calculate variance in ROI values - more consistent is more stable
    const rois = result.analysis.rankings.map(r => r.roi);
    if (rois.length === 0) return 0;

    const avgRoi = rois.reduce((sum, roi) => sum + roi, 0) / rois.length;
    const variance = rois.reduce((sum, roi) => sum + Math.pow(roi - avgRoi, 2), 0) / rois.length;
    
    // Lower variance = higher stability
    // Clamp between 0 and 1
    const stabilityScore = Math.max(0, 1 - Math.min(1, variance));
    
    // Also factor in completeness
    const completenessScore = result.analysis.proposals && result.analysis.proposals.length > 0 ? 0.8 : 0.3;
    
    return (stabilityScore + completenessScore) / 2;
  }
}

export { ObjectiveEvaluator, ObjectiveResult, ObjectiveConfig, Features };