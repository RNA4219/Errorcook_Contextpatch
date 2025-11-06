import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateConfig, ValidationResult } from './schema-validator';

export interface Limits {
  max_files: number;
  max_lines: number;
  timeout_sec: number;
}

export interface Artifacts {
  ci_dir: string;
  repo_root: string;
  birdseye_index: string;
}

export interface Objective {
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
}

export interface ErrorCookConfig {
  objective: Objective;
  limits: Limits;
  artifacts: Artifacts;
}

export function loadConfig(configPath?: string): ErrorCookConfig {
  const path = configPath || resolve(process.cwd(), 'errorcook.yaml');
  
  if (!existsSync(path)) {
    throw new Error(`Configuration file not found: ${path}`);
  }
  
  try {
    const configContent = readFileSync(path, 'utf-8');
    const config = parseYaml(configContent);
    
    // Validate configuration
    const validation = validateConfig(config);
    if (!validation.ok) {
      throw new Error(`Invalid configuration: ${validation.reason}`);
    }
    
    return config;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
    throw error;
  }
}

export function getDefaultConfig(): ErrorCookConfig {
  return {
    objective: {
      requireJson: true,
      jsonSchemaPath: '../SCHEMAS/output.schema.json',
      min_len: 100,
      max_len: 4000,
      required_sections: ['hypothesis', 'suspects', 'patch', 'tests'],
      weights: {
        json_field_coverage: 1.0,
        length_fit: 0.2,
        keyword_coverage: 0.3
      },
      keywords: ['tests', 'unified diff', 'suspects']
    },
    limits: {
      max_files: 5,
      max_lines: 60,
      timeout_sec: 900
    },
    artifacts: {
      ci_dir: './ci',
      repo_root: './',
      birdseye_index: './birdseye.json'
    }
  };
}

// Simple YAML parser for basic configuration
function parseYaml(content: string): any {
  const config: any = {};
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        
        // Try to parse as JSON first, then as string
        try {
          config[key.trim()] = JSON.parse(value);
        } catch {
          config[key.trim()] = value;
        }
      }
    }
  }
  
  return config;
}