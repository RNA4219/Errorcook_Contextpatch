import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLLMClient, TestLLMClient, OpenAIClient } from '../src/llm/index.js';
import { processLLMResponse } from '../src/llm/responseProcessor.js';
import { validateOutputSchema } from '../src/validation/SchemaValidator.js';

// Mock the SchemaValidator to control validation outcomes
vi.mock('../src/validation/SchemaValidator.js', () => ({
  validateOutputSchema: vi.fn(),
}));

describe('LLM Client Factory', () => {
  it('should return a TestLLMClient for provider \'test\'', () => {
    const client = createLLMClient({ provider: 'test' });
    expect(client).toBeInstanceOf(TestLLMClient);
  });

  it('should return an OpenAIClient for provider \'openai\'', () => {
    const client = createLLMClient({ provider: 'openai' });
    expect(client).toBeInstanceOf(OpenAIClient);
  });

  it('should return a TestLLMClient for unknown providers', () => {
    const client = createLLMClient({ provider: 'unknown' as any });
    expect(client).toBeInstanceOf(TestLLMClient);
  });
});

describe('LLM Response Processing', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should successfully process a valid JSON response that passes schema validation', () => {
    const mockValidOutput = {
      hypothesis: "This is a valid hypothesis with at least 20 characters",
      suspects: [{ file: "src/example.ts", line: 10, reason: "Possible issue" }],
      patch: { unified_diff: "diff content" },
      tests: [{ path: "tests/example.test.ts", content: "test content", purpose: "test" }],
    };
    const validJson = JSON.stringify(mockValidOutput);

    (validateOutputSchema as vi.Mock).mockReturnValue({ valid: true });

    const result = processLLMResponse(validJson);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockValidOutput);
    expect(result.validation?.valid).toBe(true);
    expect(validateOutputSchema).toHaveBeenCalledWith(mockValidOutput);
  });

  it('should fail to process invalid JSON', () => {
    const invalidJson = '{ invalid json }';

    const result = processLLMResponse(invalidJson);
    expect(result.success).toBe(false);
    expect(result.error).toContain('JSON at position 2');
    expect(validateOutputSchema).not.toHaveBeenCalled();
  });

  it('should fail to process JSON that does not pass schema validation', () => {
    const mockInvalidOutput = {
      hypothesis: "Short", // Too short
      suspects: [],
      patch: { unified_diff: "" },
      tests: [],
    };
    const invalidSchemaJson = JSON.stringify(mockInvalidOutput);

    (validateOutputSchema as vi.Mock).mockReturnValue({ valid: false, errors: ["Hypothesis too short"] });

    const result = processLLMResponse(invalidSchemaJson);
    expect(result.success).toBe(false);
    expect(result.data).toEqual(mockInvalidOutput);
    expect(result.validation?.valid).toBe(false);
    expect(result.validation?.errors).toEqual(["Hypothesis too short"]);
    expect(validateOutputSchema).toHaveBeenCalledWith(mockInvalidOutput);
  });
});
