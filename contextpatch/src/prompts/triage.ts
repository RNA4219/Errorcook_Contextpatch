import { FailureItem } from '../parsers/types';
interface FailureItem {
  tool: string;
  path?: string;
  message: string;
  details?: string;
  severity?: "error" | "warning";
  meta?: Record<string, any>;
}

export function buildTriagePrompt(failureItems: FailureItem[]): string {
  // Build a prompt for the LLM to analyze failures and provide a hypothesis
  const failuresText = failureItems.map(item => 
    `Tool: ${item.tool}
Path: ${item.path || 'N/A'}
Message: ${item.message}
Details: ${item.details || 'N/A'}
Severity: ${item.severity || 'N/A'}

Meta: ${JSON.stringify(item.meta || {}, null, 2)}
`
  ).join('\n---\n');

  return `Analyze the following CI failures and provide your findings in JSON format:

${failuresText}

Return only the JSON response in the following format:
{
  "hypothesis": "Brief explanation of what you think is causing the failures",
  "suspects": [
    {
      "file": "path/to/suspected/file",
      "line": 123,
      "reason": "Why this file might be causing the issue"
    }
  ],
  "patch": {
    "unified_diff": "...",
    "files_changed": 1,
    "lines_added": 0,
    "lines_removed": 0
  },
  "tests": [
    {
      "path": "path/to/test/file",
      "content": "Test content",
      "purpose": "What this test is checking"
    }
  ]
}`;
}