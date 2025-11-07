// Test with literal space instead of \s
console.log('Testing with literal space:');

const testInput = 'FAILED tests/test_example.py::test_addition - assertion failed';
console.log('Input:', testInput);

// Test with literal space
const re1 = /^FAILED (\\S+)/;
const match1 = re1.exec(testInput);
console.log('Match FAILED + space + non-space:', match1);

// Test step by step with literal spaces
const re2 = /^FAILED (\\S+?)::(\\S+)/;
const match2 = re2.exec(testInput);
console.log('Match up to ::: with literal space', match2);

// Full pattern with literal spaces
const re3 = /^FAILED (\\S+?)::(\\S+) (?:- (.+))?$/;
const match3 = re3.exec(testInput);
console.log('Full pattern with literal spaces:', match3);

// Test the original regex but with console.log of the regex object
const originalRe = /^FAILED\s+(\\S+?)::(\\S+)(?:\s+-\s+(.+))?$/;
console.log('\\nOriginal regex object:', originalRe);
const originalMatch = originalRe.exec(testInput);
console.log('Original regex match:', originalMatch);