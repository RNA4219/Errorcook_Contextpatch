import { describe, it, expect } from 'vitest';
import { parsePytest } from './pytest.js';
import { FailureItem } from './types.js';

describe('pytest parser', () => {
  it('should parse basic pytest failure', () => {
    const input = 'FAILED tests/test_example.py::test_addition - assertion failed';
    const result = parsePytest(input);

    expect(result.framework).toBe('pytest');
    expect(result.failures.length).toBe(1);
    
    const failure: FailureItem = result.failures[0];
    expect(failure.tool).toBe('pytest');
    expect(failure.path).toBe('tests/test_example.py');
    expect(failure.message).toBe('Test test_addition failed: assertion failed');
    expect(failure.severity).toBe('error');
    expect(failure.meta).toEqual({
      test: 'test_addition',
      file: 'tests/test_example.py'
    });
  });

  it('should parse pytest failure without message', () => {
    const input = 'FAILED tests/test_example.py::test_subtraction';
    const result = parsePytest(input);

    expect(result.failures.length).toBe(1);
    
    const failure: FailureItem = result.failures[0];
    expect(failure.tool).toBe('pytest');
    expect(failure.path).toBe('tests/test_example.py');
    expect(failure.message).toBe('Test test_subtraction failed: failed');
  });

  it('should handle multiple failures', () => {
    const input = `FAILED tests/test_example.py::test_addition - assertion failed
FAILED tests/test_other.py::test_division - division by zero`;
    const result = parsePytest(input);

    expect(result.failures.length).toBe(2);
    
    expect(result.failures[0].path).toBe('tests/test_example.py');
    expect(result.failures[0].meta?.test).toBe('test_addition');
    
    expect(result.failures[1].path).toBe('tests/test_other.py');
    expect(result.failures[1].meta?.test).toBe('test_division');
  });

  it('should return empty array for no failures', () => {
    const input = 'PASSED tests/test_example.py::test_addition';
    const result = parsePytest(input);

    expect(result.failures.length).toBe(0);
  });
});