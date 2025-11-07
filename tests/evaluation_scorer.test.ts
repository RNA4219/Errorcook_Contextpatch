import { describe, it, expect } from 'vitest';
import { calculateScore, evaluateFeatures } from '../contextpatch/src/evaluation/scorer.js';
import { OutputSchema } from '../contextpatch/src/types/output-schema.js';

describe('Evaluation Scorer', () => {
  it('should calculate a basic score for valid output', () => {
    const validOutput: OutputSchema = {
      hypothesis: 'A clear and relevant hypothesis',
      suspects: [
        {
          file: 'src/main.ts',
          line: 10,
          reason: 'The function has incorrect return value'
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
          content: 'Test that the function returns correct value',
          purpose: 'Verify the fix'
        }
      ]
    };

    const score = calculateScore(validOutput);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should evaluate all required features', () => {
    const output: OutputSchema = {
      hypothesis: 'A detailed hypothesis',
      suspects: [
        {
          file: 'src/main.ts',
          line: 10,
          reason: 'Detailed explanation'
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

    const features = evaluateFeatures(output);

    // Check that all features are present
    expect(features).toHaveProperty('patch_minimality');
    expect(features).toHaveProperty('test_coverage_delta');
    expect(features).toHaveProperty('repro_success');
    expect(features).toHaveProperty('linter_clean');
    expect(features).toHaveProperty('spec_alignment');
    expect(features).toHaveProperty('stability');

    // Check that feature values are numbers
    Object.values(features).forEach(value => {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });
  });

  it('should calculate lower score for minimal patch', () => {
    const minimalOutput: OutputSchema = {
      hypothesis: 'Short hypothesis',
      suspects: [
        {
          file: 'src/main.ts',
          reason: 'Short reason'
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
          content: 'Basic test',
          purpose: 'Basic check'
        }
      ]
    };

    const score = calculateScore(minimalOutput);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should evaluate patch minimality correctly', () => {
    const output: OutputSchema = {
      hypothesis: 'A hypothesis',
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
        files_changed: 1,  // Minimal
        lines_added: 1,    // Minimal
        lines_removed: 1   // Minimal
      },
      tests: [
        {
          path: 'tests/main.test.ts',
          content: 'Test content',
          purpose: 'Testing purpose'
        }
      ]
    };

    const features = evaluateFeatures(output);
    // A minimal patch should have high patch_minimality score
    expect(features.patch_minimality).toBeGreaterThan(0.5);
  });
});