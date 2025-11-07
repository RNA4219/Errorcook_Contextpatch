import { 
  validateOutputSchema, 
  validateUnifiedDiff, 
  validateChangeLimits, 
  validateTestInclusion, 
  validateAllGates 
} from './validators';
import { IOutput } from './types';
import { describe, it, expect } from 'vitest';

describe('Validators', () => {
  describe('validateOutputSchema', () => {
    it('should return true for valid output schema', () => {
      const validOutput = {
        hypothesis: 'This is a hypothesis that explains the failure.',
        suspects: [
          { file: 'src/example.ts', line: 10, reason: 'Potential issue' }
        ],
        patch: {
          unified_diff: 'diff --git a/src/example.ts b/src/example.ts\nindex 1234567..89abcde 100644\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -7,7 +7,7 @@\n console.log("hello");\n'
        },
        tests: [
          { 
            path: 'tests/example.test.ts', 
            content: 'import { example } from "../src/example";\n// Test content' 
          }
        ]
      };

      const result = validateOutputSchema(validOutput);
      expect(result.isValid).toBe(true);
    });

    it('should return false for invalid output schema', () => {
      const invalidOutput = {
        // Missing required fields
        hypothesis: 'Short',
        suspects: [],
        patch: {},
        tests: []
      };

      const result = validateOutputSchema(invalidOutput);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateUnifiedDiff', () => {
    it('should return true for valid unified diff format', () => {
      const validDiff = `diff --git a/src/example.ts b/src/example.ts
index 1234567..89abcde 100644
--- a/src/example.ts
+++ b/src/example.ts
@@ -7,7 +7,7 @@
 console.log("hello");
-  bad line
+  good line
`;

      const result = validateUnifiedDiff(validDiff);
      expect(result).toBe(true);
    });

    it('should return false for invalid unified diff format', () => {
      const invalidDiff = 'This is not a unified diff format';
      const result = validateUnifiedDiff(invalidDiff);
      expect(result).toBe(false);
    });
  });

  describe('validateChangeLimits', () => {
    it('should return true when changes are within limits', () => {
      const output: IOutput = {
        hypothesis: 'This is a hypothesis that explains the failure.',
        suspects: [],
        patch: {
          unified_diff: `diff --git a/src/example.ts b/src/example.ts
index 1234567..89abcde 100644
--- a/src/example.ts
+++ b/src/example.ts
@@ -7,7 +7,7 @@
 console.log("hello");
-  bad line 1
+  good line 1
-  bad line 2
+  good line 2
`,
          files_changed: 1,
          lines_added: 2,
          lines_removed: 2
        },
        tests: [
          { 
            path: 'tests/example.test.ts', 
            content: 'import { example } from "../src/example";\n// Test content' 
          }
        ]
      };

      const result = validateChangeLimits(output, 5, 60);
      expect(result).toBe(true);
    });

    it('should return false when changes exceed limits', () => {
      const output: IOutput = {
        hypothesis: 'This is a hypothesis that explains the failure.',
        suspects: [],
        patch: {
          unified_diff: `diff --git a/src/example.ts b/src/example.ts
index 1234567..89abcde 100644
--- a/src/example.ts
+++ b/src/example.ts
@@ -7,7 +7,7 @@
 console.log("hello");
-  bad line 1
+  good line 1
-  bad line 2
+  good line 2
-  bad line 3
+  good line 3
-  bad line 4
+  good line 4
-  bad line 5
+  good line 5
-  bad line 6
+  good line 6
-  bad line 7
+  good line 7
-  bad line 8
+  good line 8
-  bad line 9
+  good line 9
-  bad line 10
+  good line 10
-  bad line 11
+  good line 11
-  bad line 12
+  good line 12
-  bad line 13
+  good line 13
-  bad line 14
+  good line 14
-  bad line 15
+  good line 15
-  bad line 16
+  good line 16
-  bad line 17
+  good line 17
-  bad line 18
+  good line 18
-  bad line 19
+  good line 19
-  bad line 20
+  good line 20
-  bad line 21
+  good line 21
-  bad line 22
+  good line 22
-  bad line 23
+  good line 23
-  bad line 24
+  good line 24
-  bad line 25
+  good line 25
-  bad line 26
+  good line 26
-  bad line 27
+  good line 27
-  bad line 28
+  good line 28
-  bad line 29
+  good line 29
-  bad line 30
+  good line 30
-  bad line 31
+  good line 31
-  bad line 32
+  good line 32
-  bad line 33
+  good line 33
-  bad line 34
+  good line 34
-  bad line 35
+  good line 35
-  bad line 36
+  good line 36
-  bad line 37
+  good line 37
-  bad line 38
+  good line 38
-  bad line 39
+  good line 39
-  bad line 40
+  good line 40
-  bad line 41
+  good line 41
-  bad line 42
+  good line 42
-  bad line 43
+  good line 43
-  bad line 44
+  good line 44
-  bad line 45
+  good line 45
-  bad line 46
+  good line 46
-  bad line 47
+  good line 47
-  bad line 48
+  good line 48
-  bad line 49
+  good line 49
-  bad line 50
+  good line 50
-  bad line 51
+  good line 51
-  bad line 52
+  good line 52
-  bad line 53
+  good line 53
-  bad line 54
+  good line 54
-  bad line 55
+  good line 55
-  bad line 56
+  good line 56
-  bad line 57
+  good line 57
-  bad line 58
+  good line 58
-  bad line 59
+  good line 59
-  bad line 60
+  good line 60
-  bad line 61
+  good line 61
`,
          files_changed: 6,
          lines_added: 61,
          lines_removed: 0
        },
        tests: [
          { 
            path: 'tests/example.test.ts', 
            content: 'import { example } from "../src/example";\n// Test content' 
          }
        ]
      };

      const result = validateChangeLimits(output, 5, 60);
      expect(result).toBe(false);
    });
  });

  describe('validateTestInclusion', () => {
    it('should return true when at least one valid test is included', () => {
      const output: IOutput = {
        hypothesis: 'This is a hypothesis.',
        suspects: [],
        patch: {
          unified_diff: 'dummy diff'
        },
        tests: [
          { 
            path: 'tests/example.test.ts', 
            content: 'import { example } from "../src/example";\n// Test content' 
          }
        ]
      };

      const result = validateTestInclusion(output);
      expect(result).toBe(true);
    });

    it('should return false when no tests are included', () => {
      const output: IOutput = {
        hypothesis: 'This is a hypothesis.',
        suspects: [],
        patch: {
          unified_diff: 'dummy diff'
        },
        tests: []
      };

      const result = validateTestInclusion(output);
      expect(result).toBe(false);
    });

    it('should return false when test content is too short', () => {
      const output: IOutput = {
        hypothesis: 'This is a hypothesis.',
        suspects: [],
        patch: {
          unified_diff: 'dummy diff'
        },
        tests: [
          { 
            path: 'tests/example.test.ts', 
            content: 'short' // Less than 10 characters
          }
        ]
      };

      const result = validateTestInclusion(output);
      expect(result).toBe(false);
    });
  });

  describe('validateAllGates', () => {
    it('should return true when all gates pass', () => {
      const output: IOutput = {
        hypothesis: 'This is a hypothesis that explains the failure.',
        suspects: [
          { file: 'src/example.ts', line: 10, reason: 'Potential issue' }
        ],
        patch: {
          unified_diff: `diff --git a/src/example.ts b/src/example.ts
index 1234567..89abcde 100644
--- a/src/example.ts
+++ b/src/example.ts
@@ -7,7 +7,7 @@
 console.log("hello");
-  bad line
+  good line
`,
          files_changed: 1,
          lines_added: 1,
          lines_removed: 1
        },
        tests: [
          { 
            path: 'tests/example.test.ts', 
            content: 'import { example } from "../src/example";\n// Test content' 
          }
        ]
      };

      const result = validateAllGates(output);
      expect(result.isValid).toBe(true);
      expect(result.gateResults.jsonSchema).toBe(true);
      expect(result.gateResults.unifiedDiff).toBe(true);
      expect(result.gateResults.changeLimits).toBe(true);
      expect(result.gateResults.testInclusion).toBe(true);
    });

    it('should return false when any gate fails', () => {
      const output: IOutput = {
        hypothesis: 'Short', // Too short for schema validation
        suspects: [],
        patch: {
          unified_diff: 'invalid diff format'
        },
        tests: []
      };

      const result = validateAllGates(output);
      expect(result.isValid).toBe(false);
    });
  });
});