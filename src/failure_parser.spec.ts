import { describe, it, expect } from 'vitest';
import { parseESLintOutput, parsePytestOutput, parseClippyOutput } from './failure_parser';

describe('Failure Item Parser', () => {
  describe('ESLint Parser', () => {
    it('should parse ESLint JSON output into FailureItem array', () => {
      const eslintOutput = [
        {
          filePath: '/path/to/file.js',
          messages: [
            {
              line: 10,
              column: 5,
              message: 'Unexpected console statement',
              severity: 2,
              ruleId: 'no-console'
            },
            {
              line: 15,
              column: 10,
              message: 'Missing semicolon',
              severity: 2,
              ruleId: 'semi'
            }
          ]
        }
      ];

      const result = parseESLintOutput(eslintOutput);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: expect.any(String),
        tool: 'eslint',
        file: '/path/to/file.js',
        line: 10,
        column: 5,
        message: 'Unexpected console statement',
        severity: 'error'
      });
      expect(result[1]).toEqual({
        id: expect.any(String),
        tool: 'eslint',
        file: '/path/to/file.js',
        line: 15,
        column: 10,
        message: 'Missing semicolon',
        severity: 'error'
      });
    });

    it('should handle ESLint warning messages', () => {
      const eslintOutput = [
        {
          filePath: '/path/to/file.ts',
          messages: [
            {
              line: 20,
              column: 15,
              message: 'Unused variable',
              severity: 1,
              ruleId: 'no-unused-vars'
            }
          ]
        }
      ];

      const result = parseESLintOutput(eslintOutput);
      
      expect(result[0].severity).toBe('warning');
    });
  });

  describe('Pytest Parser', () => {
    it('should parse pytest output into FailureItem array', () => {
      const pytestOutput = [
        {
          file: '/path/to/test_file.py',
          line: 42,
          message: 'AssertionError: expected 5 but got 3',
          type: 'assertion_error'
        }
      ];

      const result = parsePytestOutput(pytestOutput);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: expect.any(String),
        tool: 'pytest',
        file: '/path/to/test_file.py',
        line: 42,
        column: 0,
        message: 'AssertionError: expected 5 but got 3',
        severity: 'error'
      });
    });

    it('should handle multiple pytest failures', () => {
      const pytestOutput = [
        {
          file: '/path/to/test1.py',
          line: 10,
          message: 'AssertionError: expected True but got False',
          type: 'assertion_error'
        },
        {
          file: '/path/to/test2.py',
          line: 25,
          message: 'TypeError: unsupported operand',
          type: 'type_error'
        }
      ];

      const result = parsePytestOutput(pytestOutput);
      
      expect(result).toHaveLength(2);
      expect(result[0].file).toBe('/path/to/test1.py');
      expect(result[1].file).toBe('/path/to/test2.py');
    });
  });

  describe('Clippy Parser', () => {
    it('should parse clippy output into FailureItem array', () => {
      const clippyOutput = [
        {
          file: '/path/to/main.rs',
          line: 30,
          column: 15,
          message: 'variable does not need to be mutable',
          severity: 'warning'
        }
      ];

      const result = parseClippyOutput(clippyOutput);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: expect.any(String),
        tool: 'clippy',
        file: '/path/to/main.rs',
        line: 30,
        column: 15,
        message: 'variable does not need to be mutable',
        severity: 'warning'
      });
    });

    it('should handle clippy error messages', () => {
      const clippyOutput = [
        {
          file: '/path/to/error.rs',
          line: 45,
          column: 20,
          message: 'unused import',
          severity: 'error'
        }
      ];

      const result = parseClippyOutput(clippyOutput);
      
      expect(result[0].severity).toBe('error');
    });
  });
});