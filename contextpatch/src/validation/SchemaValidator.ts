import { z, ZodSchema } from 'zod';

export class SchemaValidator {
  private schema: ZodSchema;

  constructor(schema: ZodSchema) {
    this.schema = schema;
  }

  validate(data: unknown): { success: boolean; data?: any; error?: string } {
    try {
      const parsedData = this.schema.parse(data);
      return { success: true, data: parsedData };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Async validation method
  async validateAsync(data: unknown): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const parsedData = await this.schema.parseAsync(data);
      return { success: true, data: parsedData };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Safe validation that properly handles unknown error types
  safeValidate(data: unknown): { success: boolean; data?: any; error?: string } {
    try {
      const parsedData = this.schema.parse(data);
      return { success: true, data: parsedData };
    } catch (e: unknown) { // Explicitly type e as unknown
      // Properly handle the unknown type by checking it before accessing properties
      if (e instanceof Error) {
        return { success: false, error: e.message };
      } else if (typeof e === 'string') {
        return { success: false, error: e };
      } else {
        return { success: false, error: 'Unknown validation error occurred' };
      }
    }
  }
}

export default SchemaValidator;