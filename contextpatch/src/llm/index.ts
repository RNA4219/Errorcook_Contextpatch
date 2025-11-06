// LLM integration module for ContextPatch

interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'test';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: {
    input: number;
    output: number;
  };
}

interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
}

// Mock LLM implementation for now - in a real implementation, this would call actual LLM APIs
export class LLMClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      provider: 'test', // default to test provider
      maxTokens: { input: 500, output: 300 },
      ...config
    };
  }

  async callPrompt(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    // For now, return a mock response based on the triage prompt
    // In a real implementation, this would call the actual LLM provider
    
    if (this.config.provider === 'test') {
      // Generate a mock triage response based on the user prompt
      return this.mockTriageResponse(userPrompt);
    }
    
    // This is where we would integrate with real LLM APIs
    // For example, OpenAI API, Anthropic API, etc.
    throw new Error(`LLM provider ${this.config.provider} not yet implemented`);
  }

  private mockTriageResponse(userPrompt: string): LLMResponse {
    // This is a mock implementation that generates a plausible triage response
    // based on the user prompt content
    
    // Extract some information from the prompt to make the response more relevant
    const hasTypeErrors = userPrompt.toLowerCase().includes('type') || userPrompt.toLowerCase().includes('error');
    const hasMissingVars = userPrompt.toLowerCase().includes('undefined') || userPrompt.toLowerCase().includes('not found');
    
    // Generate a plausible triage response as JSON
    const mockResponse = {
      hypothesis: `The failures appear to be related to ${hasTypeErrors ? 'type mismatches' : 
                   hasMissingVars ? 'undefined variables' : 'syntax or logical errors'} in the codebase. 
                   ${hasTypeErrors ? 'Check that all variables have proper type annotations and that types match expected values.' : ''}
                   ${hasMissingVars ? 'Ensure all variables are properly declared before use.' : ''}`,
      suspects: [
        {
          file: "src/index.ts",
          line: 15,
          reason: "Possible type mismatch or undefined variable"
        },
        {
          file: "src/utils.ts", 
          line: 42,
          reason: "Helper function may be returning unexpected value"
        }
      ],
      patch: {
        unified_diff: `--- a/src/index.ts
+++ b/src/index.ts
@@ -12,7 +12,7 @@
 function processInput(input: string) {
-  return input.split(',').map(s => parseInt(s));
+  return input.split(',').map(s => parseInt(s.trim()));
 }
 
 // Fixed potential NaN handling in number conversion`,
        files_changed: 1,
        lines_added: 1,
        lines_removed: 1
      },
      tests: [
        {
          path: "test/index.test.ts",
          content: `import { expect, test } from 'vitest';
import { processInput } from '../src/index';

test('should handle inputs with extra whitespace', () => {
  const result = processInput('1, 2, 3');
  expect(result).toEqual([1, 2, 3]);
});`,
          purpose: "Verify the fix handles extra whitespace in inputs"
        }
      ]
    };

    return {
      success: true,
      content: JSON.stringify(mockResponse)
    };
  }
}

// Function to build the triage prompt from the failure items
export function buildTriagePrompt(failureItems: any[]): string {
  // Read the triage prompt template from the prompts directory
  // For now we'll create a basic version, but in real implementation 
  // this would read from the actual prompt file
  const promptTemplate = `# Triage Prompt

Role: You are a skilled code repair engineer.
Input: Failure summary (FailureItem[]), related source code excerpts, dependency hints
Task: Return the following JSON: {"hypothesis":"...", "suspects":[...], "patch":{"unified_diff":"..."}, "tests":[...]}
Constraints:
- Patch should be minimal. No large rewrites.
- Tests should be 1 symptom = 1 test. Add 1 more for regression prevention.
- Do not output absolute paths or sensitive information.

# Failure Items:
${JSON.stringify(failureItems, null, 2)}

# Instructions:
- Provide a clear hypothesis about the root cause
- List suspected files with specific line numbers and reasons
- Generate a minimal Unified Diff patch 
- Include at least one test case to verify the fix`;

  return promptTemplate;
}