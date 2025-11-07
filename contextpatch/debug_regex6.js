// Check exact string content
const testInput = 'FAILED tests/test_example.py::test_addition - assertion failed';
console.log('Input string:', JSON.stringify(testInput));
console.log('Input length:', testInput.length);

// Check character codes
console.log('Character codes:');
for (let i = 0; i < testInput.length; i++) {
  console.log(`  ${i}: '${testInput[i]}' (${testInput.charCodeAt(i)})`);
}

// Test a very simple pattern
const simpleRe = /FAILED/;
const simpleMatch = simpleRe.exec(testInput);
console.log('\\nSimple "FAILED" match:', simpleMatch);

// Try to create the exact regex from the original code
const exactRe = new RegExp("^FAILED\\s+(\\S+?)::(\\S+)(?:\\s+-\\s+(.+))?$");
console.log('\\nRegex from new RegExp:', exactRe);
const exactMatch = exactRe.exec(testInput);
console.log('new RegExp match:', exactMatch);