// SchemaValidator.ts
// Original error: 'e' is of type 'unknown'

interface ValidationOptions {
  strict?: boolean;
  allowUnknown?: boolean;
}

interface OutputSchema {
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

interface ValidationResult {
  valid: boolean;
  errors: string[];
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

// Function to validate output schema specifically for the contextpatch tool
export function validateOutputSchema(data: OutputSchema): string[] {
  const errors: string[] = [];
  
  // Check required top-level fields
  if (!data.hypothesis || typeof data.hypothesis !== 'string') {
    errors.push('hypothesis is required and must be a string');
  }
  
  if (!data.suspects || !Array.isArray(data.suspects)) {
    errors.push('suspects is required and must be an array');
  } else {
    data.suspects.forEach((suspect, index) => {
      if (!suspect.file || typeof suspect.file !== 'string') {
        errors.push(`suspects[${index}].file is required and must be a string`);
      }
    });
  }
  
  if (!data.patch || typeof data.patch !== 'object') {
    errors.push('patch is required and must be an object');
  } else {
    if (!data.patch.unified_diff || typeof data.patch.unified_diff !== 'string') {
      errors.push('patch.unified_diff is required and must be a string');
    }
  }
  
  if (!data.tests || !Array.isArray(data.tests)) {
    errors.push('tests is required and must be an array');
  } else {
    data.tests.forEach((test, index) => {
      if (!test.path || typeof test.path !== 'string') {
        errors.push(`tests[${index}].path is required and must be a string`);
      }
      if (!test.content || typeof test.content !== 'string') {
        errors.push(`tests[${index}].content is required and must be a string`);
      }
    });
  }
  
  return errors;
}

export { SchemaValidator };
