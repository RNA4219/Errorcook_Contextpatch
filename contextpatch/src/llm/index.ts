// LLM interface and implementations
interface LLMConfig {
  provider: 'openai' | 'claude' | 'local' | 'test';
  model?: string;
  apiKey?: string;
  endpoint?: string;
}

interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
}

interface LLMClientInterface {
  call(prompt: string): Promise<LLMResponse>;
  callPrompt(systemPrompt: string, userPrompt: string): Promise<LLMResponse>;
}

class OpenAIClient implements LLMClientInterface {
  private config: LLMConfig;
  
  constructor(config: LLMConfig) {
    this.config = config;
  }
  
  async call(prompt: string): Promise<LLMResponse> {
    // Actual implementation would call the OpenAI API
    // This is a placeholder implementation
    try {
      // In a real implementation, this would make an API call to OpenAI
      return {
        success: true,
        content: `OpenAI response for: ${prompt}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  async callPrompt(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    // Concatenate system and user prompts for the API call
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    return this.call(fullPrompt);
  }
}

class ClaudeClient implements LLMClientInterface {
  private config: LLMConfig;
  
  constructor(config: LLMConfig) {
    this.config = config;
  }
  
  async call(prompt: string): Promise<LLMResponse> {
    try {
      // In a real implementation, this would make an API call to Claude
      return {
        success: true,
        content: `Claude response for: ${prompt}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  async callPrompt(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    return this.call(fullPrompt);
  }
}

class LocalClient implements LLMClientInterface {
  private config: LLMConfig;
  
  constructor(config: LLMConfig) {
    this.config = config;
  }
  
  async call(prompt: string): Promise<LLMResponse> {
    try {
      // In a real implementation, this would call a local LLM
      return {
        success: true,
        content: `Local LLM response for: ${prompt}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  async callPrompt(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    return this.call(fullPrompt);
  }
}

class TestClient implements LLMClientInterface {
  private config: LLMConfig;
  
  constructor(config: LLMConfig) {
    this.config = config;
  }
  
  async call(prompt: string): Promise<LLMResponse> {
    // Test client returns a deterministic response for testing purposes
    return {
      success: true,
      content: `Test response for: ${prompt}`
    };
  }
  
  async callPrompt(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    return this.call(fullPrompt);
  }
}

// Main LLMClient class that acts as a factory for different provider clients
class LLMClient {
  private client: LLMClientInterface;
  
  constructor(config: LLMConfig) {
    switch (config.provider) {
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
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }
  
  async call(prompt: string): Promise<LLMResponse> {
    return this.client.call(prompt);
  }
  
  async callPrompt(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    return this.client.callPrompt(systemPrompt, userPrompt);
  }
}

// Example configuration
const defaultConfig: LLMConfig = {
  provider: 'local',
  model: 'llama3',
  endpoint: 'http://localhost:11434/api/generate'
};

// Types for failure items
interface FailureItem {
  tool: string;
  path?: string;
  message: string;
  details?: string;
  severity?: "error" | "warning";
  meta?: Record<string, any>;
}

// Build a prompt for triaging failures
function buildTriagePrompt(failureItems: FailureItem[]): string {
  return `Analyze the following CI failures and provide:
1. A hypothesis about the root cause
2. A list of suspect files that may contain the issue
3. A proposed patch in unified diff format
4. Test cases that could validate the fix

Failures:
${failureItems.map(item => 
  `- Tool: ${item.tool}
  - Path: ${item.path || 'N/A'}
  - Message: ${item.message}
  - Details: ${item.details || 'N/A'}
  - Severity: ${item.severity || 'N/A'}
  - Meta: ${JSON.stringify(item.meta || {})}`
).join('\n\n')}

Please format your response as JSON with this structure:
{
  "hypothesis": "...",
  "suspects": [
    {
      "file": "...",
      "line": ...,
      "reason": "..."
    }
  ],
  "patch": {
    "unified_diff": "...",
    "files_changed": ...,
    "lines_added": ...,
    "lines_removed": ...
  },
  "tests": [
    {
      "path": "...",
      "content": "...",
      "purpose": "..."
    }
  ]
}`;
}

export { LLMClient, LLMConfig, LLMResponse, defaultConfig, OpenAIClient, ClaudeClient, LocalClient, buildTriagePrompt };
