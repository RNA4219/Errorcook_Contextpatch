#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const usage = `ctxpatch <command> -p <path>

Commands:
  detect  triage  patch  validate  summarize  package
`;

function arg(k: string, def?: string) {
  const i = process.argv.indexOf(k);
  if (i > -1 && i + 1 < process.argv.length) {
    return process.argv[i + 1];
  }
  return def;
}

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function main() {
  const cmd = process.argv[2];
  const p = arg("-p", "./work/.ctxpack");
  if (!cmd) { console.log(usage); process.exit(0); }

  const base = resolve(p!); // Non-null assertion since default is provided
  ensureDir(base);
  const artifact = resolve(base, "artifact");
  ensureDir(artifact);

  switch (cmd) {
    case "detect": {
      const out = { hypothesis: "unknown", suspects: [], notes: "placeholder detect()" };
      writeFileSync(resolve(artifact, "detect.jsonl"), JSON.stringify(out) + "\n");
      console.log("detect: ok");
      break;
    }
    case "triage": {
      const out = { chosen: 0, candidates: [ { file: "src/index.ts", range: [1, 40] } ] };
      writeFileSync(resolve(artifact, "triage.jsonl"), JSON.stringify(out) + "\n");
      console.log("triage: ok");
      break;
    }
    case "patch": {
      const patch = "--- a/src/index.ts\n+++ b/src/index.ts\n@@\n-console.log('hello');\n+console.log('hello world');\n";
      const patchPath = resolve(base, "patch/diff.patch");
      ensureDir(resolve(base, "patch"));
      writeFileSync(patchPath, patch);
      console.log("patch: wrote", patchPath);
      break;
    }
    case "validate": {
      const tap = "TAP version 13\nok 1 sanity\n1..1\n";
      ensureDir(resolve(artifact, "ci"));
      writeFileSync(resolve(artifact, "ci/validate.tap"), tap);
      console.log("validate: green");
      break;
    }
    case "summarize": {
      const s = "# Summary\n- cause: <hypothesis>\n- patch: patch/diff.patch\n- tests: 1 added\n";
      writeFileSync(resolve(artifact, "summary.md"), s);
      console.log("summarize: wrote artifact/summary.md");
      break;
    }
    case "package": {
      console.log("package: (placeholder) pack .ctxpack directory");
      break;
    }
    default:
      console.log(usage);
  }
}

main();
