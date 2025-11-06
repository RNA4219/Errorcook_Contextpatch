// SchemaValidator.ts
// Original error: 'e' is of type 'unknown'

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

export { SchemaValidator };