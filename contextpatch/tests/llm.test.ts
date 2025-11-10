import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLLMClient, TestLLMClient, OpenAIClient } from '../src/llm/index.js';
import { processLLMResponse } from '../src/llm/responseProcessor.js';
import { validateOutputSchema } from '../src/validation/SchemaValidator.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

// Mock the SchemaValidator to control validation outcomes
vi.mock('../src/validation/SchemaValidator.js', () => ({
  validateOutputSchema: vi.fn(),
}));

// Mock fs operations for CLI testing
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    rmSync: vi.fn(),
  };
});

// Mock process.exit to prevent actual exit during tests
const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

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

describe('CLI Triage Command', () => {
  const mockArtifactDir = resolve(process.cwd(), './work/.ctxpack/artifact');
  const mockDetectJsonlPath = resolve(mockArtifactDir, 'detect.jsonl');
  const mockTriageJsonPath = resolve(mockArtifactDir, 'triage.json');

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock existsSync to return true for artifact directories and detect.jsonl by default
    (existsSync as vi.Mock).mockImplementation((path: string) => {
      if (path === mockDetectJsonlPath) return true;
      if (path.includes('./work/.ctxpack')) return true;
      return false;
    });
    (mkdirSync as vi.Mock).mockReturnValue(undefined);
    mockExit.mockClear();
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  it('should exit with error if detect.jsonl is not found', async () => {
    (existsSync as vi.Mock).mockImplementation((path: string) => {
      if (path === mockDetectJsonlPath) return false; // Specifically make detect.jsonl not exist
      if (path.includes('./work/.ctxpack')) return true;
      return false;
    });

    process.argv = ['node', 'cli.js', 'triage', '-p', './work/.ctxpack', '--llm-provider', 'test'];
    await import('../src/cli.js'); // Re-import to run main

    expect(mockExit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('detect.jsonl not found'));
  });

  it('should successfully generate triage.json from detect.jsonl using TestLLMClient', async () => {
    const mockFailureItems = [
      {
        tool: 'pytest',
        path: 'tests/test_example.py',
        message: 'AssertionError: 2 + 2 != 5',
        severity: 'error',
      },
    ];
    const mockDetectContent = mockFailureItems.map(item => JSON.stringify(item)).join('\n');

    (readFileSync as vi.Mock).mockImplementation((path: string) => {
      if (path === mockDetectJsonlPath) return mockDetectContent;
      return '';
    });
    (validateOutputSchema as vi.Mock).mockReturnValue({ valid: true });

    process.argv = ['node', 'cli.js', 'triage', '-p', './work/.ctxpack', '--llm-provider', 'test'];
    await import('../src/cli.js'); // Re-import to run main

    expect(mockExit).not.toHaveBeenCalled();
    expect(writeFileSync).toHaveBeenCalledWith(
      mockTriageJsonPath,
      expect.stringContaining('hypothesis')
    );
    const writtenContent = (writeFileSync as vi.Mock).mock.calls[0][1];
    const output = JSON.parse(writtenContent);
    expect(output.hypothesis).toContain('mock hypothesis');
    expect(output.patch.unified_diff).toContain('diff --git');
    expect(output.tests.length).toBeGreaterThan(0);
  });

  it('should exit with error if LLM response is invalid JSON', async () => {
    const mockFailureItems = [
      {
        tool: 'pytest',
        path: 'tests/test_example.py',
        message: 'AssertionError: 2 + 2 != 5',
        severity: 'error',
      },
    ];
    const mockDetectContent = mockFailureItems.map(item => JSON.stringify(item)).join('\n');

    (readFileSync as vi.Mock).mockImplementation((path: string) => {
      if (path === mockDetectJsonlPath) return mockDetectContent;
      return '';
    });

    // Mock TestLLMClient to return invalid JSON
    vi.mock('../src/llm/index.js', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        createLLMClient: vi.fn(() => ({
          generatePatchAndTests: vi.fn(() => Promise.resolve({ success: true, content: '{ invalid json }' })),
        })),
      };
    });

    process.argv = ['node', 'cli.js', 'triage', '-p', './work/.ctxpack', '--llm-provider', 'test'];
    await import('../src/cli.js'); // Re-import to run main

    expect(mockExit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid JSON response from LLM'));
  });

  it('should exit with error if LLM response does not conform to schema', async () => {
    const mockFailureItems = [
      {
        tool: 'pytest',
        path: 'tests/test_example.py',
        message: 'AssertionError: 2 + 2 != 5',
        severity: 'error',
      },
    ];
    const mockDetectContent = mockFailureItems.map(item => JSON.stringify(item)).join('\n');

    (readFileSync as vi.Mock).mockImplementation((path: string) => {
      if (path === mockDetectJsonlPath) return mockDetectContent;
      return '';
    });
    (validateOutputSchema as vi.Mock).mockReturnValue({ valid: false, errors: ["Hypothesis too short"] });

    process.argv = ['node', 'cli.js', 'triage', '-p', './work/.ctxpack', '--llm-provider', 'test'];
    await import('../src/cli.js'); // Re-import to run main

    expect(mockExit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('LLM output does not conform to schema'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Hypothesis too short'));
  });
});
