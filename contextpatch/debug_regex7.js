// Test the exact pattern from the code separately
const pattern = "^FAILED\\\\s+(\\\\S+?)::(\\\\S+)(?:\\\\s+-\\\\s+(.+))?$";
console.log('Pattern string:', pattern);

const re = new RegExp(pattern, "gm");
console.log('RegExp object:', re);

// Test with our input
const testInput = 'FAILED tests/test_example.py::test_addition - assertion failed';
console.log('\\nTest input:', JSON.stringify(testInput));

const match = re.exec(testInput);
console.log('Direct match result:', match);

// Try calling the function again to make sure
console.log('\\nTesting with function again:');
const funcRe = new RegExp("^FAILED\\\\s+(\\\\S+?)::(\\\\S+)(?:\\\\s+-\\\\s+(.+))?\\$", "gm");
const funcMatch = funcRe.exec(testInput);
console.log('Function-style match:', funcMatch);

// Also check if it works with the string that has a newline
const testWithNewline = 'FAILED tests/test_example.py::test_addition - assertion failed\\n';
console.log('\\nTest with newline:', JSON.stringify(testWithNewline));
const reWithNewline = new RegExp("^FAILED\\\\s+(\\\\S+?)::(\\\\S+)(?:\\\\s+-\\\\s+(.+))?\\$", "gm");
const matchWithNewline = reWithNewline.exec(testWithNewline);
console.log('Match with newline:', matchWithNewline);