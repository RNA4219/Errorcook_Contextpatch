import { parsePytest } from './src/parsers/pytest.js';

// Test the updated function
const testInput = 'FAILED tests/test_example.py::test_addition - assertion failed';
console.log('Input:', testInput);

const result = parsePytest(testInput);
console.log('Result:', result);
console.log('Failures count:', result.failures.length);

if (result.failures.length > 0) {
  console.log('First failure:', result.failures[0]);
} else {
  console.log('No failures detected!');
}

// Test with multiple failures
const multiInput = `FAILED tests/test_example.py::test_addition - assertion failed
FAILED tests/test_other.py::test_division - division by zero`;
console.log('\\nMulti-input:', multiInput);

const multiResult = parsePytest(multiInput);
console.log('Multi-result failures count:', multiResult.failures.length);