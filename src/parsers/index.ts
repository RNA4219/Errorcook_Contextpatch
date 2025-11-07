// src/parsers/index.ts - Export all parsers
import { parseTapOutput } from './tap';
import { parseJunitOutput } from './junit';
import { parsePytestOutput } from './pytest';
import { parseGoOutput } from './go';
import { parseCargoOutput } from './cargo';

export {
  parseTapOutput,
  parseJunitOutput,
  parsePytestOutput,
  parseGoOutput,
  parseCargoOutput
};

// Generic parser that routes to specific parsers based on tool name
export async function parseFailureOutput(toolName: string, output: any) {
  switch (toolName.toLowerCase()) {
    case 'tap':
      return parseTapOutput(output);
    case 'junit':
      return await parseJunitOutput(output);
    case 'pytest':
      return parsePytestOutput(output);
    case 'go':
      return parseGoOutput(output);
    case 'cargo':
      return parseCargoOutput(output);
    case 'eslint': // 既存のパーサー
    case 'clippy': // 既存のパーサー
      // これらのパーサーは以前のファイル failure_parser.ts に実装されている
      throw new Error(`Tool ${toolName} parser has been moved to the main failure_parser. Please use the functions from src/failure_parser instead.`);
    default:
      throw new Error(`Unsupported tool: ${toolName}`);
  }
}