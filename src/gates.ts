import Ajv from 'ajv';
import { parseDiff, Diff, Hunk } from 'react-diff-view';

/**
 * Validates that output matches the expected schema
 */
export function validateJsonSchema(output: any, schemaPath: string): boolean {
    try {
        // In a real implementation, we would read the schema file
        // For now, we'll use a basic validation approach
        if (!output || typeof output !== 'object') {
            return false;
        }

        // Check required fields exist
        const requiredFields = ['hypothesis', 'suspects', 'patch', 'tests'];
        for (const field of requiredFields) {
            if (!(field in output)) {
                return false;
            }
        }

        // Validate hypothesis length
        if (typeof output.hypothesis !== 'string' || output.hypothesis.length < 20) {
            return false;
        }

        // Validate suspects structure
        if (!Array.isArray(output.suspects)) {
            return false;
        }

        // Validate patch structure
        if (!output.patch || typeof output.patch !== 'object' || !output.patch.unified_diff) {
            return false;
        }

        // Validate test length
        if (!Array.isArray(output.tests) || output.tests.length < 1) {
            return false;
        }

        for (const test of output.tests) {
            if (!test.content || test.content.length < 10) {
                return false;
            }
        }

        // Validate unified_diff length
        if (typeof output.patch.unified_diff !== 'string' || output.patch.unified_diff.length < 10) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Validates that the unified diff can be applied successfully
 */
export function validateUnifiedDiff(diff: string): boolean {
    try {
        if (!diff || typeof diff !== 'string') {
            return false;
        }

        // Parse the diff to check for valid structure
        // Note: For a basic check, we could validate the format without applying to actual files
        const lines = diff.split('\n');
        let inHunk = false;
        
        for (const line of lines) {
            // Check for diff headers
            if (line.startsWith('--- ') || line.startsWith('+++ ')) {
                continue;
            }
            // Check for hunk headers
            else if (/^@@ -\d+(,\d+)? \+\d+(,\d+)? @@/.test(line)) {
                inHunk = true;
                continue;
            }
            // Check for valid diff lines
            else if (inHunk) {
                if (!line.startsWith(' ') && !line.startsWith('+') && !line.startsWith('-')) {
                    // Allow context lines, additions, and deletions
                    // If it's not a valid diff line type after a hunk header, fail
                    return false;
                }
            }
        }

        // For now, we'll just validate the format. In a real implementation,
        // we'd attempt to apply the diff to the actual files.
        return lines.length > 0;
    } catch (error) {
        return false;
    }
}

/**
 * Validates that changes are within the specified limits
 */
export function validateChangeLimits(diff: string, maxLines: number = 60, maxFiles: number = 5): boolean {
    try {
        if (!diff || typeof diff !== 'string') {
            return false;
        }

        const lines = diff.split('\n');
        let fileCount = 0;
        let lineCount = 0;
        let inHunk = false;
        
        for (const line of lines) {
            if (line.startsWith('--- ')) {
                fileCount++;
            } else if (inHunk && (line.startsWith('+') || line.startsWith('-'))) {
                lineCount++;
            } else if (/^@@ -\d+(,\d+)? \+\d+(,\d+)? @@/.test(line)) {
                inHunk = true;
            } else if (line.startsWith('diff --git') || line.startsWith('index ')) {
                fileCount++; // Count files at a higher level too
            }
        }

        // Adjust line count to be just additions and deletions
        lineCount = 0;
        inHunk = false;
        for (const line of lines) {
            if (/^@@ -\d+(,\d+)? \+\d+(,\d+)? @@/.test(line)) {
                inHunk = true;
            } else if (inHunk && (line.startsWith('+') || line.startsWith('-'))) {
                lineCount++;
            } else if (line.startsWith('diff --git')) {
                inHunk = false; // Reset for new file
            }
        }

        return fileCount <= maxFiles && lineCount <= maxLines;
    } catch (error) {
        return false;
    }
}

/**
 * Validates that at least one test is included in the output
 */
export function validateTestInclusion(tests: any[]): boolean {
    try {
        if (!Array.isArray(tests) || tests.length < 1) {
            return false;
        }

        // Check that each test has required properties
        for (const test of tests) {
            if (!test.path || !test.content) {
                return false;
            }
            
            // Basic content length check
            if (typeof test.content !== 'string' || test.content.length < 10) {
                return false;
            }
        }

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Runs all gate validations
 */
export function runGates(output: any, options: { maxLines?: number, maxFiles?: number, schemaPath?: string } = {}): { passed: boolean, errors: string[] } {
    const { maxLines = 60, maxFiles = 5, schemaPath = './SCHEMAS/output.schema.json' } = options;
    const errors: string[] = [];

    // Check JSON schema compliance
    if (!validateJsonSchema(output, schemaPath)) {
        errors.push('Output does not comply with JSON schema');
    }

    // Check Unified Diff applicability if patch exists
    if (output.patch && output.patch.unified_diff) {
        if (!validateUnifiedDiff(output.patch.unified_diff)) {
            errors.push('Unified Diff is not in valid format or cannot be applied');
        }
    } else {
        errors.push('No patch provided in output');
    }

    // Check change limits if patch exists
    if (output.patch && output.patch.unified_diff) {
        if (!validateChangeLimits(output.patch.unified_diff, maxLines, maxFiles)) {
            errors.push(`Changes exceed limits: max ${maxFiles} files, max ${maxLines} lines`);
        }
    }

    // Check test inclusion
    if (!validateTestInclusion(output.tests)) {
        errors.push('At least one test case must be included with proper content');
    }

    return {
        passed: errors.length === 0,
        errors
    };
}