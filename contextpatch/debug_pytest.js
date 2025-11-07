import { parsePytest } from './src/parsers/pytest.js';

// Test the regex directly
const testInput = 'FAILED tests/test_example.py::test_addition - assertion failed';
console.log('Input:', testInput);

const result = parsePytest(testInput);
console.log('Result:', result);

// Let's also check the regex separately
const re = /^FAILED\s+(\\S+?)::(\\S+)(?:\s+-\s+(.+))?$/gm;
const match = re.exec(testInput);
console.log('Regex match:', match);