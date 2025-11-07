import { describe, it, expect } from 'vitest';
import { 
  checkJsonValidity,
  checkUnifiedDiffApplicability,
  checkChangeLimits,
  checkTestInclusion,
  runAllGates
} from '../src/validation/gateChecks.js';

describe('Gate Checks', () => {
  const validOutput = {
    hypothesis: "This is a valid hypothesis with at least 20 characters for testing",
    suspects: [
      {
        file: "src/example.ts",
        line: 10,
        reason: "Possible issue in this file"
      }
    ],
    patch: {
      unified_diff: "diff --git a/src/example.ts b/src/example.ts\nindex 1234567..8901234 100644\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -7,7 +7,7 @@\n function example() {\n   const value = getValue();\n-  return value.process();\n+  return value ? value.process() : null;\n }",
      files_changed: 1,
      lines_added: 1,
      lines_removed: 1
    },
    tests: [
      {
        path: "tests/example.test.ts",
        content: "import { example } from '../src/example';\n\ntest('example handles null value', () => {\n  // Test implementation\n});",
        purpose: "Verify that the function handles null values correctly"
      }
    ]
  };

  describe('JSON Validity Check', () => {
    it('should pass for valid output structure', () => {
      const result = checkJsonValidity(validOutput);
      expect(result.success).toBe(true);
    });
  });

  describe('Unified Diff Applicability Check', () => {
    it('should pass for valid unified diff', () => {
      const result = checkUnifiedDiffApplicability(validOutput);
      expect(result.success).toBe(true);
    });

    it('should fail for diff without diff --git header', () => {
      const invalidOutput = {
        ...validOutput,
        patch: {
          ...validOutput.patch,
          unified_diff: "@@ -7,7 +7,7 @@\n function example() {\n   const value = getValue();\n-  return value.process();\n+  return value ? value.process() : null;\n }"
        }
      };

      const result = checkUnifiedDiffApplicability(invalidOutput);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Unified diff is missing required "diff --git" header');
    });

    it('should fail for diff without hunk headers', () => {
      const invalidOutput = {
        ...validOutput,
        patch: {
          ...validOutput.patch,
          unified_diff: "diff --git a/src/example.ts b/src/example.ts\nindex 1234567..8901234 100644\n--- a/src/example.ts\n+++ b/src/example.ts\n function example() {\n   const value = getValue();\n   return value.process();\n }"
        }
      };

      const result = checkUnifiedDiffApplicability(invalidOutput);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Unified diff is missing hunk headers (@@)');
    });
  });

  describe('Change Limits Check', () => {
    it('should pass for changes within limits', () => {
      const result = checkChangeLimits(validOutput);
      expect(result.success).toBe(true);
    });

    it('should fail for too many files changed', () => {
      const invalidOutput = {
        ...validOutput,
        patch: {
          ...validOutput.patch,
          files_changed: 6  // More than 5
        }
      };

      const result = checkChangeLimits(invalidOutput);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Files changed (6) exceeds limit of 5 files');
    });

    it('should fail for too many lines changed', () => {
      const invalidOutput = {
        ...validOutput,
        patch: {
          ...validOutput.patch,
          lines_added: 40,
          lines_removed: 30  // Total 70 > 60
        }
      };

      const result = checkChangeLimits(invalidOutput);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Total changes (70 lines) exceeds limit of 60 lines');
    });

    it('should pass for changes within limits when counts are estimated from diff', () => {
      const outputWithoutCounts = {
        ...validOutput,
        patch: {
          unified_diff: "diff --git a/src/example.ts b/src/example.ts\nindex 1234567..8901234 100644\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -7,7 +7,7 @@\n function example() {\n   const value = getValue();\n-  return value.process();\n+  return value ? value.process() : null;\n }"
        }
      };

      const result = checkChangeLimits(outputWithoutCounts);
      expect(result.success).toBe(true);
    });

    it('should fail for too many files based on diff content', () => {
      const outputWithoutCounts = {
        ...validOutput,
        patch: {
          unified_diff: `diff --git a/src/file1.ts b/src/file1.ts
diff --git a/src/file2.ts b/src/file2.ts
diff --git a/src/file3.ts b/src/file3.ts
diff --git a/src/file4.ts b/src/file4.ts
diff --git a/src/file5.ts b/src/file5.ts
diff --git a/src/file6.ts b/src/file6.ts
index 1234567..8901234 100644
--- a/src/file6.ts
+++ b/src/file6.ts
@@ -7,7 +7,7 @@
 function example() {
   const value = getValue();
-  return value.process();
+  return value ? value.process() : null;
 }`
        }
      };

      const result = checkChangeLimits(outputWithoutCounts);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Estimated files changed (6) exceeds limit of 5 files');
    });
  });

  describe('Test Inclusion Check', () => {
    it('should pass when at least one test is provided', () => {
      const result = checkTestInclusion(validOutput);
      expect(result.success).toBe(true);
    });

    it('should fail when no tests are provided', () => {
      const invalidOutput = {
        ...validOutput,
        tests: []
      };

      const result = checkTestInclusion(invalidOutput);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('At least one test must be provided in the output');
    });

    it('should fail when a test is missing required fields', () => {
      const invalidOutput = {
        ...validOutput,
        tests: [
          {
            path: "tests/example.test.ts"
            // Missing content
          }
        ]
      };

      const result = checkTestInclusion(invalidOutput);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Test at index 0 is missing required \'path\' or \'content\' field');
    });
  });

  describe('All Gates Check', () => {
    it('should pass when all gates pass', () => {
      const result = runAllGates(validOutput);
      expect(result.success).toBe(true);
    });

    it('should fail when any gate fails', () => {
      const invalidOutput = {
        ...validOutput,
        tests: []  // This will fail test inclusion check
      };

      const result = runAllGates(invalidOutput);
      expect(result.success).toBe(false);
    });
  });
});