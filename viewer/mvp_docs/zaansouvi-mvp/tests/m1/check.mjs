// TEST-01 for M1 alone: runs file-symbols on every test-source file (dry run, then real run, as the
// Runner will), then compares the outputs with expected/file-symbols.json. Prints every difference.
// Usage: node tests/m1/check.mjs        Exit code 0 when everything matches.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "..");
const launcher = path.join(root, "app/tools/file-symbols/file-symbols");
const sourceRoot = path.join(root, "test-source");
// The store the Runner will pass (ARCH layout); without it M1 would write into ./zaansouvi/tools/file-symbols/ of the working folder.
const storePath = path.join(root, "data/tools/file-symbols");
const expected = JSON.parse(fs.readFileSync(path.join(root, "expected/file-symbols.json"), "utf8"));

const problems = [];
const fail = (msg) => problems.push(msg);
const outputs = {};
const timings = [];

for (const file of expected.files) {
  const input = JSON.stringify({ source_root: sourceRoot, file_id: file, file_path: path.join(sourceRoot, file), store_path: storePath });

  const dry = spawnSync(launcher, ["--dry-run", "--stdin"], { input, encoding: "utf8" });
  const lines = dry.stdout.trim().split("\n");
  const last = JSON.parse(lines.at(-1));
  if (dry.status !== 0 || last.dryRun !== "go") fail(`${file}: dry run should be go, got exit ${dry.status}: ${lines.at(-1)}`);
  const preview = lines.map((l) => JSON.parse(l)).find((l) => l.type === "preview");
  if (!preview) fail(`${file}: dry run printed no preview line`);

  const t0 = performance.now();
  const real = spawnSync(launcher, ["--stdin"], { input, encoding: "utf8" });
  timings.push({ file, ms: Math.round(performance.now() - t0) });
  if (real.status !== 0) {
    fail(`${file}: real run failed, exit ${real.status}: ${real.stderr.trim()}`);
    continue;
  }
  const summary = JSON.parse(real.stdout.trim().split("\n").at(-1));
  outputs[file] = JSON.parse(fs.readFileSync(summary.outputPath, "utf8"));
  if (preview && JSON.stringify(preview.content) !== JSON.stringify(outputs[file])) {
    fail(`${file}: the dry-run preview differs from the real output`);
  }
}

const all = (key) => Object.values(outputs).flatMap((o) => o[key]);
const symbols = all("symbols");
const references = all("references");

// Symbols: exact set.
const symKey = (s) => [s.id, s.name, s.kind, s.exported, s.import ? `${s.import.moduleSpecifier}:${s.import.importedName}` : ""].join(" | ");
const gotSymbols = new Set(symbols.map(symKey));
const wantSymbols = new Set(
  expected.symbols.map((e) => {
    const s = symbols.find((x) => x.id === e.id);
    if (s && (s.parent !== e.file || s.location.start.line !== e.line)) fail(`symbol ${e.id}: wrong parent or line`);
    return symKey(e);
  }),
);
for (const k of wantSymbols) if (!gotSymbols.has(k)) fail(`missing symbol: ${k}`);
for (const k of gotSymbols) if (!wantSymbols.has(k)) fail(`unexpected symbol: ${k}`);

// Function ranges (FND-09: the whole declaration).
for (const r of expected.functionRanges) {
  const s = symbols.find((x) => x.id === r.id);
  const got = s && `${s.range.start.line}:${s.range.start.column}-${s.range.end.line}:${s.range.end.column}`;
  if (got !== `${r.start}-${r.end}`) fail(`range of ${r.id}: expected ${r.start}-${r.end}, got ${got}`);
}

// Declaration references: one per symbol, at its location.
for (const s of symbols) {
  const decl = references.filter((r) => r.kind === "declaration" && r.to === s.id);
  if (decl.length !== 1) fail(`symbol ${s.id}: expected 1 declaration reference, got ${decl.length}`);
  else if (JSON.stringify(decl[0].location) !== JSON.stringify(s.location)) fail(`symbol ${s.id}: declaration reference at a different location`);
}

// Other references: multiset comparison.
const refKey = (r) => [r.file, r.line, r.name, r.kind, r.target ?? "none", r.enclosing].join(" | ");
const count = (keys) => keys.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map());
const got = count(
  references
    .filter((r) => r.kind !== "declaration")
    .map((r) => refKey({ file: r.location.file, line: r.location.start.line, name: r.name, kind: r.kind, target: r.to, enclosing: r.enclosing })),
);
const want = count(expected.references.map(refKey));
for (const [k, n] of want) if ((got.get(k) ?? 0) !== n) fail(`reference expected ${n}x, got ${got.get(k) ?? 0}x: ${k}`);
for (const [k, n] of got) if (!want.has(k)) fail(`unexpected reference (${n}x): ${k}`);

// Uniform relation fields (FND-02).
for (const r of references) {
  if (r.from !== r.enclosing || r.to !== r.symbol) fail(`reference ${r.id}: from/to don't mirror enclosing/symbol`);
}

// Property names must not appear.
for (const m of expected.mustNotAppear) {
  if (references.some((r) => r.location.file === m.file && r.location.start.line === m.line && r.name === m.name)) {
    fail(`must not appear: ${m.name} at ${m.file}:${m.line} (${m.why})`);
  }
}

// Repeatability (FND-29): a second run gives byte-identical output.
for (const file of expected.files) {
  const input = JSON.stringify({ source_root: sourceRoot, file_id: file, store_path: storePath });
  const again = spawnSync(launcher, ["--stdin"], { input, encoding: "utf8" });
  const summary = JSON.parse(again.stdout.trim().split("\n").at(-1));
  if (summary.outputChange !== "unchanged") fail(`${file}: second run changed the output (${summary.outputChange})`);
}

console.log(`files: ${Object.keys(outputs).length}, symbols: ${symbols.length}, references: ${references.length}`);
console.log(`real-run timings (ms): ${timings.map((t) => `${t.file} ${t.ms}`).join(", ")}`);
if (problems.length === 0) {
  console.log("PASS: M1 output matches expected/file-symbols.json");
} else {
  console.log(`FAIL: ${problems.length} difference(s)`);
  for (const p of problems) console.log("  - " + p);
  process.exitCode = 1;
}
