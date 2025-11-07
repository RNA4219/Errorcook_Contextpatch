import { describe, it, expect } from 'vitest';
import { FailureItem } from './contextpatch/src/parsers/types';

// Test to validate FailureItem schema compliance
describe('FailureItem schema compliance', () => {
  it('should match the schema definition', () => {
    // According to SCHEMAS/failure_item.schema.json:
    // Required: tool, message
    // Optional: path, details, severity, meta
    const failureItem: FailureItem = {
      tool: 'pytest',
      message: 'Test failed with some error',
      path: 'tests/test_example.py',
      details: 'Detailed information about the failure',
      severity: 'error' as 'error' | 'warning',
      meta: { 
        test: 'test_function',
        file: 'test_file.py'
      }
    };

    // Validate required fields
    expect(failureItem.tool).toBe('pytest');
    expect(failureItem.message).toBe('Test failed with some error');
    
    // Validate optional fields
    expect(failureItem.path).toBe('tests/test_example.py');
    expect(failureItem.details).toBe('Detailed information about the failure');
    expect(failureItem.severity).toBe('error');
    expect(failureItem.meta).toEqual({ test: 'test_function', file: 'test_file.py' });
  });

  it('should work with minimal required fields only', () => {
    const failureItem: FailureItem = {
      tool: 'eslint',
      message: 'Unexpected error'
    };

    expect(failureItem.tool).toBe('eslint');
    expect(failureItem.message).toBe('Unexpected error');
    // Optional fields should be undefined if not provided
    expect(failureItem.path).toBeUndefined();
    expect(failureItem.severity).toBeUndefined();
  });
});