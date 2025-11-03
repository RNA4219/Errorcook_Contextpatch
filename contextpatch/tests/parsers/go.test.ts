import { readFileSync } from 'node:fs';
import { parseGoTest } from '../../src/parsers/go';

test('parse go test: FAIL block', () => {
  const text = readFileSync(__dirname + '/fixtures/go_fail.txt', 'utf-8');
  const res = parseGoTest(text);
  expect(res.failures.length).toBe(1);
  expect(res.failures[0].test).toBe('TestDoThing');
  expect(res.failures[0].file).toBe('thing_test.go');
  expect(res.failures[0].line).toBe(42);
});
