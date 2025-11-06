// Enhanced SchemaValidator with proper JSON schema validation
import Ajv from 'ajv';

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

interface ValidationOptions {
  strict?: boolean;
  allowUnknown?: boolean;
}

class SchemaValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
  }

  validate(data: any, schema: any, options?: ValidationOptions): ValidationResult {
    try {
      const validateFn = this.ajv.compile(schema);
      const valid = validateFn(data);
      
      if (!valid && validateFn.errors) {
        const errors = validateFn.errors.map(error => 
          `${error.instancePath || 'root'}: ${error.message || 'Validation error'}`
        );
        return { valid: false, errors };
      }
      
      return { valid: true };
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

  // Convenience methods for common schemas
  validateOutputSchema(data: any): ValidationResult {
    // This would be a proper schema loaded from the SCHEMAS directory
    const outputSchema = {
      type: "object",
      required: ["hypothesis", "suspects", "patch", "tests"],
      properties: {
        hypothesis: { type: "string", minLength: 20 },
        suspects: { type: "array", items: {
          type: "object", required: ["file"], properties: {
            file: { type: "string" },
            line: { type: "integer" },
            reason: { type: "string" }
          }
        }},
        patch: { type: "object", required: ["unified_diff"], properties: {
          unified_diff: { type: "string", minLength: 10 },
          files_changed: { type: "integer", minimum: 1 },
          lines_added: { type: "integer", minimum: 0 },
          lines_removed: { type: "integer", minimum: 0 }
        }},
        tests: { type: "array", minItems: 1, items: {
          type: "object", required: ["path", "content"], properties: {
            path: { type: "string" },
            content: { type: "string", minLength: 10 },
            purpose: { type: "string" }
          }
        }}
      }
    };
    return this.validate(data, outputSchema);
  }

  validateFailureItemSchema(data: any): ValidationResult {
    const failureItemSchema = {
      type: "object",
      required: ["tool", "message"],
      properties: {
        tool: { type: "string" },
        path: { type: "string" },
        message: { type: "string" },
        details: { type: "string" },
        severity: { type: "string", enum: ["error", "warning"] },
        meta: { type: "object" }
      }
    };
    return this.validate(data, failureItemSchema);
  }
}

export { SchemaValidator, ValidationResult };