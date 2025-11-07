import { OutputStructure } from '../llm/responseProcessor.js';

interface GateCheckResult {
  success: boolean;
  errors?: string[];
}

// Check if the JSON response conforms to the output schema
function checkJsonValidity(output: OutputStructure): GateCheckResult {
  // This check is already performed by our schema validator
  // We'll return success here since processLLMResponse already validates
  return { success: true };
}

// Check if the unified diff is applicable (basic validation)
function checkUnifiedDiffApplicability(output: OutputStructure): GateCheckResult {
  try {
    const { unified_diff } = output.patch;
    
    // Check if diff has basic required components
    if (!unified_diff.includes('diff --git')) {
      return {
        success: false,
        errors: ['Unified diff is missing required "diff --git" header']
      };
    }
    
    if (!unified_diff.includes('@@')) {
      return {
        success: false,
        errors: ['Unified diff is missing hunk headers (@@)']
      };
    }
    
    // Check if the diff contains at least some changes
    if (!unified_diff.includes('+') && !unified_diff.includes('-')) {
      console.warn('Warning: Unified diff contains no additions or deletions');
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      errors: [`Error validating unified diff: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

// Check if changes are within allowed limits (≤ 60 lines, ≤ 5 files)
function checkChangeLimits(output: OutputStructure): GateCheckResult {
  try {
    const { unified_diff, files_changed, lines_added, lines_removed } = output.patch;
    
    // If counts are provided in the patch object, use them directly
    if (files_changed !== undefined && files_changed > 5) {
      return {
        success: false,
        errors: [`Files changed (${files_changed}) exceeds limit of 5 files`]
      };
    }
    
    if (lines_added !== undefined && lines_removed !== undefined) {
      const totalChanges = lines_added + lines_removed;
      if (totalChanges > 60) {
        return {
          success: false,
          errors: [`Total changes (${totalChanges} lines) exceeds limit of 60 lines`]
        };
      }
    }
    
    // If counts are not provided, parse the unified_diff to estimate
    if (files_changed === undefined || lines_added === undefined || lines_removed === undefined) {
      // Count files by looking at diff --git sections
      const fileCount = (unified_diff.match(/diff --git/g) || []).length;
      if (fileCount > 5) {
        return {
          success: false,
          errors: [`Estimated files changed (${fileCount}) exceeds limit of 5 files`]
        };
      }
      
      // Count line changes by counting + and - prefixes
      const addedLines = (unified_diff.match(/^\+[^+]/gm) || []).length;
      const removedLines = (unified_diff.match(/^-[^-]/gm) || []).length;
      const totalChanges = addedLines + removedLines;
      
      if (totalChanges > 60) {
        return {
          success: false,
          errors: [`Estimated total changes (${totalChanges} lines) exceeds limit of 60 lines`]
        };
      }
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      errors: [`Error checking change limits: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

// Check if at least one test is provided
function checkTestInclusion(output: OutputStructure): GateCheckResult {
  if (!output.tests || output.tests.length === 0) {
    return {
      success: false,
      errors: ['At least one test must be provided in the output']
    };
  }
  
  // Additional check: ensure each test has required fields
  for (let i = 0; i < output.tests.length; i++) {
    const test = output.tests[i];
    if (!test.path || !test.content) {
      return {
        success: false,
        errors: [`Test at index ${i} is missing required 'path' or 'content' field`]
      };
    }
  }
  
  return { success: true };
}

// Run all gate checks
function runAllGates(output: OutputStructure): GateCheckResult {
  // Run all checks
  const jsonCheck = checkJsonValidity(output);
  if (!jsonCheck.success) {
    return {
      success: false,
      errors: ['JSON validity check failed', ...(jsonCheck.errors || [])]
    };
  }
  
  const diffCheck = checkUnifiedDiffApplicability(output);
  if (!diffCheck.success) {
    return {
      success: false,
      errors: ['Unified diff applicability check failed', ...(diffCheck.errors || [])]
    };
  }
  
  const limitsCheck = checkChangeLimits(output);
  if (!limitsCheck.success) {
    return {
      success: false,
      errors: ['Change limits check failed', ...(limitsCheck.errors || [])]
    };
  }
  
  const testCheck = checkTestInclusion(output);
  if (!testCheck.success) {
    return {
      success: false,
      errors: ['Test inclusion check failed', ...(testCheck.errors || [])]
    };
  }
  
  // All checks passed
  return { success: true };
}

export { 
  GateCheckResult, 
  checkJsonValidity,
  checkUnifiedDiffApplicability,
  checkChangeLimits,
  checkTestInclusion,
  runAllGates
};