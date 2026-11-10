// Checks ts-program on test-source-mvp2 against the expected graph written by hand (expected-mvp2/expected-graph.json;
// mvp_docs/41_typescript_program_plan.md, section 1.1, part E). Runs the tool in a temporary folder outside the source,
// then compares, category by category: nodes (id, kind, parent; and since FND-110 exported, defaultExport, declaredWith,
// modifiers, the number of declarations), edges (from, to, kind, place), import links, built-in
// uses and unresolved uses. Prints every difference; exits 1 if there is any.
// Run from zaansouvi-mvp/: node tests/ts-program/check.mjs [<output folder>]
// With an output folder (for example data/tools/ts-program/output after a Runner run, TEST-01), it compares those files
// instead of running the tool.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "../..");
const src = path.join(root, "test-source-mvp2");
const tool = path.join(root, "app/tools/ts-program/ts-program");
const expected = JSON.parse(fs.readFileSync(path.join(root, "expected-mvp2/expected-graph.json"), "utf8"));
const work = fs.mkdtempSync(path.join(os.tmpdir(), "ts-program-check-"));

const files = ["src/app.ts", "src/shapes.ts", "src/util/numbers.ts", "src/report/format.ts", "src/report/summary.ts", "src/report/charts/bars.ts"];
let outDir = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
if (!outDir) {
  const run = spawnSync(tool, ["--stdin"], { cwd: work, input: JSON.stringify({ source_root: src, files }), encoding: "utf8" });
  if (run.status !== 0) {
    console.log("FAIL: ts-program exited", run.status, run.stderr.slice(0, 2000));
    process.exit(1);
  }
  outDir = path.join(work, "zaansouvi/tools/ts-program/output");
}
const outs = files.map((f) => JSON.parse(fs.readFileSync(path.join(outDir, f.split("/").join("__") + ".json"), "utf8")));
const symbols = outs.flatMap((o) => o.symbols);
const refs = outs.flatMap((o) => o.references);
const links = outs.flatMap((o) => o.links);
const at = (r) => `${r.location.file} ${r.location.start.line}:${r.location.start.column}`;

const problems = [];
function compare(label, exp, got) {
  const e = new Map(), g = new Map();
  for (const x of exp) e.set(x, (e.get(x) ?? 0) + 1);
  for (const x of got) g.set(x, (g.get(x) ?? 0) + 1);
  const missing = [...e].filter(([k, n]) => (g.get(k) ?? 0) < n).map(([k]) => k);
  const extra = [...g].filter(([k, n]) => (e.get(k) ?? 0) < n).map(([k]) => k);
  console.log(`${label}: expected ${exp.length}, got ${got.length}${missing.length || extra.length ? `, ${missing.length} missing, ${extra.length} unexpected` : ", match"}`);
  for (const m of missing) problems.push(`${label} missing:    ${m}`);
  for (const x of extra) problems.push(`${label} unexpected: ${x}`);
}
// A node's short facts too (FND-110): exported, default export, declared with, modifiers in order, declarations.
const facts = (n) => `${n.exported ? " exported" : ""}${n.defaultExport ? " default" : ""}${n.declaredWith ? ` ${n.declaredWith}` : ""}` +
  `${n.modifiers?.length ? ` [${n.modifiers.join(" ")}]` : ""}${n.declarations ? ` ${n.declarations.length} declarations` : ""}`;
compare("nodes", expected.nodes.map((n) => `${n.id} ${n.kind} in ${n.parent}${n.declaredIn ? ` declared in ${n.declaredIn}` : ""}${facts(n)}`),
  symbols.map((s) => `${s.id} ${s.kind} in ${s.parent}${s.declaredIn ? ` declared in ${s.declaredIn}` : ""}${facts(s)}`));
compare("edges", expected.edges.map((e) => `${e.at} ${e.kind} ${e.from} -> ${e.to}${e.member ? " member" : ""}${e.union ? " union" : ""}${e.viaImport ? ` via ${e.viaImport}` : ""}`),
  refs.filter((r) => r.to !== null).map((r) => `${at(r)} ${r.kind} ${r.from} -> ${r.to}${r.member ? " member" : ""}${r.union ? " union" : ""}${r.viaImport ? ` via ${r.viaImport}` : ""}`));
compare("links", expected.links.map((l) => `${l.from} -> ${l.to}`), links.map((l) => `${l.from} -> ${l.to}`));
compare("built-ins", expected.builtins.map((b) => `${b.at} ${b.kind} ${b.from} ${b.name}${b.member ? " member" : ""}`),
  refs.filter((r) => r.reason === "built-in").map((r) => `${at(r)} ${r.kind} ${r.from} ${r.builtin}${r.member ? " member" : ""}`));
compare("unresolved", expected.unresolved.map((u) => `${u.at} ${u.kind} ${u.from} ${u.name} (${u.reason})`),
  refs.filter((r) => r.to === null && r.reason !== "built-in").map((r) => `${at(r)} ${r.kind} ${r.from} ${r.name} (${r.reason})`));

fs.rmSync(work, { recursive: true, force: true });
for (const p of problems) console.log("  " + p);
console.log(problems.length ? `FAIL: ${problems.length} difference(s)` : "PASS: ts-program matches the expected graph of test-source-mvp2");
process.exit(problems.length ? 1 : 0);
