import { describe, it, expect, beforeEach } from 'vitest';
import { TapParser, PytestParser, JUnitParser, GoParser, CargoParser, getDefaultParserRegistry, ParserRegistry } from './index';
import { FailureItem } from '../types/FailureItem';

describe('Failure Parsers', () => {
  describe('TapParser', () => {
    it('should correctly parse TAP format', () => {
      const parser = new TapParser();
      const tapOutput = `TAP version 13
1..2
ok 1 - Input file opened
not ok 2 - First line of the input valid
  ---
  message: "Expected line 1 to be 'foo', got 'bar'"
  severity: fail
  ...
`;
      
      const failures = parser.parse(tapOutput);
      
      expect(failures).toHaveLength(1);
      expect(failures[0]).toEqual({
        tool: 'tap',
        path: 'tap-output',
        message: "First line of the input valid",
        details: "TAP test number: 2",
        severity: 'error',
        meta: {
          line: 4,
          test_number: 2
        }
      });
    });

    it('should detect TAP format correctly', () => {
      const parser = new TapParser();
      expect(parser.canParse('TAP version 13\n1..2\nnot ok 1 - test')).toBe(true);
      expect(parser.canParse('ok 1 - test')).toBe(false);
    });
  });

  describe('PytestParser', () => {
    it('should correctly parse pytest format', () => {
      const parser = new PytestParser();
      const pytestOutput = `============================= test session starts ==============================
platform linux -- Python 3.9.0, pytest-6.2.2, py-1.10.0, pluggy-0.13.1
collected 2 items

test_example.py ..F                                                  [100%]
=========================== short test summary info ==========================
FAILED test_example.py::test_function - AssertionError: assert 1 == 2
============================= 1 failed, 2 passed in 0.10s ===================`;
      
      const failures = parser.parse(pytestOutput);
      
      expect(failures).toHaveLength(1);
      expect(failures[0]).toEqual({
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

    it('should detect pytest format correctly', () => {
      const parser = new PytestParser();
      expect(parser.canParse('FAILED test.py::func - Error\nshort test summary info')).toBe(true);
      expect(parser.canParse('TAP version 13')).toBe(false);
    });
  });

  describe('JUnitParser', () => {
    it('should correctly parse JUnit XML format', async () => {
      const parser = new JUnitParser();
      const junitXml = `<testsuites>
  <testsuite name="suite1" tests="2" failures="1" errors="0">
    <testcase name="test1" classname="class1">
      <failure message="Failure message">Stack trace</failure>
    </testcase>
  </testsuite>
</testsuites>`;
      
      const failures = await parser.parse(junitXml);
      
      expect(failures).toHaveLength(1);
      expect(failures[0]).toEqual({
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

    it('should detect JUnit format correctly', () => {
      const parser = new JUnitParser();
      expect(parser.canParse('<testsuite><failure>test</failure></testsuite>')).toBe(true);
      expect(parser.canParse('TAP version 13')).toBe(false);
    });
  });

  describe('GoParser', () => {
    it('should correctly parse Go test format', () => {
      const parser = new GoParser();
      const goOutput = `--- FAIL: TestFunction (0.00s)
    file_test.go:15: Error message
    file_test.go:16: Another error message
FAIL
exit status 1`;
      
      const failures = parser.parse(goOutput);
      
      expect(failures).toHaveLength(2);
      expect(failures[0]).toEqual({
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

    it('should detect Go test format correctly', () => {
      const parser = new GoParser();
      expect(parser.canParse('--- FAIL: TestFunction (0.00s)\nfile.go:10: Error')).toBe(true);
      expect(parser.canParse('TAP version 13')).toBe(false);
    });
  });

  describe('CargoParser', () => {
    it('should correctly parse Cargo test format', () => {
      const parser = new CargoParser();
      const cargoOutput = `test test_function ... FAILED

failures:

---- test_function stdout ----
thread 'test_function' panicked at 'assertion failed: \`(left == right)\`\\n  left: \`1\\`,\\n right: \`2\`', src/lib.rs:4:5


failures:
    test_function

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s`;
      
      const failures = parser.parse(cargoOutput);
      
      expect(failures).toHaveLength(1);
      expect(failures[0]).toEqual({
        tool: 'cargo',
        path: 'src/lib.rs',
        message: 'assertion failed: `(left == right)`\n  left: `1`,\n right: `2`',
        details: 'Rust panic at src/lib.rs:4:5',
        severity: 'error',
        meta: {
          test_name: 'test_function',
          line: 4,
          column: 5
        }
      });
    });

    it('should detect Cargo test format correctly', () => {
      const parser = new CargoParser();
      expect(parser.canParse('test func ... FAILED\nthread \'\' panicked at \'\'')).toBe(true);
      expect(parser.canParse('TAP version 13')).toBe(false);
    });
  });

  describe('ParserRegistry', () => {
    it('should register and retrieve parsers correctly', () => {
      const registry = new ParserRegistry();
      const parser = new TapParser();
      
      registry.register(parser);
      const retrieved = registry.getParser('tap');
      
      expect(retrieved).toBe(parser);
    });

    it('should detect appropriate parser automatically', () => {
      const registry = getDefaultParserRegistry();
      
      const tapInput = 'TAP version 13\nnot ok 1 - test';
      const pytestInput = 'FAILED test.py::func - Error\nshort test summary info';
      
      const tapParser = registry.detectParser(tapInput);
      const pytestParser = registry.detectParser(pytestInput);
      
      expect(tapParser?.getToolName()).toBe('tap');
      expect(pytestParser?.getToolName()).toBe('pytest');
    });
  });
});