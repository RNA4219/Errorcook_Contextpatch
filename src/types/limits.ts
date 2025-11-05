/**
 * Processing limits configuration (compliant with SCHEMAS/config.schema.json)
 */

export interface ProcessingLimits {
  max_files: number;
  max_lines: number;
  timeout_sec: number;
  roi_budget: number;
}