import { OutputSchema } from '../types/output-schema.js';

/**
 * Generates a patch from the LLM output
 * @param outputSchema The output from LLM containing hypothesis, suspects, patch and tests
 * @returns The patch content in unified diff format
 */
export function generatePatch(outputSchema: OutputSchema): string {
  // For now, return the unified_diff from the output
  // In a real implementation, this would analyze the suspects and generate appropriate diff
  return outputSchema.patch.unified_diff;
}

/**
 * Validates and applies a patch to the codebase
 * @param patchContent The patch in unified diff format
 * @param basePath Base path where the patch should be applied
 * @returns Whether the patch was successfully applied
 */
export function applyPatch(patchContent: string, basePath: string): { success: boolean; error?: string } {
  try {
    // Basic validation of patch format
    if (!patchContent.includes('diff --git')) {
      return { success: false, error: 'Invalid patch format: missing diff --git header' };
    }

    if (!patchContent.includes('@@')) {
      return { success: false, error: 'Invalid patch format: missing hunk headers (@@)' };
    }

    // Check if patch has both additions and deletions
    const hasAddition = patchContent.includes('+');
    const hasDeletion = patchContent.includes('-');
    
    if (!hasAddition && !hasDeletion) {
      return { success: false, error: 'Invalid patch format: no additions or deletions' };
    }

    // In a real implementation, this would use a diff utility or shell command to apply the patch
    // For now, we just return success
    console.log(`Patch validation passed for ${basePath}`);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during patch application' 
    };
  }
}

/**
 * Validates that the patch meets minimal requirements
 * @param patchContent The patch in unified diff format
 * @returns Whether the patch meets requirements
 */
export function validatePatch(patchContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for essential diff elements
  if (!patchContent.includes('diff --git')) {
    errors.push('Missing diff --git header');
  }

  if (!patchContent.includes('---')) {
    errors.push('Missing old file indicator (---)');
  }

  if (!patchContent.includes('+++')) {
    errors.push('Missing new file indicator (+++)');
  }

  if (!patchContent.includes('@@')) {
    errors.push('Missing hunk header (@@)');
  }

  // Check that patch is substantial enough to be meaningful
  if (patchContent.length < 20) {
    errors.push('Patch is too short to be meaningful');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}