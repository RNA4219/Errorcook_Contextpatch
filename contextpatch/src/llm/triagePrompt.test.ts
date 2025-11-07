import { describe, it, expect } from 'vitest';
import { buildTriagePrompt } from './triagePrompt.js';

describe('LLM triage prompt builder', () => {
  it('should build a triage prompt with failure items', () => {
    const failureItems = [
      {
        tool: 'pytest',
        path: 'tests/test_example.py',
        message: 'AssertionError: 2 + 2 != 5',
        details: 'assert (2 + 2) == 5\\n +  where 4 = 2 + 2',
        severity: 'error',
        meta: { test: 'test_addition', line: 10 }
      }
    ];
    
    const prompt = buildTriagePrompt(failureItems);
    
    expect(prompt).toContain('Analyze the following CI failures');
    expect(prompt).toContain('Failure 1:');
    expect(prompt).toContain('- Tool: pytest');
    expect(prompt).toContain('- Path: tests/test_example.py');
    expect(prompt).toContain('- Message: AssertionError: 2 + 2 != 5');
    expect(prompt).toContain('- Severity: error');
    expect(prompt).toContain('Please provide your analysis in the following format:');
  });

  it('should handle multiple failure items', () => {
    const failureItems = [
      {
        tool: 'mypy',
        path: 'src/example.py',
        message: 'Incompatible types in assignment',
        severity: 'error'
      },
      {
        tool: 'eslint',
        path: 'src/index.js',
        message: 'Unexpected console statement',
        severity: 'warning'
      }
    ];
    
    const prompt = buildTriagePrompt(failureItems);
    
    expect(prompt).toContain('Failure 1:');
    expect(prompt).toContain('- Tool: mypy');
    expect(prompt).toContain('Failure 2:');
    expect(prompt).toContain('- Tool: eslint');
  });

  it('should handle failure items without optional fields', () => {
    const failureItems = [
      {
        tool: 'pytest',
        message: 'Test failed'
      }
    ];
    
    const prompt = buildTriagePrompt(failureItems);
    
    expect(prompt).toContain('Failure 1:');
    expect(prompt).toContain('- Tool: pytest');
    expect(prompt).toContain('- Message: Test failed');
    // Should not contain Path, Details, or Severity sections since they're missing
    expect(prompt).not.toContain('- Path:');
    expect(prompt).not.toContain('- Details:');
    expect(prompt).not.toContain('- Severity:');
  });
});