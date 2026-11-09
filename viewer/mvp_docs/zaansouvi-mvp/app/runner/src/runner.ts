// zaansouvi-run: the ZaAnSouVi MVP Runner (mvp_docs/03_runner.md).
//
//   zaansouvi-run [<source-root>]                 run everything (the source root is saved; RUN-29)
//   zaansouvi-run [<source-root>] --dry-run-only  dry-run every step; no tool writes anything (RUN-23)
//   zaansouvi-run --read-cache                    print the Runner's cache, run nothing (RUN-13)
//
// Output is always Viewer mode: one JSON event per line on standard output (RUN-02).
// Exit codes (RUN-31): 0 finished, 1 stopped by a tool's no-go or failure, 2 invocation or start-up error.

import fs from "node:fs";
import path from "node:path";
import type {
  CacheDataGroup, CacheInvocation, Diagnostic, DryRunDiagnostics, RefreshReason, RunnerCache, RunnerEvent,
} from "../../shared/types.ts";
import { canonicalJson, readJson, sha256, writeAtomic } from "../../shared/fsutil.ts";
import { nullLog, openLog, readLog } from "../../shared/log.ts";
import type { Log } from "../../shared/log.ts";
import { openDb, readSettingIfExists } from "./db.ts";
import type { Db } from "./db.ts";
import {
  StartupError, checkOutputFile, dryRun, findTools, isRunnerProvided, outputFiles, outputPath, producers, readsFile,
  realRun, workOutOrder,
} from "./tools.ts";
import type { Tool } from "./tools.ts";

// ---------------------------------------------------------------------------
// Layout (01_architecture.md)
// ---------------------------------------------------------------------------

const RUNNER_DIR = path.resolve(import.meta.dirname, "..");
const MVP_ROOT = path.resolve(RUNNER_DIR, "..", "..");
const DATA = path.join(MVP_ROOT, "data");
const DB_PATH = path.join(DATA, "zaansouvi.sqlite");
const RUNNER_DATA = path.join(DATA, "runner");
const CACHE_PATH = path.join(RUNNER_DATA, "cache.json");
const LOCK_PATH = path.join(RUNNER_DATA, "run.lock");
const LOGS = path.join(RUNNER_DATA, "logs");
const TOOLS_DIR = path.join(MVP_ROOT, "app", "tools");
const CACHE_FORMAT_VERSION = 1;

const EXIT_OK = 0;
const EXIT_STOPPED = 1;
const EXIT_STARTUP = 2;

const HELP = `zaansouvi-run: the ZaAnSouVi MVP Runner

Usage:
  zaansouvi-run [<source-root>]                 run every tool that needs it
  zaansouvi-run [<source-root>] --dry-run-only  dry-run every step; no tool writes anything
  zaansouvi-run --read-cache                    print the Runner's cache, run nothing

The source root is saved; without one, the saved source root is used.
Output: one JSON event per line. Exit codes: 0 finished, 1 stopped by a tool, 2 invocation or start-up error.
`;

// ---------------------------------------------------------------------------
// Events and refusals
// ---------------------------------------------------------------------------

let log: Log = nullLog;

function emit(ev: RunnerEvent) {
  process.stdout.write(JSON.stringify(ev) + "\n");
  if (ev.event !== "cache") {
    const failed = (ev.event === "tool_dry_run" && ev.dryRun === "no-go") || (ev.event === "tool_run" && ev.status === "failed") ||
      (ev.event === "run_finished" && ev.outcome === "failed") || ev.event === "run_refused";
    log.entry(failed ? "error" : "info", ev.event, ev as unknown as Record<string, unknown>);
  }
}

class Refusal extends Error {
  diagnostic: Diagnostic;
  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.diagnostic = { severity: "error", code, message };
    if (details !== undefined) this.diagnostic.details = details;
  }
}

/** A run that can't start: a diagnostic saying what is wrong or missing, exit 2 (RUN-03, RUN-29, RUN-30, RUN-31). */
function refuse(r: Refusal): number {
  process.stderr.write(`zaansouvi-run: ${r.diagnostic.message}\n`);
  emit({ event: "run_refused", error: r.diagnostic, exitCode: EXIT_STARTUP });
  return EXIT_STARTUP;
}

// ---------------------------------------------------------------------------
// The lock (RUN-30)
// ---------------------------------------------------------------------------

let ownLock = false;

function processAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** Takes the lock, or explains who holds it. A lock whose process is gone is taken over. */
function takeLock(runId: string): { staleTakenOver?: unknown } {
  fs.mkdirSync(RUNNER_DATA, { recursive: true });
  const content = JSON.stringify({ pid: process.pid, runId, started: new Date().toISOString() }) + "\n";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      fs.writeFileSync(LOCK_PATH, content, { flag: "wx" });
      ownLock = true;
      return {};
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
    }
    const held = readJson(LOCK_PATH) as { pid?: number; runId?: string; started?: string } | undefined;
    if (held && typeof held.pid === "number" && processAlive(held.pid)) {
      throw new Refusal("lock-held", `Another run is in progress (run ${held.runId ?? "?"}, process ${held.pid}, started ${held.started ?? "?"}). Wait for it to finish.`, held);
    }
    fs.rmSync(LOCK_PATH, { force: true });
    if (attempt === 0) {
      try {
        fs.writeFileSync(LOCK_PATH, content, { flag: "wx" });
        ownLock = true;
        return { staleTakenOver: held ?? "unreadable lock file" };
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      }
    }
  }
  throw new Refusal("lock-held", "Another run took the lock at the same moment.");
}

function releaseLock() {
  if (!ownLock) return;
  ownLock = false;
  try {
    const held = readJson(LOCK_PATH) as { pid?: number } | undefined;
    if (held?.pid === process.pid) fs.rmSync(LOCK_PATH, { force: true });
  } catch {
    // nothing to release
  }
}
process.on("exit", releaseLock);
process.on("SIGINT", () => process.exit(130));
process.on("SIGTERM", () => process.exit(143));

// ---------------------------------------------------------------------------
// The file list (RUN-06, RUN-28)
// ---------------------------------------------------------------------------

type FileEntry = { id: string; abs: string; size: number; sha256: string };

function listFiles(root: string): FileEntry[] {
  const out: FileEntry[] = [];
  const walk = (dir: string, rel: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (e.name !== "node_modules") walk(path.join(dir, e.name), rel ? `${rel}/${e.name}` : e.name);
      } else if (e.isFile() && e.name.endsWith(".ts")) {
        const abs = path.join(dir, e.name);
        const buf = fs.readFileSync(abs);
        out.push({ id: rel ? `${rel}/${e.name}` : e.name, abs, size: buf.length, sha256: sha256(buf) });
      }
    }
  };
  walk(root, "");
  // One fixed order: sorted by file ID, plain string comparison (RUN-28).
  return out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// ---------------------------------------------------------------------------
// The run
// ---------------------------------------------------------------------------

type Mode = "real" | "dry-run";

type RunContext = {
  mode: Mode;
  runId: string;
  sourceRoot: string;
  db: Db;
  order: Tool[];
  files: FileEntry[];
  stores: Map<string, string>;
  /** Output files read and checked during this run: absolute path -> parsed JSON (RUN-18). */
  available: Map<string, Record<string, unknown>>;
  /** Tools that a real run would refresh, for `upstream-refresh` in a dry-run-only pass (RUN-20). */
  wouldRefresh: Set<string>;
  invocations: CacheInvocation[];
  dryRunDiagnostics: DryRunDiagnostics["invocations"];
};

/** Runner-provided values (RUN-29). */
function provided(ctx: RunContext, tool: Tool, dataName: string, file?: FileEntry): unknown {
  switch (dataName) {
    case "files.file.id": return file?.id;
    case "files.file.path": return file?.abs;
    case "project.source_root": return ctx.sourceRoot;
    case "zaansouvi.store_path": return ctx.stores.get(tool.name);
    default: return undefined;
  }
}
const canProvide = (tool: Tool, dataName: string) =>
  dataName === "project.source_root" || dataName === "zaansouvi.store_path" ||
  ((dataName === "files.file.id" || dataName === "files.file.path") && tool.info.invocation === "per-file");

/**
 * Builds the JSON for one invocation (RUN-19): Runner-provided values, and only the records of each data name a tool asks for,
 * never the rest of another tool's output file. Also the same JSON with tool outputs replaced by dataRefs, for the cache.
 */
function buildInput(ctx: RunContext, tool: Tool, prod: Map<string, Tool>, file?: FileEntry) {
  const input: Record<string, unknown> = {};
  const forCache: Record<string, unknown> = {};
  const fileHashes: Record<string, string> = {};
  const staleInputs = new Set<string>();
  for (const [key, p] of Object.entries(tool.info.parameters)) {
    if (isRunnerProvided(p.dataName)) {
      const v = provided(ctx, tool, p.dataName, file);
      if (v === undefined) continue; // optional and not provided: the tool uses its default (TOOL-43)
      input[key] = forCache[key] = v;
      if (p.dataName.startsWith("files.file.") && file) fileHashes[key] = file.sha256;
      continue;
    }
    const from = prod.get(p.dataName);
    if (!from) continue;
    const out = from.info.outputs.find((o) => o.dataName === p.dataName)!;
    const store = ctx.stores.get(from.name)!;
    if (from.info.invocation === "per-file") {
      const values: unknown[] = [];
      const refs: string[] = [];
      for (const f of ctx.files.filter((f) => readsFile(from, f.id))) {
        const json = ctx.available.get(outputPath(store, out, f.id));
        if (!json) {
          staleInputs.add(f.id);
          continue;
        }
        if (typeof json.sourceSha256 === "string" && json.sourceSha256 !== f.sha256) staleInputs.add(f.id);
        values.push(...(json[out.jsonKey] as unknown[])); // only the records of that data name (RUN-19, DATA-13)
        refs.push(`${from.name}:${f.id}`);
      }
      input[key] = values; // one flat array, in file order; sent even when empty: the tool then says no-go itself (RUN-16)
      forCache[key] = refs;
    } else {
      const json = ctx.available.get(outputPath(store, out));
      input[key] = json ? (json[out.jsonKey] as unknown[]) : [];
      forCache[key] = json ? from.name : null;
    }
  }
  const fingerprint = sha256(canonicalJson({ tool: tool.name, toolVersion: tool.info.toolVersion, input, fileHashes }));
  return { input, forCache, fingerprint, staleInputs: [...staleInputs].sort() };
}

/** Reads and checks the output files of one invocation into `available`. */
function loadOwnOutputs(ctx: RunContext, tool: Tool, fileId?: string): { ok: true } | { ok: false; problem: string } {
  for (const [file, outs] of outputFiles(tool, ctx.stores.get(tool.name)!, fileId)) {
    const r = checkOutputFile(file, outs);
    if ("problem" in r) {
      ctx.available.delete(file);
      return { ok: false, problem: r.problem };
    }
    ctx.available.set(file, r.json);
  }
  return { ok: true };
}

function dropOwnOutputs(ctx: RunContext, tool: Tool, fileId?: string) {
  for (const file of outputFiles(tool, ctx.stores.get(tool.name)!, fileId).keys()) ctx.available.delete(file);
}

/** RUN-20: the first matching reason, or up-to-date. */
function refreshReason(ctx: RunContext, tool: Tool, prod: Map<string, Tool>, fileId: string | undefined, fingerprint: string, own: { ok: boolean }): RefreshReason {
  if (!own.ok) return "missing";
  const success = ctx.db.lastSuccess(tool.name, fileId);
  if (success === undefined) return "never-run";
  if (ctx.db.lastRealRun(tool.name, fileId)?.real_run_result !== "succeeded") return "last-failed";
  if (success !== fingerprint) return "inputs-changed";
  if (ctx.mode === "dry-run") {
    for (const p of Object.values(tool.info.parameters)) {
      const from = prod.get(p.dataName);
      if (from && ctx.wouldRefresh.has(from.name)) return "upstream-refresh";
    }
  }
  return "up-to-date";
}

/** One invocation. Returns false when the run must stop (RUN-08, RUN-10). */
function invoke(ctx: RunContext, tool: Tool, prod: Map<string, Tool>, file?: FileEntry): boolean {
  const fileId = file?.id;
  const label = fileId ? `${tool.name} on ${fileId}` : tool.name;
  const ids = fileId ? { file_id: fileId } : {};
  const own = loadOwnOutputs(ctx, tool, fileId);
  const { input, forCache, fingerprint, staleInputs } = buildInput(ctx, tool, prod, file);
  const reason = refreshReason(ctx, tool, prod, fileId, fingerprint, own);
  const inv: CacheInvocation = { tool: tool.name, ...ids, refreshReason: reason, input: forCache };
  ctx.invocations.push(inv);

  // RUN-17: a real run skips what is up to date; a dry-run-only pass dry-runs everything.
  if (reason === "up-to-date" && ctx.mode === "real") {
    log.comment("step", `${label}: up to date, skipped`);
    emit({ event: "tool_skipped", tool: tool.name, ...ids, refreshReason: "up-to-date" });
    ctx.db.recordToolRun({ runId: ctx.runId, mode: "real", tool: tool.name, fileId, refreshReason: "skipped", fingerprint });
    inv.skipped = true;
    return true;
  }
  if (!own.ok) log.comment("step", `${label}: ${own.problem}`);

  // RUN-08: the dry run, with --stdin and the JSON (RUN-15: command line and JSON in the log).
  log.comment("step", `${label}: dry run (${reason})`);
  log.entry("info", "tool_invoked", { tool: tool.name, ...ids, mode: "dry-run", argv: [tool.launcher, "--dry-run", "--stdin"], json: input });
  const dry = dryRun(tool, input, DATA);
  log.entry(dry.dryRun === "go" ? "info" : "error", "tool_dry_run_result",
    { tool: tool.name, ...ids, dryRun: dry.dryRun, exitCode: dry.exitCode, lastLine: dry.lastLine, stderr: dry.stderr || undefined });
  // A tool's diagnostics come on its go line, and in result.json after a real run (DATA-14, DATA-17).
  const lastLine = dry.lastLine as { diagnostics?: unknown } | undefined;
  const dryDiagnostics = Array.isArray(lastLine?.diagnostics) ? (lastLine.diagnostics as Diagnostic[]) : undefined;
  inv.dryRun = {
    dryRun: dry.dryRun, ...(dry.errorKind ? { errorKind: dry.errorKind } : {}), ...(dry.error ? { error: dry.error } : {}),
    ...(dryDiagnostics ? { diagnostics: dryDiagnostics } : {}),
  };
  emit({
    event: "tool_dry_run", tool: tool.name, ...ids, refreshReason: reason, dryRun: dry.dryRun,
    ...(dry.errorKind ? { errorKind: dry.errorKind } : {}), ...(dry.error ? { error: dry.error } : {}), staleInputs,
  });
  if (ctx.mode === "dry-run") {
    ctx.dryRunDiagnostics.push({
      tool: tool.name, ...ids, refreshReason: reason, dryRun: dry.dryRun, ...(dry.error ? { error: dry.error } : {}),
      ...(dryDiagnostics ? { diagnostics: dryDiagnostics } : {}), staleInputs,
    });
    ctx.db.recordToolRun({ runId: ctx.runId, mode: "dry-run", tool: tool.name, fileId, refreshReason: reason, dryRunResult: dry.dryRun });
    if (reason !== "up-to-date") ctx.wouldRefresh.add(tool.name);
  }
  if (dry.dryRun === "no-go") {
    if (dry.errorKind === "invocation") log.comment("runner-bug", `${label}: the tool reported an invocation error, so the JSON the Runner built is wrong.`);
    if (ctx.mode === "real") ctx.db.recordToolRun({ runId: ctx.runId, mode: "real", tool: tool.name, fileId, refreshReason: reason, dryRunResult: "no-go", fingerprint });
    dropOwnOutputs(ctx, tool, fileId);
    return false;
  }
  if (ctx.mode === "dry-run") return true;

  // RUN-09: the real run, then the tool's result.json in the store the Runner passed, its log and its output.
  log.comment("step", `${label}: real run`);
  log.entry("info", "tool_invoked", { tool: tool.name, ...ids, mode: "real", argv: [tool.launcher, "--stdin"], json: input });
  const resultFile = path.join(ctx.stores.get(tool.name)!, "result.json");
  const t0 = Date.now();
  const real = realRun(tool, input, DATA);
  let status: "succeeded" | "failed" = "failed";
  let error: Diagnostic | undefined;
  let result: Record<string, unknown> | undefined;
  const fresh = fs.existsSync(resultFile) && fs.statSync(resultFile).mtimeMs >= t0 - 1000;
  if (real.startError) error = { severity: "error", code: "E8", message: `Couldn't start ${tool.name}: ${real.startError}` };
  else if (!fresh) {
    // A tool that crashes without writing its result: a failed real run (errors table).
    error = { severity: "error", code: "E8", message: `${label}: the tool exited with code ${real.exitCode} without writing result.json.`, details: { exitCode: real.exitCode, stderr: real.stderr } };
  } else {
    result = readJson(resultFile) as Record<string, unknown> | undefined;
    if (!result || result.tool !== tool.name) error = { severity: "error", code: "E8", message: `${label}: result.json is unreadable or names another tool.` };
    else if (result.status === "succeeded" && real.exitCode === 0) status = "succeeded";
    else error = (result.error as Diagnostic | undefined) ?? { severity: "error", code: "E8", message: `${label}: failed with exit code ${real.exitCode}.` };
  }
  if (status === "succeeded") {
    // An output that fails the shape check right after the tool ran: that tool's failed real run (errors table).
    const check = loadOwnOutputs(ctx, tool, fileId);
    if (!check.ok) {
      status = "failed";
      error = { severity: "error", code: "E8", message: `${label}: its output fails the shape check: ${check.problem}` };
    }
  }
  const toolLog = typeof result?.logPath === "string" ? result.logPath : undefined;
  if (toolLog) {
    try {
      const entries = readLog(fs.readFileSync(toolLog, "utf8"));
      log.entry("info", "tool_log_read", { tool: tool.name, ...ids, logPath: toolLog, entryCount: entries.length, errors: entries.filter((e) => e.level === "error") });
    } catch {
      log.entry("warn", "tool_log_unreadable", { tool: tool.name, ...ids, logPath: toolLog });
    }
  }
  log.entry(status === "succeeded" ? "info" : "error", "tool_real_run_result",
    { tool: tool.name, ...ids, status, exitCode: real.exitCode, resultPath: resultFile, error, stderr: real.stderr || undefined });
  if (result) inv.result = result;
  ctx.db.recordToolRun({ runId: ctx.runId, mode: "real", tool: tool.name, fileId, refreshReason: reason, dryRunResult: "go", realRunResult: status, fingerprint });
  emit({
    event: "tool_run", tool: tool.name, ...ids, status, ...(error ? { error } : {}), ...(toolLog ? { logPath: toolLog } : {}),
    ...(typeof result?.outputChange === "string" ? { outputChange: result.outputChange } : {}),
  });
  if (status === "failed") {
    dropOwnOutputs(ctx, tool, fileId);
    return false;
  }
  for (const [file, outs] of outputFiles(tool, ctx.stores.get(tool.name)!, fileId)) {
    for (const o of outs) ctx.db.recordOutput(tool.name, o.dataName, o.formatVersion, file, fingerprint);
  }
  return true;
}

/** The cache's graph part: every data name, grouped, from the outputs this run read or produced (RUN-25, RUN-27). */
function buildData(ctx: RunContext): Record<string, CacheDataGroup> {
  const data: Record<string, CacheDataGroup> = {};
  for (const tool of ctx.order) {
    const store = ctx.stores.get(tool.name)!;
    for (const o of tool.info.outputs) {
      const targets = tool.info.invocation === "per-file" ? ctx.files.filter((f) => readsFile(tool, f.id)).map((f) => f.id) : [undefined];
      for (const fileId of targets) {
        const json = ctx.available.get(outputPath(store, o, fileId));
        if (!json || !Array.isArray(json[o.jsonKey])) continue;
        const group = (data[o.dataName] ??= {
          represents: o.represents,
          ...(o.containedIn ? { containedIn: o.containedIn } : {}),
          ...(o.contains ? { contains: o.contains } : {}),
          ...(o.fields ? { fields: o.fields } : {}),
          outputs: [],
        });
        group.outputs.push({ tool: tool.name, dataRef: fileId ? `${tool.name}:${fileId}` : tool.name, ...(fileId ? { file: fileId } : {}), records: json[o.jsonKey] as unknown[] });
      }
    }
  }
  return data;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]) {
  const a = { sourceRoot: undefined as string | undefined, dryRunOnly: false, readCache: false, help: false };
  for (const arg of argv) {
    if (arg === "--dry-run-only") a.dryRunOnly = true;
    else if (arg === "--read-cache") a.readCache = true;
    else if (arg === "--help" || arg === "-h") a.help = true;
    else if (arg.startsWith("-")) throw new Refusal("invocation", `Unknown option ${arg}. Run with --help to see the options.`);
    else if (a.sourceRoot !== undefined) throw new Refusal("invocation", `Only one source root can be given; got "${a.sourceRoot}" and "${arg}".`);
    else a.sourceRoot = arg;
  }
  if (a.readCache && a.dryRunOnly) throw new Refusal("invocation", "--read-cache and --dry-run-only can't be combined.");
  return a;
}

/** RUN-13: exactly the Runner's cache; reads nothing else, starts nothing, writes nothing. */
function readCache(): number {
  if (!fs.existsSync(CACHE_PATH)) {
    emit({ event: "cache", cache: null });
    return EXIT_OK;
  }
  const cache = readJson(CACHE_PATH);
  if (!cache || typeof cache !== "object") return refuse(new Refusal("cache-unreadable", `The Runner's cache ${CACHE_PATH} is not valid JSON.`));
  emit({ event: "cache", cache: cache as RunnerCache });
  return EXIT_OK;
}

function main(argv: string[]): number {
  let args: ReturnType<typeof parseArgs>;
  try {
    args = parseArgs(argv);
  } catch (e) {
    return refuse(e as Refusal);
  }
  if (args.help) {
    process.stdout.write(HELP);
    return EXIT_OK;
  }
  if (args.readCache) return readCache();

  const mode: Mode = args.dryRunOnly ? "dry-run" : "real";

  // The source root: user-defined, no default (RUN-29). Checked before anything is written (RUN-03).
  const given = args.sourceRoot;
  const rootText = given ?? readSettingIfExists(DB_PATH, "source_root");
  if (rootText === undefined) {
    return refuse(new Refusal("source-root-missing",
      "No source root: give the folder to examine as the first argument, for example `zaansouvi-run ./my-project`. None is saved from an earlier run."));
  }
  const sourceRoot = path.resolve(rootText);
  try {
    if (!fs.statSync(sourceRoot).isDirectory()) throw new Error("not a folder");
    fs.accessSync(sourceRoot, fs.constants.R_OK | fs.constants.X_OK);
  } catch (e) {
    return refuse(new Refusal("source-root-unreadable",
      `The source root ${sourceRoot}${given ? "" : " (saved from an earlier run)"} is missing or can't be read: ${(e as Error).message}.`));
  }

  const started = new Date();
  const stamp = started.toISOString().replace(/:/g, "-");
  const runId = `${stamp}-${process.pid}`;

  let lockInfo: { staleTakenOver?: unknown };
  try {
    lockInfo = takeLock(runId);
  } catch (e) {
    if (e instanceof Refusal) return refuse(e);
    throw e;
  }

  // RUN-04: the database, and its structure version.
  const opened = openDb(DB_PATH);
  if ("unknownVersion" in opened) {
    return refuse(new Refusal("database-version", `The database ${DB_PATH} has structure version ${String(opened.unknownVersion)}; this Runner knows only version 1.`));
  }
  const db = opened.db;
  try {
    // RUN-14: every run writes its log, a dry-run-only pass too, marked in its first entries.
    log = openLog(path.join(LOGS, `${stamp}.log`));
    log.comment("run", `zaansouvi-run, ${mode === "dry-run" ? "dry-run-only pass" : "real run"} on ${sourceRoot}`);
    log.entry("info", "runner_started", { runId, mode, sourceRoot, argv: process.argv.slice(2), pid: process.pid });
    if (lockInfo.staleTakenOver) log.entry("warn", "stale_lock_taken_over", { previous: lockInfo.staleTakenOver });

    // RUN-05: the tools, their --info, the order; RUN-29: what the Runner must provide.
    let order: Tool[];
    let prod: Map<string, Tool>;
    try {
      const tools = findTools(TOOLS_DIR, (folder, reason) => log.entry("info", "tool_folder_skipped", { folder, reason }));
      order = workOutOrder(tools);
      prod = producers(tools);
      for (const t of order) {
        for (const [key, p] of Object.entries(t.info.parameters)) {
          if (p.required && isRunnerProvided(p.dataName) && !canProvide(t, p.dataName)) {
            throw new StartupError("no-provider", `Tool "${t.name}" requires parameter "${key}" (data "${p.dataName}"), which the Runner can't provide to it.`, { tool: t.name, parameter: key });
          }
        }
      }
    } catch (e) {
      if (e instanceof StartupError) return refuse(new Refusal(e.code, e.message, e.details));
      throw e;
    }

    // Store paths: from the saved configuration, else the default (RUN-26, RUN-29).
    const stores = new Map<string, string>();
    for (const t of order) {
      const saved = db.getSetting(`store_path.${t.name}`);
      const store = saved !== undefined ? path.resolve(MVP_ROOT, saved) : path.join(DATA, "tools", t.name);
      if (fs.existsSync(store) && !fs.statSync(store).isDirectory()) {
        return refuse(new Refusal("provided-value-invalid", `The store path for "${t.name}", ${store}, is not a folder.`));
      }
      stores.set(t.name, store);
    }

    db.writeTools(order.map((t) => ({ name: t.name, launcher: t.launcher, info: t.info, version: t.info.toolVersion })), order.map((t) => t.name));
    for (const t of order) db.setSetting(`tool.${t.name}.enabled`, "true");
    db.setSetting("source_root", sourceRoot);
    log.entry("info", "tools_ordered", { order: order.map((t) => t.name), stores: Object.fromEntries(stores) });

    emit({ event: "run_started", runId, mode, sourceRoot, time: started.toISOString() });
    db.startRun(runId, mode, started.toISOString(), log.path);

    const files = listFiles(sourceRoot);
    db.writeFiles(sourceRoot, files.map((f) => ({ id: f.id, size: f.size, sha256: f.sha256 })));
    emit({ event: "files_listed", fileCount: files.length });

    const ctx: RunContext = {
      mode, runId, sourceRoot, db, order, files, stores,
      available: new Map(), wouldRefresh: new Set(), invocations: [], dryRunDiagnostics: [],
    };

    let ok = true;
    for (const tool of order) {
      const targets = tool.info.invocation === "per-file" ? files.filter((f) => readsFile(tool, f.id)) : [undefined];
      for (const file of targets) {
        if (!invoke(ctx, tool, prod, file)) {
          ok = false;
          break;
        }
      }
      if (!ok) break;
    }

    const exitCode = ok ? EXIT_OK : EXIT_STOPPED;
    const outcome = ok ? "succeeded" : "failed";
    const finished = new Date();
    db.finishRun(runId, outcome, exitCode, finished.toISOString());

    // RUN-27: a real run replaces the whole cache; a dry-run-only pass replaces only its diagnostics part.
    if (mode === "real") {
      const cache: RunnerCache = {
        formatVersion: CACHE_FORMAT_VERSION,
        run: { runId, mode: "real", outcome, exitCode, started: started.toISOString(), finished: finished.toISOString(), sourceRoot, logPath: log.path },
        files: files.map((f) => ({ id: f.id, sourceBytes: f.size, sourceSha256: f.sha256 })),
        tools: order.map((t, i) => ({ tool: t.name, position: i + 1, info: t.info })),
        invocations: ctx.invocations,
        data: buildData(ctx),
      };
      writeAtomic(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
    } else {
      const previous = readJson(CACHE_PATH) as RunnerCache | undefined;
      const base: RunnerCache = previous && typeof previous === "object" ? previous : { formatVersion: CACHE_FORMAT_VERSION };
      writeAtomic(CACHE_PATH, JSON.stringify({ ...base, dryRun: { runId, time: finished.toISOString(), invocations: ctx.dryRunDiagnostics } }, null, 2) + "\n");
    }
    log.entry("info", "cache_written", { path: CACHE_PATH, part: mode === "real" ? "whole cache" : "dryRun only" });

    emit({ event: "run_finished", runId, outcome, exitCode, time: finished.toISOString(), logPath: log.path });
    return exitCode;
  } finally {
    db.close();
  }
}

process.exitCode = main(process.argv.slice(2));
