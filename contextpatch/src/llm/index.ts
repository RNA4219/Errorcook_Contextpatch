// LLM client abstractions and test/mock backends
export interface LLMConfig {
  provider: 'openai' | 'claude' | 'local' | 'test';
  model?: string;
  apiKey?: string;
  endpoint?: string;
}

export interface LLMClient {
  call(prompt: string): Promise<{ success: boolean; content: string; error?: string }>;
  callPrompt(systemPrompt: string, userPrompt: string): Promise<{ success: boolean; content: string; error?: string }>;
}

export interface LLMBackend {
  generatePatchAndTests(systemPrompt: string, userPrompt: string): Promise<{ success: boolean; content: string; error?: string }>;
}

import { LocalLLMClient as _LocalLLM } from './local_llm.js';

// Base class (simple default) for potential extensions
class BaseLLMClient implements LLMClient {
  protected config: LLMConfig;
  constructor(config: LLMConfig) {
    this.config = config;
  }
  async call(_prompt: string): Promise<{ success: boolean; content: string; error?: string }> {
    return { success: true, content: JSON.stringify({ ok: true }) };
  }
  async callPrompt(systemPrompt: string, userPrompt: string): Promise<{ success: boolean; content: string; error?: string }> {
    const full = systemPrompt + "\n" + userPrompt;
    return this.call(full);
  }
}

// Simple mock backend used in tests
export class TestLLMClient extends BaseLLMClient {
  constructor(config: LLMConfig) { super(config); }
  async generatePatchAndTests(systemPrompt: string, userPrompt: string): Promise<{ success: boolean; content: string; error?: string }> {
    const mockResponse = {
      hypothesis: "This is a mock hypothesis for testing purposes. The issue appears to be related to type checking in the specified files.",
      suspects: [ { file: "src/example.ts", line: 10, reason: "Possible type mismatch or undefined variable" } ],
      patch: {
        unified_diff: `diff --git a/src/example.ts b/src/example.ts\nindex 1234567..8901234 100644\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -7,7 +7,7 @@\n function example() {\n   const value = getValue();\n-  return value.process();\n+  return value ? value.process() : null;\n }`,
        files_changed: 1,
        lines_added: 1,
        lines_removed: 1
      },
      tests: [ { path: "tests/example.test.ts", content: "import { example } from '../src/example';\\n\\ntest('example handles null value', () => {\\n  // Test implementation\\n});", purpose: "Verify that the function handles null values correctly" } ]
    };
    return { success: true, content: JSON.stringify(mockResponse) };
  }
  async call(_prompt: string) {
    return this.generatePatchAndTests("", _prompt);
  }
}

// Local LLM backend (stubbed)
export class LocalLLMClient implements LLMBackend {
  private config: LLMConfig;
  constructor(config: LLMConfig) { this.config = config; }
  async generatePatchAndTests(_systemPrompt: string, _userPrompt: string) {
    const payload = {
      hypothesis: "Automated triage patch suggestion",
      suspects: [],
      patch: { unified_diff: "" as string },
      tests: []
    };
    return { success: true, content: JSON.stringify(payload) };
  }
}

// OpenAI-like client placeholder (not exercised in tests)
export class OpenAIClient extends BaseLLMClient {
  constructor(config: LLMConfig) { super(config); }
  async call(_prompt: string) {
    return { success: true, content: JSON.stringify({ ok: true }) };
  }
  async callPrompt(_system: string, _user: string) {
    return this.call("");
  }
  async generatePatchAndTests(_system: string, _user: string) {
    return this.call("");
  }
}

export function createLLMClient(config: LLMConfig): LLMBackend {
  switch (config.provider) {
    case 'openai':
      return new OpenAIClient(config);
    case 'local':
      return new LocalLLMClient(config);
    case 'test':
      return new TestLLMClient(config);
    default:
      return new TestLLMClient(config);
  }
}

export { TestLLMClient as _TestLLMClient };
