import { LLMBackend, LLMConfig, LLMResponse } from './index.js';

export class LocalLLMClient implements LLMBackend {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async generatePatchAndTests(_systemPrompt: string, _userPrompt: string): Promise<LLMResponse> {
    // Produce a minimal valid JSON payload that conforms to the expected OutputSchema
    const payload = {
      hypothesis: "Automated triage patch suggestion from local LLM mock",
      suspects: [],
      patch: {
        unified_diff: "" as string
      },
      tests: []
    };
    return { success: true, content: JSON.stringify(payload) };
  }
}
