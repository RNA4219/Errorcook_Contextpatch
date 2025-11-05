/**
 * Configuration management system (compliant with examples/configs/errorcook.yaml)
 */

import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { ProcessingLimits } from '../types/limits';

export interface ErrorCookConfig {
  objective: {
    requireJson: boolean;
    jsonSchemaPath: string;
    min_len: number;
    max_len: number;
    required_sections: string[];
    weights: {
      json_field_coverage: number;
      length_fit: number;
      keyword_coverage: number;
    };
    keywords: string[];
    target_len: number;
    diversity: {
      enable: boolean;
    };
  };
  limits: ProcessingLimits;
  artifacts: {
    ci_dir: string;
    repo_root: string;
    birdseye_index: string;
  };
}

export class ConfigManager {
  private config: ErrorCookConfig;
  private configPath: string;

  constructor(configPath: string = 'errorcook.yaml') {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  private loadConfig(): ErrorCookConfig {
    try {
      const configFile = readFileSync(this.configPath, 'utf8');
      const configData = load(configFile);
      
      // Validate and merge with defaults
      return this.validateConfig(configData);
    } catch (error) {
      console.warn(`Failed to load config from ${this.configPath}, using defaults:`, error);
      return this.getDefaultConfig();
    }
  }

  private validateConfig(config: any): ErrorCookConfig {
    const defaultConfig = this.getDefaultConfig();
    
    return {
      objective: {
        ...defaultConfig.objective,
        ...config.objective
      },
      limits: {
        ...defaultConfig.limits,
        ...config.limits
      },
      artifacts: {
        ...defaultConfig.artifacts,
        ...config.artifacts
      }
    };
  }

  private getDefaultConfig(): ErrorCookConfig {
    return {
      objective: {
        requireJson: true,
        jsonSchemaPath: 'SCHEMAS/output.schema.json',
        min_len: 100,
        max_len: 4000,
        required_sections: ['hypothesis', 'suspects', 'patch', 'tests'],
        weights: {
          json_field_coverage: 1.0,
          length_fit: 0.2,
          keyword_coverage: 0.3
        },
        keywords: ['tests', 'unified diff', 'suspects'],
        target_len: 900,
        diversity: {
          enable: false
        }
      },
      limits: {
        max_files: 5,
        max_lines: 60,
        timeout_sec: 900,
        roi_budget: 40
      },
      artifacts: {
        ci_dir: 'artifacts/ci',
        repo_root: '.',
        birdseye_index: 'artifacts/birdseye/index.json'
      }
    };
  }

  public getConfig(): ErrorCookConfig {
    return this.config;
  }

  public getLimits(): ProcessingLimits {
    return this.config.limits;
  }

  public getObjective(): ErrorCookConfig['objective'] {
    return this.config.objective;
  }

  public getArtifacts(): ErrorCookConfig['artifacts'] {
    return this.config.artifacts;
  }

  public updateConfig(updates: Partial<ErrorCookConfig>): void {
    this.config = this.validateConfig({ ...this.config, ...updates });
  }

  public validateConfigSchema(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required sections
    const requiredSections = ['hypothesis', 'suspects', 'patch', 'tests'];
    for (const section of requiredSections) {
      if (!this.config.objective.required_sections.includes(section)) {
        errors.push(`Missing required section: ${section}`);
      }
    }

    // Check limits
    if (this.config.limits.max_files <= 0) {
      errors.push('max_files must be greater than 0');
    }
    if (this.config.limits.max_lines <= 0) {
      errors.push('max_lines must be greater than 0');
    }
    if (this.config.limits.timeout_sec <= 0) {
      errors.push('timeout_sec must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}