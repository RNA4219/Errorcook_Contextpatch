import json
import yaml
import sys
import time
import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

# ErrorCook ContextPatch - Main Pipeline Implementation
# Based on IMPLEMENTATION_REFERENCE_FILES.md specification

@dataclass
class FailureItem:
    """Standardized Failure Item schema per SCHEMAS/failure_item.schema.json"""
    tool: str
    path: str
    message: str
    details: str
    severity: str  # "error" | "warning"
    meta: Dict[str, Any]

@dataclass
class ErrorCookOutput:
    """Output schema per SCHEMAS/output.schema.json"""
    hypothesis: str
    suspects: List[Dict[str, Any]]
    patch: Dict[str, str]
    tests: List[Dict[str, str]]

class ModelProfile(Enum):
    """Model profiles for token budgeting per workflow-cookbook-compact/config/budget.yaml"""
    CPU_SMALL = "cpu_small"  # 500 tokens
    SEVEN_B_GPU = "7b_gpu"   # 1,000 tokens
    CHEAP_API = "cheap_api"  # 1,200 tokens

@dataclass
class ProcessingLimits:
    """Processing constraints per examples/configs/errorcook.yaml"""
    max_files: int = 5
    max_lines: int = 60
    timeout_sec: int = 900
    roi_budget: float = 40.0  # Default ROI budget

class CIParserAdapter:
    """Adapter for parsing various CI tool outputs into standardized FailureItem format"""
    
    def __init__(self, limits: ProcessingLimits):
        self.limits = limits
        
    def parse_ci_output(self, ci_output: str, tool_type: str) -> List[FailureItem]:
        """Parse CI tool output and convert to standardized FailureItem[]"""
        
        if tool_type == "pytest":
            return self._parse_pytest_output(ci_output)
        elif tool_type == "eslint":
            return self._parse_eslint_output(ci_output)
        elif tool_type == "mypy":
            return self._parse_mypy_output(ci_output)
        elif tool_type == "cargo":
            return self._parse_cargo_output(ci_output)
        elif tool_type == "go":
            return self._parse_go_output(ci_output)
        elif tool_type == "junit":
            return self._parse_junit_output(ci_output)
        elif tool_type == "tap":
            return self._parse_tap_output(ci_output)
        else:
            raise ValueError(f"Unsupported CI tool type: {tool_type}")
    
    def _parse_pytest_output(self, output: str) -> List[FailureItem]:
        """Parse pytest failure output"""
        failures: List[FailureItem] = []
        lines = output.split('\n')
        
        for line in lines:
            if 'FAILED' in line or 'ERROR' in line:
                failures.append(FailureItem(
                    tool="pytest",
                    path=line.split('::')[0] if '::' in line else "unknown",
                    message=line.strip(),
                    details=line.strip(),
                    severity="error",
                    meta={"line_number": 0, "rule_id": None}
                ))
        
        return failures
    
    def _parse_eslint_output(self, output: str) -> List[FailureItem]:
        """Parse ESLint output"""
        failures: List[FailureItem] = []
        try:
            eslint_data = json.loads(output)
            for item in eslint_data:
                failures.append(FailureItem(
                    tool="eslint",
                    path=item.get('filePath', 'unknown'),
                    message=item.get('message', {}).get('message', ''),
                    details=json.dumps(item),
                    severity="error" if item.get('message', {}).get('severity', 0) == 2 else "warning",
                    meta={
                        "line_number": item.get('message', {}).get('line', 0),
                        "rule_id": item.get('message', {}).get('ruleId', None)
                    }
                ))
        except json.JSONDecodeError:
            # Fallback for non-JSON ESLint output
            failures.append(FailureItem(
                tool="eslint",
                path="unknown",
                message=output[:100],
                details=output,
                severity="warning",
                meta={}
            ))
        
        return failures
    
    def _parse_mypy_output(self, output: str) -> List[FailureItem]:
        """Parse mypy output"""
        failures: List[FailureItem] = []
        lines = output.split('\n')
        
        for line in lines:
            if ': error:' in line or ': note:' in line:
                parts = line.split(':')
                if len(parts) >= 3:
                    failures.append(FailureItem(
                        tool="mypy",
                        path=parts[0],
                        message=line.strip(),
                        details=line.strip(),
                        severity="error" if 'error:' in line else "warning",
                        meta={"line_number": int(parts[1]) if parts[1].isdigit() else 0}
                    ))
        
        return failures
    
    def _parse_cargo_output(self, output: str) -> List[FailureItem]:
        """Parse cargo output"""
        failures: List[FailureItem] = []
        lines = output.split('\n')
        
        for line in lines:
            if 'error[' in line or 'warning[' in line:
                failures.append(FailureItem(
                    tool="cargo",
                    path="Cargo.toml",
                    message=line.strip(),
                    details=line.strip(),
                    severity="error" if 'error[' in line else "warning",
                    meta={}
                ))
        
        return failures
    
    def _parse_go_output(self, output: str) -> List[FailureItem]:
        """Parse Go tool output"""
        failures: List[FailureItem] = []
        lines = output.split('\n')
        
        for line in lines:
            if line.startswith('FAIL:') or line.startswith('--- FAIL:'):
                failures.append(FailureItem(
                    tool="go",
                    path="unknown",
                    message=line.strip(),
                    details=line.strip(),
                    severity="error",
                    meta={}
                ))
        
        return failures
    
    def _parse_junit_output(self, output: str) -> List[FailureItem]:
        """Parse JUnit XML output"""
        failures: List[FailureItem] = []
        try:
            # Simplified XML parsing - would use proper XML parser in production
            if '<failure' in output or '<error' in output:
                failures.append(FailureItem(
                    tool="junit",
                    path="test-results.xml",
                    message="Test failures detected in JUnit output",
                    details=output,
                    severity="error",
                    meta={}
                ))
        except Exception:
            failures.append(FailureItem(
                tool="junit",
                path="unknown",
                message="Failed to parse JUnit output",
                details=output,
                severity="error",
                meta={}
            ))
        
        return failures
    
    def _parse_tap_output(self, output: str) -> List[FailureItem]:
        """Parse TAP (Test Anything Protocol) output"""
        failures: List[FailureItem] = []
        lines = output.split('\n')
        
        for line in lines:
            if line.startswith('not ok'):
                failures.append(FailureItem(
                    tool="tap",
                    path="unknown",
                    message=line.strip(),
                    details=line.strip(),
                    severity="error",
                    meta={}
                ))
        
        return failures

class JSONPromptTemplate:
    """JSON prompt template management per prompts/triage.md and prompts/config/prompts.json"""
    
    def __init__(self, limits: ProcessingLimits):
        self.limits = limits
        self.base_template = {
            "system": "You are an expert code repair engineer. Analyze the CI failure and propose minimal patches.",
            "task": "Analyze failure items and generate JSON output with hypothesis, suspects, patch, and tests.",
            "constraints": [
                "Patch must be minimal (≤60 lines, ≤5 files)",
                "Include at least one test",
                "Output only valid JSON",
                "Use Unified Diff format for patches",
                "Avoid destructive operations"
            ],
            "output_schema": {
                "hypothesis": "string (≥20 chars)",
                "suspects": [{"file": "string", "line": "number", "reason": "string"}],
                "patch": {"unified_diff": "string (≥10 chars)"},
                "tests": [{"path": "string", "content": "string", "purpose": "string"}]
            }
        }
    
    def generate_prompt(self, failures: List[FailureItem], context: str = "") -> str:
        """Generate structured prompt for LLM analysis"""
        
        failure_summaries: List[Dict[str, Any]] = []
        for failure in failures[:self.limits.max_files]:  # Respect limits
            failure_summaries.append({
                "tool": failure.tool,
                "path": failure.path,
                "message": failure.message[:200],  # Truncate long messages
                "severity": failure.severity,
                "meta": failure.meta
            })
        
        system_msg = self.base_template['system']
        task_msg = self.base_template['task']
        constraints = self.base_template['constraints']
        output_schema = self.base_template['output_schema']
        
        prompt = f"""{system_msg}

{task_msg}

CI FAILURE ITEMS:
{json.dumps(failure_summaries, indent=2)}

CONTEXT:
{context[:500] if context else "No additional context provided"}

{constraints}

OUTPUT SCHEMA:
{json.dumps(output_schema, indent=2)}

Generate valid JSON output following the schema above."""
        
        return prompt
    
    def validate_output(self, output_text: str) -> Optional[ErrorCookOutput]:
        """Validate and parse LLM output against schema"""
        try:
            data = json.loads(output_text)
            
            # Validate required fields
            required_fields = ['hypothesis', 'suspects', 'patch', 'tests']
            for field in required_fields:
                if field not in data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate hypothesis length
            if len(data['hypothesis']) < 20:
                raise ValueError("Hypothesis too short (min 20 chars)")
            
            # Validate patch format
            if 'unified_diff' not in data['patch']:
                raise ValueError("Patch missing unified_diff field")
            
            if len(data['patch']['unified_diff']) < 10:
                raise ValueError("Unified diff too short (min 10 chars)")
            
            # Validate tests
            if not data['tests'] or len(data['tests']) == 0:
                raise ValueError("At least one test required")
            
            return ErrorCookOutput(
                hypothesis=data['hypothesis'],
                suspects=data['suspects'],
                patch=data['patch'],
                tests=data['tests']
            )
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON output: {e}")
        except Exception as e:
            raise ValueError(f"Schema validation failed: {e}")

class ROIManager:
    """ROI budget management per workflow-cookbook-compact/config/budget.yaml"""
    
    def __init__(self, default_budget: float = 40.0):
        self.default_budget = default_budget
        self.roi_budget = float(os.environ.get('ROI_BUDGET', str(default_budget)))
    
    def calculate_effort_score(self, failure_count: int, complexity_score: float) -> float:
        """Calculate effort score for ROI calculation"""
        return float(failure_count * complexity_score)
    
    def calculate_value_score(self, success_rate: float, urgency: float) -> float:
        """Calculate value score for ROI calculation"""
        return float(success_rate * urgency)
    
    def calculate_roi(self, effort_score: float, value_score: float, risk: float = 1.0) -> float:
        """Calculate ROI: (value * confidence) / (effort * max(risk,1))"""
        if effort_score <= 0:
            return 0.0
        return float(value_score / (effort_score * max(risk, 1.0)))
    
    def can_proceed(self, roi_score: float, budget_limit: Optional[float] = None) -> bool:
        """Check if processing can proceed within budget"""
        budget_limit = budget_limit or float(self.roi_budget)
        return roi_score >= budget_limit

class ModelProfileManager:
    """Model profile and token management"""
    
    def __init__(self):
        self.profiles = {
            ModelProfile.CPU_SMALL: {"max_tokens": 500},
            ModelProfile.SEVEN_B_GPU: {"max_tokens": 1000},
            ModelProfile.CHEAP_API: {"max_tokens": 1200}
        }
    
    def get_profile(self, model_type: str) -> Dict[str, int]:
        """Get model profile configuration"""
        try:
            profile = ModelProfile(model_type)
            return self.profiles[profile]
        except ValueError:
            return self.profiles[ModelProfile.CPU_SMALL]  # Default fallback

class PipelineState:
    """Pipeline state management"""
    
    def __init__(self, limits: ProcessingLimits, pipeline_id: Optional[str] = None):
        self.limits = limits
        self.pipeline_id = pipeline_id or f"pipeline_{int(time.time())}"
        self.status = "initialized"
        self.failures: List[FailureItem] = []
        self.analysis_result: Optional[ErrorCookOutput] = None
        self.start_time = time.time()
    
    def add_failures(self, failures: List[FailureItem]):
        """Add parsed failures to pipeline state"""
        self.failures.extend(failures[:self.limits.max_files])
    
    def set_analysis_result(self, result: ErrorCookOutput):
        """Set analysis result"""
        self.analysis_result = result
        self.status = "completed"
    
    def get_duration(self) -> float:
        """Get pipeline duration in seconds"""
        return time.time() - self.start_time

class ErrorCookPipeline:
    """Main ErrorCook ContextPatch Pipeline - Integrated implementation"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.limits = ProcessingLimits(
            max_files=config.get('max_files', 5),
            max_lines=config.get('max_lines', 60),
            timeout_sec=config.get('timeout_sec', 900),
            roi_budget=config.get('roi_budget', 40)
        )
        
        self.parser = CIParserAdapter(self.limits)
        self.prompt_template = JSONPromptTemplate(self.limits)
        self.roi_manager = ROIManager(self.limits.roi_budget)
        self.profile_manager = ModelProfileManager()
        self.state = PipelineState(self.limits)
    
    def process_ci_failures(self, ci_output: str, tool_type: str, context: str = "") -> ErrorCookOutput:
        """Main pipeline processing method"""
        
        try:
            # Step 1: Parse CI output to standardized FailureItems
            failures = self.parser.parse_ci_output(ci_output, tool_type)
            self.state.add_failures(failures)
            
            if not failures:
                raise ValueError("No failures detected in CI output")
            
            # Step 2: Calculate ROI and check budget
            effort_score = self.roi_manager.calculate_effort_score(
                len(failures), 
                complexity_score=1.0  # Simplified complexity calculation
            )
            value_score = self.roi_manager.calculate_value_score(
                success_rate=0.8,  # Estimated success rate
                urgency=1.0  # Default urgency
            )
            roi_score = self.roi_manager.calculate_roi(effort_score, value_score)
            
            if not self.roi_manager.can_proceed(roi_score):
                raise ValueError(f"ROI score {roi_score} below budget threshold {self.limits.roi_budget}")
            
            # Step 2.5: Extract minimal context relevant to failures
            from .context_extraction import MinimalContextExtractor, get_related_source_files
            
            # Extract paths from failures
            failure_paths = [f.path for f in failures if f.path and f.path != "unknown"]
            
            # Get additional related files based on error context
            related_files = set()
            for failure in failures:
                if failure.details:
                    failure_context = {
                        "details": failure.details,
                        "path": failure.path,
                        "message": failure.message
                    }
                    try:
                        related = get_related_source_files(failure_context, os.getcwd())
                        related_files.update(related)
                    except Exception:
                        # If repo root detection fails, continue with basic paths
                        pass
            
            # Combine failure paths with related files
            all_relevant_paths = list(set(failure_paths + list(related_files)))
            
            # Extract minimal context
            extractor = MinimalContextExtractor(os.getcwd())
            context_files = extractor.extract_context(all_relevant_paths)
            
            # Create context string with relevant file contents
            context_excerpts = []
            for ctx_file in context_files:
                if ctx_file.content and len(ctx_file.content.strip()) > 0:
                    context_excerpts.append(f"=== {ctx_file.path} ===\n{ctx_file.content[:500]}")  # Limit context size
            
            enhanced_context = context + "\n\nRELATED SOURCE CONTEXT:\n" + "\n\n".join(context_excerpts) if context_excerpts else context

            # Step 3: Generate prompt and get LLM analysis (mock implementation)
            prompt = self.prompt_template.generate_prompt(failures, enhanced_context)
            
            # Mock LLM response - in real implementation would call actual LLM
            mock_response = self._generate_mock_llm_response(failures)
            
            # Step 4: Validate output against schema
            result = self.prompt_template.validate_output(mock_response)
            if result is None:
                raise ValueError("Failed to validate LLM output")
            
            self.state.set_analysis_result(result)
            
            return result
            
        except Exception as e:
            self.state.status = "failed"
            raise RuntimeError(f"Pipeline processing failed: {e}")
    
    def _generate_mock_llm_response(self, failures: List[FailureItem]) -> str:
        """Generate mock LLM response for testing - replace with actual LLM call"""
        
        hypothesis = f"Based on {len(failures)} CI failures, the issue appears to be related to code quality and testing coverage problems."
        
        suspects: List[Dict[str, Any]] = []
        for i, failure in enumerate(failures[:3]):  # Limit to 3 suspects
            suspects.append({
                "file": failure.path,
                "line": failure.meta.get('line_number', 0),
                "reason": f"{failure.tool} detected {failure.severity}: {failure.message[:50]}"
            })
        
        # Mock unified diff
        mock_diff = f"""--- a/{failures[0].path if failures else 'file.py'}
+++ b/{failures[0].path if failures else 'file.py'}
@@ -1,3 +1,3 @@
 def example_function():
-    # problematic code
+    # fixed code
     return True
"""
        
        mock_tests = [
            {
                "path": "test_fix.py",
                "content": "def test_example(): assert example_function() == True",
                "purpose": "Verify the fix resolves the CI failure"
            }
        ]
        
        response: Dict[str, Any] = {
            "hypothesis": hypothesis,
            "suspects": suspects,
            "patch": {"unified_diff": mock_diff},
            "tests": mock_tests
        }
        
        return json.dumps(response)

def load_config(config_path: str) -> Dict[str, Any]:
    """Load ErrorCook configuration"""
    try:
        with open(config_path, 'r') as f:
            if config_path.endswith('.yaml') or config_path.endswith('.yml'):
                return yaml.safe_load(f)
            else:
                return json.load(f)
    except FileNotFoundError:
        # Return default configuration
        return {
            "max_files": 5,
            "max_lines": 60,
            "timeout_sec": 900,
            "roi_budget": 40,
            "model_profile": "cpu_small"
        }

def main():
    """Main CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="ErrorCook ContextPatch Pipeline")
    parser.add_argument("--config", default="errorcook.yaml", help="Configuration file path")
    parser.add_argument("--ci-output", required=True, help="CI failure output")
    parser.add_argument("--tool-type", required=True, help="CI tool type (pytest, eslint, mypy, etc.)")
    parser.add_argument("--context", default="", help="Additional context information")
    parser.add_argument("--output", help="Output file path (default: stdout)")
    
    args = parser.parse_args()
    
    try:
        # Load configuration
        config = load_config(args.config)
        
        # Initialize pipeline
        pipeline = ErrorCookPipeline(config)
        
        # Process CI failures
        result = pipeline.process_ci_failures(args.ci_output, args.tool_type, args.context)
        
        # Output result
        output_data: Dict[str, Any] = {
            "pipeline_id": pipeline.state.pipeline_id,
            "status": pipeline.state.status,
            "duration": pipeline.state.get_duration(),
            "result": {
                "hypothesis": result.hypothesis,
                "suspects": result.suspects,
                "patch": result.patch,
                "tests": result.tests
            }
        }
        
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(output_data, f, indent=2)
        else:
            print(json.dumps(output_data, indent=2))
            
        print(f"Pipeline completed successfully in {pipeline.state.get_duration():.2f}s")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
