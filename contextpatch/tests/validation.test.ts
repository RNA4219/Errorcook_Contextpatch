import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateOutputSchema } from '../src/validation/SchemaValidator.js';
import { processLLMResponse } from '../src/llm/responseProcessor.js';

describe('Output Schema Validation', () => {
  it('should validate a correct output structure', () => {
    const validOutput = {
      hypothesis: "This is a valid hypothesis with at least 20 characters",
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

    const result = validateOutputSchema(validOutput);
    expect(result.valid).toBe(true);
  });

  it('should fail validation for missing required fields', () => {
    const invalidOutput = {
      // Missing hypothesis
      suspects: [
        {
          file: "src/example.ts",
          line: 10,
          reason: "Possible issue in this file"
        }
      ],
      patch: {
        unified_diff: "some diff content" // Valid unified_diff
      },
      tests: [
        {
          path: "tests/example.test.ts",
          content: "Test content" // Valid content
        }
      ]
    };

    const result = validateOutputSchema(invalidOutput);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('should fail validation for hypothesis with less than 20 characters', () => {
    const invalidOutput = {
      hypothesis: "Too short", // Less than 20 chars
      suspects: [
        {
          file: "src/example.ts",
          line: 10,
          reason: "Possible issue in this file"
        }
      ],
      patch: {
        unified_diff: "some diff content" // Valid unified_diff
      },
      tests: [
        {
          path: "tests/example.test.ts",
          content: "Test content" // Valid content
        }
      ]
    };

    const result = validateOutputSchema(invalidOutput);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(error => error.includes('hypothesis'))).toBe(true);
  });

  it('should fail validation for patch without unified_diff', () => {
    const invalidOutput = {
      hypothesis: "This is a valid hypothesis with at least 20 characters",
      suspects: [
        {
          file: "src/example.ts",
          line: 10,
          reason: "Possible issue in this file"
        }
      ],
      patch: {
        // Missing unified_diff
        files_changed: 1,
        lines_added: 1,
        lines_removed: 1
      },
      tests: [
        {
          path: "tests/example.test.ts",
          content: "Test content" // Valid content
        }
      ]
    };

    const result = validateOutputSchema(invalidOutput);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should fail validation for tests with less than 10 chars content', () => {
    const invalidOutput = {
      hypothesis: "This is a valid hypothesis with at least 20 characters",
      suspects: [
        {
          file: "src/example.ts",
          line: 10,
          reason: "Possible issue in this file"
        }
      ],
      patch: {
        unified_diff: "some diff content" // Valid unified_diff
      },
      tests: [
        {
          path: "tests/example.test.ts",
          content: "short" // Less than 10 chars
        }
      ]
    };

    const result = validateOutputSchema(invalidOutput);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

describe('LLM Response Processing', () => {
  it('should successfully process a valid JSON response', () => {
    const validJson = JSON.stringify({
      hypothesis: "This is a valid hypothesis with at least 20 characters",
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
    });

    const result = processLLMResponse(validJson);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.validation).toBeDefined();
    expect(result.validation?.valid).toBe(true);
  });

  it('should fail to process invalid JSON', () => {
    const invalidJson = '{ invalid json }';

    const result = processLLMResponse(invalidJson);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('Invalid JSON');
  });

  it('should fail to process JSON that does not match schema', () => {
    const invalidSchemaJson = JSON.stringify({
      hypothesis: "Short", // Too short
      suspects: [
        {
          file: "src/example.ts",
          line: 10,
          reason: "Possible issue in this file"
        }
      ],
      patch: {
        unified_diff: "some diff" // Too short
      },
      tests: [
        {
          path: "tests/example.test.ts",
          content: "short" // Too short
        }
      ]
    });

    const result = processLLMResponse(invalidSchemaJson);
    expect(result.success).toBe(false);
    expect(result.validation?.valid).toBe(false);
  });
});