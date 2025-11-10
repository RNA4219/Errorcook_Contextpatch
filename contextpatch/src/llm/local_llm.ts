export interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export interface LLMConfig {
  provider: string;
  model?: string;
  endpoint?: string;
}

export class LocalLLMClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async call(_prompt: string): Promise<LLMResponse> {
    // Produce a minimal valid JSON payload that conforms to the expected OutputSchema
    const payload = {
      hypothesis: "Automated triage patch suggestion",
      suspects: [],
      patch: {
        unified_diff: "" as string
      },
      tests: []
    };
    return { success: true, content: JSON.stringify(payload) };
  }

  async callPrompt(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    return this.call(fullPrompt);
  }
}
