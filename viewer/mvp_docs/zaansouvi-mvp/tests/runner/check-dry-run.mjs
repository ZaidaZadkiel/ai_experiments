// Checks a dry-run-only pass against the MVP rules. Read only. See tests/runner/README.md for the steps.
// Usage: node tests/runner/check-dry-run.mjs <zaansouvi-mvp> <work dir holding before.json, after.json, events.jsonl>
import fs from "node:fs"; import path from "node:path"; import { DatabaseSync } from "node:sqlite";
const [root, S] = process.argv.slice(2);
const b = JSON.parse(fs.readFileSync(`${S}/before.json`, "utf8")), a = JSON.parse(fs.readFileSync(`${S}/after.json`, "utf8"));
const ev = fs.readFileSync(`${S}/events.jsonl`, "utf8").trim().split("\n").map(JSON.parse);
const runId = ev[0].runId; const rows = []; const ok = (rule, cond, note = "") => rows.push(`${cond ? "ok  " : "FAIL"}  ${rule.padEnd(26)} ${note}`);
// What must stay untouched
ok("TOOL-06 stores", JSON.stringify(a.stores) === JSON.stringify(b.stores), `${Object.keys(a.stores).length} files in data/tools unchanged`);
ok("TOOL-06 last_run.json", JSON.stringify(a.lastRuns) === JSON.stringify(b.lastRuns), "M1's and M2's last_run.json unchanged");
ok("RUN-27 cache graph part", a.cacheGraph === b.cacheGraph, "run, files, tools, invocations, data unchanged");
ok("RUN-23 real-run rows", a.db.realToolRuns === b.db.realToolRuns && JSON.stringify(a.db.outputs) === JSON.stringify(b.db.outputs), "no real tool-run row, no project_outputs row");
// What it writes
ok("RUN-27 cache dryRun part", a.cacheDryRun === runId, "replaced by this pass");
ok("RUN-23 dry-run rows", a.db.dryToolRuns - b.db.dryToolRuns === 4, `${a.db.dryToolRuns - b.db.dryToolRuns} dry-run tool rows`);
const db = new DatabaseSync(path.join(root, "data/zaansouvi.sqlite"), { readOnly: true });
const run = db.prepare("select mode, outcome, exit_code, log_path from project_runs where run_id=?").get(runId);
ok("RUN-23 project_runs row", run?.mode === "dry-run" && run.outcome === "succeeded" && run.exit_code === 0, JSON.stringify({ mode: run?.mode, outcome: run?.outcome, exit: run?.exit_code }));
const fp = db.prepare("select count(*) n from project_tool_runs where run_id=? and fingerprint is not null").get(runId).n;
ok("RUN-23 no fingerprint", fp === 0, "dry-run rows carry no fingerprint");
const order = db.prepare("select tool from config_ordering order by position").all().map((r) => r.tool).join(", ");
ok("RUN-05 ordering", order === "file-symbols, cross-file-links", order + " (symbol-scope folder empty: skipped)");
db.close();
// The log (RUN-14, RUN-15)
const log = fs.readFileSync(ev.at(-1).logPath, "utf8").split("\n");
ok("RUN-14 marked dry run", log[0].includes("dry-run-only pass") && log[1].includes('"mode":"dry-run"'), "first comment and runner_started");
const inv = log.filter((l) => l.includes("\ttool_invoked\t")).map((l) => JSON.parse(l.split("\t")[3]));
ok("RUN-15 command line, JSON", inv.length === 4 && inv.every((i) => i.mode === "dry-run" && i.argv.includes("--dry-run") && i.argv.includes("--stdin") && i.json), `${inv.length} invocations logged, all --dry-run --stdin, JSON included`);
ok("RUN-17 no real run", !log.some((l) => l.includes('"mode":"real"') && l.includes("tool_invoked")), "no tool started for real");
ok("RUN-30 lock", !fs.existsSync(path.join(root, "data/runner/run.lock")), "released");
// The inputs sent (DATA-12, DATA-13, DATA-09, RUN-19)
const m1 = inv.filter((i) => i.tool === "file-symbols"), m2 = inv.find((i) => i.tool === "cross-file-links");
ok("DATA-12 M1 input", m1.every((i) => Object.keys(i.json).sort().join() === "file_id,file_path,source_root,store_path"), Object.keys(m1[0].json).join(", "));
ok("RUN-28 file order", m1.map((i) => i.file_id).join() === "src/counter.ts,src/main.ts,src/math.ts", m1.map((i) => i.file_id).join(", "));
ok("DATA-13 M2 input", Object.keys(m2.json).sort().join() === "references,store_path,symbols", Object.keys(m2.json).join(", ") + " (no source_root: DATA-09)");
ok("RUN-19 records only", m2.json.symbols.length === 13 && m2.json.references.length === 30 && !m2.json.symbols.some((s) => "dataNames" in s), `${m2.json.symbols.length} symbols, ${m2.json.references.length} references, flat`);
// Dry-run lines (DATA-17): last lines
const res = log.filter((l) => l.includes("\ttool_dry_run_result\t")).map((l) => JSON.parse(l.split("\t")[3]));
ok("DATA-17 go lines", res.every((r) => r.lastLine?.dryRun === "go" && r.exitCode === 0), res.map((r) => `${r.tool}${r.file_id ? ":" + r.file_id : ""} go`).join(", "));
// Events (event table; expected/run-events.jsonl key sets)
const exp = fs.readFileSync(path.join(root, "expected/run-events.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
for (const name of ["run_started", "files_listed", "tool_dry_run", "run_finished"]) {
  const e = exp.find((x) => x.event === name), acts = ev.filter((x) => x.event === name);
  const missing = Object.keys(e).filter((k) => acts.some((x) => !(k in x)));
  ok(`event keys: ${name}`, missing.length === 0, missing.length ? "missing " + missing : `${acts.length}x, keys as expected/run-events.jsonl`);
}
ok("RUN-17 every invocation", ev.filter((x) => x.event === "tool_dry_run").length === 4 && !ev.some((x) => x.event === "tool_run" || x.event === "tool_skipped"), "4 dry runs, no tool_run or tool_skipped");
ok("RUN-31 exit code", ev.at(-1).exitCode === 0, "0");
console.log(rows.join("\n"));
