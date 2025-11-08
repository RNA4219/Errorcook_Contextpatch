import { auditMonorepo, RepoInfo } from '../src/monorepo_auditor';

describe('Monorepo Auditor', () => {
  test('auditMonorepo returns an array', () => {
    const res = auditMonorepo();
    expect(Array.isArray(res)).toBe(true);
  });
});
