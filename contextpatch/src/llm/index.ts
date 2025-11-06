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
  
  async callPrompt(systemPrompt: string, userPrompt: string): Promise<{ success: boolean; content?: string; error?: string }> {
    // Implementation would depend on provider
    try {
      const response = await this.generate(systemPrompt + "\n\n" + userPrompt);
      return { success: true, content: response };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async generate(prompt: string): Promise<string> {
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

// Define the FailureItem interface to match the one in cli.ts
interface FailureItem {
  tool: string;
  path?: string;
  message: string;
  details?: string;
  severity?: "error" | "warning";
  meta?: Record<string, any>;
}

// Function to build triage prompt from failure items
function buildTriagePrompt(failures: FailureItem[]): string {
  const failuresText = failures.map(failure => {
    return `Tool: ${failure.tool}
Path: ${failure.path || 'N/A'}
Message: ${failure.message}
Details: ${failure.details || 'N/A'}
Severity: ${failure.severity || 'N/A'}
Meta: ${JSON.stringify(failure.meta || {})}
`;
  }).join('\n---\n');

  return `Analyze the following CI failures and generate a structured JSON response with a hypothesis, suspect files, patch, and test cases.

Failures:
${failuresText}

Provide your response as a JSON object with the following structure:
{
  "hypothesis": "string - A detailed hypothesis about the root cause",
  "suspects": [
    {
      "file": "string - The suspected file path",
      "line": "number - The suspected line number (optional)",
      "reason": "string - The reason this file is suspected (optional)"
    }
  ],
  "patch": {
    "unified_diff": "string - The proposed patch in unified diff format",
    "files_changed": "number - Number of files changed (optional)",
    "lines_added": "number - Number of lines added (optional)",
    "lines_removed": "number - Number of lines removed (optional)"
  },
  "tests": [
    {
      "path": "string - Path for new/modified test file",
      "content": "string - Content of the test",
      "purpose": "string - Purpose of this test (optional)"
    }
  ]
}`;
}

export { LLMClient, LLMConfig, defaultConfig, buildTriagePrompt };
