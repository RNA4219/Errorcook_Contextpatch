#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { failure, ParseResult } from "./parsers/types.js";

// Import parser functions
import { parseTAP } from "./parsers/tap.js";
import { parsePytest } from "./parsers/pytest.js";
import { parseGoTest } from "./parsers/go.js";
import { parseCargo } from "./parsers/cargo.js";
import { parseJUnit } from "./parsers/junit.js";
import { parseESLint, parseESLintJSON } from "./parsers/eslint.js";
import { parseMyPy } from "./parsers/mypy.js";
import { parseRuff } from "./parsers/ruff.js";
import { parseClippy } from "./parsers/clippy.js";

// Import LLM functions
import { LLMClient, buildTriagePrompt } from "./llm/index.js";

// Import validation function
import { validateOutput } from "./prompts/validateOutput.js";
// Import schema validator
import { validateOutputSchema as validateOutputAgainstSchema } from "./validation/SchemaValidator.js";

// Types based on schema definitions
interface FailureItem {
  tool: string;
  path?: string;
  message: string;
  details?: string;
  severity?: "error" | "warning";
  meta?: Record<string, any>;
}

interface OutputSchema {
  hypothesis: string;
  suspects: Array<{
    file: string;
    line?: number;
    reason?: string;
  }>;
  patch: {
    unified_diff: string;
    files_changed?: number;
    lines_added?: number;
    lines_removed?: number;
  };
  tests: Array<{
    path: string;
    content: string;
    purpose?: string;
  }>;
}

interface Config {
  objective: any;
  limits: {
    max_files: number;
    max_lines: number;
    timeout_sec: number;
  };
  artifacts: {
    ci_dir: string;
    repo_root: string;
    birdseye_index?: string;
  };
}

const usage = `ctxpatch <command> -p <path>

Commands:
  detect    - Parse CI logs and detect failures
  triage    - Analyze failures and generate hypothesis
  patch     - Generate patch from triage results  
  validate  - Validate output against schema
  summarize - Create summary report
  package   - Package artifacts

Options:
  -p <path> - Path to .ctxpack directory (default: ./work/.ctxpack)
  --from-artifact <dir> - Directory containing CI artifacts to parse (for detect)
`;

function arg(k: string, def?: string): string | undefined {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i+1] : def;
}

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

async function main() {
  const cmd = process.argv[2];
  const p: string = arg("-p", "./work/.ctxpack")!; // Non-null assertion since we have a default
  const fromArtifact = arg("--from-artifact", undefined);
  
  if (!cmd) { 
    console.log(usage); 
    process.exit(0); 
  }

  const base = resolve(p ?? "./work/.ctxpack");
  ensureDir(base);
  const artifact = resolve(base, "artifact");
  ensureDir(artifact);

  switch (cmd) {
    case "detect": {
      if (!fromArtifact) {
        console.error("Error: --from-artifact is required for detect command");
        process.exit(1);
      }
      detect(base, fromArtifact, artifact);
      break;
    }
    case "triage": {
      await triage(base, artifact);
      break;
    }
    case "patch": {
      patch(base, artifact);
      break;
    }
    case "validate": {
      validate(base, artifact);
      break;
    }
    case "summarize": {
      summarize(base, artifact);
      break;
    }
    case "package": {
      packageArtifacts(base, artifact);
      break;
    }
    default:
      console.log(usage);
      process.exit(1);
  }
}

function detect(base: string, fromArtifact: string, artifactDir: string) {
  const artifactPath = resolve(process.cwd(), fromArtifact);
  if (!existsSync(artifactPath)) {
    console.error(`Error: Artifact directory does not exist: ${artifactPath}`);
    process.exit(1);
  }

  // Find all CI log files in the artifact directory
  const files = findFiles(artifactPath, ['.tap', '.xml', '.log']);
  const failureItems: FailureItem[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      let parseResult: ParseResult | null = null;

      // Determine parser based on file extension and content
      if (file.endsWith('.tap')) {
        parseResult = parseTAP(content);
      } else if (file.endsWith('.xml') && content.includes('testsuite')) {
        parseResult = parseJUnit(content);
      } else if (file.endsWith('.json') && (content.includes('eslint') || content.includes('filePath'))) {
        parseResult = parseESLintJSON(content);
      } else if (file.endsWith('.log') && content.includes('FAILED') && (content.includes('pytest') || content.includes('ERROR'))) {
        parseResult = parsePytest(content);
      } else if (file.endsWith('.log') && content.includes('FAIL') && content.includes('go test')) {
        parseResult = parseGoTest(content);
      } else if (file.endsWith('.log') && content.includes('failures=')) {  // cargo test typically has 'failures=' in output
        parseResult = parseCargo(content);
      } else if (file.endsWith('.log') && (content.includes('mypy') || content.match(/\.py:\d+:\d+:\s*error:/))) {
        parseResult = parseMyPy(content);
      } else if (file.endsWith('.txt') || file.endsWith('.log') && content.match(/\.py:\d+:\d+:\s*[A-Z][A-Z0-9]+\s+/)) {
        parseResult = parseRuff(content);
      } else if (content.includes('clippy') || content.match(/\.rs:\d+:\d+:/)) {
        parseResult = parseClippy(content);
      } else if (content.includes('eslint') && content.match(/:\d+:\d+:\s*/)) {
        parseResult = parseESLint(content);
      }
      // Add other parsers as needed

      if (parseResult) {
        // Convert ParseResult to FailureItem[]
        for (const failure of parseResult.failures) {
          failureItems.push({
            tool: parseResult.framework,
            path: failure.file,
            message: failure.message,
            details: content.substring(0, 500), // First 500 chars as details
            severity: "error",
            meta: {
              test: failure.test,
              line: failure.line,
              col: failure.col
            }
          });
        }
      }
    } catch (e) {
      console.warn(`Warning: Could not parse ${file}: ${e}`);
    }
  }

  // Write the detected failures to detect.jsonl
  const outputPath = resolve(artifactDir, "detect.jsonl");
  writeFileSync(outputPath, failureItems.map(item => JSON.stringify(item)).join('\n') + '\n');
  
  console.log(`detect: found ${failureItems.length} failure items, written to ${outputPath}`);
}

async function triage(base: string, artifactDir: string) {
  // Read the detect.jsonl file to get failures
  const detectPath = resolve(artifactDir, "detect.jsonl");
  if (!existsSync(detectPath)) {
    console.error(`Error: detect.jsonl not found at ${detectPath}. Run detect command first.`);
    process.exit(1);
  }
  
  const detectContent = readFileSync(detectPath, 'utf8');
  const failureItems: FailureItem[] = detectContent
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => JSON.parse(line));

  // Build the triage prompt using the failure items
  const userPrompt = buildTriagePrompt(failureItems);

  // Create LLM client and call the triage prompt
  const llm = new LLMClient({ provider: 'test' }); // In production, would use real provider
  const response = await llm.callPrompt(
    "You are a code repair assistant. Analyze the provided CI failures and generate a hypothesis, suspect files, patch, and test cases.",
    userPrompt
  );

  if (!response.success || !response.content) {
    console.error(`Error: LLM call failed: ${response.error}`);
    process.exit(1);
  }

  let output: OutputSchema;
  try {
    // Parse the LLM response as JSON
    output = JSON.parse(response.content);
  } catch (e) {
    console.error(`Error: Invalid JSON response from LLM: ${e}`);
    console.error(`Response content: ${response.content}`);
    process.exit(1);
  }

  // Validate the output against the schema
  const validationErrors = validateOutputSchema(output);
  if (validationErrors.length > 0) {
    console.error(`Error: LLM output does not conform to schema:`);
    validationErrors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  const outputPath = resolve(artifactDir, "triage.json");
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`triage: analysis completed, written to ${outputPath}`);
}

function patch(base: string, artifactDir: string) {
  // Read the triage.json file to get the patch information
  const triagePath = resolve(artifactDir, "triage.json");
  if (!existsSync(triagePath)) {
    console.error(`Error: triage.json not found at ${triagePath}. Run triage command first.`);
    process.exit(1);
  }

  const triageData = JSON.parse(readFileSync(triagePath, 'utf8')) as OutputSchema;
  
  // Write the patch to a diff file
  const patchDir = resolve(base, "patch");
  ensureDir(patchDir);
  const patchPath = resolve(patchDir, "diff.patch");
  writeFileSync(patchPath, triageData.patch.unified_diff);
  
  console.log(`patch: generated patch at ${patchPath}`);
}

function validate(base: string, artifactDir: string) {
  // Read the triage.json file
  const triagePath = resolve(artifactDir, "triage.json");
  if (!existsSync(triagePath)) {
    console.error(`Error: triage.json not found at ${triagePath}. Run triage command first.`);
    process.exit(1);
  }

  const triageData = JSON.parse(readFileSync(triagePath, 'utf8')) as OutputSchema;
  
  // Validate against the schema requirements
  const errors = validateOutputSchema(triageData);
  
  // Write validation results
  const tapPath = resolve(artifactDir, "ci", "validate.tap");
  ensureDir(resolve(artifactDir, "ci"));
  
  if (errors.length === 0) {
    const tap = `TAP version 13
ok 1 - Schema validation passed
ok 2 - Patch format is valid
ok 3 - Has required fields (hypothesis, suspects, patch, tests)
1..3
`;
    writeFileSync(tapPath, tap);
    console.log(`validate: all checks passed, written to ${tapPath}`);
  } else {
    const tap = `TAP version 13
not ok 1 - Schema validation failed
# Errors: ${errors.join(', ')}
1..1
`;
    writeFileSync(tapPath, tap);
    console.error(`validate: failed, written to ${tapPath}`);
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}

function validateOutputSchema(data: OutputSchema): string[] {
  const result = validateOutputAgainstSchema(data);
  if (result.valid) {
    return [];
  } else {
    return result.errors || ["Unknown validation error"];
  }
}

function summarize(base: string, artifactDir: string) {
  // Read triage.json for the summary
  const triagePath = resolve(artifactDir, "triage.json");
  if (!existsSync(triagePath)) {
    console.error(`Error: triage.json not found at ${triagePath}. Run triage command first.`);
    process.exit(1);
  }

  const triageData = JSON.parse(readFileSync(triagePath, 'utf8')) as OutputSchema;
  
  const summary = `# ContextPatch Summary

## Problem Analysis
- **Hypothesis**: ${triageData.hypothesis.substring(0, 200)}...

## Suspected Files
${triageData.suspects.map(s => `- ${s.file}:${s.line} - ${s.reason?.substring(0, 80) || 'No reason provided'}`).join('\n')}

## Proposed Patch
- **Files Changed**: ${triageData.patch.files_changed || 'Unknown'}
- **Lines Added**: ${triageData.patch.lines_added || 'Unknown'}  
- **Lines Removed**: ${triageData.patch.lines_removed || 'Unknown'}
- **Path**: patch/diff.patch

## Tests Added
- **Count**: ${triageData.tests.length}
${triageData.tests.map(t => `- ${t.path} (${t.purpose || 'No purpose specified'})`).join('\n')}

## Next Steps
1. Review the proposed patch
2. Apply the patch if appropriate
3. Run tests to validate the fix
`;

  const summaryPath = resolve(artifactDir, "summary.md");
  writeFileSync(summaryPath, summary);
  
  console.log(`summarize: written to ${summaryPath}`);
}

function packageArtifacts(base: string, artifactDir: string) {
  // Create a packaged version of the artifacts directory
  const packageDir = resolve(base, "package");
  ensureDir(packageDir);
  
  // Copy all artifacts to the package directory
  const artifactFiles = findFiles(artifactDir);
  for (const file of artifactFiles) {
    const relPath = file.substring(artifactDir.length + 1);
    const targetPath = resolve(packageDir, relPath);
    ensureDir(resolve(targetPath, '..'));
    
    const content = readFileSync(file);
    writeFileSync(targetPath, content);
  }
  
  const pkgManifest = {
    timestamp: new Date().toISOString(),
    artifacts: artifactFiles.map(f => f.substring(artifactDir.length + 1)),
    baseDir: base
  };
  
  writeFileSync(resolve(packageDir, "manifest.json"), JSON.stringify(pkgManifest, null, 2));
  
  console.log(`package: artifacts packaged to ${packageDir}`);
}

function findFiles(dir: string, extensions?: string[]): string[] {
  const results: string[] = [];
  
  function walk(currentDir: string) {
    const items = readdirSync(currentDir);
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = existsSync(fullPath) ? require('node:fs').statSync(fullPath) : null;
      
      if (stat?.isDirectory()) {
        walk(fullPath);
      } else if (stat?.isFile()) {
        if (!extensions || extensions.some(ext => fullPath.endsWith(ext))) {
          results.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return results;
}

main();