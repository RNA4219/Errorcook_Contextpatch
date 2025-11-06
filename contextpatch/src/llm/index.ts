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
    try {
      const response = await this.generate(options.prompt);
      return { success: true, content: response };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async generate(prompt: string): Promise<string> {
    // Implementation would depend on provider
    return `OpenAI response for: ${prompt}`;
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

// Export the LLMClientWrapper as LLMClient
export { LLMClientWrapper as LLMClient, LLMConfig, defaultConfig, buildTriagePrompt };

// Example configuration - making sure no duplicate keys
const defaultConfig: LLMConfig = {
  provider: 'local',  // This was probably duplicated in the original file
  model: 'llama3',
  endpoint: 'http://localhost:11434/api/generate'
};

// Type definition for failure items
interface FailureItem {
  tool: string;
  path?: string;
  message: string;
  details?: string;
  severity?: "error" | "warning";
  meta?: Record<string, any>;
}

function buildTriagePrompt(failureItems: FailureItem[]): string {
  return `Analyze the following CI failures and provide a hypothesis, suspected files, and suggested fixes:

${failureItems.map(item => 
  `Tool: ${item.tool}
Path: ${item.path || 'N/A'}
Message: ${item.message}
Details: ${item.details || 'N/A'}
Severity: ${item.severity || 'N/A'}

`
).join('\n')}

Please provide:
1. A hypothesis about what's causing the failures
2. A list of suspect files that might need to be changed
3. A suggested patch in unified diff format
4. Any additional test cases that might be needed`;
}


