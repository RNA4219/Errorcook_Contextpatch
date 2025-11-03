import { readFileSync } from 'node:fs';
import { parseTAP } from '../../src/parsers/tap';

test('parse TAP: extracts not ok as failures', () => {
  const text = readFileSync(__dirname + '/fixtures/tap_fail.tap', 'utf-8');
  const res = parseTAP(text);
  expect(res.failures.length).toBe(1);
  expect(res.failures[0].test).toMatch(/share\.spec\.ts/);
});
