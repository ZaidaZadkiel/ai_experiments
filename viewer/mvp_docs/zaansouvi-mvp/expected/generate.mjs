// Generator for the proposed expected run result (zaansouvi-mvp/expected/).
// M1's data comes from its real outputs; M2 and M3 are derived by their written rules (TOOL-20, TOOL-30, TOOL-31)
// under the assumptions listed in expected/README.md. Usage, from zaansouvi-mvp/, after node tests/m1/check.mjs:
//   node expected/generate.mjs .
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const root = path.resolve(process.argv[2]);
const out = path.join(root, "expected");
const m1Store = path.join(root, "data/tools/file-symbols");
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const FILES = ["src/counter.ts", "src/main.ts", "src/math.ts"]; // file ID order (RUN-28)
const key = (f) => f.split("/").join("__") + ".json";

const m1 = Object.fromEntries(FILES.map((f) => {
  const p = path.join(m1Store, "output", key(f));
  const buf = fs.readFileSync(p);
  return [f, { json: JSON.parse(buf), outputSha256: sha(buf) }];
}));
const m1Info = JSON.parse(execFileSync(path.join(root, "app/tools/file-symbols/file-symbols"), ["--info"], { encoding: "utf8" }));

// ---------- M2: TOOL-20, TOOL-21, TOOL-23 (use-site links, FND-03 decided on 2026-11-08)
const links = []; // unresolved imports are links with to: null and a reason (FND-42)
const unres = (s, spec, reason) => links.push({ id: `${s.id}->`, from: s.id, to: null, kind: "import", reason, moduleSpecifier: spec, location: s.location });
for (const f of FILES) for (const s of m1[f].json.symbols) {
  if (s.kind !== "import") continue;
  const { moduleSpecifier: spec, importedName: name } = s.import;
  if (!spec.startsWith(".")) { unres(s, spec, "external"); continue; }
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(f), spec));
  const target = m1[base + ".ts"] ? base + ".ts" : m1[base + "/index.ts"] ? base + "/index.ts" : null;
  const to = target && m1[target].json.symbols.find((t) => t.exported && t.kind !== "import" && t.name === name);
  if (!to) { unres(s, spec, target ? "not exported" : "no such file"); continue; }
  links.push({ id: `${s.id}->${to.id}`, from: s.id, to: to.id, kind: "import", moduleSpecifier: spec, location: s.location });
}
// TOOL-23: each use of a resolved import, from the reference's enclosing function, at the use's location
const resolvedImport = new Map(links.filter((l) => l.to !== null).map((l) => [l.from, l]));
for (const f of FILES) for (const r of m1[f].json.references) {
  if (r.kind === "declaration") continue;
  const imp = resolvedImport.get(r.to);
  if (imp) links.push({ id: `${r.id}->${imp.to}`, from: r.from, to: imp.to, kind: r.kind, moduleSpecifier: imp.moduleSpecifier, location: r.location });
}
const pos = (l) => [FILES.indexOf(l.location.file), l.location.start.line, l.location.start.column];
links.sort((a, b) => { const x = pos(a), y = pos(b); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; });

// ---------- M3: TOOL-30, TOOL-31, TOOL-33 (lexical scope only, each scope naming its owner: MVP-4 decided; assumptions: file scope has no location, FND-11;
// scope ID at the declaration start, FND-12)
const before = (a, b) => a.line < b.line || (a.line === b.line && a.column <= b.column);
const inside = (loc, range) => before(range.start, loc.start) && before(loc.end, range.end);
const scopes = [], membership = [];
for (const f of FILES) {
  const syms = m1[f].json.symbols;
  const fileScope = { id: `${f}#scope@file`, kind: "file", name: f, owner: f, parent: f };   // owner: TOOL-33
  scopes.push(fileScope);
  const fns = syms.filter((s) => s.kind === "function").filter((s) => !syms.some((o) => o !== s && o.kind === "function" && inside(s.range, o.range)));
  const fnScopes = fns.map((s) => ({ fn: s, scope: { id: `${f}#scope@${s.range.start.line}:${s.range.start.column}`, kind: "function", name: s.name, owner: s.id, location: s.range, parent: f } }));
  for (const x of fnScopes) scopes.push(x.scope);
  for (const s of syms) {
    const home = fnScopes.find((x) => x.fn !== s && inside(s.location, x.fn.range));
    membership.push({ child: s.id, parent: home ? home.scope.id : fileScope.id });
  }
}

// ---------- cross-checks against the hand-written tables in mvp_docs/06_test_plan.md
const unresolved = links.filter((l) => l.to === null);
const want = (cond, msg) => { if (!cond) { console.error("MISMATCH: " + msg); process.exit(1); } };
want(JSON.stringify(links.filter((l) => l.to !== null).map((l) => `${l.id} ${l.kind}`)) === JSON.stringify([
  "src/counter.ts#round@1:10->src/math.ts#round@3:17 import",
  "src/counter.ts#ref@7:10->src/math.ts#round@3:17 call",
  "src/main.ts#add@1:10->src/counter.ts#add@5:17 import",
  "src/main.ts#PRECISION@2:10->src/math.ts#PRECISION@1:14 import",
  "src/main.ts#ref@5:17->src/counter.ts#add@5:17 call",
  "src/main.ts#ref@7:34->src/math.ts#PRECISION@1:14 read"]), "links differ from the Links table (order included)");
want(unresolved.length === 0, "the test plan has no unresolved imports");
want(JSON.stringify(scopes.filter((s) => s.kind === "function").map((s) => `${s.id} ${s.location.start.line}-${s.location.end.line}`)) ===
  JSON.stringify(["src/counter.ts#scope@5:1 5-8", "src/main.ts#scope@4:1 4-10", "src/math.ts#scope@3:1 3-6"]), "function scopes differ from the Scopes table");
want(membership.length === 13, "13 symbols, 13 memberships");

// ---------- tool output files (DATA-22 header)
// M2 writes only its header and the links (DATA-06), in import-position order (files in order, symbols by position)
const m2Out = { tool: "cross-file-links", toolVersion: "0.2.0", formatVersion: 1, dataNames: { "code.link": "links" }, links };
// tools run once record nothing about their inputs (DATA-22)
const m3Out = { tool: "symbol-scope", toolVersion: "0.1.0", formatVersion: 1, dataNames: { "code.scope": "scopes", "code.membership": "membership" },
  counts: { scopeCount: scopes.length, membershipCount: membership.length }, scopes, membership };

// --info of M2 and M3, as in mvp_docs/02_data_contracts.md, DATA-08
const prm = (files, refs) => ({
  ...(files ? { symbols: { dataName: "code.symbol", shape: "array of code.symbol records", required: true, affectsOutput: true } } : {}),
  ...(refs ? { references: { dataName: "code.reference", shape: "array of code.reference records", required: true, affectsOutput: true } } : {}),
  store_path: { dataName: "zaansouvi.store_path", shape: "string", required: false, affectsOutput: false } });
const relFields = { idField: "id", fromField: "from", toField: "to", kindField: "kind", locationField: "location" };
const nodeFields = { idField: "id", parentField: "parent", labelField: "name", kindField: "kind", locationField: "location" };
const m2Info = { tool: "cross-file-links", toolVersion: "0.2.0", invocation: "once", readsFiles: false, parameters: prm(true, true),
  outputs: [{ dataName: "code.link", formatVersion: 1, represents: "relations", outputFilePattern: "output/links.json", jsonKey: "links", fields: relFields }] };
const m3Info = { tool: "symbol-scope", toolVersion: "0.1.0", invocation: "once", readsFiles: false, parameters: prm(true),
  outputs: [
    { dataName: "code.scope", formatVersion: 1, represents: "nodes", containedIn: "files.file", outputFilePattern: "output/scopes.json", jsonKey: "scopes", fields: { ...nodeFields, ownerField: "owner" } },
    { dataName: "code.membership", formatVersion: 1, represents: "containment", contains: "code.symbol", outputFilePattern: "output/scopes.json", jsonKey: "membership", fields: { childField: "child", parentField: "parent" } }] };

// ---------- events of a full run on an empty data folder
const P = { time: "<time>", runId: "<runId>", toolLog: "<toolLogPath>", runnerLog: "<runnerLogPath>", src: "<sourceRoot>" };
const inv = [...FILES.map((f) => ({ tool: "file-symbols", file_id: f })), { tool: "cross-file-links" }, { tool: "symbol-scope" }];
const events = [{ event: "run_started", runId: P.runId, mode: "real", sourceRoot: P.src, time: P.time }, { event: "files_listed", fileCount: 3 }];
for (const i of inv) {
  events.push({ event: "tool_dry_run", ...i, refreshReason: "missing", dryRun: "go", staleInputs: [] });
  events.push({ event: "tool_run", ...i, status: "succeeded", logPath: P.toolLog, outputChange: "create" });
}
events.push({ event: "run_finished", runId: P.runId, outcome: "succeeded", exitCode: 0, time: P.time, logPath: P.runnerLog });
const second = [{ event: "run_started", runId: P.runId, mode: "real", sourceRoot: P.src, time: P.time }, { event: "files_listed", fileCount: 3 },
  ...inv.map((i) => ({ event: "tool_skipped", ...i, refreshReason: "up-to-date" })),
  { event: "run_finished", runId: P.runId, outcome: "succeeded", exitCode: 0, time: P.time, logPath: P.runnerLog }];

// ---------- the Runner's cache after that run (schema section 13)
const store = (t) => `<mvpRoot>/data/tools/${t}`;
const fileEntries = FILES.map((f) => { const b = fs.readFileSync(path.join(root, "test-source", f)); return { id: f, sourceBytes: b.length, sourceSha256: sha(b) }; });
const m1Ref = (f) => `file-symbols:${f}`;
// Diagnostics are part of each run's result, never of an output file (DATA-14); the test source gives none.
const resultOf = (tool, extra) => ({ diagnostics: [], tool, toolVersion: { "file-symbols": m1Info, "cross-file-links": m2Info, "symbol-scope": m3Info }[tool].toolVersion, status: "succeeded",
  started: P.time, finished: P.time, outputPaths: ["<path>"], logPath: P.toolLog, ...extra });
const invocations = [
  ...FILES.map((f) => {
    const input = { source_root: P.src, file_id: f, file_path: `${P.src}/${f}`, store_path: store("file-symbols") };
    const fe = fileEntries.find((e) => e.id === f);
    return { tool: "file-symbols", file_id: f, refreshReason: "missing", input, dryRun: { dryRun: "go" },
      result: resultOf("file-symbols", { mode: "real", parameterSource: "stdin", nonOutputParameterSources: { store_path: "input" }, effectiveParameters: input,
        read: { file_id: f, sourcePath: `${P.src}/${f}`, sourceBytes: fe.sourceBytes, sourceSha256: fe.sourceSha256 }, outputChange: "create", counts: m1[f].json.counts }) };
  }),
  ...[["cross-file-links", m2Out], ["symbol-scope", m3Out]].map(([tool, o]) => ({ tool, refreshReason: "missing",
    input: { symbols: FILES.map(m1Ref), ...(tool === "cross-file-links" ? { references: FILES.map(m1Ref) } : {}), store_path: store(tool) }, dryRun: { dryRun: "go" },
    result: resultOf(tool, { outputChange: "create", ...(o.counts ? { counts: o.counts } : {}) }) })),
];
const group = (info, dataName, outputs) => {
  const o = info.outputs.find((x) => x.dataName === dataName);
  return { represents: o.represents, ...(o.containedIn ? { containedIn: o.containedIn } : {}), ...(o.contains ? { contains: o.contains } : {}), fields: o.fields, outputs };
};
const cache = {
  formatVersion: 1,
  run: { runId: P.runId, mode: "real", outcome: "succeeded", exitCode: 0, started: P.time, finished: P.time, sourceRoot: P.src, logPath: P.runnerLog },
  files: fileEntries,
  tools: [{ tool: "file-symbols", position: 1, info: m1Info }, { tool: "cross-file-links", position: 2, info: m2Info }, { tool: "symbol-scope", position: 3, info: m3Info }],
  invocations,
  data: {
    "code.symbol": group(m1Info, "code.symbol", FILES.map((f) => ({ tool: "file-symbols", dataRef: m1Ref(f), file: f, records: m1[f].json.symbols }))),
    "code.reference": group(m1Info, "code.reference", FILES.map((f) => ({ tool: "file-symbols", dataRef: m1Ref(f), file: f, records: m1[f].json.references }))),
    "code.link": group(m2Info, "code.link", [{ tool: "cross-file-links", dataRef: "cross-file-links", records: links }]),
    "code.scope": group(m3Info, "code.scope", [{ tool: "symbol-scope", dataRef: "symbol-scope", records: scopes }]),
    "code.membership": group(m3Info, "code.membership", [{ tool: "symbol-scope", dataRef: "symbol-scope", records: membership }]),
  },
};

// ---------- writing: short objects on one line, so the files stay readable
function fmt(v, ind = "") {
  const one = JSON.stringify(v);
  if (one.length <= 150 || v === null || typeof v !== "object") return one;
  const next = ind + "  ";
  if (Array.isArray(v)) return "[\n" + v.map((x) => next + fmt(x, next)).join(",\n") + "\n" + ind + "]";
  return "{\n" + Object.entries(v).map(([k, x]) => `${next}${JSON.stringify(k)}: ${fmt(x, next)}`).join(",\n") + "\n" + ind + "}";
}
const write = (name, obj) => fs.writeFileSync(path.join(out, name), fmt(obj) + "\n");
const PROPOSED = `Proposed expected result (2026-11-07), generated: M1's data from its real output (file-symbols ${m1Info.toolVersion}), M2 and M3 derived by TOOL-20, TOOL-30 and TOOL-31 under the assumptions in expected/README.md.`;
write("cross-file-links.json", { about: PROPOSED, ...m2Out });
write("symbol-scope.json", { about: PROPOSED, ...m3Out });
write("runner-cache.json", { about: PROPOSED + " Placeholders in <angle brackets>; see README.md for how to compare.", ...cache });
fs.writeFileSync(path.join(out, "run-events.jsonl"), events.map((e) => JSON.stringify(e)).join("\n") + "\n");
fs.writeFileSync(path.join(out, "run-events-second.jsonl"), second.map((e) => JSON.stringify(e)).join("\n") + "\n");
console.log(`links ${links.length}, unresolved ${unresolved.length}, scopes ${scopes.length}, membership ${membership.length}, events ${events.length}/${second.length}`);
