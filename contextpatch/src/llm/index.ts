// LLM Client implementation
export type LLMProvider = "openai" | "claude" | "local"; // Fixed: removed "test" from valid providers

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  baseURL?: string;
}

export class LLMClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  // Added callPrompt method that was missing
  async callPrompt(prompt: string): Promise<string> {
    // Implementation would go here
    return "Mock response";
  }
}

// Added buildTriagePrompt function that was missing
export function buildTriagePrompt(context: any): string {
  // Implementation would go here
  return "Mock triage prompt";
}