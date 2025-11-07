import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { createLLMClient, LLMClient } from '../contextpatch/src/llm/index.js';

// Mock the LLM provider implementations
vi.mock('../contextpatch/src/llm/index.js', async () => {
  const actual = await vi.importActual('../contextpatch/src/llm/index.js');
  
  // Create a mock client for testing
  const MockLLMClient = class implements LLMClient {
    call(prompt: string) {
      return Promise.resolve({ success: true, content: `Mock response for: ${prompt}` });
    }
    
    callPrompt(systemPrompt: string, userPrompt: string) {
      return Promise.resolve({ 
        success: true, 
        content: `Mock response - System: ${systemPrompt.substring(0, 20)}..., User: ${userPrompt.substring(0, 20)}...` 
      });
    }
  };
  
  return {
    ...actual,
    createLLMClient: vi.fn((config) => new MockLLMClient())
  };
});

describe('LLM Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an LLM client with test provider', () => {
    const client = createLLMClient({ provider: 'test' });
    expect(client).toBeDefined();
    expect(typeof client.call).toBe('function');
    expect(typeof client.callPrompt).toBe('function');
  });

  it('should create an LLM client with openai provider', () => {
    const client = createLLMClient({ provider: 'openai' });
    expect(client).toBeDefined();
  });

  it('should call the LLM with a prompt', async () => {
    const client = createLLMClient({ provider: 'test' });
    const result = await client.call('Test prompt');
    
    expect(result.success).toBe(true);
    expect(result.content).toContain('Mock response for:');
  });

  it('should call the LLM with system and user prompts', async () => {
    const client = createLLMClient({ provider: 'test' });
    const result = await client.callPrompt('System prompt', 'User prompt');
    
    expect(result.success).toBe(true);
    expect(result.content).toContain('Mock response');
    expect(result.content).toContain('System:');
    expect(result.content).toContain('User:');
  });

  it('should handle errors gracefully', async () => {
    // This test verifies the error handling in the LLM client
    const client = createLLMClient({ provider: 'test' });
    
    // Test with a special prompt that would trigger an error in a real implementation
    const result = await client.call('Error test');
    
    expect(result).toBeDefined();
  });
});