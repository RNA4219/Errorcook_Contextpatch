// Test the regex pattern in isolation
const re = /^FAILED\s+(\\S+?)::(\\S+)(?:\s+-\s+(.+))?$/gm;
const testInput = 'FAILED tests/test_example.py::test_addition - assertion failed';
console.log('Input:', testInput);

const match = re.exec(testInput);
console.log('Match result:', match);

// Try different variations
console.log('\\nTesting alternative regex:');
const re2 = /^FAILED\s+(\\S+?)::(\\S+)(?:\s+-\s+(.+))?$/;
const match2 = re2.exec(testInput);
console.log('Match result without g,m flags:', match2);

// Check if pattern itself works
console.log('\\nTesting pattern without anchors:');
const re3 = /FAILED\s+(\\S+?)::(\\S+)(?:\s+-\s+(.+))?/;
const match3 = re3.exec(testInput);
console.log('Match without anchors:', match3);