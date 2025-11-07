// Simple test to debug regex
const input = 'FAILED tests/test_example.py::test_addition - assertion failed';
console.log('Input:', JSON.stringify(input));

// Test with literal regex
const literalRegex = /^FAILED\s+(\S+?)::(\S+)(?:\s+-\s+(.+))?$/gm;
console.log('Literal regex test:');
let match1;
while ((match1 = literalRegex.exec(input)) !== null) {
  console.log('Match 1:', match1);
}

// Test with string-based regex (as used in the code)
const stringRegex = new RegExp("^FAILED\\s+(\\S+?)::(\\S+)(?:\\s+-\\s+(.+))?$/gm");
console.log('String-based regex test:');
let match2;
while ((match2 = stringRegex.exec(input)) !== null) {
  console.log('Match 2:', match2);
}