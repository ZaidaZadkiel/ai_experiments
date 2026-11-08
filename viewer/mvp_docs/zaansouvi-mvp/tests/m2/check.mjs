// TEST-01 for M2 alone: runs cross-file-links on M1's records for test-source/ (dry run, then real run, as the
// Runner will), and compares the output with expected/cross-file-links.json. Prints every difference.
// Needs M1's outputs: run `node tests/m1/check.mjs` first. Usage: node tests/m2/check.mjs
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "..");
const launcher = path.join(root, "app/tools/cross-file-links/cross-file-links");
const m1Out = path.join(root, "data/tools/file-symbols/output");
const storePath = path.join(root, "data/tools/cross-file-links"); // the store the Runner passes (RUN-26)
const problems = [];
const fail = (m) => problems.push(m);

// The input the Runner builds (RUN-19, DATA-13): only M1's records, flat, files in file ID order.
const files = ["src/counter.ts", "src/main.ts", "src/math.ts"];
const m1 = files.map((f) => {
  const p = path.join(m1Out, f.split("/").join("__") + ".json");
  if (!fs.existsSync(p)) { console.error(`Missing ${p}: run node tests/m1/check.mjs first.`); process.exit(2); }
  return JSON.parse(fs.readFileSync(p, "utf8"));
});
const input = JSON.stringify({ symbols: m1.flatMap((o) => o.symbols), references: m1.flatMap((o) => o.references), store_path: storePath });

const dry = spawnSync(launcher, ["--dry-run", "--stdin"], { input, encoding: "utf8" });
const lines = dry.stdout.trim().split("\n").map((l) => JSON.parse(l));
if (dry.status !== 0 || lines.at(-1).dryRun !== "go") fail(`dry run should be go, got exit ${dry.status}: ${JSON.stringify(lines.at(-1))}`);
if (lines.some((l) => l.type === "preview")) fail("the dry run printed a preview line; M2 prints none");

const real = spawnSync(launcher, ["--stdin"], { input, encoding: "utf8" });
if (real.status !== 0) { console.log(`FAIL: real run exit ${real.status}: ${real.stderr}`); process.exit(1); }
const summary = JSON.parse(real.stdout.trim().split("\n").at(-1));
const actual = JSON.parse(fs.readFileSync(summary.outputPath, "utf8"));
const expected = JSON.parse(fs.readFileSync(path.join(root, "expected/cross-file-links.json"), "utf8"));
delete expected.about;

// Exact comparison, link order included (DATA-06: ordered by the import's position).
if (JSON.stringify(Object.keys(actual)) !== JSON.stringify(Object.keys(expected))) fail(`top-level keys: expected ${Object.keys(expected)}, got ${Object.keys(actual)}`);
for (const k of ["tool", "toolVersion", "formatVersion", "dataNames"]) if (JSON.stringify(actual[k]) !== JSON.stringify(expected[k])) fail(`${k}: expected ${JSON.stringify(expected[k])}, got ${JSON.stringify(actual[k])}`);
const n = Math.max(actual.links.length, expected.links.length);
for (let i = 0; i < n; i++) {
  const a = JSON.stringify(actual.links[i]), e = JSON.stringify(expected.links[i]);
  if (a !== e) fail(`link ${i}: expected ${e?.slice(0, 160)}, got ${a?.slice(0, 160)}`);
}

// Repeatability (FND-29): a second run gives byte-identical output.
const again = spawnSync(launcher, ["--stdin"], { input, encoding: "utf8" });
const s2 = JSON.parse(again.stdout.trim().split("\n").at(-1));
if (s2.outputChange !== "unchanged") fail(`second run changed the output (${s2.outputChange})`);

console.log(`links: ${actual.links.length} (${actual.links.map((l) => l.kind).join(", ")})`);
if (problems.length === 0) console.log("PASS: M2 output matches expected/cross-file-links.json");
else { console.log(`FAIL: ${problems.length} difference(s)`); for (const p of problems) console.log("  - " + p); process.exitCode = 1; }
