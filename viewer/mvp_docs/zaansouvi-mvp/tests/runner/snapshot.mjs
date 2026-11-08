// Snapshot of what a dry-run-only pass must leave alone (RUN-23, RUN-27, TOOL-06): the tool stores, each tool's last_run.json, the
// cache's graph part, and the database's real-run rows. Read only.  Usage: node tests/runner/snapshot.mjs <zaansouvi-mvp> > <file>.json
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
const root = process.argv[2];
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 16);
const walk = (d) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
const out = { stores: {}, lastRuns: {}, cacheGraph: null, cacheDryRun: null, db: {} };
for (const f of walk(path.join(root, "data/tools"))) out.stores[path.relative(root, f)] = sha(f);
for (const t of fs.readdirSync(path.join(root, "app/tools"))) { const p = path.join(root, "app/tools", t, "last_run.json"); if (fs.existsSync(p)) out.lastRuns[t] = sha(p); }
const cp = path.join(root, "data/runner/cache.json");
if (fs.existsSync(cp)) { const c = JSON.parse(fs.readFileSync(cp, "utf8")); const { dryRun, ...graph } = c; out.cacheGraph = crypto.createHash("sha256").update(JSON.stringify(graph)).digest("hex").slice(0, 16); out.cacheDryRun = dryRun ? dryRun.runId : null; }
const db = new DatabaseSync(path.join(root, "data/zaansouvi.sqlite"), { readOnly: true });
const q = (s) => db.prepare(s).get();
out.db = { realToolRuns: q("select count(*) n from project_tool_runs where mode='real'").n, dryToolRuns: q("select count(*) n from project_tool_runs where mode='dry-run'").n,
  outputs: q("select count(*) n, max(produced_at) last from project_outputs"), runs: db.prepare("select mode, count(*) n from project_runs group by mode").all() };
db.close();
console.log(JSON.stringify(out));
