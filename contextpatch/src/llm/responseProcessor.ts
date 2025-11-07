import { validateOutputSchema, ValidationResult } from '../validation/SchemaValidator.js';

// Define the expected output structure
interface OutputStructure {
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
}

// Process the LLM response and validate against schema
function processLLMResponse(response: string): { 
  success: boolean; 
  data?: OutputStructure; 
  error?: string;
  validation?: ValidationResult;
} {
  try {
    // Attempt to parse JSON from LLM response
    const parsedResponse = JSON.parse(response) as OutputStructure;
    
    // Validate against the output schema
    const validation = validateOutputSchema(parsedResponse);
    
    if (!validation.valid) {
      return {
        success: false,
        error: `Response validation failed: ${validation.errors?.join(', ')}`,
        validation
      };
    }
    
    // Return the validated response
    return {
      success: true,
      data: parsedResponse,
      validation
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: `Invalid JSON in LLM response: ${error.message}`
      };
    } else if (error instanceof Error) {
      return {
        success: false,
        error: `Error processing LLM response: ${error.message}`
      };
    } else {
      return {
        success: false,
        error: `Unknown error processing LLM response: ${String(error)}`
      };
    }
  }
}

export { processLLMResponse, OutputStructure };