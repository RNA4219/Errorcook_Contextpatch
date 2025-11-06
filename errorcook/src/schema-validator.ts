import { ErrorCookConfig } from './config';

/**
 * Schema validation utilities for ErrorCook
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

type SchemaType = Record<string, unknown>;

/**
 * Validates an object against a given schema
 */
function validateSchema<T extends SchemaType>(
  obj: T,
  schema: Record<string, unknown>
): ValidationResult {
  const errors: string[] = [];
  
  // Basic implementation - in a real scenario, you'd want to implement 
  // proper schema validation logic here based on your schema definition format
  for (const key in schema) {
    if (Object.prototype.hasOwnProperty.call(schema, key)) {
      if (!(key in obj)) {
        errors.push(`Missing required property: ${key}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a configuration object
 */
function validateConfig(config: ErrorCookConfig): ValidationResult {
  const errors: string[] = [];
  
  // Validate LLM config
  if (!config.llm) {
    errors.push('llm configuration is required');
  } else {
    const validProviders = ['openai', 'claude', 'local'];
    if (config.llm.provider && !validProviders.includes(config.llm.provider)) {
      errors.push(`llm.provider must be one of: ${validProviders.join(', ')}`);
    }
    
    if (config.llm.maxTokens) {
      if (typeof config.llm.maxTokens.input !== 'number' || config.llm.maxTokens.input <= 0) {
        errors.push('llm.maxTokens.input must be a positive number');
      }
      if (typeof config.llm.maxTokens.output !== 'number' || config.llm.maxTokens.output <= 0) {
        errors.push('llm.maxTokens.output must be a positive number');
      }
    }
  }
  
  // Validate processing config
  if (config.processing) {
    if (typeof config.processing.maxFiles !== 'number' || config.processing.maxFiles <= 0) {
      errors.push('processing.maxFiles must be a positive number');
    }
    if (typeof config.processing.maxChanges !== 'number' || config.processing.maxChanges <= 0) {
      errors.push('processing.maxChanges must be a positive number');
    }
    if (typeof config.processing.parallelism !== 'number' || config.processing.parallelism <= 0) {
      errors.push('processing.parallelism must be a positive number');
    }
  }
  
  // Validate validation config
  if (config.validation) {
    if (typeof config.validation.schemaStrict !== 'boolean') {
      errors.push('validation.schemaStrict must be a boolean');
    }
    if (typeof config.validation.gateEnforcement !== 'boolean') {
      errors.push('validation.gateEnforcement must be a boolean');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export { validateSchema, validateConfig, ValidationResult };