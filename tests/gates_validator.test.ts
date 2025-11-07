import { describe, it, expect } from 'vitest';
import { validateGates } from '../contextpatch/src/validation/gates-validator.js';
import { OutputSchema } from '../contextpatch/src/types/output-schema.js';

describe('Gates Validator', () => {
  it('should validate JSON schema compliance', () => {
    const validOutput: OutputSchema = {
      hypothesis: 'A valid hypothesis',
      suspects: [
        {
          file: 'src/main.ts',
          line: 10,
          reason: 'An issue with this file'
        }
      ],
      patch: {
        unified_diff: `diff --git a/src/main.ts b/src/main.ts
index 1234567..89abcde 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -7,7 +7,7 @@
 function calculateValue() {
-  return 41;
+  return 42;
 }
`,
        files_changed: 1,
        lines_added: 1,
        lines_removed: 1
      },
      tests: [
        {
          path: 'tests/main.test.ts',
          content: 'Test content',
          purpose: 'Testing purpose'
        }
      ]
    };

    const result = validateGates(validOutput);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail validation if schema is not compliant', () => {
    // Missing required fields to test validation
    const invalidOutput: any = {
      // Missing hypothesis
      suspects: [],
      patch: {
        // Missing unified_diff
        files_changed: 0
      },
      tests: []
    };

    const result = validateGates(invalidOutput);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('hypothesis is required');
  });

  it('should validate unified diff format', () => {
    const outputWithValidPatch: OutputSchema = {
      hypothesis: 'A valid hypothesis',
      suspects: [],
      patch: {
        unified_diff: `diff --git a/src/main.ts b/src/main.ts
index 1234567..89abcde 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -7,7 +7,7 @@
 function calculateValue() {
-  return 41;
+  return 42;
 }
`,
        files_changed: 1
      },
      tests: []
    };

    const result = validateGates(outputWithValidPatch);
    expect(result.valid).toBe(true);
  });

  it('should fail validation if unified diff format is invalid', () => {
    const outputWithInvalidPatch: OutputSchema = {
      hypothesis: 'A valid hypothesis',
      suspects: [],
      patch: {
        unified_diff: 'This is not a valid unified diff',
        files_changed: 1
      },
      tests: []
    };

    const result = validateGates(outputWithInvalidPatch);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('unified_diff must be in valid unified diff format');
  });

  it('should validate change limits', () => {
    const outputWithinLimits: OutputSchema = {
      hypothesis: 'A valid hypothesis',
      suspects: Array(4).fill({ file: 'src/file.ts', line: 10, reason: 'test' }),
      patch: {
        unified_diff: `diff --git a/src/main.ts b/src/main.ts
index 1234567..89abcde 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -7,7 +7,7 @@
 function calculateValue() {
-  return 41;
+  return 42;
 }
`,
        files_changed: 4,  // Within limit (≤ 5)
        lines_added: 10,   // Within limit (≤ 60)
        lines_removed: 5   // Within limit (≤ 60)
      },
      tests: [
        {
          path: 'tests/main.test.ts',
          content: 'Test content',
          purpose: 'Testing purpose'
        }
      ]
    };

    const result = validateGates(outputWithInvalidPatch);
    expect(result.valid).toBe(false); // This should still fail due to invalid diff

    // Test with valid patch but over file limit
    const outputOverFileLimit: OutputSchema = {
      ...outputWithinLimits,
      patch: {
        ...outputWithinLimits.patch,
        files_changed: 6 // Over limit (> 5)
      }
    };

    const result2 = validateGates(outputOverFileLimit);
    expect(result2.valid).toBe(false);
    expect(result2.errors).toContain('files_changed exceeds maximum of 5 files');
  });

  it('should validate test inclusion', () => {
    const outputWithoutTests: OutputSchema = {
      hypothesis: 'A valid hypothesis',
      suspects: [],
      patch: {
        unified_diff: `diff --git a/src/main.ts b/src/main.ts
index 1234567..89abcde 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -7,7 +7,7 @@
 function calculateValue() {
-  return 41;
+  return 42;
 }
`,
        files_changed: 1
      },
      tests: [] // No tests
    };

    const result = validateGates(outputWithoutTests);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one test case must be provided');
  });
});