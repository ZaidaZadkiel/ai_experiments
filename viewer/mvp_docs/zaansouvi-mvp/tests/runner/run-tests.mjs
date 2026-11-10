// The Runner's tests for MVP 2, as one script (06_test_plan.md, TEST-01 to TEST-05 and R1 to R8, adapted to MVP 2 where
// they named M1 to M3; R9 to R11 are new, for what MVP 2 added: RUN-33, RUN-34). Works on a temporary copy of
// zaansouvi-mvp (node_modules linked), so the real data/ is never touched. Prints every check; exits 1 if any failed.
// Run from zaansouvi-mvp/: node tests/runner/run-tests.mjs
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "zaansouvi-runner-"));
const MVP = path.join(TMP, "zaansouvi-mvp");
const DATA = path.join(MVP, "data");
const SRC = path.join(TMP, "source");               // a copy of test-source-mvp2, outside the MVP copy
const RUNNER = path.join(MVP, "app/runner/zaansouvi-run");
const problems = [];
let passed = 0;
const check = (name, ok, detail = "") => { if (ok) { passed++; console.log(`  ok    ${name}`); } else { problems.push(`${name} ${detail}`); console.log(`  FAIL  ${name} ${String(detail).slice(0, 400)}`); } };

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.name === "node_modules") fs.symlinkSync(a, b);
    else if (e.isDirectory()) copyTree(a, b);
    else if (e.isSymbolicLink()) fs.symlinkSync(fs.readlinkSync(a), b);
    else fs.copyFileSync(a, b);
  }
}
const run = (args, opts = {}) => {
  const r = spawnSync(RUNNER, args, { cwd: TMP, encoding: "utf8", ...opts });
  const events = r.stdout.trim().split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return { unparsed: l }; } });
  return { status: r.status, events, stdout: r.stdout, stderr: r.stderr, of: (name) => events.filter((e) => e.event === name) };
};
function hashTree(dir) {
  const h = crypto.createHash("sha256");
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else { h.update(path.relative(dir, p)); h.update(fs.readFileSync(p)); }
    }
  };
  walk(dir);
  return h.digest("hex");
}
const setRunList = (names) => {
  const f = path.join(MVP, "app/runner/src/tools.ts");
  fs.writeFileSync(f, fs.readFileSync(f, "utf8").replace(/export const RUN_LIST = \[[^\]]*\];/, `export const RUN_LIST = ${JSON.stringify(names)};`));
};
const freshData = () => fs.rmSync(DATA, { recursive: true, force: true });

try {
  copyTree(path.join(ROOT, "app"), path.join(MVP, "app"));
  copyTree(path.join(ROOT, "test-source-mvp2"), SRC);

  console.log("TEST-01: a run from an empty data folder matches expected-mvp2/");
  freshData();
  const r1 = run([SRC]);
  check("the run succeeds, exit 0", r1.status === 0, r1.stderr);
  check("ts-program ran once, from missing", r1.of("tool_run").length === 1 && r1.of("tool_dry_run")[0]?.refreshReason === "missing");
  const cmp = spawnSync(process.execPath, [path.join(ROOT, "tests/ts-program/check.mjs"), path.join(DATA, "tools/ts-program/output")], { encoding: "utf8" });
  check("its output matches the expected graph exactly", cmp.status === 0, cmp.stdout.slice(-600));

  console.log("TEST-02: a dry-run-only pass after it: go, up to date, nothing written");
  const before = hashTree(path.join(DATA, "tools"));
  const r2 = run([SRC, "--dry-run-only"]);
  const d2 = r2.of("tool_dry_run")[0];
  check("go, up-to-date, no stale inputs", r2.status === 0 && d2?.dryRun === "go" && d2?.refreshReason === "up-to-date" && d2?.staleInputs.length === 0, JSON.stringify(d2));
  check("the tools' stores unchanged", hashTree(path.join(DATA, "tools")) === before);

  console.log("TEST-03: a dry-run-only pass with no tool store: go, missing, nothing written");
  fs.rmSync(path.join(DATA, "tools"), { recursive: true, force: true });
  const r3 = run([SRC, "--dry-run-only"]);
  const d3 = r3.of("tool_dry_run")[0];
  check("go, missing", r3.status === 0 && d3?.dryRun === "go" && d3?.refreshReason === "missing", JSON.stringify(d3));
  check("no tool wrote anything", !fs.existsSync(path.join(DATA, "tools/ts-program/output")));

  console.log("TEST-04: the refresh check (RUN-17 to RUN-22, TSP-D11)");
  run([SRC]);
  const r4a = run([SRC]);
  check("nothing changed: skipped", r4a.of("tool_skipped").length === 1 && r4a.of("tool_run").length === 0);
  const app = path.join(SRC, "src/app.ts");
  const appText = fs.readFileSync(app, "utf8");
  fs.utimesSync(app, new Date(), new Date(Date.now() + 5000));
  check("a file touched, content the same: still skipped", run([SRC]).of("tool_skipped").length === 1);
  fs.appendFileSync(app, "\n// changed\n");
  const r4c = run([SRC]);
  check("a file changed: rerun, inputs-changed", r4c.of("tool_dry_run")[0]?.refreshReason === "inputs-changed" && r4c.of("tool_run")[0]?.status === "succeeded");
  fs.writeFileSync(app, appText);
  run([SRC]);
  fs.writeFileSync(path.join(SRC, "src/extra.ts"), "export const EXTRA = 1;\n");
  const r4d = run([SRC]);
  check("a .ts file added: rerun, given 7 files", r4d.of("tool_run").length === 1 && r4d.of("files_listed")[0]?.perTool?.["ts-program"] === 7);
  fs.rmSync(path.join(SRC, "src/extra.ts"));
  run([SRC]);
  fs.rmSync(path.join(DATA, "tools/ts-program/output"), { recursive: true, force: true });
  check("its outputs deleted: rerun, missing", run([SRC]).of("tool_dry_run")[0]?.refreshReason === "missing");
  fs.writeFileSync(path.join(SRC, "notes.txt"), "a file no tool reads\n");
  check("a file no tool reads added: still skipped", run([SRC]).of("tool_skipped").length === 1);
  fs.rmSync(path.join(SRC, "notes.txt"));

  console.log("TEST-05: --read-cache");
  run([SRC]);
  const r5 = run(["--read-cache"]);
  const c = r5.of("cache")[0]?.cache;
  check("one cache event; the run succeeded", r5.of("cache").length === 1 && c?.run?.outcome === "succeeded");
  check("files: every entry, in ID order", JSON.stringify(c?.files.map((f) => f.id)) === JSON.stringify(["README.md", "src", "src/app.ts", "src/report", "src/report/charts", "src/report/charts/bars.ts", "src/report/format.ts", "src/report/summary.ts", "src/shapes.ts", "src/util", "src/util/numbers.ts"]), JSON.stringify(c?.files.map((f) => f.id)));
  check("tools: ts-program; the others not listed", JSON.stringify(c?.tools.map((t) => t.tool)) === '["ts-program"]' && c?.notListed.length === 3);
  const count = (dn) => c?.data[dn]?.outputs.reduce((n, o) => n + o.records.length, 0);
  check("data: 120 symbols, 182 references, 20 links", count("code.symbol") === 120 && count("code.reference") === 182 && count("code.link") === 20, `${count("code.symbol")} ${count("code.reference")} ${count("code.link")}`);

  console.log("R1 to R11: refusals and edge cases");
  const db = new DatabaseSync(path.join(DATA, "zaansouvi.sqlite"));
  db.exec("UPDATE config_version SET version = 99");
  db.close();
  const rR1 = run([SRC]);
  check("R1 an unknown database version: exit 2, says so", rR1.status === 2 && /version 99/.test(rR1.stdout), rR1.stdout.slice(-300));
  freshData();
  const rR7 = run([]);
  check("R7 no source root, none saved: exit 2, says how to give it", rR7.status === 2 && /source root/i.test(rR7.stdout));
  fs.mkdirSync(path.join(DATA, "runner"), { recursive: true });
  fs.writeFileSync(path.join(DATA, "runner/run.lock"), JSON.stringify({ pid: process.pid, runId: "held-run", started: new Date().toISOString() }));
  const rR5 = run([SRC]);
  check("R5 a lock held by a live process: exit 2, names the run, nothing written", rR5.status === 2 && /held-run/.test(rR5.stdout) && !fs.existsSync(path.join(DATA, "tools")));
  fs.writeFileSync(path.join(DATA, "runner/run.lock"), JSON.stringify({ pid: 999999, runId: "gone-run", started: "2026-01-01T00:00:00.000Z" }));
  const rR6 = run([SRC]);
  const runnerLog = fs.readdirSync(path.join(DATA, "runner/logs")).map((f) => fs.readFileSync(path.join(DATA, "runner/logs", f), "utf8")).join("\n");
  check("R6 a stale lock: taken over, logged, the run goes on", rR6.status === 0 && runnerLog.includes("stale_lock_taken_over"));
  fs.mkdirSync(path.join(MVP, "app/tools/empty-folder"));
  const rR8 = run([SRC]);
  check("R8 an empty tool folder: the run is unaffected", rR8.status === 0 && !rR8.of("tool_not_listed").some((e) => e.tool === "empty-folder"));
  check("R10 tool folders not listed: reported, not run", ["cross-file-links", "file-symbols", "symbol-scope"].every((t) => rR8.of("tool_not_listed").some((e) => e.tool === t)));
  fs.rmSync(path.join(MVP, "app/tools/empty-folder"), { recursive: true });
  // R2: a listed tool whose --info fails
  fs.mkdirSync(path.join(MVP, "app/tools/bad-info"));
  fs.writeFileSync(path.join(MVP, "app/tools/bad-info/bad-info"), "#!/bin/sh\necho not json\n", { mode: 0o755 });
  setRunList(["ts-program", "bad-info"]);
  const rR2 = run([SRC]);
  check("R2 a listed tool whose --info isn't JSON: exit 2, names it", rR2.status === 2 && /bad-info/.test(rR2.stdout), rR2.stdout.slice(-300));
  // R3, R4: stand-in tools taking ts-program's symbols, in the run list
  for (const stub of ["stub-crash", "stub-garbage"]) {
    fs.copyFileSync(path.join(ROOT, "tests/fixtures/tools/stub.mjs"), path.join(MVP, "app/tools/stub.mjs"));
    copyTree(path.join(ROOT, "tests/fixtures/tools", stub), path.join(MVP, "app/tools", stub));
  }
  setRunList(["ts-program", "stub-crash"]);
  const rR3 = run([SRC]);
  check("R3 a tool crashing in its real run: a failed real run, exit 1", rR3.status === 1 && rR3.of("tool_run").some((e) => e.tool === "stub-crash" && e.status === "failed"), rR3.stdout.slice(-400));
  setRunList(["ts-program", "stub-garbage"]);
  const rR4 = run([SRC]);
  check("R4 a tool printing garbage in its dry run: no-go, exit 1", rR4.status === 1 && rR4.of("tool_dry_run").some((e) => e.tool === "stub-garbage" && e.dryRun === "no-go"), rR4.stdout.slice(-400));
  setRunList(["ts-program", "no-such-tool"]);
  const rR9 = run([SRC]);
  check("R9 a listed tool with no folder: exit 2 before any tool, names it", rR9.status === 2 && /no-such-tool/.test(rR9.stdout) && rR9.of("tool_dry_run").length === 0);
  setRunList(["ts-program"]);
  const js = path.join(TMP, "js-only");
  fs.mkdirSync(path.join(js, "src"), { recursive: true });
  fs.writeFileSync(path.join(js, "src/app.js"), "export const a = 1;\n");
  const rR11 = run([js]);
  const no = rR11.of("tool_dry_run")[0];
  check("R11 no file to read: stops before the tool, saying why", rR11.status === 1 && no?.dryRun === "no-go" && /none of the 1 files listed/.test(no?.error?.message ?? ""), JSON.stringify(no));
} catch (e) {
  problems.push(`the tests stopped: ${e.stack}`);
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}
for (const p of problems) console.log(`  - ${p}`);
console.log(`\npassed: ${passed}, failed: ${problems.length}`);
process.exitCode = problems.length ? 1 : 0;
