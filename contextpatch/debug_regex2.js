// Check the actual string being passed to RegExp
const regexStr = "^FAILED\\s+(\\S+?)::(\\S+)(?:\\s+-\\s+(.+))?$/gm";
console.log('Regex string:', JSON.stringify(regexStr));

// Create regex object
const regex = new RegExp(regexStr);
console.log('Regex object:', regex);

// Test input
const input = 'FAILED tests/test_example.py::test_addition - assertion failed';
console.log('Input:', JSON.stringify(input));

// Execute
const match = regex.exec(input);
console.log('Match result:', match);

// Also try with exec in a loop (like in the original code)
const re = new RegExp("^FAILED\\s+(\\S+?)::(\\S+)(?:\\s+-\\s+(.+))?$/gm");
let m;
while ((m = re.exec(input)) !== null) {
  console.log('Loop match:', m);
}