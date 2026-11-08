// Compares a Runner run with expected/, by the rules in expected/README.md. Read only.
// Usage: node tests/runner/compare-expected.mjs <zaansouvi-mvp> <events.jsonl> [<cache.json>, default data/runner/cache.json]
import fs from "node:fs"; import path from "node:path";
const [mvp, eventsFile] = process.argv.slice(2);
const SRC = path.join(mvp, "test-source"), ROOT = mvp;
const fill = (s) => s.replaceAll("<sourceRoot>", SRC).replaceAll("<mvpRoot>", ROOT);
const SHAPE_ONLY = new Set(["outputSha256", "durationMs", "fingerprint"]);
const SET_ARRAYS = new Set(["links", "scopes", "membership"]);
function cmp(exp, act, at, out) {
  if (typeof exp === "string") {
    const e = fill(exp);
    if (/^<[^>]+>$/.test(e)) { if (act === undefined || act === null || act === "") out.push(`${at}: placeholder ${e}, got ${JSON.stringify(act)}`); return; }
    if (/<[^>]+>/.test(e)) { const re = new RegExp("^" + e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/<[^>]+>/g, ".+") + "$"); if (typeof act !== "string" || !re.test(act)) out.push(`${at}: expected ${e}, got ${JSON.stringify(act)}`); return; }
    if (e !== act) out.push(`${at}: expected ${JSON.stringify(e)}, got ${JSON.stringify(act)}`); return;
  }
  if (exp === null || typeof exp !== "object") { if (exp !== act) out.push(`${at}: expected ${JSON.stringify(exp)}, got ${JSON.stringify(act)}`); return; }
  if (Array.isArray(exp)) {
    if (!Array.isArray(act)) { out.push(`${at}: expected an array of ${exp.length}, got ${act === undefined ? "nothing" : typeof act}`); return; }
    if (exp.length !== act.length) out.push(`${at}: expected ${exp.length} items, got ${act.length}`);
    if (SET_ARRAYS.has(at.split(".").pop())) {
      const a = new Set(act.map((x) => JSON.stringify(x)));
      for (const x of exp) if (!a.has(JSON.stringify(x))) out.push(`${at}: missing ${JSON.stringify(x).slice(0, 120)}`);
      return;
    }
    exp.forEach((x, i) => { if (i < act.length) cmp(x, act[i], `${at}[${i}]`, out); });
    return;
  }
  if (act === null || typeof act !== "object") { out.push(`${at}: expected an object, got ${JSON.stringify(act)?.slice(0, 60) ?? "nothing"}`); return; }
  for (const [k, v] of Object.entries(exp)) {
    if (k === "about") continue;
    if (!(k in act)) { out.push(`${at}.${k}: missing`); continue; }
    if (SHAPE_ONLY.has(k)) { if (typeof act[k] !== typeof v && !(typeof v === "string" && typeof act[k] === "number")) out.push(`${at}.${k}: wrong shape`); continue; }
    cmp(v, act[k], `${at}.${k}`, out);
  }
}
const show = (title, diffs) => { console.log(`\n### ${title}: ${diffs.length ? diffs.length + " difference(s)" : "matches"}`); for (const d of diffs.slice(0, 40)) console.log("  - " + d); if (diffs.length > 40) console.log(`  ... and ${diffs.length - 40} more`); };

// Events, line by line
const expEv = fs.readFileSync(path.join(mvp, "expected/run-events.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
const actEv = fs.readFileSync(eventsFile, "utf8").trim().split("\n").map(JSON.parse);
const evDiffs = [];
const n = Math.max(expEv.length, actEv.length);
for (let i = 0; i < n; i++) {
  const e = expEv[i], a = actEv[i];
  if (!e) { evDiffs.push(`line ${i + 1}: unexpected ${a.event} ${a.tool ?? ""}`); continue; }
  if (!a) { evDiffs.push(`line ${i + 1}: missing ${e.event} ${e.tool ?? ""} ${e.file_id ?? ""}`.trim()); continue; }
  const d = []; cmp(e, a, `line ${i + 1} (${e.event}${e.tool ? " " + e.tool : ""}${e.file_id ? " " + e.file_id : ""})`, d);
  evDiffs.push(...d);
}
show(`Events (expected ${expEv.length}, actual ${actEv.length})`, evDiffs);

// The cache, part by part
const expC = JSON.parse(fs.readFileSync(path.join(mvp, "expected/runner-cache.json"), "utf8"));
const actC = JSON.parse(fs.readFileSync(process.argv[4] ?? path.join(mvp, "data/runner/cache.json"), "utf8"));
for (const part of ["formatVersion", "run", "files", "tools", "invocations"]) { const d = []; cmp(expC[part], actC[part], part, d); show(`Cache: ${part}`, d); }
for (const dn of Object.keys(expC.data)) { const d = []; cmp(expC.data[dn], actC.data?.[dn], `data.${dn}`, d); show(`Cache: data.${dn}`, d); }
const extra = Object.keys(actC.data ?? {}).filter((k) => !(k in expC.data)); if (extra.length) console.log(`\n(extra data names in the actual cache: ${extra})`);

// Tool output files of M2 and M3
for (const [tool, file] of [["cross-file-links", "links.json"], ["symbol-scope", "scopes.json"]]) {
  const p = path.join(mvp, "data/tools", tool, "output", file);
  if (!fs.existsSync(p)) { show(`expected/${tool}.json vs ${path.relative(mvp, p)}`, [`not produced: ${tool} isn't built`]); continue; }
  const d = []; cmp(JSON.parse(fs.readFileSync(path.join(mvp, `expected/${tool}.json`), "utf8")), JSON.parse(fs.readFileSync(p, "utf8")), tool, d); show(`expected/${tool}.json`, d);
}
