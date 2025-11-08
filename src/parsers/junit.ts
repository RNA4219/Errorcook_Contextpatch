import { FailureItem } from '../types/FailureItem';
import { FailureParser } from './interfaces';
import { parseString } from 'xml2js';

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
      parseString(junitXml, { explicitArray: false, ignoreAttrs: false }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    // testsuites > testsuite > testcase を探索
    const testsuites = parsed?.testsuites ?? { testsuite: [] };
    const suites = Array.isArray(testsuites.testsuite) ? testsuites.testsuite : [testsuites.testsuite];

    for (const suite of suites) {
      if (!suite?.testcase) continue;
      const testcases = Array.isArray(suite.testcase) ? suite.testcase : [suite.testcase];

      for (const testcase of testcases) {
        const tcName = testcase?.$?.name;
        const tcClass = testcase?.$?.classname;

        if (testcase?.failure) {
          const failure = testcase.failure;
          const message = (failure?.$?.message) || (typeof failure === 'string' ? failure : failure?._ || 'JUnit test failure');
          const details = (failure?._) ?? message;

          failures.push({
            tool: 'junit',
            path: tcClass ?? 'unknown',
            message: message,
            details: details,
            severity: 'error',
            meta: {
              test_name: tcName,
              classname: tcClass
            }
          });
        }

        if (testcase?.error) {
          const error = testcase.error;
          const message = (error?.$?.message) || (typeof error === 'string' ? error : error?._ || 'JUnit test error');
          const details = (error?._) ?? message;

          failures.push({
            tool: 'junit',
            path: tcClass ?? 'unknown',
            message: message,
            details: details,
            severity: 'error',
            meta: {
              test_name: tcName,
              classname: tcClass
            }
          });
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
    return input.includes('<testsuite') && (input.includes('<failure') || input.includes('<error'));
  }
}

// 従来の関数も引き続きエクスポート（後方互換性のため）
export async function parseJunitOutput(junitXml: string): Promise<FailureItem[]> {
  const parser = new JUnitParser();
  return parser.parse(junitXml);
}
