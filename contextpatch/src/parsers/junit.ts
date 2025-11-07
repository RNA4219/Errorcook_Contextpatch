import { FailureItem, ParseResult, failure } from './types.js';

/** Minimal JUnit XML parser (regex-based, not full XML). */
export function parseJUnit(xml: string): ParseResult {
  const failures: FailureItem[] = [];
  
  // Find all test cases that contain failure elements
  // The pattern looks for: <testcase ...> ... <failure> ... </failure> ... </testcase>
  const testCaseRegex = /<testcase\s+([^>]+)>([\s\S]*?<failure[^>]*>([\s\S]*?)<\/failure>[\s\S]*)<\/testcase>/g;
  let match;
  
  while ((match = testCaseRegex.exec(xml)) !== null) {
    // match[1]: attributes of the testcase element
    // match[2]: content of the testcase (including the failure)
    // match[3]: content inside the failure element
    
    // Extract classname and name attributes
    const classnameMatch = /classname=(["'])([^"']*)\1/.exec(match[1]);
    const nameMatch = /name=(["'])([^"']*)\1/.exec(match[1]);
    
    // Extract failure details
    const failureFullMatch = /<failure([^>]*)>([\s\S]*?)<\/failure>/.exec(match[2]);
    if (failureFullMatch) {
      const failureAttrs = failureFullMatch[1];
      const content = failureFullMatch[2].trim();
      
      // Check if failure tag has a message attribute  
      const messageAttrMatch = /message=(["'])([^"']*)\1/.exec(failureAttrs);
      const messageAttr = messageAttrMatch ? messageAttrMatch[2] : undefined;
      
      failures.push(failure('junit', {
        path: classnameMatch?.[2],
        file: classnameMatch?.[2], // For backward compatibility
        test: nameMatch?.[2],      // For wrapper function access
        message: content,
        testMessage: messageAttr,
        severity: 'error',
        meta: {
          test: nameMatch?.[2],
        }
      }));
    }
  }
  
  return { framework: 'junit', failures };
}