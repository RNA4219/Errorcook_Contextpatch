// Response processor for LLM outputs
import { validateOutputSchema, ValidationResult } from "../validation/SchemaValidator.js";

export type ProcessResult = {
  success: boolean;
  data?: any;
  error?: string;
  validation?: ValidationResult;
};

export function processLLMResponse(content: string): ProcessResult {
  try {
    const data = JSON.parse(content);
    const validation = validateOutputSchema(data);
    if (!validation?.valid) {
      return { success: false, data, validation };
    }
    return { success: true, data, validation };
  } catch (e: any) {
    return { success: false, error: typeof e?.message === 'string' ? e.message : String(e) };
  }
}
