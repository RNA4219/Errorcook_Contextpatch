import { describe, it, expect } from 'vitest';
import { applyPatch } from '../src/patch_generator';

describe('Patch generation', () => {
  it('generates a minimal patch for a simple failure', () => {
    const failure = {
      tool: 'pytest',
      path: 'tests/example.test.ts',
      message: 'Test failed',
      severity: 'error'
    } as any;
    const patch = applyPatch(failure);
    expect(typeof patch).toBe('string');
    expect(patch.length).toBeGreaterThan(0);
  });
});