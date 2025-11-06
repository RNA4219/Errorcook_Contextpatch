import { Failure, ParseResult, failure } from './types.js';

/** Minimal JUnit XML parser (regex-based, not full XML). */
export function parseJUnit(xml: string): ParseResult {
  const failures: Failure[] = [];
  // naive split by <testcase ...> ... </testcase>
  const tcRegex = /<testcase\b[^>]*>([\s\S]*?)<\/testcase>/g;
  let m: RegExpExecArray | null;
  while ((m = tcRegex.exec(xml))) {
    const tc = m[0];
    const nameMatch = /name="([^"]+)"/.exec(tc) || /name='([^']+)'/.exec(tc);
    const classnameMatch = /classname="([^"]+)"/.exec(tc) || /classname='([^']+)'/.exec(tc);
    const failureMatch = /<failure[^>]*>([\s\S]*?)<\/failure>/.exec(tc);
    if (failureMatch) {
      failures.push(failure('junit', {
        test: nameMatch?.[1],
        file: classnameMatch?.[1],
        message: failureMatch[1].trim()
      }));
    }
  }
  return { framework: 'junit', failures };
}
