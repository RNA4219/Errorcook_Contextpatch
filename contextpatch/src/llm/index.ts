// Define interface for LLM clients
interface LLMClient {
  call(prompt: string): Promise<{ success: boolean; content: string; error?: string }>;
  callPrompt(systemPrompt: string, userPrompt: string): Promise<{ success: boolean; content: string; error?: string }>;
}

interface LLMConfig {
  provider: 'openai' | 'claude' | 'local' | 'test';
  model?: string;
  apiKey?: string;
  endpoint?: string;
}

// Base class implementing the LLMClient interface
class BaseLLMClient implements LLMClient {
  protected config: LLMConfig;
  
  constructor(config: LLMConfig) {
    this.config = config;
  }
  
  async call(prompt: string): Promise<{ success: boolean; content: string; error?: string }> {
    // Base implementation - to be overridden
    return { success: true, content: `Processed: ${prompt}` };
  }
  
  async callPrompt(systemPrompt: string, userPrompt: string): Promise<{ success: boolean; content: string; error?: string }> {
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    return await this.call(fullPrompt);
  }
}

// OpenAI Client Implementation
class OpenAIClient extends BaseLLMClient {
  constructor(config: LLMConfig) {
    super(config);
  }
  
  async call(prompt: string): Promise<{ success: boolean; content: string; error?: string }> {
    // Mock implementation for now
    try {
      // In a real implementation, this would call the OpenAI API
      const mockResponse = `Mock OpenAI response for: ${prompt.substring(0, 50)}...`;
      return { success: true, content: mockResponse };
    } catch (error) {
      return { 
        success: false, 
        content: '', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Test Client Implementation (for testing purposes)
class TestLLMClient extends BaseLLMClient {
  constructor(config: LLMConfig) {
    super(config);
  }
  
  async call(prompt: string): Promise<{ success: boolean; content: string; error?: string }> {
    // Mock implementation for testing
    return { success: true, content: `Test response for: ${prompt}` };
  }
}

// Factory function to create appropriate LLM client
function createLLMClient(config: LLMConfig): LLMClient {
  switch (config.provider) {
    case 'openai':
      return new OpenAIClient(config);
    case 'test':
      return new TestLLMClient(config);
    case 'claude':
    case 'local':
    default:
      // For now, default to test client for unimplemented providers
      return new TestLLMClient(config);
  }
}

// Export the interface and factory function
export { LLMClient, LLMConfig, createLLMClient };

// Also export the client classes if needed
export { BaseLLMClient, OpenAIClient, TestLLMClient };
