import { FailureItem } from '../types/FailureItem';
import { FailureParser } from './interfaces';
import { parse as parseXml } from 'xml2js';

/**
 * JUnit XML用パーサー
 * JUnit XML format example:
 * <testsuite name="suite1" tests="2" failures="1" errors="0">
 *   <testcase name="test1" classname="class1">
 *     <failure message="Failure message">Stack trace</failure>
 *   </testcase>
 * </testsuite>
 */
export class JUnitParser implements FailureParser {
  async parse(junitXml: string): Promise<FailureItem[]> {
    const failures: FailureItem[] = [];
    
    // XMLを解析
    const parsed = await new Promise<any>((resolve, reject) => {
      parseXml(junitXml, { explicitArray: false, ignoreAttrs: false }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    // testsuites > testsuite > testcase を探索
    const testsuites = parsed.testsuites || { testsuite: [] };
    const suites = Array.isArray(testsuites.testsuite) ? testsuites.testsuite : [testsuites.testsuite];

    for (const suite of suites) {
      if (suite.testcase) {
        const testcases = Array.isArray(suite.testcase) ? suite.testcase : [suite.testcase];
        
        for (const testcase of testcases) {
          // failureまたはerror要素をチェック
          if (testcase.failure) {
            const failure = testcase.failure;
            const message = typeof failure === 'string' ? failure : failure._ || failure.message || 'JUnit test failure';
            
            failures.push({
              tool: 'junit',
              path: testcase._attributes?.classname || 'unknown',
              message: failure._attributes?.message || 'JUnit test failure',
              details: message,
              severity: 'error',
              meta: {
                test_name: testcase._attributes?.name,
                classname: testcase._attributes?.classname,
              }
            });
          }
          
          if (testcase.error) {
            const error = testcase.error;
            const message = typeof error === 'string' ? error : error._ || error.message || 'JUnit test error';
            
            failures.push({
              tool: 'junit',
              path: testcase._attributes?.classname || 'unknown',
              message: error._attributes?.message || 'JUnit test error',
              details: message,
              severity: 'error',
              meta: {
                test_name: testcase._attributes?.name,
                classname: testcase._attributes?.classname,
              }
            });
          }
        }
      }
    }

    return failures;
  }

  getToolName(): string {
    return 'junit';
  }

  canParse(input: string): boolean {
    // JUnit XML形式かどうかを検出
    return input.includes('<testsuite') && 
           (input.includes('<failure') || input.includes('<error'));
  }
}

// 従来の関数も引き続きエクスポート（後方互換性のため）
export async function parseJunitOutput(junitXml: string): Promise<FailureItem[]> {
  const parser = new JUnitParser();
  return parser.parse(junitXml);
}