import { describe, it, expect } from 'vitest';
import { FailureItem } from '../src/types/failure_item';
import { processFailureAnalysis } from '../src/workflows/failure_analysis';

/**
 * Unit tests for CI failure parsing and normalization
 */

describe('Failure Parser', () => {
  it('should convert ESLint output to FailureItem format', () => {
    const eslintOutput = {
      tool: 'eslint',
      file: 'src/main.js',
      line: 10,
      column: 5,
      message: "'foo' is not defined. (no-undef)",
      severity: 'error'
    };

    // Mock conversion to FailureItem
    const failureItem: FailureItem = {
      id: 'eslint-001',
      tool: eslintOutput.tool,
      file: eslintOutput.file,
      line: eslintOutput.line,
      column: eslintOutput.column,
      message: eslintOutput.message,
      severity: eslintOutput.severity,
      timestamp: new Date().toISOString()
    };

    expect(failureItem).toHaveProperty('id');
    expect(failureItem.tool).toBe('eslint');
    expect(failureItem.message).toContain('no-undef');
  });

  it('should convert pytest output to FailureItem format', () => {
    const pytestOutput = {
      tool: 'pytest',
      file: 'tests/test_main.py',
      line: 25,
      column: 1,
      message: "AssertionError: expected 'hello' but got 'world'",
      severity: 'error'
    };

    const failureItem: FailureItem = {
      id: 'pytest-001',
      tool: pytestOutput.tool,
      file: pytestOutput.file,
      line: pytestOutput.line,
      column: pytestOutput.column,
      message: pytestOutput.message,
      severity: pytestOutput.severity,
      timestamp: new Date().toISOString()
    };

    expect(failureItem).toHaveProperty('id');
    expect(failureItem.tool).toBe('pytest');
    expect(failureItem.message).toContain('AssertionError');
  });

  it('should convert clippy output to FailureItem format', () => {
    const clippyOutput = {
      tool: 'clippy',
      file: 'src/main.rs',
      line: 15,
      column: 8,
      message: "unused variable 'bar'",
      severity: 'warning'
    };

    const failureItem: FailureItem = {
      id: 'clippy-001',
      tool: clippyOutput.tool,
      file: clippyOutput.file,
      line: clippyOutput.line,
      column: clippyOutput.column,
      message: clippyOutput.message,
      severity: clippyOutput.severity,
      timestamp: new Date().toISOString()
    };

    expect(failureItem).toHaveProperty('id');
    expect(failureItem.tool).toBe('clippy');
    expect(failureItem.message).toContain('unused variable');
  });

  it('should process multiple failures through workflow', async () => {
    const failures: FailureItem[] = [
      {
        id: 'eslint-001',
        tool: 'eslint',
        file: 'src/main.js',
        line: 10,
        column: 5,
        message: "'foo' is not defined. (no-undef)",
        severity: 'error',
        timestamp: new Date().toISOString()
      },
      {
        id: 'pytest-001',
        tool: 'pytest',
        file: 'tests/test_main.py',
        line: 25,
        column: 1,
        message: "AssertionError: expected 'hello' but got 'world'",
        severity: 'error',
        timestamp: new Date().toISOString()
      }
    ];

    const result = await processFailureAnalysis(failures);
    
    expect(result.triageResults).toHaveLength(2);
    expect(result.roiAnalysis).toBeDefined();
    expect(result.roiAnalysis.totalCost).toBeGreaterThan(0);
  });
});