import { promises as fs } from 'fs';
import * as path from 'path';

export interface StaticTriageResult {
  references: string[];
  rules: string[];
  summary: string;
}

/**
 * Detects triage rules by scanning known reference files in the repo.
 * Returns a list of detected headings as potential rules and the reference file paths.
 */
export async function detectRulesInRepo(rootPath: string): Promise<StaticTriageResult> {
  const refFiles = [
    path.resolve(rootPath, 'IMPLEMENTATION_REFERENCE_FILES.md'),
    path.resolve(rootPath, 'docs/downsized_cookbook_summary.md')
  ];

  const contents: string[] = [];
  for (const p of refFiles) {
    try {
      const s = await fs.readFile(p, { encoding: 'utf8' });
      contents.push(s);
    } catch {
      // ignore missing files
    }
  }

  const extractHeadings = (text: string): string[] => {
    return text
      .split(/\r?\n/)
      .filter((line) => /^#+\s/.test(line))
      .map((line) => line.replace(/^#+\s*/, '').trim())
      .filter((t) => t.length > 0);
  };

  const headings = contents.flatMap(extractHeadings);
  const uniqueHeadings = Array.from(new Set(headings)).slice(0, 100);

  return {
    references: refFiles.filter((f) => {
      try {
        // @ts-ignore
        return require('fs').existsSync(f) && require('fs').statSync(f).isFile();
      } catch {
        return false;
      }
    }),
    // Use headings as a lightweight proxy for rules candidate
    rules: uniqueHeadings,
    summary: `Detected ${uniqueHeadings.length} rule headings from reference files.`,
  };
}

export function summarizeTriaging(result: StaticTriageResult): string {
  const r = result.rules?.length ?? 0;
  const refCount = result.references?.length ?? 0;
  return `Static triage: ${r} rules detected from ${refCount} reference files.`;
}
