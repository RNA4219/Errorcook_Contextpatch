import { describe, it, expect } from 'vitest';
import {
  parseTapOutput,
  parseJunitOutput,
  parsePytestOutput,
  parseGoOutput,
  parseCargoOutput,
  parseFailureOutput
} from '../../src/parsers/index';

describe('Failure Parsers', () => {
  describe('TAP Parser', () => {
    it('should parse TAP output correctly', () => {
      const tapOutput = `TAP version 13
1..2
ok 1 - Input file opened
not ok 2 - First line of the input valid
  ---
  message: "Expected line 1 to be 'foo', got 'bar'"
  severity: fail
  ...`;
      
      const result = parseTapOutput(tapOutput);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        tool: 'tap',
        path: 'tap-output',
        message: 'First line of the input valid',
        details: 'TAP test number: 2',
        severity: 'error',
        meta: {
          line: 4,
          test_number: 2
        }
      });
    });
  });

  describe('JUnit Parser', () => {
    it('should parse JUnit XML output correctly', async () => {
      const junitXml = `<testsuites>
  <testsuite name="suite1" tests="2" failures="1" errors="0">
    <testcase name="test1" classname="class1">
      <failure message="Failure message">Stack trace</failure>
    </testcase>
  </testsuite>
</testsuites>`;
      
      const result = await parseJunitOutput(junitXml);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        tool: 'junit',
        path: 'class1',
        message: 'Failure message',
        details: 'Stack trace',
        severity: 'error',
        meta: {
          test_name: 'test1',
          classname: 'class1'
        }
      });
    });
  });

  describe('Pytest Parser', () => {
    it('should parse Pytest output correctly', () => {
      const pytestOutput = `============================= test session starts ==============================
platform linux -- Python 3.x.x, pytest-x.x.x, py-x.x.x, pluggy-x.x.x
collected 2 items

test_example.py ..F                                                  [100%]
=========================== short test summary info ==========================
FAILED test_example.py::test_function - AssertionError: assert 1 == 2
============================== 1 failed, 2 passed in 0.10s ===================`;
      
      const result = parsePytestOutput(pytestOutput);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        tool: 'pytest',
        path: 'test_example.py',
        message: 'AssertionError: assert 1 == 2',
        details: 'Pytest failure for test: test_function',
        severity: 'error',
        meta: {
          test_name: 'test_function'
        }
      });
    });
  });

  describe('Go Parser', () => {
    it('should parse Go test output correctly', () => {
      const goOutput = `--- FAIL: TestFunction (0.00s)
    file_test.go:15: Error message
    file_test.go:16: Another error message
FAIL
exit status 1`;
      
      const result = parseGoOutput(goOutput);
      
      expect(result).toHaveLength(2); // 2つのエラーメッセージがあるため
      expect(result[0]).toEqual({
        tool: 'go',
        path: 'file_test.go',
        message: 'Error message',
        details: 'Go test failure in TestFunction',
        severity: 'error',
        meta: {
          test_name: 'TestFunction',
          line: 15
        }
      });
    });
  });

  describe('Cargo Parser', () => {
    it('should parse Cargo test output correctly', () => {
      const cargoOutput = `test test_function ... FAILED
failures:
---- test_function stdout ----
thread 'test_function' panicked at 'assertion failed: \`(left == right)\`
  left: \`1\`,
  right: \`2\`', src/lib.rs:4:5

failures:
    test_function`;
      
      const result = parseCargoOutput(cargoOutput);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        tool: 'cargo',
        path: 'src/lib.rs',
        message: 'assertion failed: `(left == right)`\\n  left: `1`,\\n  right: `2`',
        details: 'Rust panic at src/lib.rs:4:5',
        severity: 'error',
        meta: {
          test_name: 'test_function',
          line: 4,
          column: 5
        }
      });
    });
  });

  describe('Generic Parser', () => {
    it('should route to the correct parser based on tool name', async () => {
      const tapOutput = `TAP version 13
1..1
not ok 1 - Test failed`;
      
      const result = await parseFailureOutput('tap', tapOutput);
      
      expect(result).toHaveLength(1);
      expect(result[0].tool).toBe('tap');
    });

    it('should throw an error for unsupported tools', async () => {
      await expect(parseFailureOutput('unsupported', 'some output'))
        .rejects
        .toThrow('Unsupported tool: unsupported');
    });
  });
});