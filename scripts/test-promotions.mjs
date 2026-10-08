import process from "node:process";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
const directory = await mkdtemp(join(tmpdir(), "promotion-tests-"));
try {
  const file = join(directory, "tests.cjs");
  await build({ entryPoints: ["tests/promotions.test.tsx"], outfile: file, bundle: true, platform: "node", format: "cjs", packages: "external" });
  const child = spawn(process.execPath, ["--test", file], { stdio: "inherit", env: { ...process.env, NODE_PATH: join(process.cwd(), "node_modules") } });
  process.exitCode = await new Promise(resolve => child.on("exit", resolve));
} finally { await rm(directory, { recursive: true, force: true }); }
