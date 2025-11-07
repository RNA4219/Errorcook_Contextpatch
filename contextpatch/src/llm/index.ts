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
    // Mock implementation for testing that returns valid JSON structure
    const mockResponse = {
      hypothesis: "This is a mock hypothesis for testing purposes. The issue appears to be related to type checking in the specified files.",
      suspects: [
        {
          file: "src/example.ts",
          line: 10,
          reason: "Possible type mismatch or undefined variable"
        }
      ],
      patch: {
        unified_diff: `diff --git a/src/example.ts b/src/example.ts
index 1234567..8901234 100644
--- a/src/example.ts
+++ b/src/example.ts
@@ -7,7 +7,7 @@
 function example() {
   const value = getValue();
-  return value.process();
+  return value ? value.process() : null;
 }`,
        files_changed: 1,
        lines_added: 1,
        lines_removed: 1
      },
      tests: [
        {
          path: "tests/example.test.ts",
          content: "import { example } from '../src/example';\n\ntest('example handles null value', () => {\n  // Test implementation\n});",
          purpose: "Verify that the function handles null values correctly"
        }
      ]
    };
    
    return { success: true, content: JSON.stringify(mockResponse) };
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
