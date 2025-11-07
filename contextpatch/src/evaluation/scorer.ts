import { OutputSchema } from '../types/output-schema.js';

// Define the feature scores interface
interface FeatureScores {
  patch_minimality: number;        // 0-1, higher is better (fewer changes)
  test_coverage_delta: number;     // 0-1, higher is better (more coverage added)
  repro_success: number;           // 0-1, higher is better (better reproducibility)
  linter_clean: number;            // 0-1, higher is better (cleaner code)
  spec_alignment: number;          // 0-1, higher is better (better alignment to spec)
  stability: number;               // 0-1, higher is better (consistency across runs)
}

// Weights for each feature in the final score calculation
const FEATURE_WEIGHTS: { [key in keyof FeatureScores]: number } = {
  patch_minimality: 0.2,
  test_coverage_delta: 0.2,
  repro_success: 0.25,
  linter_clean: 0.15,
  spec_alignment: 0.1,
  stability: 0.1
};

/**
 * Evaluates all features for the given output
 * @param output The output from LLM
 * @returns Feature scores
 */
export function evaluateFeatures(output: OutputSchema): FeatureScores {
  // Calculate patch minimality (fewer changes = higher score)
  const maxFiles = 5;
  const maxLines = 60;
  
  const filesChanged = output.patch.files_changed || 0;
  const linesAdded = output.patch.lines_added || 0;
  const linesRemoved = output.patch.lines_removed || 0;
  const totalLines = linesAdded + linesRemoved;
  
  // Calculate patch minimality score (inverted, so smaller changes = higher score)
  const filePenalty = filesChanged / maxFiles;
  const linePenalty = Math.min(totalLines, maxLines) / maxLines; // Cap at 1
  const patchMinimalityScore = Math.max(0, 1 - (filePenalty * 0.5 + linePenalty * 0.5));
  
  // Calculate test coverage delta (simple heuristic based on number of tests)
  const testCount = output.tests.length;
  const testCoverageDelta = Math.min(1, testCount / 3); // Assume 3 tests is good coverage
  
  // Calculate reproducibility success (for now, just based on whether hypothesis is detailed)
  const hypothesisDetail = output.hypothesis.length > 50 ? 1 : output.hypothesis.length / 50;
  
  // Calculate linter cleanliness (for now, just based on whether changes follow basic rules)
  const linterClean = output.patch.unified_diff.includes('+  ') || output.patch.unified_diff.includes('-  ') 
    ? 0.8 // Indentation seems correct
    : 0.5; // Less confident about code quality
  
  // Calculate spec alignment (for now, based on how well suspects explain the issue)
  const suspectDetail = output.suspects.length > 0 
    ? Math.min(1, output.suspects.filter(s => s.reason && s.reason.length > 10).length / output.suspects.length)
    : 0;
  
  // Calculate stability (currently based on consistency of implementation)
  const stability = 0.9; // Assume high stability for a well-structured patch

  return {
    patch_minimality: patchMinimalityScore,
    test_coverage_delta: testCoverageDelta,
    repro_success: hypothesisDetail,
    linter_clean: linterClean,
    spec_alignment: suspectDetail,
    stability: stability
  };
}

/**
 * Calculates the final score based on all features and their weights
 * @param output The output from LLM
 * @returns Final score between 0 and 100
 */
export function calculateScore(output: OutputSchema): number {
  const features = evaluateFeatures(output);
  
  // Calculate weighted sum
  let score = 0;
  for (const [key, weight] of Object.entries(FEATURE_WEIGHTS)) {
    const featureKey = key as keyof FeatureScores;
    score += features[featureKey] * weight;
  }
  
  // Convert to 0-100 scale
  return Math.round(score * 100);
}

/**
 * Calculates ROI score based on value, effort, risk, and confidence
 * @param output The output from LLM
 * @returns ROI score between 0 and 100
 */
export function calculateROIScore(output: OutputSchema): number {
  // Simple ROI calculation based on our features
  const features = evaluateFeatures(output);
  
  // Value: How good is the solution (opposite of patch size, more tests = more value)
  const value = (features.test_coverage_delta * 0.7) + (features.patch_minimality * 0.3);
  
  // Effort: How much effort is required (more changes = more effort)
  const effort = features.patch_minimality; // Inverse relationship
  
  // Risk: How risky is the change (minimal changes = lower risk)
  const risk = features.patch_minimality; // Inverse relationship
  
  // Confidence: How confident are we in the solution (based on hypothesis and suspect detail)
  const confidence = (features.repro_success + features.spec_alignment) / 2;
  
  // ROI = (Value * Confidence) / (Effort * Risk) * scaling factor
  const roi = (value * confidence) / (Math.max(0.1, effort) * Math.max(0.1, risk));
  
  // Normalize to 0-100 scale
  return Math.min(100, Math.round(roi * 50));
}