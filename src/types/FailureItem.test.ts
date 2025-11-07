import { describe, it, expect } from 'vitest';
import { FailureItem, isValidFailureItem } from './FailureItem';

describe('FailureItem', () => {
  it('should match the schema definition', () => {
    const validFailureItem: FailureItem = {
      tool: 'pytest',
      path: 'tests/example.test.ts',
      message: 'Test failed due to assertion error',
      details: 'AssertionError: expected false to be true',
      severity: 'error',
      meta: {
        line: 15,
        column: 8
      }
    };

    expect(validFailureItem).toEqual({
      tool: 'pytest',
      path: 'tests/example.test.ts',
      message: 'Test failed due to assertion error',
      details: 'AssertionError: expected false to be true',
      severity: 'error',
      meta: {
        line: 15,
        column: 8
      }
    });
  });

  it('should validate a correct FailureItem', () => {
    const item = {
      tool: 'mypy',
      message: 'Incompatible types in assignment',
      severity: 'error'
    };

    expect(isValidFailureItem(item)).toBe(true);
  });

  it('should reject an invalid FailureItem without required fields', () => {
    const invalidItem1 = {
      tool: 'eslint'
      // missing required 'message' field
    };

    const invalidItem2 = {
      message: 'Some error'
      // missing required 'tool' field
    };

    expect(isValidFailureItem(invalidItem1)).toBe(false);
    expect(isValidFailureItem(invalidItem2)).toBe(false);
  });

  it('should accept FailureItem with optional fields', () => {
    const item = {
      tool: 'tsc',
      message: 'Type error',
      path: 'src/index.ts',
      details: 'Type number is not assignable to type string',
      severity: 'error',
      meta: {
        startLine: 10,
        endLine: 10,
        startColumn: 5,
        endColumn: 15
      }
    };

    expect(isValidFailureItem(item)).toBe(true);
  });

  it('should reject FailureItem with invalid severity', () => {
    const item = {
      tool: 'jest',
      message: 'Test timeout',
      severity: 'critical' // invalid severity value
    };

    expect(isValidFailureItem(item)).toBe(false);
  });

  it('should accept FailureItem without optional fields', () => {
    const item = {
      tool: 'ruff',
      message: 'Import not found'
    };

    expect(isValidFailureItem(item)).toBe(true);
  });
});