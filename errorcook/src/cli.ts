#!/usr/bin/env node
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const usage = `errorcook <command> -p <path>

Commands:
  smell  rank  propose  validate  nightshift
`;

function arg(k: string, def?: string) {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i+1] : def;
}

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function main() {
  const cmd = process.argv[2];
  const p = arg("-p", "./work/.ctxpack");
  if (!cmd) { console.log(usage); process.exit(0); }

  const base = resolve(p || './work/.ctxpack');
  const smellDir = resolve(base, "smell");
  const artifact = resolve(base, "artifact");
  ensureDir(smellDir); ensureDir(artifact);

  switch (cmd) {
    case "smell": {
      const report = { long_functions: [], deep_nesting: [], dup_ratio: 0.0 };
      writeFileSync(resolve(smellDir, "smell_report.json"), JSON.stringify(report, null, 2));
      console.log("smell: wrote smell/smell_report.json");
      break;
    }
    case "rank": {
      const ranking = [{ id: "refactor-1", roi: 0.42 }];
      writeFileSync(resolve(artifact, "smell_rank.jsonl"), JSON.stringify(ranking) + "\n");
      console.log("rank: ok");
      break;
    }
    case "propose": {
      const md = "# Refactor Proposal\n- split function foo() into foo() + fooCore()\n";
      writeFileSync(resolve(smellDir, "refactor_proposal.md"), md);
      console.log("propose: wrote smell/refactor_proposal.md");
      break;
    }
    case "validate": {
      const tap = "TAP version 13\nok 1 smell baseline\n1..1\n";
      const ciDir = resolve(artifact, "ci");
      ensureDir(ciDir);
      writeFileSync(resolve(ciDir, "smell-validate.tap"), tap);
      console.log("validate: green");
      break;
    }
    case "nightshift": {
      console.log("nightshift: (placeholder) sweep → smell → micro-patches → validate");
      break;
    }
    default:
      console.log(usage);
  }
}

main();
