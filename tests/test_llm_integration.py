"""
LLM Integration tests for ErrorCook/ContextPatch pipeline
Based on IMPLEMENTATION_REFERENCE_FILES.md specification
"""
import json
import pytest
from src.main import ErrorCookPipeline, JSONPromptTemplate, ProcessingLimits
from src.main import FailureItem


class TestLLMIntegration:
    """Test LLM integration with ErrorCook pipeline components"""
    
    def test_prompt_template_generation(self):
        """Test prompt template generation per triage.md spec"""
        limits = ProcessingLimits(max_files=5, max_lines=60)
        prompt_template = JSONPromptTemplate(limits)
        
        # Create sample failure items
        failures = [
            FailureItem(
                tool="pytest",
                path="test_example.py",
                message="AssertionError: Expected True, got False",
                details="AssertionError: assert False == True",
                severity="error",
                meta={"line_number": 15}
            )
        ]
        
        # Generate prompt
        prompt = prompt_template.generate_prompt(failures, "Context about the test failure")
        
        # Verify prompt contains required elements
        assert "CI FAILURE ITEMS:" in prompt
        assert "test_example.py" in prompt
        assert "AssertionError" in prompt
        assert "CONTEXT:" in prompt
        assert "Output only valid JSON" in prompt
        assert "Unified Diff format" in prompt
        
    def test_prompt_template_with_multiple_failures(self):
        """Test prompt template with multiple failure items"""
        limits = ProcessingLimits(max_files=3, max_lines=60)
        prompt_template = JSONPromptTemplate(limits)
        
        # Create multiple sample failure items
        failures = [
            FailureItem(tool="pytest", path="test1.py", message="Error 1", details="Details 1", severity="error", meta={"line_number": 10}),
            FailureItem(tool="mypy", path="src/code.py", message="Type error", details="Incompatible types", severity="error", meta={"line_number": 25}),
            FailureItem(tool="eslint", path="src/app.js", message="Style error", details="Semicolon required", severity="warning", meta={"line_number": 5})
        ]
        
        prompt = prompt_template.generate_prompt(failures)
        
        # Verify all failures are included in prompt (up to max_files limit)
        assert "test1.py" in prompt
        assert "src/code.py" in prompt
        assert "src/app.js" in prompt
        assert "Type error" in prompt
        assert "Style error" in prompt
        
    def test_output_validation_success(self):
        """Test successful validation of LLM output against schema"""
        limits = ProcessingLimits(max_files=5, max_lines=60)
        prompt_template = JSONPromptTemplate(limits)
        
        # Valid output example
        valid_output = json.dumps({
            "hypothesis": "The issue is related to incorrect assertion in the test function",
            "suspects": [
                {"file": "src/code.py", "line": 10, "reason": "Potential null value causing assertion failure"}
            ],
            "patch": {
                "unified_diff": """--- a/src/code.py\n+++ b/src/code.py\n@@ -7,7 +7,7 @@\n def example_function():\n-    return False\n+    return True\n"""
            },
            "tests": [
                {"path": "test_fix.py", "content": "def test_fix(): assert example_function() == True", "purpose": "Verify fix"}
            ]
        })
        
        result = prompt_template.validate_output(valid_output)
        
        assert result is not None
        assert result.hypothesis == "The issue is related to incorrect assertion in the test function"
        assert len(result.suspects) == 1
        assert result.suspects[0]["file"] == "src/code.py"
        assert "unified_diff" in result.patch
        assert len(result.tests) == 1
        
    def test_output_validation_fails_on_missing_fields(self):
        """Test validation fails when required fields are missing"""
        limits = ProcessingLimits(max_files=5, max_lines=60)
        prompt_template = JSONPromptTemplate(limits)
        
        # Invalid output missing required field
        invalid_output = json.dumps({
            "hypothesis": "Short",
            "suspects": [],
            # Missing 'patch' and 'tests' fields
        })
        
        with pytest.raises(ValueError) as exc_info:
            prompt_template.validate_output(invalid_output)
        
        assert "Missing required field" in str(exc_info.value)
        
    def test_output_validation_fails_on_short_hypothesis(self):
        """Test validation fails when hypothesis is too short"""
        limits = ProcessingLimits(max_files=5, max_lines=60)
        prompt_template = JSONPromptTemplate(limits)
        
        # Invalid output with short hypothesis
        invalid_output = json.dumps({
            "hypothesis": "Too short",
            "suspects": [],
            "patch": {"unified_diff": "diff content"},
            "tests": []
        })
        
        with pytest.raises(ValueError) as exc_info:
            prompt_template.validate_output(invalid_output)
        
        assert "Hypothesis too short" in str(exc_info.value)
        
    def test_output_validation_fails_on_short_patch(self):
        """Test validation fails when patch is too short"""
        limits = ProcessingLimits(max_files=5, max_lines=60)
        prompt_template = JSONPromptTemplate(limits)
        
        # Invalid output with short patch
        invalid_output = json.dumps({
            "hypothesis": "The issue is related to incorrect assertion in the test function",
            "suspects": [],
            "patch": {"unified_diff": "short"},
            "tests": [{"path": "test.py", "content": "test", "purpose": "Verify"}]
        })
        
        with pytest.raises(ValueError) as exc_info:
            prompt_template.validate_output(invalid_output)
        
        assert "Unified diff too short" in str(exc_info.value)
        
    def test_output_validation_fails_on_missing_patch_property(self):
        """Test validation fails when patch is missing unified_diff property"""
        limits = ProcessingLimits(max_files=5, max_lines=60)
        prompt_template = JSONPromptTemplate(limits)
        
        # Invalid output with patch missing unified_diff
        invalid_output = json.dumps({
            "hypothesis": "The issue is related to incorrect assertion in the test function",
            "suspects": [],
            "patch": {"other_property": "value"},
            "tests": [{"path": "test.py", "content": "test", "purpose": "Verify"}]
        })
        
        with pytest.raises(ValueError) as exc_info:
            prompt_template.validate_output(invalid_output)
        
        assert "Patch missing unified_diff field" in str(exc_info.value)
        
    def test_output_validation_fails_on_missing_tests(self):
        """Test validation fails when no tests are provided"""
        limits = ProcessingLimits(max_files=5, max_lines=60)
        prompt_template = JSONPromptTemplate(limits)
        
        # Invalid output with no tests
        invalid_output = json.dumps({
            "hypothesis": "The issue is related to incorrect assertion in the test function",
            "suspects": [],
            "patch": {"unified_diff": "valid diff content that is long enough to pass length check"},
            "tests": []
        })
        
        with pytest.raises(ValueError) as exc_info:
            prompt_template.validate_output(invalid_output)
        
        assert "At least one test required" in str(exc_info.value)


class TestPipelineIntegration:
    """Test integration of pipeline components"""
    
    def test_full_pipeline_execution(self):
        """Test end-to-end pipeline execution with mock data"""
        # Configuration
        config = {
            "max_files": 3,
            "max_lines": 60,
            "timeout_sec": 900,
            "roi_budget": 0.5 # Modified from 20 to 0.5
        }
        
        pipeline = ErrorCookPipeline(config)
        
        # Sample CI output that simulates pytest failure
        ci_output = """test_example.py::test_function FAILED
_____________________________________________
def test_function():
>       assert calculate(2, 3) == 6
E       assert 5 == 6
E        +  where 5 = calculate(2, 3)

test_example.py:15: AssertionError
AssertionError: assert 5 == 6
"""
        
        # Execute pipeline
        result = pipeline.process_ci_failures(ci_output, "pytest", "Testing the pipeline")
        
        # Validate result structure
        assert hasattr(result, 'hypothesis')
        assert hasattr(result, 'suspects')
        assert hasattr(result, 'patch')
        assert hasattr(result, 'tests')
        
        # Verify hypothesis has reasonable length
        assert len(result.hypothesis) >= 20
        
        # Verify suspects is a list
        assert isinstance(result.suspects, list)
        
        # Verify patch has unified_diff
        assert 'unified_diff' in result.patch
        
        # Verify tests is a non-empty list
        assert len(result.tests) >= 1
        assert isinstance(result.tests, list)
        
    def test_pipeline_with_multiple_tool_types(self):
        """Test pipeline with different CI tool types"""
        config = {"max_files": 3, "max_lines": 60, "timeout_sec": 900, "roi_budget": 0.5} # Added roi_budget: 0.5
        pipeline = ErrorCookPipeline(config)
        
        # Test with different tool types
        tool_outputs = {
            "mypy": "src/example.py:10: error: Incompatible types in assignment (expression has type \"str\", variable has type \"int\")",
            "eslint": '[{"filePath":"src/app.js","message":{"message":"Missing semicolon","severity":2,"line":5,"ruleId":"semi"}}]',
            "junit": '<testsuite name="AllTests" tests="1" failures="1"><testcase name="testFail"><failure message="Test failed">Assertion failed</failure></testcase></testsuite>'
        }
        
        for tool_type, output in tool_outputs.items():
            result = pipeline.process_ci_failures(output, tool_type, f"Testing {tool_type}")
            
            # Validate result structure for each tool type
            assert hasattr(result, 'hypothesis')
            assert hasattr(result, 'suspects')
            assert hasattr(result, 'patch')
            assert hasattr(result, 'tests')
            assert len(result.hypothesis) >= 20
            assert len(result.tests) >= 1
