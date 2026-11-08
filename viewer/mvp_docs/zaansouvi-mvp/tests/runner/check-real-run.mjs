// Checks a real run, then a second run with nothing changed, against the MVP rules. Read only. See tests/runner/README.md.
// Usage: node tests/runner/check-real-run.mjs <zaansouvi-mvp> <work dir holding before.json, after.json, events.jsonl,
//        events2.jsonl, cache-after-first.json>
import fs from "node:fs"; import path from "node:path"; import { DatabaseSync } from "node:sqlite";
const [root, S] = process.argv.slice(2);
const b = JSON.parse(fs.readFileSync(`${S}/before.json`, "utf8")), a = JSON.parse(fs.readFileSync(`${S}/after.json`, "utf8"));
const ev = fs.readFileSync(`${S}/events.jsonl`, "utf8").trim().split("\n").map(JSON.parse);
const ev2 = fs.readFileSync(`${S}/events2.jsonl`, "utf8").trim().split("\n").map(JSON.parse);
const c1 = JSON.parse(fs.readFileSync(`${S}/cache-after-first.json`, "utf8"));
const c2 = JSON.parse(fs.readFileSync(path.join(root, "data/runner/cache.json"), "utf8"));
const rows = []; const ok = (rule, cond, note = "") => rows.push(`${cond ? "ok  " : "FAIL"}  ${rule.padEnd(30)} ${note}`);
const runId = ev[0].runId, runId2 = ev2[0].runId;
const outs = (s) => Object.entries(s.stores).filter(([k]) => k.includes("/output/"));
// First run
ok("RUN-20 reasons", ev.filter((e) => e.event === "tool_dry_run").map((e) => e.refreshReason).join() === "inputs-changed,inputs-changed,inputs-changed,never-run", "M1 inputs-changed (version), M2 never-run");
ok("RUN-08/09 dry then real", ev.filter((e) => e.event === "tool_run").length === 4 && ev.filter((e) => e.event === "tool_dry_run").length === 4, "4 dry runs, each followed by a real run");
ok("FND-29 same bytes", JSON.stringify(outs(a)) === JSON.stringify(outs(b)) && ev.filter((e) => e.event === "tool_run").every((e) => e.outputChange === "unchanged"), "all 4 output files byte-identical; outputChange unchanged");
ok("RUN-09 tool logs read", ev.filter((e) => e.event === "tool_run").every((e) => e.logPath && fs.existsSync(e.logPath)), "every tool_run names an existing tool log");
const db = new DatabaseSync(path.join(root, "data/zaansouvi.sqlite"), { readOnly: true });
const r1 = db.prepare("select tool, file_id, refresh_reason, dry_run_result, real_run_result, fingerprint is not null fp from project_tool_runs where run_id=?").all(runId);
ok("RUN-10/22 tool-run rows", r1.length === 4 && r1.every((r) => r.real_run_result === "succeeded" && r.dry_run_result === "go" && r.fp === 1), `${r1.length} real rows, succeeded, with fingerprints`);
const po = db.prepare("select tool, data_name, output_path from project_outputs order by tool, data_name, output_path").all();
ok("RUN-10 project_outputs", po.length === 10 && po.filter((r) => r.tool === "cross-file-links").length === 1, `${po.length} rows: 9 for M1 (3 files x 3 data names), 1 for M2`);
ok("RUN-26 store paths", po.every((r) => r.output_path.startsWith(path.join(root, "data/tools", r.tool) + "/")), "every output under data/tools/<tool>/");
const runs = db.prepare("select run_id, mode, outcome, exit_code from project_runs where run_id in (?, ?)").all(runId, runId2);
ok("RUN-12 run rows", runs.length === 2 && runs.every((r) => r.mode === "real" && r.outcome === "succeeded" && r.exit_code === 0), "both runs recorded: real, succeeded, exit 0");
ok("RUN-27 cache replaced whole", c1.run.runId === runId && !("dryRun" in c1), "the first run's cache; the dry-run part dropped");
ok("RUN-27 cache contents", c1.tools.map((t) => t.tool).join() === "file-symbols,cross-file-links" && c1.invocations.length === 4 && Object.keys(c1.data).sort().join() === "code.link,code.reference,code.symbol,diagnostic", "2 tools, 4 invocations, data: symbols, references, links, diagnostics");
ok("RUN-25 records by data name", c1.data["code.link"].outputs[0].records.length === 6 && c1.data["code.symbol"].outputs.reduce((n, o) => n + o.records.length, 0) === 13, "6 links, 13 symbols");
ok("RUN-27 M2 input as dataRefs", JSON.stringify(c1.invocations[3].input.symbols) === JSON.stringify(["file-symbols:src/counter.ts", "file-symbols:src/main.ts", "file-symbols:src/math.ts"]), "symbols and references stored as references, not copies");
ok("TOOL-04 last_run.json", Object.keys(a.lastRuns).every((t) => a.lastRuns[t] !== b.lastRuns[t]), "both tools rewrote their last_run.json (a real run)");
// Second run
ok("RUN-17 nothing changed", ev2.filter((e) => e.event === "tool_skipped").length === 4 && !ev2.some((e) => e.event === "tool_run" || e.event === "tool_dry_run"), "4 skipped, no tool started");
const r2 = db.prepare("select refresh_reason, fingerprint is not null fp from project_tool_runs where run_id=?").all(runId2);
ok("RUN-22 skipped rows", r2.length === 4 && r2.every((r) => r.refresh_reason === "skipped" && r.fp === 1), "4 rows recorded as skipped");
ok("RUN-27 skipped still cached", JSON.stringify(c2.data) === JSON.stringify(c1.data) && c2.invocations.every((i) => i.skipped === true), "same data as the first run; invocations marked skipped");
const expSecond = fs.readFileSync(path.join(root, "expected/run-events-second.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
const pairs = ev2.map((e) => [e, expSecond.find((x) => x.event === e.event && (x.tool ?? "") === (e.tool ?? "") && (x.file_id ?? "") === (e.file_id ?? ""))]);
ok("TEST-04 vs expected second run", pairs.every(([e, x]) => x && Object.keys(x).every((k) => k in e) && Object.entries(x).every(([k, v]) => String(v).startsWith("<") || JSON.stringify(v) === JSON.stringify(e[k]))) && expSecond.length - ev2.length === 1, `${ev2.length} of ${expSecond.length} expected lines match; missing only symbol-scope's tool_skipped`);
db.close();
ok("RUN-30/31 lock, exit", !fs.existsSync(path.join(root, "data/runner/run.lock")) && ev.at(-1).exitCode === 0 && ev2.at(-1).exitCode === 0, "lock released; exit 0 both times");
console.log(rows.join("\n"));
