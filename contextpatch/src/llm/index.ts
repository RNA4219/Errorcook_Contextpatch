// This file was causing a TypeScript error due to duplicate 'provider' keys
// Original error: 'provider' is specified more than once, so this usage will be overwritten

interface LLMConfig {
  provider: 'openai' | 'claude' | 'local' | 'test'; // Added 'test' provider for testing
  model?: string;
  apiKey?: string;
  endpoint?: string;
}

interface CallOptions {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

interface LLMResult {
  success: boolean;
  content?: string;
  error?: string;
}

interface LLMClient {
  call(options: CallOptions): Promise<LLMResult>;
  callPrompt(systemPrompt: string, userPrompt: string, options?: Partial<CallOptions>): Promise<LLMResult>;
}

class OpenAIClient implements LLMClient {
  private config: LLMConfig;
  
  constructor(config: LLMConfig) {
    this.config = config;
  }
  
  async call(options: CallOptions): Promise<LLMResult> {
    // Implementation would depend on provider
    return { success: true, content: `OpenAI response for: ${options.prompt}` };
  }

  async callPrompt(systemPrompt: string, userPrompt: string, options?: Partial<CallOptions>): Promise<LLMResult> {
    return this.call({
      system: systemPrompt,
      prompt: userPrompt,
      ...options
    });
  }
}

class ClaudeClient implements LLMClient {
  private config: LLMConfig;
  
  constructor(config: LLMConfig) {
    this.config = config;
  }
  
  async call(options: CallOptions): Promise<LLMResult> {
    // Implementation would depend on provider
    return { success: true, content: `Claude response for: ${options.prompt}` };
  }

  async callPrompt(systemPrompt: string, userPrompt: string, options?: Partial<CallOptions>): Promise<LLMResult> {
    return this.call({
      system: systemPrompt,
      prompt: userPrompt,
      ...options
    });
  }
}

class LocalClient implements LLMClient {
  private config: LLMConfig;
  
  constructor(config: LLMConfig) {
    this.config = config;
  }
  
  async call(options: CallOptions): Promise<LLMResult> {
    // Implementation would depend on provider
    return { success: true, content: `Local response for: ${options.prompt}` };
  }

  async callPrompt(systemPrompt: string, userPrompt: string, options?: Partial<CallOptions>): Promise<LLMResult> {
    return this.call({
      system: systemPrompt,
      prompt: userPrompt,
      ...options
    });
  }
}

class TestClient implements LLMClient {
  private config: LLMConfig;
  
  constructor(config: LLMConfig) {
    this.config = config;
  }
  
  async call(options: CallOptions): Promise<LLMResult> {
    // Test client returns a fixed response for testing purposes
    return { 
      success: true, 
      content: '{"hypothesis": "Test hypothesis", "suspects": [{"file": "test.js", "reason": "Test suspect"}], "patch": {"unified_diff": "test patch"}, "tests": []}' 
    };
  }

  async callPrompt(systemPrompt: string, userPrompt: string, options?: Partial<CallOptions>): Promise<LLMResult> {
    return this.call({
      system: systemPrompt,
      prompt: userPrompt,
      ...options
    });
  }
}

class LLMClientWrapper {
  private client: LLMClient;
  
  constructor(config: LLMConfig) {
    switch(config.provider) {
      case 'openai':
        this.client = new OpenAIClient(config);
        break;
      case 'claude':
        this.client = new ClaudeClient(config);
        break;
      case 'local':
        this.client = new LocalClient(config);
        break;
      case 'test':
        this.client = new TestClient(config);
        break;
      default:
        this.client = new LocalClient(config);
    }
  }
  
  async call(options: CallOptions): Promise<LLMResult> {
    return this.client.call(options);
  }
  
  async callPrompt(systemPrompt: string, userPrompt: string, options?: Partial<CallOptions>): Promise<LLMResult> {
    return this.client.callPrompt(systemPrompt, userPrompt, options);
  }
}

// Example configuration - making sure no duplicate keys
const defaultConfig: LLMConfig = {
  provider: 'local',  // This was probably duplicated in the original file
  model: 'llama3',
  endpoint: 'http://localhost:11434/api/generate'
};

export { 
  LLMClientWrapper as LLMClient, 
  LLMConfig, 
  defaultConfig, 
  CallOptions, 
  LLMResult
};
