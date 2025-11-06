// Schema validation module using JSON Schema
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { resolve } from "path";

// Simple JSON Schema validator (in a real implementation, we might use a library like ajv)
export class SchemaValidator {
  /**
   * Validates data against a JSON schema
   * This is a simplified implementation - in production, use a proper library like ajv
   */
  static validateAgainstSchema(data: any, schemaPath: string): { valid: boolean; errors?: string[] } {
    try {
      // Load the schema from file
      const schemaContent = readFileSync(schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      
      // Validate against the schema
      const errors = this.validateValue(data, schema, '#');
      
      if (errors.length > 0) {
        return { valid: false, errors };
      }
      
      return { valid: true };
    } catch (e) {
      return { valid: false, errors: [`Schema validation error: ${e.message}`] };
    }
  }

  private static validateValue(value: any, schema: any, path: string): string[] {
    const errors: string[] = [];

    // Check type
    if (schema.type) {
      if (schema.type === 'object' && typeof value !== 'object' || value === null) {
        errors.push(`${path} must be an object but got ${typeof value}`);
        return errors; // If wrong type, no point checking further
      }
      if (schema.type === 'array' && !Array.isArray(value)) {
        errors.push(`${path} must be an array but got ${typeof value}`);
        return errors;
      }
      if (schema.type === 'string' && typeof value !== 'string') {
        errors.push(`${path} must be a string but got ${typeof value}`);
        return errors;
      }
      if (schema.type === 'number' && typeof value !== 'number') {
        errors.push(`${path} must be a number but got ${typeof value}`);
        return errors;
      }
      if (schema.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${path} must be a boolean but got ${typeof value}`);
        return errors;
      }
    }

    // Check required fields for objects
    if (schema.type === 'object' && schema.required && Array.isArray(schema.required)) {
      for (const requiredField of schema.required) {
        if (!(requiredField in value)) {
          errors.push(`${path}.${requiredField} is required but missing`);
        }
      }
    }

    // Validate properties of objects
    if (schema.type === 'object' && schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties as Record<string, any>)) {
        if (propName in value) {
          const propErrors = this.validateValue(value[propName], propSchema, `${path}.${propName}`);
          errors.push(...propErrors);
        } else if (schema.required?.includes(propName)) {
          errors.push(`${path}.${propName} is required`);
        }
      }
    }

    // Validate array items
    if (schema.type === 'array' && Array.isArray(value)) {
      if (schema.items) {
        for (let i = 0; i < value.length; i++) {
          const itemErrors = this.validateValue(value[i], schema.items, `${path}[${i}]`);
          errors.push(...itemErrors);
        }
      }
    }

    // Check string minLength
    if (schema.type === 'string' && schema.minLength && typeof value === 'string') {
      if (value.length < schema.minLength) {
        errors.push(`${path} must be at least ${schema.minLength} characters, got ${value.length}`);
      }
    }

    // Check number minimum
    if (schema.type === 'number' && schema.minimum !== undefined && typeof value === 'number') {
      if (value < schema.minimum) {
        errors.push(`${path} must be at least ${schema.minimum}, got ${value}`);
      }
    }

    // Check array minItems
    if (schema.type === 'array' && schema.minItems && Array.isArray(value)) {
      if (value.length < schema.minItems) {
        errors.push(`${path} must have at least ${schema.minItems} items, got ${value.length}`);
      }
    }

    return errors;
  }
}

/**
 * Validates FailureItem against the schema
 */
export function validateFailureItem(item: any): { valid: boolean; errors?: string[] } {
  const schemaPath = resolveSchemaPath('failure_item.schema.json');
  return SchemaValidator.validateAgainstSchema(item, schemaPath);
}

/**
 * Validates Output against the schema  
 */
export function validateOutputSchema(data: any): { valid: boolean; errors?: string[] } {
  const schemaPath = resolveSchemaPath('output.schema.json');
  return SchemaValidator.validateAgainstSchema(data, schemaPath);
}

/**
 * Validates Config against the schema
 */
export function validateConfig(config: any): { valid: boolean; errors?: string[] } {
  const schemaPath = resolveSchemaPath('config.schema.json');
  return SchemaValidator.validateAgainstSchema(config, schemaPath);
}

// Helper to resolve schema paths relative to project root
function resolveSchemaPath(schemaFileName: string): string {
  // Get current file's directory using ES modules equivalent of __dirname
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = resolve(__filename, "..", "..", ".."); // Go up to project root from contextpatch/src/validation/
  
  return resolve(__dirname, "SCHEMAS", schemaFileName);
}