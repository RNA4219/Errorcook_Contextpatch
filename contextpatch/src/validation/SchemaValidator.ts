// SchemaValidator.ts
// Original error: 'e' is of type 'unknown'

import { OutputSchema } from "../prompts/validateOutput.js";

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

interface ValidationOptions {
  strict?: boolean;
  allowUnknown?: boolean;
}

class SchemaValidator {
  validate(data: any, schema: any, options?: ValidationOptions): boolean {
    try {
      // Example validation implementation
      this.performValidation(data, schema, options);
      return true;
    } catch (e: unknown) { // Fixed: explicitly typed as 'unknown'
      // Fixed: Type guard to properly handle the unknown error type
      if (e instanceof Error) {
        console.error(`Validation error: ${e.message}`);
      } else {
        console.error(`Validation error: ${String(e)}`);
      }
      return false;
    }
  }

  private performValidation(data: any, schema: any, options?: ValidationOptions): void {
    // Implementation would go here
    if (!data || !schema) {
      throw new Error('Data and schema are required');
    }
    
    // Basic validation logic would be implemented here
    Object.keys(schema).forEach(key => {
      if (schema[key].required && data[key] === undefined) {
        throw new Error(`Required field ${key} is missing`);
      }
    });
  }
}

// Function to validate output schema specifically for the OutputSchema type
function validateOutputSchema(data: OutputSchema): ValidationResult {
  // We'll call the same validation that's in the validateOutput function
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['not an object'] };
  }
  
  // Validate hypothesis
  if (typeof data.hypothesis !== 'string' || data.hypothesis.length < 20) {
    return { valid: false, errors: ['hypothesis must be a string of at least 20 characters'] };
  }
  
  // Validate suspects
  if (!Array.isArray(data.suspects)) {
    return { valid: false, errors: ['suspects must be an array'] };
  }
  for (const s of data.suspects) {
    if (!s || typeof s.file !== 'string') {
      return { valid: false, errors: ['suspect.file must be a string'] };
    }
    if (s.line != null && typeof s.line !== 'number') {
      return { valid: false, errors: ['suspect.line must be a number'] };
    }
    if (s.reason != null && typeof s.reason !== 'string') {
      return { valid: false, errors: ['suspect.reason must be a string'] };
    }
  }
  
  // Validate patch
  if (!data.patch || typeof data.patch.unified_diff !== 'string' || data.patch.unified_diff.length < 10) {
    return { valid: false, errors: ['patch.unified_diff must be a string of at least 10 characters'] };
  }
  
  // Validate tests
  if (!Array.isArray(data.tests) || data.tests.length < 1) {
    return { valid: false, errors: ['tests must be an array with at least 1 element'] };
  }
  for (const t of data.tests) {
    if (!t || typeof t.path !== 'string' || typeof t.content !== 'string') {
      return { valid: false, errors: ['test.path and test.content are required strings'] };
    }
    if (t.content.length < 10) {
      return { valid: false, errors: ['test.content must be at least 10 characters'] };
    }
    if (t.purpose != null && typeof t.purpose !== 'string') {
      return { valid: false, errors: ['test.purpose must be a string if provided'] };
    }
  }
  
  return { valid: true };
}

export { SchemaValidator, validateOutputSchema, ValidationResult };
