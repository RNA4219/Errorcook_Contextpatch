import { describe, it, expect } from 'vitest';
import { parseCargo } from './cargo.js';
import { FailureItem } from './types.js';

describe('cargo parser', () => {
  it('should parse cargo test panic with location', () => {
    const input = `test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

running 1 test
test tests::test_addition ... FAILED

thread 'tests::test_addition' panicked at 'assertion failed: `(left == right)`
  left: 5,
 right: 6', src/lib.rs:4:5
note: run with \`RUST_BACKTRACE=1\` command line flag to obtain a backtrace
test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s`;
    
    const result = parseCargo(input);

    expect(result.framework).toBe('cargo');
    expect(result.failures.length).toBe(1);
    
    const failure: FailureItem = result.failures[0];
    expect(failure.tool).toBe('cargo');
    expect(failure.path).toBe('src/lib.rs');
    expect(failure.message).toBe('assertion failed: `(left == right)`\n  left: 5,\n right: 6');
    expect(failure.severity).toBe('error');
    expect(failure.meta).toEqual({
      test: 'tests::test_addition',
      file: 'src/lib.rs',
      line: 4,
      col: 5
    });
  });

  it('should handle multiple cargo failures', () => {
    const input = `thread 'test1' panicked at 'first failure', src/file1.rs:10:5
thread 'test2' panicked at 'second failure', src/file2.rs:20:10`;
    
    const result = parseCargo(input);

    expect(result.failures.length).toBe(2);
    
    expect(result.failures[0].path).toBe('src/file1.rs');
    expect(result.failures[0].meta?.test).toBe('test1');
    expect(result.failures[0].meta?.line).toBe(10);
    
    expect(result.failures[1].path).toBe('src/file2.rs');
    expect(result.failures[1].meta?.test).toBe('test2');
    expect(result.failures[1].meta?.line).toBe(20);
  });

  it('should return empty array for no failures', () => {
    const input = 'test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s';
    const result = parseCargo(input);

    expect(result.failures.length).toBe(0);
  });
});