// Test even simpler regex pattern
console.log('Testing simple patterns:');

// Test just the beginning
const re1 = /^FAILED/;
const testInput = 'FAILED tests/test_example.py::test_addition - assertion failed';
console.log('Input:', testInput);
console.log('Match FAILED:', re1.exec(testInput));

// Test with spaces
const re2 = /^FAILED\\s+/;
const match2 = re2.exec(testInput);
console.log('Match FAILED + spaces:', match2);

// Test with non-whitespace chars
const re3 = /^FAILED\\s+(\\S+)/;
const match3 = re3.exec(testInput);
console.log('Match FAILED + spaces + non-space:', match3);

// Test the exact pattern step by step
const re4 = /^FAILED\\s+(\\S+?)::(\\S+)/;
const match4 = re4.exec(testInput);
console.log('Match up to :::', match4);

// The full pattern
const re5 = /^FAILED\\s+(\\S+?)::(\\S+)(?:\\s+-\\s+(.+))?$/;
const match5 = re5.exec(testInput);
console.log('Match full pattern:', match5);