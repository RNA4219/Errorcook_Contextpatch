import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { detectRulesInRepo, summarizeTriaging } from '../src/static_triage';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Static Triaging', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = path.join(os.tmpdir(), 'static-triage-test-' + Date.now());
    await fs.mkdir(tmpDir, { recursive: true });

    // Create reference files with headings
    await fs.writeFile(path.join(tmpDir, 'IMPLEMENTATION_REFERENCE_FILES.md'), '# RuleA\n## RuleB\n');
    const docsDir = path.join(tmpDir, 'docs');
    await fs.mkdir(docsDir, { recursive: true });
    await fs.writeFile(path.join(docsDir, 'downsized_cookbook_summary.md'), '### RuleC\n');
  });

  afterAll(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('should detect rules from reference files', async () => {
    const res = await detectRulesInRepo(tmpDir);
    expect(res.references.length).toBe(2);
    expect(res.rules.length).toBe(3);
  });

  it('should summarize triaging results', async () => {
    const res = await detectRulesInRepo(tmpDir);
    const summary = summarizeTriaging(res);
    expect(summary).toContain('Static triage: 3 rules detected from 2 reference files.');
  });
});
