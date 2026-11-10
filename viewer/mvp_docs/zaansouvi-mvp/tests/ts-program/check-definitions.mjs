// The sanity check of the definition of a correct graph, part E (mvp_docs/41_typescript_program_plan.md, section 1.1):
// for every edge ts-program writes, asks TypeScript's language service "go to definition" at the use, and checks that the
// edge's target is among the definitions it returns. The same compiler, but not ts-program's code: this catches mistakes
// in ts-program's walk. Uses test-source-mvp2 and the options of `tsc --init` (TPG-D4a).
// Run from zaansouvi-mvp/: node tests/ts-program/check-definitions.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const root = path.resolve(import.meta.dirname, "../..");
const ts = createRequire(path.join(root, "app/tools/ts-program/package.json"))("typescript");
const src = path.join(root, "test-source-mvp2");
const files = ["src/app.ts", "src/shapes.ts", "src/util/numbers.ts", "src/report/format.ts", "src/report/summary.ts", "src/report/charts/bars.ts"];
const work = fs.mkdtempSync(path.join(os.tmpdir(), "ts-defs-"));
const run = spawnSync(path.join(root, "app/tools/ts-program/ts-program"), ["--stdin"], { cwd: work, input: JSON.stringify({ source_root: src, files }), encoding: "utf8" });
if (run.status !== 0) { console.log("FAIL: ts-program exited", run.status); process.exit(1); }
const outs = files.map((f) => JSON.parse(fs.readFileSync(path.join(work, "zaansouvi/tools/ts-program/output", f.split("/").join("__") + ".json"), "utf8")));
fs.rmSync(work, { recursive: true, force: true });
const symbols = new Map(outs.flatMap((o) => o.symbols).map((s) => [s.id, s]));
const refs = outs.flatMap((o) => o.references).filter((r) => r.to !== null);

const options = { target: ts.ScriptTarget.ES2016, module: ts.ModuleKind.CommonJS, esModuleInterop: true, strict: true, skipLibCheck: true, types: [] };
const abs = files.map((f) => path.join(src, f));
const service = ts.createLanguageService({
  getScriptFileNames: () => abs, getScriptVersion: () => "1", getCompilationSettings: () => options,
  getScriptSnapshot: (f) => (fs.existsSync(f) ? ts.ScriptSnapshot.fromString(fs.readFileSync(f, "utf8")) : undefined),
  getCurrentDirectory: () => src, getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
  fileExists: (f) => fs.existsSync(f), readFile: (f) => fs.readFileSync(f, "utf8"),
});
const program = service.getProgram();
const posOf = (file, line, column) => program.getSourceFile(path.join(src, file)).getPositionOfLineAndCharacter(line - 1, column - 1);
const locOf = (fileName, start) => {
  const sf = program.getSourceFile(fileName);
  const lc = sf.getLineAndCharacterOfPosition(start);
  return `${path.relative(src, fileName)} ${lc.line + 1}:${lc.character + 1}`;
};
// Where a target is declared: its own position, every merged declaration's, or for a file, the file itself.
const targetPlaces = (id) => {
  const s = symbols.get(id);
  if (!s) return [`${id} file`];
  return [s.location, ...(s.declarations ?? [])].map((l) => `${l.file} ${l.start.line}:${l.start.column}`);
};

let agree = 0;
const disagree = [];
for (const r of refs) {
  const defs = service.getDefinitionAtPosition(path.join(src, r.location.file), posOf(r.location.file, r.location.start.line, r.location.start.column)) ?? [];
  // A file is an empty span at its start (a namespace is also of kind "module", so the kind can't tell them apart).
  const places = defs.map((d) => (d.textSpan.start === 0 && d.textSpan.length === 0 ? `${path.relative(src, d.fileName)} file` : locOf(d.fileName, d.textSpan.start)));
  let want = targetPlaces(r.to);
  // Known differences, each still checked: go to definition stops at a namespace import itself, where the definition
  // follows it to the module (B8): it must stop at the import the edge goes through. For a use resolved to several
  // declarations (a union, part C), it names one of them: it must name one of the union's own targets.
  if (r.viaImport && symbols.get(r.viaImport)?.import?.importedName === "*") want = [...want, ...targetPlaces(r.viaImport)];
  if (r.union) {
    const base = r.id.replace(/\.\d+$/, "");
    want = refs.filter((x) => x.id.replace(/\.\d+$/, "") === base).flatMap((x) => targetPlaces(x.to));
  }
  if (want.some((w) => places.includes(w))) agree++;
  else disagree.push(`${r.location.file} ${r.location.start.line}:${r.location.start.column} ${r.kind} ${r.name}: ts-program -> ${r.to}; go to definition -> ${places.join(", ") || "nothing"}`);
}
console.log(`edges: ${refs.length}; agreeing with go to definition: ${agree}; disagreeing: ${disagree.length}`);
for (const d of disagree) console.log("  " + d);
console.log(disagree.length ? "FAIL: see the edges above" : "PASS: every edge's target is where go to definition leads");
process.exit(disagree.length ? 1 : 0);
