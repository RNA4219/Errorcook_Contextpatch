/** Minimal runtime validation without external deps */
export type Output = {
  hypothesis: string;
  suspects: {file: string; line?: number; reason?: string}[];
  patch: { unified_diff: string; hunk_count?: number };
  tests: { path: string; content: string; purpose?: string }[];
};

export function validateOutput(o: any): { ok: true } | { ok: false; reason: string } {
  if (!o || typeof o !== 'object') return { ok: false, reason: 'not an object' };
  if (typeof o.hypothesis !== 'string') return { ok: false, reason: 'hypothesis missing/string' };
  if (!Array.isArray(o.suspects)) return { ok: false, reason: 'suspects array required' };
  for (const s of o.suspects) {
    if (!s || typeof s.file !== 'string') return { ok: false, reason: 'suspect.file required' };
    if (s.line != null && typeof s.line !== 'number') return { ok: false, reason: 'suspect.line number' };
  }
  if (!o.patch || typeof o.patch.unified_diff !== 'string') return { ok: false, reason: 'patch.unified_diff string' };
  if (!Array.isArray(o.tests)) return { ok: false, reason: 'tests array required' };
  for (const t of o.tests) {
    if (!t || typeof t.path !== 'string' || typeof t.content !== 'string') {
      return { ok: false, reason: 'test.path and test.content required' };
    }
  }
  return { ok: true };
}
