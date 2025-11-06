import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { test, expect } from "vitest";

const run = (cmd: string) => execSync(cmd, { stdio: "pipe" }).toString();

test("smell→rank→propose→validate pipeline", () => {
  run("node ./src/cli.ts smell -p ./work/.ctxpack");
  run("node ./src/cli.ts rank -p ./work/.ctxpack");
  run("node ./src/cli.ts propose -p ./work/.ctxpack");
  run("node ./src/cli.ts validate -p ./work/.ctxpack");
  expect(existsSync("./work/.ctxpack/smell/refactor_proposal.md")).toBe(true);
});
