/** Validation based on schema from SCHEMAS/output.schema.json */
export interface OutputSchema {
  hypothesis: string;
  suspects: Array<{
    file: string;
    line?: number;
    reason?: string;
  }>;
  patch: {
    unified_diff: string;
    files_changed?: number;
    lines_added?: number;
    lines_removed?: number;
  };
  tests: Array<{
    path: string;
    content: string;
    purpose?: string;
  }>;
}

export function validateOutput(o: any): { ok: true } | { ok: false; reason: string } {
  if (!o || typeof o !== 'object') return { ok: false, reason: 'not an object' };
  
  // Validate hypothesis
  if (typeof o.hypothesis !== 'string' || o.hypothesis.length < 20) {
    return { ok: false, reason: 'hypothesis must be a string of at least 20 characters' };
  }
  
  // Validate suspects
  if (!Array.isArray(o.suspects)) return { ok: false, reason: 'suspects must be an array' };
  for (const s of o.suspects) {
    if (!s || typeof s.file !== 'string') return { ok: false, reason: 'suspect.file must be a string' };
    if (s.line != null && typeof s.line !== 'number') return { ok: false, reason: 'suspect.line must be a number' };
    if (s.reason != null && typeof s.reason !== 'string') return { ok: false, reason: 'suspect.reason must be a string' };
  }
  
  // Validate patch
  if (!o.patch || typeof o.patch.unified_diff !== 'string' || o.patch.unified_diff.length < 10) {
    return { ok: false, reason: 'patch.unified_diff must be a string of at least 10 characters' };
  }
  
  // Validate tests
  if (!Array.isArray(o.tests) || o.tests.length < 1) {
    return { ok: false, reason: 'tests must be an array with at least 1 element' };
  }
  for (const t of o.tests) {
    if (!t || typeof t.path !== 'string' || typeof t.content !== 'string') {
      return { ok: false, reason: 'test.path and test.content are required strings' };
    }
    if (t.content.length < 10) {
      return { ok: false, reason: 'test.content must be at least 10 characters' };
    }
    if (t.purpose != null && typeof t.purpose !== 'string') {
      return { ok: false, reason: 'test.purpose must be a string if provided' };
    }
  }
  
  return { ok: true };
}
