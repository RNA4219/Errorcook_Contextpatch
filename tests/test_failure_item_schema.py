"""
Tests for FailureItem schema compliance per SCHEMAS/failure_item.schema.json
Based on IMPLEMENTATION_REFERENCE_FILES.md specification
"""
import json
import pytest
from src.main import FailureItem, CIParserAdapter, ProcessingLimits


class TestFailureItemSchema:
    """Test FailureItem schema compliance"""
    
    def test_failure_item_creation(self):
        """Test basic FailureItem creation with required fields"""
        item = FailureItem(
            tool="pytest",
            path="test_example.py",
            message="Test failure message",
            details="Detailed error information",
            severity="error",
            meta={"line_number": 10}
        )
        
        # Verify all fields are set correctly
        assert item.tool == "pytest"
        assert item.path == "test_example.py"
        assert item.message == "Test failure message"
        assert item.details == "Detailed error information"
        assert item.severity == "error"
        assert item.meta == {"line_number": 10}
        
    def test_failure_item_required_fields(self):
        """Test that required fields are properly defined"""
        # Try to create FailureItem without required field - this should work in Python
        # as dataclass doesn't enforce required fields at runtime like TypeScript would
        # So we check the schema definition instead
        schema_path = "SCHEMAS/failure_item.schema.json"
        with open(schema_path, 'r') as f:
            schema = json.load(f)
        
        # Check required fields in schema
        required_fields = schema.get("required", [])
        assert "tool" in required_fields
        assert "message" in required_fields
        assert len(required_fields) == 2  # Only tool and message are required
        
    def test_failure_item_optional_fields(self):
        """Test optional fields in FailureItem"""
        item = FailureItem(
            tool="mypy",
            path="src/code.py",
            message="Type error detected",
            details="",  # Optional field
            severity="warning",  # Optional field
            meta={}  # Optional field
        )
        
        # Verify item is created properly even with empty optional fields
        assert item.tool == "mypy"
        assert item.message == "Type error detected"
        assert item.details == ""
        assert item.severity == "warning"
        assert item.meta == {}
        
    def test_severity_enum_values(self):
        """Test that severity field supports only allowed values"""
        # Valid severity values per schema
        valid_item1 = FailureItem(
            tool="eslint",
            path="src/app.js",
            message="Style issue",
            details="Details",
            severity="error",
            meta={}
        )
        
        valid_item2 = FailureItem(
            tool="eslint",
            path="src/app.js",
            message="Style issue",
            details="Details",
            severity="warning",
            meta={}
        )
        
        # Both valid items should be created successfully
        assert valid_item1.severity == "error"
        assert valid_item2.severity == "warning"


class TestParserSchemaCompliance:
    """Test that parsers generate FailureItems that comply with schema"""
    
    def setup_method(self):
        """Set up parser adapter for testing"""
        self.limits = ProcessingLimits(max_files=5, max_lines=60)
        self.parser = CIParserAdapter(self.limits)
    
    def test_pytest_parser_output_compliance(self):
        """Test that pytest parser output complies with FailureItem schema"""
        pytest_output = """test_example.py::test_addition FAILED
_____________________________________________
def test_addition():
>       assert add(2, 3) == 6
E       assert 5 == 6

test_example.py:15: AssertionError
"""
        
        failures = self.parser.parse_ci_output(pytest_output, "pytest")
        
        # Verify all failures comply with schema
        assert len(failures) > 0
        for failure in failures:
            # Check required fields
            assert hasattr(failure, 'tool')
            assert hasattr(failure, 'message')
            
            # Check that fields have appropriate types/values
            assert isinstance(failure.tool, str)
            assert isinstance(failure.message, str)
            assert len(failure.tool) > 0  # tool is required
            assert len(failure.message) > 0  # message is required
            
    def test_mypy_parser_output_compliance(self):
        """Test that mypy parser output complies with FailureItem schema"""
        mypy_output = "src/calculator.py:10: error: Incompatible types in assignment"
        
        failures = self.parser.parse_ci_output(mypy_output, "mypy")
        
        assert len(failures) > 0
        for failure in failures:
            # Check required fields
            assert hasattr(failure, 'tool')
            assert hasattr(failure, 'message')
            
            # Check that fields have appropriate types/values
            assert isinstance(failure.tool, str)
            assert isinstance(failure.message, str)
            assert len(failure.tool) > 0  # tool is required
            assert len(failure.message) > 0  # message is required
            
    def test_eslint_parser_output_compliance(self):
        """Test that eslint parser output complies with FailureItem schema"""
        eslint_output = '[{"filePath":"src/app.js","message":{"message":"Missing semicolon","severity":2,"line":5,"ruleId":"semi"}}]'
        
        failures = self.parser.parse_ci_output(eslint_output, "eslint")
        
        assert len(failures) > 0
        for failure in failures:
            # Check required fields
            assert hasattr(failure, 'tool')
            assert hasattr(failure, 'message')
            
            # Check that fields have appropriate types/values
            assert isinstance(failure.tool, str)
            assert isinstance(failure.message, str)
            assert len(failure.tool) > 0  # tool is required
            
    def test_cargo_parser_output_compliance(self):
        """Test that cargo parser output complies with FailureItem schema"""
        cargo_output = "error[E0425]: cannot find value `x` in this scope"
        
        failures = self.parser.parse_ci_output(cargo_output, "cargo")
        
        assert len(failures) > 0
        for failure in failures:
            # Check required fields
            assert hasattr(failure, 'tool')
            assert hasattr(failure, 'message')
            
            # Check that fields have appropriate types/values
            assert isinstance(failure.tool, str)
            assert isinstance(failure.message, str)
            assert len(failure.tool) > 0  # tool is required
            assert len(failure.message) > 0  # message is required
            
    def test_go_parser_output_compliance(self):
        """Test that go parser output complies with FailureItem schema"""
        go_output = "--- FAIL: TestAddition (0.00s)\n    calculator_test.go:15: Addition(2, 3) = 5, want 6"
        
        failures = self.parser.parse_ci_output(go_output, "go")
        
        assert len(failures) > 0
        for failure in failures:
            # Check required fields
            assert hasattr(failure, 'tool')
            assert hasattr(failure, 'message')
            
            # Check that fields have appropriate types/values
            assert isinstance(failure.tool, str)
            assert isinstance(failure.message, str)
            assert len(failure.tool) > 0  # tool is required
            assert len(failure.message) > 0  # message is required
            
    def test_junit_parser_output_compliance(self):
        """Test that junit parser output complies with FailureItem schema"""
        junit_output = """<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="TestSuite" tests="1" failures="1">
    <testcase name="testFail">
      <failure message="Assertion failed">java.lang.AssertionError: Values are not equal</failure>
    </testcase>
  </testsuite>
</testsuites>"""
        
        failures = self.parser.parse_ci_output(junit_output, "junit")
        
        assert len(failures) > 0
        for failure in failures:
            # Check required fields
            assert hasattr(failure, 'tool')
            assert hasattr(failure, 'message')
            
            # Check that fields have appropriate types/values
            assert isinstance(failure.tool, str)
            assert isinstance(failure.message, str)
            assert len(failure.tool) > 0  # tool is required
            assert len(failure.message) > 0  # message is required
            
    def test_tap_parser_output_compliance(self):
        """Test that tap parser output complies with FailureItem schema"""
        tap_output = """1..2
ok 1 - Input file opened
not ok 2 - First line of the input valid"""
        
        failures = self.parser.parse_ci_output(tap_output, "tap")
        
        assert len(failures) > 0
        for failure in failures:
            # Check required fields
            assert hasattr(failure, 'tool')
            assert hasattr(failure, 'message')
            
            # Check that fields have appropriate types/values
            assert isinstance(failure.tool, str)
            assert isinstance(failure.message, str)
            assert len(failure.tool) > 0  # tool is required
            assert len(failure.message) > 0  # message is required
            
    def test_unknown_tool_raises_error(self):
        """Test that unsupported tool types raise an error"""
        with pytest.raises(ValueError) as exc_info:
            self.parser.parse_ci_output("some output", "unknown_tool")
        
        assert "Unsupported CI tool type: unknown_tool" in str(exc_info.value)