import { FailureItem, ParseResult, failure } from './types.js';

/** Minimal JUnit XML parser (regex-based, not full XML). */
export function parseJUnit(xml: string): ParseResult {
  const failures: FailureItem[] = [];
  // naive split by <testcase ...> ... </testcase>
  const tcRegex = /<testcase\b[^>]*>([\s\S]*?)<\/testcase>/g;
  let m: RegExpExecArray | null;
  while ((m = tcRegex.exec(xml))) {
    const tc = m[0];
    const nameMatch = /name="([^"]+)"/.exec(tc) || /name='([^']+)'/.exec(tc);
    const classnameMatch = /classname="([^"]+)"/.exec(tc) || /classname='([^']+)'/.exec(tc);
    const failureWithMessageAttr = /<failure[^>]*message=["']([^"']*)["'][^>]*>([\s\S]*?)<\/failure>/.exec(tc);
    if (failureWithMessageAttr) {
      // failureWithMessageAttr[1] is the message attribute, [2] is the content
      const messageAttr = failureWithMessageAttr[1];
      const content = failureWithMessageAttr[2].trim();
      
      failures.push(failure('junit', {
        test: nameMatch?.[1],
        file: classnameMatch?.[1],
        message: content, // Keep content as the main message
        testMessage: messageAttr // Store message attribute separately
      }));
    } else {
      // If no message attribute, try matching without it
      const failureMatch = /<failure[^>]*>([\s\S]*?)<\/failure>/.exec(tc);
      if (failureMatch) {
        const content = failureMatch[1].trim();
        
        failures.push(failure('junit', {
          test: nameMatch?.[1],
          file: classnameMatch?.[1],
          message: content // Content as the main message
        }));
      }
    }
  }
  return { framework: 'junit', failures };
}