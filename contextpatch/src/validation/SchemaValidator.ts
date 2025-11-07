// SchemaValidator.ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

interface ValidationOptions {
  strict?: boolean;
  allowUnknown?: boolean;
}

// Initialize Ajv validator with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Import JSON schema
import outputSchema from '../../../SCHEMAS/output.schema.json' assert { type: 'json' };

// Compile the schema
const validate = ajv.compile(outputSchema);

class SchemaValidator {
  validate(data: any, schema: any, options?: ValidationOptions): ValidationResult {
    try {
      // Using the precompiled validator
      const valid = validate(data);
      
      if (valid) {
        return { valid: true };
      } else {
        const errors = validate.errors?.map(error => 
          `${error.instancePath || 'root'} ${error.message || ''} (${error.keyword})`
        ) || ['Unknown validation error'];
        return { valid: false, errors };
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(`Validation error: ${e.message}`);
        return { valid: false, errors: [e.message] };
      } else {
        console.error(`Validation error: ${String(e)}`);
        return { valid: false, errors: [String(e)] };
      }
    }
  }
}

function validateOutputSchema(data: any): ValidationResult {
  const validator = new SchemaValidator();
  return validator.validate(data, outputSchema);
}

export { SchemaValidator, validateOutputSchema, ValidationResult };
