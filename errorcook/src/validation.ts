import { ErrorCookResult, AnalysisResult, ValidationResult, SmellReport } from './types';

/**
 * Validation utilities for ErrorCook
 */

/**
 * Validates an ErrorCookResult object
 */
function validateErrorCookResult(result: ErrorCookResult): ValidationResult {
  const errors: string[] = [];

  // Validate status
  const validStatuses = ['success', 'partial', 'failed'];
  if (!validStatuses.includes(result.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }

  // Validate analysis if present
  if (result.analysis) {
    validateAnalysisResult(result.analysis).errors.forEach(error => {
      errors.push(`analysis: ${error}`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an AnalysisResult object
 */
function validateAnalysisResult(analysis: AnalysisResult): ValidationResult {
  const errors: string[] = [];

  // Validate smells
  if (!analysis.smells) {
    errors.push('smells is required');
  } else {
    if (!Array.isArray(analysis.smells.long_functions)) {
      errors.push('smells.long_functions must be an array');
    }
    if (!Array.isArray(analysis.smells.deep_nesting)) {
      errors.push('smells.deep_nesting must be an array');
    }
    if (typeof analysis.smells.dup_ratio !== 'number') {
      errors.push('smells.dup_ratio must be a number');
    }
  }

  // Validate rankings
  if (!Array.isArray(analysis.rankings)) {
    errors.push('rankings must be an array');
  } else {
    for (let i = 0; i < analysis.rankings.length; i++) {
      const ranking = analysis.rankings[i];
      if (!ranking.id) {
        errors.push(`rankings[${i}].id is required`);
      }
      if (typeof ranking.roi !== 'number') {
        errors.push(`rankings[${i}].roi must be a number`);
      }
    }
  }

  // Validate proposals
  if (!Array.isArray(analysis.proposals)) {
    errors.push('proposals must be an array');
  } else {
    for (let i = 0; i < analysis.proposals.length; i++) {
      const proposal = analysis.proposals[i];
      if (!proposal.id) {
        errors.push(`proposals[${i}].id is required`);
      }
      if (!proposal.title) {
        errors.push(`proposals[${i}].title is required`);
      }
      if (!proposal.description) {
        errors.push(`proposals[${i}].description is required`);
      }
      if (!Array.isArray(proposal.files)) {
        errors.push(`proposals[${i}].files must be an array`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a smell report
 */
function validateSmellReport(report: SmellReport): ValidationResult {
  const errors: string[] = [];

  if (!report) {
    errors.push('report is required');
    return { isValid: false, errors };
  }

  if (!Array.isArray(report.long_functions)) {
    errors.push('long_functions must be an array');
  }
  if (!Array.isArray(report.deep_nesting)) {
    errors.push('deep_nesting must be an array');
  }
  if (typeof report.dup_ratio !== 'number') {
    errors.push('dup_ratio must be a number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export { validateErrorCookResult, validateAnalysisResult, validateSmellReport };
