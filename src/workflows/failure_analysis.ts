import { FailureItem } from '../types/failure_item';
import { TriageResult, ROIAnalysis } from '../types/analysis';

/**
 * Main workflow for failure analysis and ROI calculation
 * Converts CI tool outputs to standardized format and applies LLM analysis
 */
export class FailureAnalysisWorkflow {
  private triagePrompt: string;
  private guardrailTemplate: string;

  constructor() {
    // These would be loaded from prompts/triage.md and prompts/guardrails.md
    this.triagePrompt = `You are an expert software engineer analyzing CI failures.
    
Analyze the following failure item and provide:
1. Classification of the error type
2. Root cause analysis 
3. Fix recommendation with code example

Input: {{failure_item}}

Output format: JSON with fields: classification, root_cause, fix_recommendation`;
    
    this.guardrailTemplate = `Always follow these constraints:
- Never output absolute file paths
- Always provide minimal, focused code examples
- Keep explanations concise but comprehensive
- Do not include any markdown formatting in your response`;
  }

  /**
   * Process a batch of CI failures through the analysis workflow
   */
  async processFailures(failures: FailureItem[]): Promise<{
    triageResults: TriageResult[];
    roiAnalysis: ROIAnalysis;
  }> {
    const triageResults: TriageResult[] = [];
    
    // Convert each failure to standardized format and analyze
    for (const failure of failures) {
      const triageResult = await this.analyzeFailure(failure);
      triageResults.push(triageResult);
    }
    
    // Generate ROI analysis using req_to_srs_roi.yaml workflow
    const roiAnalysis = await this.calculateROI(triageResults);
    
    return {
      triageResults,
      roiAnalysis
    };
  }

  /**
   * Analyze individual failure item using LLM
   */
  private async analyzeFailure(failure: FailureItem): Promise<TriageResult> {
    // In a real implementation, this would call an LLM API
    // For now, we'll return mock results based on failure content
    
    const classification = this.classifyErrorType(failure);
    const rootCause = this.analyzeRootCause(failure);
    const fixRecommendation = this.generateFix(failure);
    
    return {
      id: failure.id,
      classification,
      rootCause,
      fixRecommendation,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Classify error type based on failure content
   */
  private classifyErrorType(failure: FailureItem): string {
    if (failure.tool.includes('eslint')) {
      return 'linting_error';
    } else if (failure.tool.includes('pytest')) {
      return 'test_failure';
    } else if (failure.tool.includes('clippy')) {
      return 'rust_analysis';
    }
    return 'unknown';
  }

  /**
   * Analyze root cause of failure
   */
  private analyzeRootCause(failure: FailureItem): string {
    // Mock analysis based on error message patterns
    const msg = failure.message.toLowerCase();
    
    if (msg.includes('undefined')) {
      return 'Variable not declared or out of scope';
    } else if (msg.includes('assertion')) {
      return 'Test condition failed';
    } else if (msg.includes('unused')) {
      return 'Unnecessary code detected';
    }
    
    return 'Generic error pattern';
  }

  /**
   * Generate fix recommendation
   */
  private generateFix(failure: FailureItem): string {
    // Mock fix generation based on failure type
    const msg = failure.message.toLowerCase();
    
    if (msg.includes('undefined')) {
      return 'Declare the variable before use or check for null/undefined values';
    } else if (msg.includes('assertion')) {
      return 'Review test conditions and ensure expected values match actual results';
    } else if (msg.includes('unused')) {
      return 'Remove unused variables or add proper usage to prevent warnings';
    }
    
    return 'Review code for potential logical or syntax errors';
  }

  /**
   * Calculate ROI for each failure analysis
   */
  private async calculateROI(triageResults: TriageResult[]): Promise<ROIAnalysis> {
    // Mock ROI calculation based on severity and impact factors
    const totalCost = triageResults.reduce((sum, result) => {
      return sum + (result.classification === 'test_failure' ? 100 : 50);
    }, 0);
    
    const estimatedSavings = triageResults.reduce((sum, result) => {
      return sum + (result.classification === 'test_failure' ? 80 : 30);
    }, 0);
    
    return {
      totalCost,
      estimatedSavings,
      roi: totalCost > 0 ? (estimatedSavings - totalCost) / totalCost : 0,
      analysis: triageResults.map(result => ({
        failureId: result.id,
        cost: result.classification === 'test_failure' ? 100 : 50,
        savings: result.classification === 'test_failure' ? 80 : 30
      }))
    };
  }
}

// Export the main processing function
export async function processFailureAnalysis(
  failures: FailureItem[]
): Promise<{
  triageResults: TriageResult[];
  roiAnalysis: ROIAnalysis;
}> {
  const workflow = new FailureAnalysisWorkflow();
  return workflow.processFailures(failures);
}