import { LLMClient, createLLMClient, LLMConfig } from './index.js';
import { buildTriagePrompt } from '../prompts/triage.js';
import { FailureItem } from '../parsers/types.js';
import { processLLMResponse } from './responseProcessor.js';

interface TriageResult {
  success: boolean;
  data?: {
    hypothesis: string;
    suspects: Array<{
      file: string;
      line?: number;
      reason?: string;
    }>;
    patch: {
      unified_diff: string;
      files_changed?: number;
      lines_added?: number;
      lines_removed?: number;
    };
    tests: Array<{
      path: string;
      content: string;
      purpose?: string;
    }>;
  };
  error?: string;
}

class TriageService {
  private llmClient: LLMClient;

  constructor(llmConfig: LLMConfig) {
    this.llmClient = createLLMClient(llmConfig);
  }

  async triageFailures(failures: FailureItem[]): Promise<TriageResult> {
    // Build the triage prompt from failures
    const prompt = buildTriagePrompt(failures);

    // Call the LLM
    const llmResponse = await this.llmClient.call(prompt);

    if (!llmResponse.success) {
      return {
        success: false,
        error: `LLM call failed: ${llmResponse.error}`
      };
    }

    // Process and validate the response
    const processedResponse = processLLMResponse((llmResponse.content as string) || '');

    if (!processedResponse.success) {
      return {
        success: false,
        error: `LLM response processing failed: ${processedResponse.error}`
      };
    }

    return {
      success: true,
      data: processedResponse.data
    };
  }
}

export { TriageService, TriageResult };