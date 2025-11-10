import { describe, it, expect } from 'vitest';
import { TestLLMClient, LLMConfig } from './index.js';

describe('TestLLMClient', () => {
  it('should return a mock patch and tests in the expected JSON format', async () => {
    const config: LLMConfig = { provider: 'test' };
    const client = new TestLLMClient(config);

    const systemPrompt = "You are a code repair assistant.";
    const userPrompt = "Analyze the following CI failures and generate a hypothesis, suspect files, patch, and test cases.";

    const response = await client.generatePatchAndTests(systemPrompt, userPrompt);

    expect(response.success).toBe(true);
    expect(response.content).toBeDefined();

    const output = JSON.parse(response.content!);

    expect(output).toHaveProperty('hypothesis');
    expect(output.hypothesis).toContain('mock hypothesis');
    expect(output).toHaveProperty('suspects');
    expect(Array.isArray(output.suspects)).toBe(true);
    expect(output.suspects.length).toBeGreaterThan(0);
    expect(output.suspects[0]).toHaveProperty('file');
    expect(output).toHaveProperty('patch');
    expect(output.patch).toHaveProperty('unified_diff');
    expect(output.patch.unified_diff).toContain('diff --git');
    expect(output).toHaveProperty('tests');
    expect(Array.isArray(output.tests)).toBe(true);
    expect(output.tests.length).toBeGreaterThan(0);
    expect(output.tests[0]).toHaveProperty('path');
    expect(output.tests[0]).toHaveProperty('content');
  });
});