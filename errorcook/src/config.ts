/**
 * Configuration management for ErrorCook
 */

interface LLMConfig {
  provider: 'openai' | 'claude' | 'local';
  model: string;
  maxTokens: {
    input: number;
    output: number;
  };
}

interface ProcessingConfig {
  maxFiles: number;
  maxChanges: number; // ≤60行
  parallelism: number;
}

interface ValidationConfig {
  schemaStrict: boolean;
  gateEnforcement: boolean;
}

interface ErrorCookConfig {
  llm: LLMConfig;
  processing: ProcessingConfig;
  validation: ValidationConfig;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: ErrorCookConfig = {
  llm: {
    provider: 'local',
    model: 'default-model',
    maxTokens: {
      input: 500,
      output: 300,
    },
  },
  processing: {
    maxFiles: 10,
    maxChanges: 60,
    parallelism: 1,
  },
  validation: {
    schemaStrict: true,
    gateEnforcement: true,
  },
};

/**
 * Load configuration from various sources
 */
function loadConfig(overrides?: Partial<ErrorCookConfig>): ErrorCookConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
  };
}

export { ErrorCookConfig, loadConfig, DEFAULT_CONFIG };
