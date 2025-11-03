import { describe, it, expect } from 'vitest';
import { parseFailureOutput, mapSeverity } from './failure_parser';

describe('Failure Item Parser', () => {
  describe('ESLint Parser', () => {
    it('should parse ESLint JSON output into FailureItem array', () => {
      const eslintOutput = [
        {
          line: 10,
          column: 5,
          message: 'Unexpected console statement',
          severity: 2,
          ruleId: 'no-console'
        }
      ];

      const result = parseFailureOutput('eslint', eslintOutput);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        tool: 'eslint',
        path: undefined,
        message: 'Unexpected console statement',
        details: undefined,
        severity: 'error',
        meta: {
          line: 10,
          column: 5,
          ruleId: 'no-console'
        }
      });
    });

    it('should handle ESLint warning messages', () => {
      const eslintOutput = [
        {
          line: 20,
          column: 15,
          message: 'Unused variable',
          severity: 1,
          ruleId: 'no-unused-vars'
        }
      ];

      const result = parseFailureOutput('eslint', eslintOutput);
      
      expect(result[0].severity).toBe('warning');
    });
  });

  describe('Pytest Parser', () => {
    it('should parse pytest output into FailureItem array', () => {
      const pytestOutput = [
        {
          message: 'AssertionError: expected 5 but got 3',
          type: 'assertion_error'
        }
      ];

      const result = parseFailureOutput('pytest', pytestOutput);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        tool: 'pytest',
        path: undefined,
        message: 'AssertionError: expected 5 but got 3',
        details: undefined,
        severity: 'error',
        meta: {
          type: 'assertion_error'
        }
      });
    });

    it('should handle multiple pytest failures', () => {
      const pytestOutput = [
        {
          message: 'AssertionError: expected True but got False',
          type: 'assertion_error'
        },
        {
          message: 'TypeError: unsupported operand',
          type: 'type_error'
        }
      ];

      const result = parseFailureOutput('pytest', pytestOutput);
      
      expect(result).toHaveLength(2);
      expect(result[0].message).toBe('AssertionError: expected True but got False');
      expect(result[1].message).toBe('TypeError: unsupported operand');
    });
  });

  describe('Clippy Parser', () => {
    it('should parse clippy output into FailureItem array', () => {
      const clippyOutput = [
        {
          line: 30,
          column: 15,
          message: 'variable does not need to be mutable',
          level: 'warning'
        }
      ];

      const result = parseFailureOutput('clippy', clippyOutput);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        tool: 'clippy',
        path: undefined,
        message: 'variable does not need to be mutable',
        details: undefined,
        severity: 'warning',
        meta: {
          line: 30,
          column: 15
        }
      });
    });

    it('should handle clippy error messages', () => {
      const clippyOutput = [
        {
          line: 45,
          column: 20,
          message: 'unused import',
          level: 'error'
        }
      ];

      const result = parseFailureOutput('clippy', clippyOutput);
      
      expect(result[0].severity).toBe('error');
    });
  });

  describe('Severity Mapping', () => {
    it('should map numeric severity levels correctly', () => {
      expect(mapSeverity(2)).toBe('error');
      expect(mapSeverity(1)).toBe('warning');
      expect(mapSeverity(0)).toBe('info');
    });

    it('should map string severity levels correctly', () => {
      expect(mapSeverity('error')).toBe('error');
      expect(mapSeverity('warning')).toBe('warning');
      expect(mapSeverity('info')).toBe('info');
    });

    it('should handle unknown severity levels', () => {
      expect(mapSeverity('unknown')).toBe('error');
      expect(mapSeverity(99)).toBe('error');
    });
  });

  describe('Unknown Tool Support', () => {
    it('should handle unknown tools with fallback', () => {
      const unknownOutput = [
        { message: 'Some error message' },
        { code: 'ERROR_001', desc: 'Another error' }
      ];

      const result = parseFailureOutput('unknown_tool', unknownOutput);
      
      expect(result).toHaveLength(2);
      expect(result[0].tool).toBe('unknown_tool');
      expect(result[0].message).toBe('Some error message');
      expect(result[1].tool).toBe('unknown_tool');
      expect(result[1].message).toBe('{"code":"ERROR_001","desc":"Another error"}');
    });
  });
});
