import { 
  validateJsonSchema, 
  validateUnifiedDiff, 
  validateChangeLimits, 
  validateTestInclusion, 
  runGates 
} from '../src/gates';

// Test cases for the gates functionality
describe('Gates Validation Tests', () => {
  describe('validateJsonSchema', () => {
    it('should return true for valid output schema', () => {
      const validOutput = {
        hypothesis: 'This is a hypothesis that is more than 20 characters long',
        suspects: [{ file: 'test.ts', line: 10, reason: 'Possible issue' }],
        patch: { 
          unified_diff: '@@ -1,3 +1,3 @@\n- foo\n+ bar\n baz' 
        },
        tests: [{ path: 'test.ts', content: 'test content more than 10 chars' }]
      };

      expect(validateJsonSchema(validOutput, '')).toBe(true);
    });

    it('should return false for output missing required fields', () => {
      const invalidOutput = {
        hypothesis: 'This is a hypothesis that is more than 20 characters long',
        suspects: [{ file: 'test.ts', line: 10, reason: 'Possible issue' }],
        // Missing patch field
        tests: [{ path: 'test.ts', content: 'test content more than 10 chars' }]
      };

      expect(validateJsonSchema(invalidOutput, '')).toBe(false);
    });

    it('should return false for hypothesis too short', () => {
      const invalidOutput = {
        hypothesis: 'Short',
        suspects: [{ file: 'test.ts', line: 10, reason: 'Possible issue' }],
        patch: { 
          unified_diff: '@@ -1,3 +1,3 @@\n- foo\n+ bar\n baz' 
        },
        tests: [{ path: 'test.ts', content: 'test content more than 10 chars' }]
      };

      expect(validateJsonSchema(invalidOutput, '')).toBe(false);
    });
  });

  describe('validateUnifiedDiff', () => {
    it('should return true for valid unified diff format', () => {
      const validDiff = `--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,3 @@
 foo
-bar
+baz
 qux`;

      expect(validateUnifiedDiff(validDiff)).toBe(true);
    });

    it('should return false for invalid unified diff format', () => {
      const invalidDiff = `Invalid diff format
without proper headers`;

      expect(validateUnifiedDiff(invalidDiff)).toBe(false);
    });
  });

  describe('validateChangeLimits', () => {
    it('should return true for changes within limits', () => {
      const validDiff = `--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,3 @@
 foo
-bar
+baz
 qux`;

      expect(validateChangeLimits(validDiff, 10, 5)).toBe(true);
    });

    it('should return false for changes exceeding line limits', () => {
      const invalidDiff = `--- a/test.ts
+++ b/test.ts
@@ -1,10 +1,10 @@
 foo
-bar
+baz
 foo
-bar
+baz
 foo
-bar
+baz
 foo
-bar
+baz
 foo
-bar
+baz
 foo
-bar
+baz
 foo
-bar
+baz
 foo
-bar
+baz
 foo
-bar
+baz
 foo
-bar
+baz`;

      expect(validateChangeLimits(invalidDiff, 5, 5)).toBe(false);
    });

    it('should return false for changes exceeding file limits', () => {
      const invalidDiff = `--- a/test1.ts
+++ b/test1.ts
@@ -1,3 +1,3 @@
 foo
-bar
+baz
 qux
--- a/test2.ts
+++ b/test2.ts
@@ -1,3 +1,3 @@
 foo
-bar
+baz
 qux
--- a/test3.ts
+++ b/test3.ts
@@ -1,3 +1,3 @@
 foo
-bar
+baz
 qux
--- a/test4.ts
+++ b/test4.ts
@@ -1,3 +1,3 @@
 foo
-bar
+baz
 qux
--- a/test5.ts
+++ b/test5.ts
@@ -1,3 +1,3 @@
 foo
-bar
+baz
 qux
--- a/test6.ts
+++ b/test6.ts
@@ -1,3 +1,3 @@
 foo
-bar
+baz
 qux`;

      expect(validateChangeLimits(invalidDiff, 60, 5)).toBe(false); // 6 files, limit 5
    });
  });

  describe('validateTestInclusion', () => {
    it('should return true for valid test inclusion', () => {
      const validTests = [
        { path: 'test.ts', content: 'test content more than 10 chars' }
      ];

      expect(validateTestInclusion(validTests)).toBe(true);
    });

    it('should return false for missing test content', () => {
      const invalidTests = [
        { path: 'test.ts', content: 'short' } // Less than 10 chars
      ];

      expect(validateTestInclusion(invalidTests)).toBe(false);
    });

    it('should return false for missing tests', () => {
      const invalidTests: any[] = [];

      expect(validateTestInclusion(invalidTests)).toBe(false);
    });
  });

  describe('runGates', () => {
    it('should return passed: true for output that passes all gates', () => {
      const validOutput = {
        hypothesis: 'This is a hypothesis that is more than 20 characters long',
        suspects: [{ file: 'test.ts', line: 10, reason: 'Possible issue' }],
        patch: { 
          unified_diff: `--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,3 @@
 foo
-bar
+baz
 qux` 
        },
        tests: [{ path: 'test.ts', content: 'test content more than 10 chars' }]
      };

      const result = runGates(validOutput, { maxLines: 10, maxFiles: 5 });
      expect(result.passed).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return passed: false with errors for output that fails gates', () => {
      const invalidOutput = {
        hypothesis: 'Short', // Too short
        suspects: [{ file: 'test.ts', line: 10, reason: 'Possible issue' }],
        patch: { 
          unified_diff: `Invalid diff format` // Invalid format
        },
        tests: [] // No tests
      };

      const result = runGates(invalidOutput, { maxLines: 10, maxFiles: 5 });
      expect(result.passed).toBe(false);
      expect(result.errors).toContain('Output does not comply with JSON schema');
      expect(result.errors).toContain('Unified Diff is not in valid format or cannot be applied');
      expect(result.errors).toContain('At least one test case must be included with proper content');
    });
  });
});