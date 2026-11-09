// TEST-06 and TEST-07 for M3 (mvp_docs/06_test_plan.md, "M3 checks").
// TEST-06: runs symbol-scope on M1's records for test-source/ (dry run, then real run, as the Runner will), and
// compares the output exactly with expected/symbol-scope.json. Prints every difference.
// TEST-07: runs M1 on tests/m3/source/ (nested functions, a file with file-level symbols only), then M3 on those
// records, and checks the scopes and memberships in the test plan's table.
// TEST-07 uses temporary stores; each tool's last_run.json sits in its store (toolset.md 4.5), so nothing else is written.
// Needs M1's outputs for test-source/: run `node tests/m1/check.mjs` first. Usage: node tests/m3/check.mjs
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "..");
const m1Launcher = path.join(root, "app/tools/file-symbols/file-symbols");
const launcher = path.join(root, "app/tools/symbol-scope/symbol-scope");
const m1Out = path.join(root, "data/tools/file-symbols/output");
const storePath = path.join(root, "data/tools/symbol-scope"); // the store the Runner passes (RUN-26)
const problems = [];
const fail = (m) => problems.push(m);
const lastLine = (s) => JSON.parse(s.trim().split("\n").at(-1));

// ---------- TEST-06
// The input the Runner builds (RUN-19, DATA-13): only M1's symbol records, flat, files in file ID order.
const files = ["src/counter.ts", "src/main.ts", "src/math.ts"];
const m1 = files.map((f) => {
  const p = path.join(m1Out, f.split("/").join("__") + ".json");
  if (!fs.existsSync(p)) { console.error(`Missing ${p}: run node tests/m1/check.mjs first.`); process.exit(2); }
  return JSON.parse(fs.readFileSync(p, "utf8"));
});
const input = JSON.stringify({ symbols: m1.flatMap((o) => o.symbols), store_path: storePath });

const outFile = path.join(storePath, "output/scopes.json");
const before = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8") : null;
const dry = spawnSync(launcher, ["--dry-run", "--stdin"], { input, encoding: "utf8" });
const lines = dry.stdout.trim().split("\n").map((l) => JSON.parse(l));
if (dry.status !== 0 || lines.at(-1).dryRun !== "go") fail(`dry run should be go, got exit ${dry.status}: ${JSON.stringify(lines.at(-1))}`);
if (lines.some((l) => l.type === "preview")) fail("the dry run printed a preview line; M3 prints none");
const afterDry = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8") : null;
if (afterDry !== before) fail("the dry run changed output/scopes.json (TOOL-06: it writes nothing)");

const real = spawnSync(launcher, ["--stdin"], { input, encoding: "utf8" });
if (real.status !== 0) { console.log(`FAIL: real run exit ${real.status}: ${real.stderr}`); process.exit(1); }
const summary = lastLine(real.stdout);
const actual = JSON.parse(fs.readFileSync(summary.outputPath, "utf8"));
const expected = JSON.parse(fs.readFileSync(path.join(root, "expected/symbol-scope.json"), "utf8"));
delete expected.about;

// Exact comparison, order included (TOOL-35).
if (JSON.stringify(Object.keys(actual)) !== JSON.stringify(Object.keys(expected))) fail(`top-level keys: expected ${Object.keys(expected)}, got ${Object.keys(actual)}`);
for (const k of ["tool", "toolVersion", "formatVersion", "dataNames", "counts"]) {
  if (JSON.stringify(actual[k]) !== JSON.stringify(expected[k])) fail(`${k}: expected ${JSON.stringify(expected[k])}, got ${JSON.stringify(actual[k])}`);
}
for (const key of ["scopes", "membership"]) {
  const n = Math.max(actual[key].length, expected[key].length);
  for (let i = 0; i < n; i++) {
    const a = JSON.stringify(actual[key][i]), e = JSON.stringify(expected[key][i]);
    if (a !== e) fail(`${key} ${i}: expected ${e?.slice(0, 200)}, got ${a?.slice(0, 200)}`);
  }
}
const result = JSON.parse(fs.readFileSync(path.join(storePath, "result.json"), "utf8"));
if (result.status !== "succeeded" || result.diagnostics.length !== 0) fail(`result.json: expected succeeded with no diagnostics, got ${result.status}, ${result.diagnostics.length} diagnostic(s)`);

// Repeatability (DATA-22): a second run gives byte-identical output.
const again = spawnSync(launcher, ["--stdin"], { input, encoding: "utf8" });
if (lastLine(again.stdout).outputChange !== "unchanged") fail(`second run changed the output (${lastLine(again.stdout).outputChange})`);
// The output never depends on the order of the input records (toolset.md 2, TOOL-35, FND-58): the files reversed
// and the records shuffled give the same bytes. Written to a temporary store.
{
  const tmpStore = fs.mkdtempSync(path.join(os.tmpdir(), "zaansouvi-m3-order-"));
  try {
    const reversed = m1.slice().reverse().flatMap((o) => o.symbols.slice().reverse());
    const r = spawnSync(launcher, ["--stdin"], { input: JSON.stringify({ symbols: reversed, store_path: tmpStore }), encoding: "utf8" });
    if (r.status !== 0) fail(`reversed input: exit ${r.status}`);
    else if (fs.readFileSync(path.join(tmpStore, "output/scopes.json"), "utf8") !== fs.readFileSync(summary.outputPath, "utf8")) {
      fail("reversed input order gives a different output (TOOL-35)");
    }
  } finally {
    fs.rmSync(tmpStore, { recursive: true, force: true });
  }
}
console.log(`TEST-06: scopes ${actual.scopes.length}, memberships ${actual.membership.length}; same output with the input reversed`);

// ---------- TEST-07
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zaansouvi-m3-"));
try {
  const sourceRoot = path.join(root, "tests/m3/source");
  const extraFiles = ["src/nested.ts", "src/only-vars.ts"]; // file ID order (RUN-28)
  const symbols = [];
  for (const f of extraFiles) {
    const m1Input = JSON.stringify({ source_root: sourceRoot, file_id: f, store_path: path.join(tmp, "m1") });
    const r = spawnSync(m1Launcher, ["--stdin"], { input: m1Input, encoding: "utf8" });
    if (r.status !== 0) throw new Error(`M1 failed on ${f}: ${r.stderr}`);
    symbols.push(...JSON.parse(fs.readFileSync(lastLine(r.stdout).outputPath, "utf8")).symbols);
  }
  const r = spawnSync(launcher, ["--stdin"], { input: JSON.stringify({ symbols, store_path: path.join(tmp, "m3") }), encoding: "utf8" });
  if (r.status !== 0) throw new Error(`M3 failed: ${r.stderr}`);
  const out = JSON.parse(fs.readFileSync(lastLine(r.stdout).outputPath, "utf8"));

  // The table in 06_test_plan.md, TEST-07.
  const want = [
    ["src/nested.ts#scope@file", "1:1-10:2", ["src/nested.ts#outer@1:17", "src/nested.ts#second@8:17"]],
    ["src/nested.ts#scope@1:1", "1:1-6:2", ["src/nested.ts#a@1:23", "src/nested.ts#inner@2:12", "src/nested.ts#b@2:18"]],
    ["src/nested.ts#scope@8:1", "8:1-10:2", []],
    ["src/only-vars.ts#scope@file", "1:1-2:14", ["src/only-vars.ts#LIMIT@1:14", "src/only-vars.ts#count@2:5"]],
  ];
  const span = (l) => `${l.start.line}:${l.start.column}-${l.end.line}:${l.end.column}`;
  if (JSON.stringify(out.scopes.map((s) => s.id)) !== JSON.stringify(want.map((w) => w[0]))) {
    fail(`TEST-07 scopes: expected ${want.map((w) => w[0]).join(", ")}, got ${out.scopes.map((s) => s.id).join(", ")}`);
  }
  for (const [id, where, members] of want) {
    const s = out.scopes.find((x) => x.id === id);
    if (!s) continue;
    if (span(s.location) !== where) fail(`TEST-07 ${id}: location expected ${where}, got ${span(s.location)}`);
    const got = out.membership.filter((m) => m.parent === id).map((m) => m.child);
    if (JSON.stringify(got) !== JSON.stringify(members)) fail(`TEST-07 ${id}: members expected ${members.join(", ") || "none"}, got ${got.join(", ") || "none"}`);
  }
  const owners = { "src/nested.ts#scope@1:1": "src/nested.ts#outer@1:17", "src/nested.ts#scope@8:1": "src/nested.ts#second@8:17", "src/only-vars.ts#scope@file": "src/only-vars.ts" };
  for (const [id, owner] of Object.entries(owners)) {
    const s = out.scopes.find((x) => x.id === id);
    if (s && s.owner !== owner) fail(`TEST-07 ${id}: owner expected ${owner}, got ${s.owner}`);
  }
  if (out.counts.scopeCount !== 4 || out.counts.membershipCount !== 7) fail(`TEST-07 counts: expected 4 and 7, got ${JSON.stringify(out.counts)}`);
  console.log(`TEST-07: scopes ${out.scopes.length}, memberships ${out.membership.length}`);
} catch (e) {
  fail(`TEST-07: ${e.message}`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (problems.length === 0) console.log("PASS: M3 matches expected/symbol-scope.json and the TEST-07 table");
else { console.log(`FAIL: ${problems.length} difference(s)`); for (const p of problems) console.log("  - " + p); process.exitCode = 1; }
