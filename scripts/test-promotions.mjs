import process from "node:process";
import { build } from "esbuild";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
const directory = await mkdtemp(join(tmpdir(), "promotion-tests-"));
try {
  const file = join(directory, "tests.cjs");
  await build({ entryPoints: ["tests/promotions.test.tsx"], outfile: file, bundle: true, platform: "node", format: "cjs", packages: "external", plugins: [{ name: "raw", setup(build) { build.onResolve({ filter: /\?raw$/ }, args => ({ path: resolve(args.resolveDir, args.path.slice(0, -4)), namespace: "raw" })); build.onLoad({ filter: /.*/, namespace: "raw" }, async args => ({ contents: await readFile(args.path, "utf8"), loader: "text" })); } }] });
  const child = spawn(process.execPath, ["--test", file, "tests/promotions-runtime.test.cjs"], { stdio: "inherit", env: { ...process.env, NODE_PATH: join(process.cwd(), "node_modules") } });
  process.exitCode = await new Promise(resolve => child.on("exit", resolve));
} finally { await rm(directory, { recursive: true, force: true }); }
