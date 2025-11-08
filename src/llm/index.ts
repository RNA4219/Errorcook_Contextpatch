// This file was causing a TypeScript error due to duplicate 'provider' keys
// Original error: 'provider' is specified more than once, so this usage will be overwritten

interface LLMConfig {
  provider: 'openai' | 'claude' | 'local';
  model?: string;
  apiKey?: string;
  endpoint?: string;
}

class LLMClient {
  private config: LLMConfig;
  
  constructor(config: LLMConfig) {
    this.config = config;
  }
  
  async generate(prompt: string): Promise<string> {
    // Implementation would depend on provider
    return `Generated response for: ${prompt}`;
  }
}

// Example configuration - making sure no duplicate keys
const defaultConfig: LLMConfig = {
  provider: 'local',
  model: 'llama3',
  endpoint: 'http://localhost:11434/api/generate'
};

export { LLMClient, LLMConfig, defaultConfig };