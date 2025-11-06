#!/usr/bin/env python3
import json
import sys
import os

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from main import ErrorCookPipeline, load_config

def test_pipeline():
    """Test the ErrorCook pipeline with sample CI output"""
    
    # Load configuration
    config = load_config("examples/configs/errorcook.yaml")
    print(f"Loaded config: {config}")
    
    # Sample CI output
    ci_output = """test_example.py::test_addition FAILED
test_example.py::test_subtraction FAILED

AssertionError: assert 2 + 2 == 5
assert 5 - 3 == 3"""
    
    # Initialize pipeline with lower budget for testing
    config['roi_budget'] = 0.1  # Lower budget for testing
    pipeline = ErrorCookPipeline(config)
    
    try:
        # Process CI failures
        result = pipeline.process_ci_failures(
            ci_output=ci_output,
            tool_type="pytest",
            context="Unit tests for basic arithmetic operations"
        )
        
        # Print results
        print("\n=== PIPELINE RESULTS ===")
        print(f"Pipeline ID: {pipeline.state.pipeline_id}")
        print(f"Status: {pipeline.state.status}")
        print(f"Duration: {pipeline.state.get_duration():.2f}s")
        print(f"Failures processed: {len(pipeline.state.failures)}")
        
        print("\n=== HYPOTHESIS ===")
        print(result.hypothesis)
        
        print("\n=== SUSPECTS ===")
        for suspect in result.suspects:
            print(f"  File: {suspect['file']}")
            print(f"  Line: {suspect['line']}")
            print(f"  Reason: {suspect['reason']}")
        
        print("\n=== PATCH ===")
        print(result.patch['unified_diff'])
        
        print("\n=== TESTS ===")
        for test in result.tests:
            print(f"  Path: {test['path']}")
            print(f"  Purpose: {test['purpose']}")
            print(f"  Content: {test['content']}")
        
        # Validate output schema
        print("\n=== SCHEMA VALIDATION ===")
        from main import JSONPromptTemplate
        validator = JSONPromptTemplate(pipeline.limits)
        validated = validator.validate_output(json.dumps({
            "hypothesis": result.hypothesis,
            "suspects": result.suspects,
            "patch": result.patch,
            "tests": result.tests
        }))
        
        if validated:
            print("PASS: Output schema validation PASSED")
        else:
            print("FAIL: Output schema validation FAILED")
        
        return True
        
    except Exception as e:
        print(f"FAIL: Pipeline test FAILED: {e}")
        return False

if __name__ == "__main__":
    success = test_pipeline()
    sys.exit(0 if success else 1)