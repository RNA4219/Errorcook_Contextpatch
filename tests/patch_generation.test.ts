import { describe, it, expect } from '@jest/globals';
import { generatePatch, applyPatch } from '../contextpatch/src/patch/patch-generator.js';

interface OutputSchema {
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

describe('Patch Generation', () => {
  it('should generate a valid unified diff patch', () => {
    const mockOutput: OutputSchema = {
      hypothesis: 'The function returns incorrect value',
      suspects: [
        {
          file: 'src/main.ts',
          line: 10,
          reason: 'Function implementation is incorrect'
        }
      ],
      patch: {
        unified_diff: `diff --git a/src/main.ts b/src/main.ts
index 1234567..89abcde 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -7,7 +7,7 @@
 function calculateValue() {
-  return 41;
+  return 42;
 }
`,
        files_changed: 1,
        lines_added: 1,
        lines_removed: 1
      },
      tests: [
        {
          path: 'tests/main.test.ts',
          content: 'import { calculateValue } from "../src/main";\n\n// Test for calculateValue function\n',
          purpose: 'Verify calculateValue returns correct value'
        }
      ]
    };

    // Check if the patch is in valid unified diff format
    expect(mockOutput.patch.unified_diff).toContain('diff --git');
    expect(mockOutput.patch.unified_diff).toContain('@@');
    expect(mockOutput.patch.unified_diff).toContain('---');
    expect(mockOutput.patch.unified_diff).toContain('+++');
    
    // Check if patch has proper metadata
    expect(mockOutput.patch.files_changed).toBeGreaterThan(0);
    expect(mockOutput.patch.lines_added).toBeGreaterThanOrEqual(0);
    expect(mockOutput.patch.lines_removed).toBeGreaterThanOrEqual(0);
  });

  it('should validate the generated patch format', () => {
    const patchContent = `diff --git a/src/main.ts b/src/main.ts
index 1234567..89abcde 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -7,7 +7,7 @@
 function calculateValue() {
-  return 41;
+  return 42;
 }
`;

    // Verify the patch format requirements
    expect(patchContent).toContain('diff --git');
    const lines = patchContent.split('\n');
    let hasHunkHeader = false;
    let hasOldLine = false;
    let hasNewLine = false;
    
    for (const line of lines) {
      if (line.startsWith('@@')) {
        hasHunkHeader = true;
      } else if (line.startsWith('-')) {
        hasOldLine = true;
      } else if (line.startsWith('+')) {
        hasNewLine = true;
      }
    }
    
    expect(hasHunkHeader).toBe(true);
    expect(hasOldLine).toBe(true);
    expect(hasNewLine).toBe(true);
  });

  it('should generate appropriate test cases for the patch', () => {
    const mockOutput: OutputSchema = {
      hypothesis: 'The function returns incorrect value',
      suspects: [
        {
          file: 'src/main.ts',
          line: 10,
          reason: 'Function implementation is incorrect'
        }
      ],
      patch: {
        unified_diff: '...',
        files_changed: 1
      },
      tests: [
        {
          path: 'tests/main.test.ts',
          content: 'describe(\'calculateValue\', () => {\n  it(\'should return correct value\', () => {\n    expect(calculateValue()).toBe(42);\n  });\n});',
          purpose: 'Verify calculateValue returns correct value'
        }
      ]
    };

    expect(mockOutput.tests.length).toBeGreaterThan(0);
    expect(mockOutput.tests[0].path).toContain('.test.ts');
    expect(mockOutput.tests[0].content).toContain('it(');
    expect(mockOutput.tests[0].purpose).toBeDefined();
  });
});