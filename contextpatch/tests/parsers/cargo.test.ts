import { readFileSync } from 'node:fs';
import { parseCargo } from '../../src/parsers/cargo';

test('parse cargo test: panic locations', () => {
  const text = readFileSync(__dirname + '/fixtures/cargo_fail.txt', 'utf-8');
  const res = parseCargo(text);
  expect(res.failures.length).toBe(1);
  expect(res.failures[0].message).toBe('boom');
  expect(res.failures[0].file).toBe('src/lib.rs');
  expect(res.failures[0].line).toBe(12);
});
