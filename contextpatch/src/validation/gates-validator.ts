import { OutputSchema } from '../types/output-schema.js';
import { validatePatch } from '../patch/patch-generator.js';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that the output meets all required "gates" conditions
 * @param output The output from the LLM
 * @returns Validation result with errors if any
 */
export function validateGates(output: OutputSchema): ValidationResult {
  const errors: string[] = [];

  // Gate 1: JSON schema validation
  if (!output.hypothesis || typeof output.hypothesis !== 'string') {
    errors.push('hypothesis is required');
  }

  if (!Array.isArray(output.suspects)) {
    errors.push('suspects must be an array');
  }

  if (!output.patch || typeof output.patch !== 'object') {
    errors.push('patch is required');
  } else {
    if (!output.patch.unified_diff || typeof output.patch.unified_diff !== 'string') {
      errors.push('patch.unified_diff is required and must be a string');
    } else {
      // Validate the patch format
      const patchValidation = validatePatch(output.patch.unified_diff);
      if (!patchValidation.valid) {
        errors.push('unified_diff must be in valid unified diff format');
        errors.push(...patchValidation.errors);
      }
    }

    // Check file/line limits
    if (output.patch.files_changed !== undefined && output.patch.files_changed > 5) {
      errors.push('files_changed exceeds maximum of 5 files');
    }

    // Calculate total lines changed
    const totalLinesChanged = (output.patch.lines_added || 0) + (output.patch.lines_removed || 0);
    if (totalLinesChanged > 60) {
      errors.push('total lines changed exceeds maximum of 60 lines');
    }
  }

  if (!Array.isArray(output.tests)) {
    errors.push('tests must be an array');
  } else if (output.tests.length === 0) {
    errors.push('At least one test case must be provided');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}