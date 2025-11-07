#!/usr/bin/env node

import { runGates } from './src/gates.js';

// Example usage of the gates system
const exampleOutput = {
  hypothesis: 'The error occurs because of incorrect type checking in the validation function',
  suspects: [
    { file: 'src/validator.ts', line: 42, reason: 'Type mismatch in validation logic' }
  ],
  patch: {
    unified_diff: `--- a/src/validator.ts
+++ b/src/validator.ts
@@ -39,7 +39,7 @@
 function validateInput(input: string): boolean {
   if (!input) {
     return false;
-  } 
+  }
   return typeof input === 'string';
 }`
  },
  tests: [
    {
      path: 'tests/validator.test.ts',
      content: '// Test to verify validation function handles null input correctly\nfunction testValidation(): void {\n  expect(validateInput(null)).toBe(false);\n}',
      purpose: 'Verify null input handling'
    }
  ]
};

console.log('Example output for validation:', JSON.stringify(exampleOutput, null, 2));

const validationResult = runGates(exampleOutput, { maxLines: 60, maxFiles: 5 });
console.log('\nValidation Result:');
console.log('Passed:', validationResult.passed);
console.log('Errors:', validationResult.errors);

if (validationResult.passed) {
  console.log('\nAll gates passed! The output meets the required criteria.');
} else {
  console.log('\nSome gates failed. Please address the issues above.');
}