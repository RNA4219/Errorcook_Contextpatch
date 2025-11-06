#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";



interface SmellReport {
  long_functions: Array<{
    file: string;
    function: string;
    lines: number;
    complexity: number;
  }>;
  deep_nesting: Array<{
    file: string;
    location: string;
    depth: number;
  }>;
  dup_ratio: number;
}

interface RankingItem {
  id: string;
  roi: number;
  type: string;
  location: string;
  severity: "low" | "medium" | "high";
}

interface RefactorProposal {
  id: string;
  title: string;
  description: string;
  files_affected: string[];
  estimated_effort: number; // in hours
  expected_roi: number;
}

const usage = `errorcook <command> -p <path>

Commands:
  smell     - Detect code smells and potential issues
  rank      - Rank issues by ROI and importance  
  propose   - Generate detailed refactor proposals
  validate  - Validate refactor proposals
  nightshift - Run batch processing jobs

Options:
  -p <path> - Path to .ctxpack directory (default: ./work/.ctxpack)
`;

function arg(k: string, def: string): string {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i+1] : def;
}

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function main() {
  const cmd = process.argv[2];
  const p: string = arg("-p", "./work/.ctxpack")!;
  
  if (!cmd) { 
    console.log(usage); 
    process.exit(0); 
  }

  const base = resolve(p!); // Non-null assertion since we provide a default
  const smellDir = resolve(base, "smell");
  const artifact = resolve(base, "artifact");
  ensureDir(smellDir); 
  ensureDir(artifact);

  switch (cmd) {
    case "smell": {
      smell(base, smellDir);
      break;
    }
    case "rank": {
      rank(base, smellDir, artifact);
      break;
    }
    case "propose": {
      propose(base, smellDir, artifact);
      break;
    }
    case "validate": {
      validate(base, smellDir, artifact);
      break;
    }
    case "nightshift": {
      nightshift(base, smellDir, artifact);
      break;
    }
    default:
      console.log(usage);
      process.exit(1);
  }
}

function smell(base: string, smellDir: string) {
  // For now, create a basic smell report
  // In a real implementation, this would analyze code files for smells
  
  const report: SmellReport = {
    long_functions: [
      {
        file: "src/complex-module.ts",
        function: "complexFunction",
        lines: 180,
        complexity: 15
      }
    ],
    deep_nesting: [
      {
        file: "src/logic-handler.ts",
        location: "handleRequest -> processRequest -> validateData -> sanitizeInputs",
        depth: 6
      }
    ],
    dup_ratio: 0.12 // 12% duplication
  };

  const reportPath = resolve(smellDir, "smell_report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`smell: analysis complete, written to ${reportPath}`);
}

function rank(base: string, smellDir: string, artifactDir: string) {
  // Read the smell report to rank the issues
  const reportPath = resolve(smellDir, "smell_report.json");
  if (!existsSync(reportPath)) {
    console.error(`Error: smell_report.json not found at ${reportPath}. Run smell command first.`);
    process.exit(1);
  }

  const report: SmellReport = JSON.parse(readFileSync(reportPath, 'utf8'));
  const rankings: RankingItem[] = [];

  // Create rankings from the smell report
  for (const fn of report.long_functions) {
    rankings.push({
      id: `long-fn-${fn.file}-${fn.function}`,
      roi: calculateRoi('long-function', fn.complexity, fn.lines),
      type: 'long-function',
      location: `${fn.file}:${fn.function}`,
      severity: complexityToSeverity(fn.complexity)
    });
  }

  for (const nesting of report.deep_nesting) {
    rankings.push({
      id: `deep-nesting-${nesting.file}`,
      roi: calculateRoi('deep-nesting', nesting.depth),
      type: 'deep-nesting',
      location: nesting.file,
      severity: depthToSeverity(nesting.depth)
    });
  }

  // Sort by ROI descending
  rankings.sort((a, b) => b.roi - a.roi);

  const rankingPath = resolve(artifactDir, "smell_rank.jsonl");
  writeFileSync(rankingPath, JSON.stringify(rankings) + "\n");
  
  console.log(`rank: ${rankings.length} items ranked, written to ${rankingPath}`);
}

function calculateRoi(type: string, ...params: number[]): number {
  // Simplified ROI calculation based on issue type and severity
  switch (type) {
    case 'long-function': {
      // Higher complexity and line count = higher ROI for refactoring
      const complexity = params[0] || 0;
      const lines = params[1] || 0;
      return Math.min(1.0, (complexity * 0.1 + lines * 0.01) / 10);
    }
    case 'deep-nesting': {
      const depth = params[0] || 0;
      return Math.min(1.0, depth * 0.15);
    }
    case 'duplication': {
      const ratio = params[0] || 0;
      return Math.min(1.0, ratio * 3); // High ROI for duplication fixes
    }
    default:
      return 0.5; // Default medium ROI
  }
}

function complexityToSeverity(complexity: number): "low" | "medium" | "high" {
  if (complexity >= 10) return "high";
  if (complexity >= 5) return "medium";
  return "low";
}

function depthToSeverity(depth: number): "low" | "medium" | "high" {
  if (depth >= 5) return "high";
  if (depth >= 3) return "medium";
  return "low";
}

function propose(base: string, smellDir: string, artifactDir: string) {
  // Read the ranked smells to generate refactor proposals
  const rankingPath = resolve(artifactDir, "smell_rank.jsonl");
  if (!existsSync(rankingPath)) {
    console.error(`Error: smell_rank.jsonl not found at ${rankingPath}. Run rank command first.`);
    process.exit(1);
  }

  const rankingData = readFileSync(rankingPath, 'utf8');
  const rankings: RankingItem[] = JSON.parse(rankingData);
  
  // Take the top 3 highest ROI items for proposal
  const topRankings = rankings.slice(0, 3);
  const proposals: RefactorProposal[] = [];

  for (const item of topRankings) {
    const parts = item.location.split(':');
    const file = parts[0];
    const entity = parts[1] || 'unknown';

    proposals.push({
      id: item.id,
      title: `Refactor ${entity} in ${file}`,
      description: `The ${item.type} "${entity}" in ${file} has ROI of ${item.roi.toFixed(2)}. ` +
                   `This refactor would improve code maintainability and reduce future bugs.`,
      files_affected: [file],
      estimated_effort: Math.min(8, Math.max(1, Math.round(item.roi * 10))), // 1-8 hours
      expected_roi: item.roi
    });
  }

  const proposalPath = resolve(smellDir, "refactor_proposals.json");
  writeFileSync(proposalPath, JSON.stringify(proposals, null, 2));

  // Also write a markdown version
  const mdPath = resolve(smellDir, "refactor_proposals.md");
  const mdContent = generateProposalMarkdown(proposals);
  writeFileSync(mdPath, mdContent);

  console.log(`propose: ${proposals.length} proposals generated, written to ${proposalPath} and ${mdPath}`);
}

function generateProposalMarkdown(proposals: RefactorProposal[]): string {
  let md = "# Refactor Proposals\n\n";
  
  for (let i = 0; i < proposals.length; i++) {
    const p = proposals[i];
    md += `## ${i + 1}. ${p.title}\n\n`;
    md += `- **ID**: ${p.id}\n`;
    md += `- **Description**: ${p.description}\n`;
    md += `- **Files Affected**: ${p.files_affected.join(', ')}\n`;
    md += `- **Estimated Effort**: ${p.estimated_effort} hours\n`;
    md += `- **Expected ROI**: ${p.expected_roi.toFixed(2)}\n\n`;
  }

  return md;
}

function validate(base: string, smellDir: string, artifactDir: string) {
  // Validate that refactor proposals are reasonable and follow best practices
  const proposalPath = resolve(smellDir, "refactor_proposals.json");
  if (!existsSync(proposalPath)) {
    console.error(`Error: refactor_proposals.json not found at ${proposalPath}. Run propose command first.`);
    process.exit(1);
  }

  const proposals: RefactorProposal[] = JSON.parse(readFileSync(proposalPath, 'utf8'));
  
  // Validation checks
  const validationErrors: string[] = [];
  
  for (const prop of proposals) {
    if (!prop.id || prop.id.length < 5) {
      validationErrors.push(`Proposal ${prop.id} has invalid ID`);
    }
    if (!prop.title || prop.title.length < 10) {
      validationErrors.push(`Proposal ${prop.id} has insufficient title`);
    }
    if (!prop.description || prop.description.length < 20) {
      validationErrors.push(`Proposal ${prop.id} has insufficient description`);
    }
    if (!prop.files_affected || prop.files_affected.length === 0) {
      validationErrors.push(`Proposal ${prop.id} has no affected files`);
    }
    if (prop.estimated_effort <= 0 || prop.estimated_effort > 16) {  // Max 2 days effort
      validationErrors.push(`Proposal ${prop.id} has invalid effort estimate: ${prop.estimated_effort}`);
    }
    if (prop.expected_roi < 0 || prop.expected_roi > 1) {
      validationErrors.push(`Proposal ${prop.id} has invalid ROI: ${prop.expected_roi}`);
    }
  }

  // Write validation results
  const ciDir = resolve(artifactDir, "ci");
  ensureDir(ciDir);
  const tapPath = resolve(ciDir, "smell-validate.tap");
  
  if (validationErrors.length === 0) {
    const tap = `TAP version 13
ok 1 - All refactor proposals are valid
ok 2 - Proposals have valid IDs, titles, and descriptions
ok 3 - Effort estimates are reasonable (1-16 hours)
ok 4 - ROI values are in valid range (0-1)
1..4
`;
    writeFileSync(tapPath, tap);
    console.log(`validate: all proposals passed validation, written to ${tapPath}`);
  } else {
    const tap = `TAP version 13
not ok 1 - ${validationErrors.length} validation errors found
# Errors: ${validationErrors.slice(0, 3).join('; ')}
1..1
`;
    writeFileSync(tapPath, tap);
    console.error(`validate: ${validationErrors.length} proposals failed validation, written to ${tapPath}`);
    validationErrors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}

function nightshift(base: string, smellDir: string, artifactDir: string) {
  // Nightshift runs a full cycle: smell -> rank -> propose -> validate
  console.log("nightshift: starting full analysis cycle...");
  
  try {
    // Run smell detection
    smell(base, smellDir);
    
    // Run ranking
    rank(base, smellDir, artifactDir);
    
    // Generate proposals
    propose(base, smellDir, artifactDir);
    
    // Validate proposals
    validate(base, smellDir, artifactDir);
    
    console.log("nightshift: analysis cycle completed successfully");
  } catch (e) {
    console.error(`nightshift: error during analysis cycle: ${e}`);
    process.exit(1);
  }
}

main();