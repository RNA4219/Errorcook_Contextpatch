// triagePrompt.ts - Function to build triage prompt from failure items

interface FailureItem {
  tool: string;
  path?: string;
  message: string;
  details?: string;
  severity?: "error" | "warning";
  meta?: Record<string, any>;
}

export function buildTriagePrompt(failureItems: FailureItem[]): string {
  // Build a comprehensive prompt based on the failure items
  const promptSections = [
    "Analyze the following CI failures and provide a structured response:",
    "",
    ...failureItems.map((item, index) => {
      let section = `Failure ${index + 1}:`;
      section += `\n- Tool: ${item.tool}`;
      if (item.path) section += `\n- Path: ${item.path}`;
      section += `\n- Message: ${item.message}`;
      if (item.details) section += `\n- Details: ${item.details.substring(0, 200)}...`;
      if (item.severity) section += `\n- Severity: ${item.severity}`;
      section += "\n";
      return section;
    }),
    "",
    "Please provide your analysis in the following format:",
    "{",
    "  \"hypothesis\": \"Brief explanation of what might be causing the failures\",",
    "  \"suspects\": [",
    "    {",
    "      \"file\": \"path/to/suspected/file\",",
    "      \"line\": 123,",
    "      \"reason\": \"Why this file/line is suspected\"",
    "    }",
    "  ],",
    "  \"patch\": {",
    "    \"unified_diff\": \"A unified diff of the proposed changes in standard patch format\"",
    "  },",
    "  \"tests\": [",
    "    {",
    "      \"path\": \"path/to/test/file\",",
    "      \"content\": \"Content of a test case that would validate the fix\",",
    "      \"purpose\": \"Description of what the test checks\"",
    "    }",
    "  ]",
    "}"
  ];

  return promptSections.join("\n");
}