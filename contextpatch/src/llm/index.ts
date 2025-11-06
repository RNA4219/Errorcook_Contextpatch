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

  async callPrompt(systemPrompt: string, userPrompt: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      // This is a placeholder implementation that combines the prompts
      // In a real implementation, this would call the actual LLM provider
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      const response = await this.generate(fullPrompt);
      
      return {
        success: true,
        content: response
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

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

export { LLMClient, LLMConfig, defaultConfig, buildTriagePrompt };
