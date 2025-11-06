import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load JSON schema
const schemaPath = resolve(process.cwd(), '..', 'SCHEMAS', 'output.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Compile schema for validation
const validate = ajv.compile(schema);

export interface ValidationResult {
  ok: boolean;
  reason?: string;
  errors?: any[];
}

export function validateOutput(data: any): ValidationResult {
  const valid = validate(data);
  
  if (valid) {
    return { ok: true };
  } else {
    return {
      ok: false,
      reason: 'JSON validation failed',
      errors: validate.errors
    };
  }
}

export function validateFailureItem(data: any): ValidationResult {
  // Load failure item schema
  const failureSchemaPath = resolve(process.cwd(), '..', 'SCHEMAS', 'failure_item.schema.json');
  const failureSchema = JSON.parse(readFileSync(failureSchemaPath, 'utf-8'));
  
  const validateFailure = ajv.compile(failureSchema);
  const valid = validateFailure(data);
  
  if (valid) {
    return { ok: true };
  } else {
    return {
      ok: false,
      reason: 'FailureItem validation failed',
      errors: validateFailure.errors
    };
  }
}

export function validateConfig(data: any): ValidationResult {
  // Load config schema
  const configSchemaPath = resolve(process.cwd(), '..', 'SCHEMAS', 'config.schema.json');
  const configSchema = JSON.parse(readFileSync(configSchemaPath, 'utf-8'));
  
  const validateConfig = ajv.compile(configSchema);
  const valid = validateConfig(data);
  
  if (valid) {
    return { ok: true };
  } else {
    return {
      ok: false,
      reason: 'Config validation failed',
      errors: validateConfig.errors
    };
  }
}