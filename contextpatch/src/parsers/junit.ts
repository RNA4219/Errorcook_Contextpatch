import { FailureItem, ParseResult, failure } from './types.js';

/** Minimal JUnit XML parser (regex-based, not full XML). */
export function parseJUnit(xml: string): ParseResult {
  const failures: FailureItem[] = [];
  
  // Match only testcases that contain at least one failure element
  // Using positive lookahead to ensure failure tag exists within the testcase
  const tcRegex = /<testcase\s+([^>]+?)>(?=[\s\S]*?<failure[\s\S]*?<\/failure>)([\s\S]*?)<\/testcase>/g;
  let tcMatch: RegExpExecArray | null;
  
  while ((tcMatch = tcRegex.exec(xml)) !== null) {
    const attributes = tcMatch[1];
    const content = tcMatch[2];
    
    // Extract classname and name attributes
    const classNameMatch = /classname=(["'])([^"']*)\1/.exec(attributes);
    const nameMatch = /name=(["'])([^"']*)\1/.exec(attributes);
    
    // Find all failure elements in this testcase
    const failureRegex = /<failure([^>]*)>([\s\S]*?)<\/failure>/g;
    let failureMatch: RegExpExecArray | null;
    
    while ((failureMatch = failureRegex.exec(content)) !== null) {
      const failureAttributes = failureMatch[1];
      const failureContent = failureMatch[2].trim();
      
      // Extract message attribute from failure tag if it exists
      const messageAttrMatch = /message=(["'])([^"']*)\1/.exec(failureAttributes);
      const failureMessage = messageAttrMatch ? messageAttrMatch[2] : failureContent;
      const failureDetails = messageAttrMatch ? failureContent : '';
      
      if (classNameMatch && nameMatch) {
        const className = classNameMatch[2];
        const testName = nameMatch[2];
        
        failures.push(failure('junit', {
          path: className,
          file: className,  // For backward compatibility with tests
          test: testName,   // For backward compatibility with tests
          message: failureMessage,
          details: failureDetails, // Content as details when message attr exists
          severity: 'error',
          meta: {
            test_name: testName,
            classname: className,
            testMessage: failureMessage
          }
        }));
      }
    }
  }
  
  return { framework: 'junit', failures };
}