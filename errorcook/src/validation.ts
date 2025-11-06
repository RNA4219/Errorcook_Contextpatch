import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { validate } from "jsonschema";
import { Output, FailureItem } from "./types";

// Load JSON schema
function loadSchema(schemaPath: string): any {
  if (!existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }
  return JSON.parse(readFileSync(schemaPath, "utf-8"));
}

// Validate output against schema
export function validateOutput(output: Output, schemaPath: string): { valid: boolean; errors: string[] } {
  try {
    const schema = loadSchema(schemaPath);
    const validation = validate(output, schema);
    
    return {
      valid: validation.errors.length === 0,
      errors: validation.errors.map(error => 
        `${error.property}: ${error.message}`
      )
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Schema validation error: ${error}`]
    };
  }
}

// Validate failure items
export function validateFailureItems(items: FailureItem[]): { valid: boolean; errors: string[] } {
  const schema = loadSchema(resolve(process.cwd(), "SCHEMAS/failure_item.schema.json"));
  const validation = validate(items, {
    type: "array",
    items: schema
  });
  
  return {
    valid: validation.errors.length === 0,
    errors: validation.errors.map(error => 
      `${error.property}: ${error.message}`
    )
  };
}

// Validate configuration
export function validateConfig(config: any): { valid: boolean; errors: string[] } {
  const schema = loadSchema(resolve(process.cwd(), "SCHEMAS/config.schema.json"));
  const validation = validate(config, schema);
  
  return {
    valid: validation.errors.length === 0,
    errors: validation.errors.map(error => 
      `${error.property}: ${error.message}`
    )
  };
}

// Check guardrails compliance
export function checkGuardrails(output: Output): { compliant: boolean; violations: string[] } {
  const violations: string[] = [];
  
  // Check hypothesis length
  if (output.hypothesis.length < 20) {
    violations.push("Hypothesis must be at least 20 characters long");
  }
  
  // Check unified diff format
  if (!output.patch.unified_diff.startsWith("--- a/") || 
      !output.patch.unified_diff.includes("+++ b/") ||
      !output.patch.unified_diff.includes("@@")) {
    violations.push("Patch must be in unified diff format");
  }
  
  // Check unified diff length
  if (output.patch.unified_diff.length < 10) {
    violations.push("Unified diff must be at least 10 characters long");
  }
  
  // Check minimum tests
  if (output.tests.length < 1) {
    violations.push("At least one test is required");
  }
  
  // Check test content length
  for (const test of output.tests) {
    if (test.content.length < 10) {
      violations.push(`Test content must be at least 10 characters long: ${test.path}`);
    }
  }
  
  return {
    compliant: violations.length === 0,
    violations
  };
}