// BE-91 and the model part of BE-92 (mvp_docs/55_viewer_backend.md): builds the Viewer's graph model from
// expected/runner-cache.json, compares its views with expected/graph-views.json (written by hand from
// 50_viewer_ui.md, section 4.1), checks that two builds give the same bytes, then builds it from damaged copies of the
// cache and checks the invalid and extra items found. Read only. Usage, from zaansouvi-mvp/: node tests/viewer/check-model.mjs
import fs from "node:fs";
import path from "node:path";
import { buildModel } from "../../app/viewer/server/src/model.ts";

const root = path.resolve(import.meta.dirname, "..", "..");
const cache = JSON.parse(fs.readFileSync(path.join(root, "expected/runner-cache.json"), "utf8"));
delete cache.about;
const expected = JSON.parse(fs.readFileSync(path.join(root, "expected/graph-views.json"), "utf8")).views;
const problems = [];
const fail = (m) => problems.push(m);
const j = (v) => JSON.stringify(v);

// ---- the test source
const model = buildModel(cache, "test", "0.1.0");
for (const [key, want] of Object.entries(expected)) {
  const got = model.levels[key];
  const name = key === "" ? "top view" : key;
  if (!got) { fail(`${name}: no such view`); continue; }
  if (j(got.nodes) !== j(want.nodes)) fail(`${name}: nodes ${j(got.nodes)}, expected ${j(want.nodes)}`);
  if (j(got.stubs) !== j(want.stubs)) fail(`${name}: stubs ${j(got.stubs)}, expected ${j(want.stubs)}`);
  if (got.thisNode !== want.thisNode) fail(`${name}: thisNode ${got.thisNode}, expected ${want.thisNode}`);
  const edges = got.edges.map((e) => ({ from: e.from, to: e.to, count: e.count, kind: e.kind }));
  if (j(edges) !== j(want.edges)) fail(`${name}: edges\n      got      ${j(edges)}\n      expected ${j(want.edges)}`);
  for (const e of got.edges) if (e.members.length !== e.count) fail(`${name}: edge ${e.id} counts ${e.count} but has ${e.members.length} members`);
  if (got.unresolved.length !== want.unresolved) fail(`${name}: ${got.unresolved.length} unresolved, expected ${want.unresolved}`);
}
const views = Object.keys(model.levels).length;
if (views !== 10) fail(`${views} views, expected 10 (top, 3 files, 6 scopes, BE-54)`);
if (model.checks.invalid.length !== 0) fail(`invalid items on the test source: ${j(model.checks.invalid)}`);
if (j(buildModel(cache, "test", "0.1.0")) !== j(model)) fail("two builds of the same cache differ (BE-50)");
console.log(`test source: ${views} views, ${model.nodes.length} nodes, ${model.relations.length} relations; extra: ${model.checks.extra.map((e) => e.dataName + " " + e.detail).join("; ") || "none"}`);

// ---- damaged copies (BE-92, VIEW-15)
const damaged = (name, change, expect) => {
  const c = structuredClone(cache);
  change(c);
  let m;
  try { m = buildModel(c, "test", "0.1.0"); } catch (e) { fail(`${name}: the build threw: ${e.message}`); return; }
  const found = [...m.checks.invalid.map((i) => `invalid: ${i.problem}`), ...m.checks.extra.map((x) => `extra: ${x.what}`)];
  for (const want of expect) if (!found.some((f) => f.includes(want))) fail(`${name}: expected "${want}", found ${j(found)}`);
  console.log(`  ${name}: ${found.filter((f) => expect.some((w) => f.includes(w))).join("; ")}`);
};
const recs = (c, dataName) => c.data[dataName].outputs[0].records;
// A symbol's own parent is replaced by its scope (VIEW-11), so damage a scope's container; its members go with it.
damaged("a missing container", (c) => { recs(c, "code.scope")[0].parent = "src/nowhere.ts"; }, ["invalid: its container isn't a known node"]);
damaged("an edge to an unknown node", (c) => { c.data["code.link"].outputs[0].records[0].to = "src/math.ts#ghost@9:9"; }, ["invalid: its target is neither a known node nor null"]);
damaged("a duplicate ID", (c) => { const r = recs(c, "code.symbol"); r.push(structuredClone(r[0])); }, ["invalid: another node has the same ID"]);
damaged("an unknown represents", (c) => { c.data["code.metric"] = { represents: "metrics", fields: {}, outputs: [{ tool: "stub", dataRef: "stub", records: [] }] }; }, ["extra: represents"]);
damaged("a membership to an unknown scope", (c) => { c.data["code.membership"].outputs[0].records[0].parent = "src/x.ts#scope@1:1"; }, ["invalid: the container isn't a known node"]);
damaged("a malformed location", (c) => { recs(c, "code.symbol")[1].location = { file: "src/counter.ts" }; }, ["invalid: its location"]);

if (problems.length === 0) console.log("PASS: the graph model matches expected/graph-views.json; damaged caches give the expected items");
else { console.log(`FAIL: ${problems.length} problem(s)`); for (const p of problems) console.log("  - " + p); process.exitCode = 1; }
