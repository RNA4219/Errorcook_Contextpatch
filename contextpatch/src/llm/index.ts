// LLM provider interface and implementation
export interface LLMProvider {
  name: string;
  apiKey?: string;
  baseUrl?: string;
  call: (prompt: string) => Promise<string>;
}

// Example implementation of an LLM provider
export class OpenAIProvider implements LLMProvider {
  name: string;
  apiKey?: string;
  baseUrl?: string;

  constructor(options: { name: string; apiKey?: string; baseUrl?: string }) {
    this.name = options.name;
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
  }

  async call(prompt: string): Promise<string> {
    // This is a simplified placeholder implementation
    throw new Error('Method not implemented');
  }
}

// Export a default provider if needed
export const defaultProvider: LLMProvider = {
  name: 'default',
  call: async (prompt: string) => {
    return `Response to: ${prompt}`;
  }
};

// Don't export a duplicate provider property, just export what's needed
export default defaultProvider;