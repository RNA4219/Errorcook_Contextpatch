import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { validate } from "jsonschema";

// Configuration interfaces based on schema
export interface Config {
  objective: Objective;
  limits: Limits;
  artifacts: Artifacts;
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
  target_len: number;
  diversity: {
    enable: boolean;
  };
}

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

// Default configuration
const DEFAULT_CONFIG: Config = {
  objective: {
    requireJson: true,
    jsonSchemaPath: "SCHEMAS/output.schema.json",
    min_len: 100,
    max_len: 4000,
    required_sections: ["hypothesis", "suspects", "patch", "tests"],
    weights: {
      json_field_coverage: 1.0,
      length_fit: 0.2,
      keyword_coverage: 0.3,
    },
    keywords: ["tests", "unified diff", "suspects"],
    target_len: 900,
    diversity: {
      enable: false,
    },
  },
  limits: {
    max_files: 5,
    max_lines: 60,
    timeout_sec: 900,
  },
  artifacts: {
    ci_dir: "artifacts/ci",
    repo_root: ".",
    birdseye_index: "artifacts/birdseye/index.json",
  },
};

// Load configuration from file or use defaults
export function loadConfig(configPath?: string): Config {
  const path = configPath || resolve(process.cwd(), "errorcook.yaml");
  
  if (!existsSync(path)) {
    console.warn(`Config file not found at ${path}, using defaults`);
    return DEFAULT_CONFIG;
  }

  try {
    const configContent = readFileSync(path, "utf-8");
    const config = YAML.parse(configContent);
    
    // Validate against schema
    const schema = JSON.parse(readFileSync(resolve(process.cwd(), "SCHEMAS/config.schema.json"), "utf-8"));
    const validation = validate(config, schema);
    
    if (validation.errors.length > 0) {
      console.error("Configuration validation errors:");
      validation.errors.forEach(error => console.error(`- ${error.property}: ${error.message}`));
      process.exit(1);
    }
    
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.error(`Failed to load config from ${path}:`, error);
    return DEFAULT_CONFIG;
  }
}

// Simple YAML parser (basic implementation)
const YAML = {
  parse(content: string): any {
    const lines = content.split('\n');
    const result: any = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();
        
        if (value.startsWith('{') && value.endsWith('}')) {
          // Handle object
          result[key] = JSON.parse(value);
        } else if (value.startsWith('[') && value.endsWith(']')) {
          // Handle array
          result[key] = JSON.parse(value);
        } else if (!isNaN(Number(value))) {
          // Handle number
          result[key] = Number(value);
        } else if (value === 'true' || value === 'false') {
          // Handle boolean
          result[key] = value === 'true';
        } else {
          // Handle string
          result[key] = value;
        }
      }
    }
    
    return result;
  }
};