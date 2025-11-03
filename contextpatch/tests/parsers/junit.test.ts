import { readFileSync } from 'node:fs';
import { parseJUnit } from '../../src/parsers/junit';

test('parse JUnit: finds <failure> under testcase', () => {
  const xml = readFileSync(__dirname + '/fixtures/junit_fail.xml', 'utf-8');
  const res = parseJUnit(xml);
  expect(res.failures.length).toBe(1);
  expect(res.failures[0].file).toBe('tests.e2e.share');
  expect(res.failures[0].test).toBe('share flow');
});
