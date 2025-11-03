import { readFileSync } from 'node:fs';
import { parsePytest } from '../../src/parsers/pytest';

test('parse pytest: FAILED lines', () => {
  const text = readFileSync(__dirname + '/fixtures/pytest_fail.txt', 'utf-8');
  const res = parsePytest(text);
  expect(res.failures.length).toBeGreaterThanOrEqual(1);
  expect(res.failures[0].file).toBe('tests/test_calc.py');
});
