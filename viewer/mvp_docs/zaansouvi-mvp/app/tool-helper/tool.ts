// Tool helper for ZaAnSouVi MVP tools (04_tools.md, TOOL-45; ARCH-02).
//
// The contract every tool shares: options (TOOL-01), reading parameters in the decided order with last_run.json
// only as a complete input (TOOL-02, TOOL-43), the shape check (TOOL-03), last_run.json (TOOL-04, DATA-15), the log
// (DATA-16), result.json (DATA-14), the dry run's output (TOOL-06, DATA-17), the store from store_path or
// ./zaansouvi/tools/<tool>/ in the working folder (DATA-21, FND-59), last_run.json in the store, E14, atomic writes (TOOL-05), error and exit codes.
//
// It knows nothing about any specific tool. Everything tool-specific comes from the tool: its --info (which
// also drives the parameter options and the shape check), its help text, its extra shape checks and its work.
// Only Node built-ins. Tools import it; it imports nothing from a tool, the Runner or the Viewer.

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Codes and shapes
// ---------------------------------------------------------------------------

export const EXIT_OK = 0;
export const EXIT_RUN_ERROR = 1;
export const EXIT_INVOCATION_ERROR = 2;

/** The error codes every tool shares (04_tools.md, "Error codes"). A tool may add its own notes. */
export const COMMON_ERROR_CODES: Record<string, string> = {
  E1: "invocation: malformed invocation (both --json and --stdin, unknown option, option without its value)",
  E2: "invocation: explicit JSON input unusable (file missing or unreadable, not valid JSON, not an object)",
  E3: "invocation: no parameters and no usable last_run.json",
  E13: "invocation: a parameter is missing or has the wrong shape",
  E14: "invocation: run from inside the examined source; tools must never be run from the source path",
  E6: "run: the file to read is missing or unreadable",
  E12: "run: a value is incorrect or incongruent, or lacks what the tool needs",
  E8: "run: unexpected failure",
};

/** The known parameter naming the tool's store (DATA-21). It doesn't affect the output. */
export const STORE_PATH_PARAMETER = "store_path";

/** The known parameter naming the examined source's root (DATA-09); only tools that read files take it. */
export const SOURCE_ROOT_PARAMETER = "source_root";

/** With no store given, a tool's store is <working folder>/zaansouvi/tools/<tool>/: the same layout as the Runner's data
 *  folder, so a copied data folder can be used by hand (decided by the user on 2026-11-08; toolset.md 4.5). */
export const DEFAULT_STORE_ROOT = path.join("zaansouvi", "tools");

export type Position = { line: number; column: number };
export type Location = { file: string; start: Position; end: Position };
export type Diagnostic = { severity: "error" | "warning" | "info"; code: string; message: string; location?: Location; details?: unknown };

export type ParameterInfo = { dataName: string; shape: string; required: boolean; affectsOutput: boolean; [extra: string]: unknown };
export type ToolInfo = { tool: string; toolVersion: string; parameters: Record<string, ParameterInfo>; [extra: string]: unknown };

export type Params = Record<string, unknown>;
export type ParamSource = "json" | "stdin" | "last_run" | "command line" | "command line + last_run";

export class ToolError extends Error {
  kind: "invocation" | "run";
  diagnostic: Diagnostic;
  constructor(kind: "invocation" | "run", code: string, message: string, location?: Location, details?: unknown) {
    super(message);
    this.kind = kind;
    this.diagnostic = { severity: "error", code, message };
    if (location) this.diagnostic.location = location;
    if (details !== undefined) this.diagnostic.details = details;
  }
}

/** A shape problem: nothing is written, exit 2 (TOOL-03). */
export const invocationError = (code: string, message: string, details?: unknown) => new ToolError("invocation", code, message, undefined, details);
/** A value problem or a failure while working: logged, result.json failed, exit 1 (TOOL-03, TOOL-05). */
export const runError = (code: string, message: string, location?: Location, details?: unknown) => new ToolError("run", code, message, location, details);

export type Logger = {
  entry: (level: "info" | "warn" | "error", event: string, details?: Record<string, unknown>) => void;
  comment: (type: string, text: string) => void;
};

export type WorkContext = { params: Params; store: string; log: Logger; mode: "real" | "dry-run" };

export type WorkResult = {
  /** Output files, `path` relative to the store. Written only in a real run, each to a temporary name then renamed. */
  outputs: { path: string; content: unknown }[];
  /** Extra fields for the summary line, the go line and result.json, for example `counts`. */
  summary?: Record<string, unknown>;
  /** Extra fields for result.json only, for example what was read. */
  resultExtra?: Record<string, unknown>;
  /** Notes on how the run went (for example constructs skipped). They go in result.json and the dry run's go line,
   *  never in an output file: diagnostics describe a run, not data another tool may use (DATA-14). */
  diagnostics?: Diagnostic[];
};

export type ToolSpec = {
  info: ToolInfo;
  help: string;
  /** The folder of the tool's launcher, for the log only: nothing is written there (the store and last_run.json are
   *  elsewhere, toolset.md 4.5). */
  programDir: string;
  /** Tool-specific shape checks, after the generic ones from --info. Throw invocationError("E13", ...). */
  checkShape?: (p: Params) => void;
  /** The work, the same in a real run and a dry run. Throw runError(...) for run errors. */
  work: (ctx: WorkContext) => WorkResult;
  /** Fields identifying what this run is about, for its output lines (for example which file). */
  identity?: (p: Params) => Record<string, unknown>;
  /** A suffix for the log file name, after the timestamp. */
  logName?: (p: Params) => string;
  /** A hint logged after a run error with this code. */
  hints?: Record<string, string>;
  /** Whether the dry run prints a preview line with each would-be output. */
  preview?: boolean;
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const out = (value: unknown) => process.stdout.write(JSON.stringify(value) + "\n");

export function errText(e: unknown): string {
  if (e && typeof e === "object" && "code" in e && typeof (e as { code: unknown }).code === "string") {
    return `${(e as { code: string }).code} (${(e as unknown as Error).message})`;
  }
  return e instanceof Error ? e.message : String(e);
}

export function describe(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "an array";
  return typeof v === "string" ? `"${v}"` : `a ${typeof v}`;
}

const stamp = (d: Date) => d.toISOString().replace(/:/g, "-");

function writeAtomic(file: string, content: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

function existingChange(file: string, content: string): "create" | "update" | "unchanged" {
  try {
    return fs.readFileSync(file, "utf8") === content ? "unchanged" : "update";
  } catch {
    return "create";
  }
}

function overallChange(changes: string[]): string {
  if (changes.length === 1) return changes[0];
  if (changes.every((c) => c === "unchanged")) return "unchanged";
  if (changes.every((c) => c === "create")) return "create";
  return "update";
}

function toDiagnostic(e: unknown): Diagnostic {
  if (e instanceof ToolError) return e.diagnostic;
  return { severity: "error", code: "E8", message: `Unexpected failure: ${errText(e)}`, details: { stack: e instanceof Error ? e.stack : undefined } };
}

// ---------------------------------------------------------------------------
// Command line (TOOL-01): common options, plus one option per string parameter in --info
// ---------------------------------------------------------------------------

type Cli = { info: boolean; help: boolean; version: boolean; dryRun: boolean; stdin: boolean; json?: string; log?: string; params: Record<string, string> };

const FLAG_OPTIONS = ["--info", "--help", "--version", "--dry-run", "--stdin"];

/** A parameter key `some_key` gives the option `--some-key`, for every parameter whose shape is a string. */
export function parameterOptions(info: ToolInfo): Record<string, string> {
  const opts: Record<string, string> = {};
  for (const [key, p] of Object.entries(info.parameters)) if (p.shape === "string") opts[`--${key.replace(/_/g, "-")}`] = key;
  return opts;
}

function parseArgs(argv: string[], paramOptions: Record<string, string>): Cli {
  const cli: Cli = { info: false, help: false, version: false, dryRun: false, stdin: false, params: {} };
  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i];
    let inline: string | undefined;
    const eq = arg.indexOf("=");
    if (arg.startsWith("--") && eq > 0) {
      inline = arg.slice(eq + 1);
      arg = arg.slice(0, eq);
    }
    if (arg === "-h") arg = "--help";
    if (inline !== undefined && FLAG_OPTIONS.includes(arg)) throw invocationError("E1", `Option ${arg} takes no value.`);
    const takeValue = (): string => {
      if (inline !== undefined) return inline;
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) throw invocationError("E1", `Option ${arg} needs a value.`);
      i++;
      return next;
    };
    switch (arg) {
      case "--info": cli.info = true; break;
      case "--help": cli.help = true; break;
      case "--version": cli.version = true; break;
      case "--dry-run": cli.dryRun = true; break;
      case "--stdin": cli.stdin = true; break;
      case "--json": cli.json = takeValue(); break;
      case "--log": cli.log = takeValue(); break;
      default:
        if (arg in paramOptions) {
          cli.params[paramOptions[arg]] = takeValue();
          break;
        }
        throw invocationError("E1", arg.startsWith("-")
          ? `Unknown option ${arg}. Run with --help to see the options.`
          : `Unexpected argument "${arg}". This tool takes no positional arguments.`);
    }
  }
  if (cli.json !== undefined && cli.stdin) throw invocationError("E1", "Both --json and --stdin were given. Pass the parameters one way only.");
  return cli;
}

// ---------------------------------------------------------------------------
// Parameters (TOOL-02, TOOL-03, TOOL-43)
// ---------------------------------------------------------------------------

function parseJsonObject(text: string, what: string, code: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    throw invocationError(code, `${what} is not valid JSON: ${errText(e)}`);
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw invocationError(code, `${what} must be a JSON object, not ${describe(value)}.`);
  return value as Record<string, unknown>;
}

function readLastRun(file: string): Record<string, unknown> | string {
  let text: string;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return `there is no last_run.json at ${file}`;
  }
  try {
    const v = JSON.parse(text);
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  } catch {
    // fall through
  }
  return `last_run.json at ${file} is not a usable JSON object`;
}

/** Command-line parameters, then --json or --stdin, then last_run.json, which is only ever a complete input. */
function loadParams(cli: Cli, lastRunPath: string): { params: Params; source: ParamSource } {
  let base: Record<string, unknown> = {};
  let source: ParamSource;
  if (cli.json !== undefined) {
    let text: string;
    try {
      text = fs.readFileSync(cli.json, "utf8");
    } catch (e) {
      throw invocationError("E2", `Cannot read the JSON parameters file ${cli.json}: ${errText(e)}`);
    }
    base = parseJsonObject(text, `The JSON parameters file ${cli.json}`, "E2");
    source = "json";
  } else if (cli.stdin) {
    let text: string;
    try {
      text = fs.readFileSync(0, "utf8");
    } catch (e) {
      throw invocationError("E2", `Cannot read the parameters from standard input: ${errText(e)}`);
    }
    if (text.trim() === "") throw invocationError("E2", "--stdin was given, but standard input was empty.");
    base = parseJsonObject(text, "The JSON on standard input", "E2");
    source = "stdin";
  } else {
    const hasCli = Object.keys(cli.params).length > 0;
    const last = readLastRun(lastRunPath);
    if (typeof last === "string") {
      if (!hasCli) throw invocationError("E3", `No parameters were given, and ${last}. Nothing to repeat.`);
      source = "command line";
    } else {
      // The store is where last_run.json was found, never a store recorded in it (toolset.md 4.5), so a copied
      // store repeats into itself, not into the folder it was copied from.
      delete last[STORE_PATH_PARAMETER];
      base = last;
      source = hasCli ? "command line + last_run" : "last_run";
    }
  }
  const params: Params = { ...base, ...cli.params };
  delete params._last_run; // metadata written next to the parameters, not a parameter
  return { params, source };
}

/** The generic shape check, from --info: required parameters present; strings non-empty; arrays arrays. */
function checkGenericShape(info: ToolInfo, p: Params) {
  for (const [key, d] of Object.entries(info.parameters)) {
    const v = p[key];
    if (v === undefined || v === null) {
      if (d.required) throw invocationError("E13", `Required parameter "${key}" is missing.`, { parameter: key });
      continue;
    }
    if (d.shape === "string" && (typeof v !== "string" || v === "")) {
      throw invocationError("E13", `Parameter "${key}" must be a non-empty string; got ${describe(v)}.`, { parameter: key });
    }
    if (d.shape.startsWith("array") && !Array.isArray(v)) {
      throw invocationError("E13", `Parameter "${key}" must be an array; got ${describe(v)}.`, { parameter: key });
    }
  }
}

/** For each parameter that doesn't affect the output: whether the input gave it or its default applies (TOOL-43). */
function nonOutputSources(info: ToolInfo, p: Params): Record<string, "input" | "default"> {
  const sources: Record<string, "input" | "default"> = {};
  for (const [key, d] of Object.entries(info.parameters).sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (!d.affectsOutput) sources[key] = p[key] !== undefined ? "input" : "default";
  }
  return sources;
}

// ---------------------------------------------------------------------------
// Logging (DATA-16); in a dry run the same entries go to standard output as JSON lines
// ---------------------------------------------------------------------------

function fileLogger(file: string, copy?: string): Logger {
  let copyPath = copy;
  const write = (line: string) => {
    fs.appendFileSync(file, line + "\n");
    if (!copyPath) return;
    try {
      fs.appendFileSync(copyPath, line + "\n");
    } catch (e) {
      const failed = copyPath;
      copyPath = undefined;
      fs.appendFileSync(file, `${new Date().toISOString()}\twarn\tlog_copy_failed\t${JSON.stringify({ logCopyPath: failed, errorText: errText(e) })}\n`);
    }
  };
  return {
    entry: (level, event, details = {}) => write(`${new Date().toISOString()}\t${level}\t${event}\t${JSON.stringify(details)}`),
    comment: (type, text) => write(`# [${type}] ${text.replace(/\n/g, " ")}`),
  };
}

const stdoutLogger: Logger = {
  entry: (level, event, details = {}) => out({ type: "log", time: new Date().toISOString(), level, event, details }),
  comment: (type, text) => out({ type: "comment", commentType: type, text }),
};

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

type Run = { spec: ToolSpec; p: Params; source: ParamSource; sources: Record<string, "input" | "default">; store: string; lastRunPath: string; logCopy?: string };

const toolLabel = (spec: ToolSpec) => spec.info.tool;

function writeLastRun(r: Run, meta: Record<string, unknown>) {
  const _last_run = { tool: r.spec.info.tool, toolVersion: r.spec.info.toolVersion, ...meta };
  // last_run.json sits in the store and doesn't record it: the store is wherever the file is (toolset.md 4.5).
  const { [STORE_PATH_PARAMETER]: _store, ...params } = r.p;
  writeAtomic(r.lastRunPath, JSON.stringify({ ...params, _last_run }, null, 2) + "\n");
}

/** E14: a tool that is given a source root never runs from inside it (decided by the user on 2026-11-08). Tools that
 *  read no files have no source root, so they can't check this. */
function checkNotInSource(p: Params) {
  const root = p[SOURCE_ROOT_PARAMETER];
  if (typeof root !== "string") return;
  const real = (x: string) => {
    try {
      return fs.realpathSync(x);
    } catch {
      return path.resolve(x);
    }
  };
  const cwd = real(process.cwd());
  const src = real(root);
  const rel = path.relative(src, cwd);
  if (rel === "" || (rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel))) {
    throw invocationError("E14",
      `The working folder ${cwd} is inside the examined source ${src}. Tools must never be run from the source path: ` +
      "change to a folder outside the examined source and run again.", { workingFolder: cwd, sourceRoot: src });
  }
}

function realRun(r: Run): number {
  const { spec, p } = r;
  const { tool, toolVersion } = spec.info;
  const ids = spec.identity?.(p) ?? {};
  const started = new Date();
  const resultPath = path.join(r.store, "result.json");
  const name = spec.logName?.(p);
  const logFile = path.join(r.store, "logs", `${stamp(started)}${name ? `_${name}` : ""}.log`);

  let log: Logger;
  try {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    log = fileLogger(logFile, r.logCopy);
  } catch (e) {
    process.stderr.write(`${tool}: run error E8: cannot create the store at ${r.store}: ${errText(e)}\n`);
    return EXIT_RUN_ERROR;
  }
  const what = Object.values(ids).filter((v) => typeof v === "string").join(", ");
  log.comment("run", `${tool} ${toolVersion}: real run${what ? ` on ${what}` : ""}`);
  log.entry("info", "run_started", {
    tool, toolVersion, mode: "real", parameterSource: r.source, nonOutputParameterSources: r.sources, effectiveParameters: p,
    argv: process.argv.slice(2), programDir: spec.programDir, storePath: r.store, logCopyPath: r.logCopy ?? null,
  });

  try {
    // The parameters passed the shape check, so the run has begun: save them (TOOL-04).
    writeLastRun(r, { outcome: "started", started: started.toISOString() });
    log.entry("info", "last_run_saved", { lastRunPath: r.lastRunPath });

    const w = spec.work({ params: p, store: r.store, log, mode: "real" });
    const written: string[] = [];
    const changes: string[] = [];
    for (const o of w.outputs) {
      const file = path.join(r.store, o.path);
      const content = JSON.stringify(o.content, null, 2) + "\n";
      const change = existingChange(file, content);
      writeAtomic(file, content);
      written.push(file);
      changes.push(change);
      log.entry("info", "output_written", { outputPath: file, outputChange: change, dataNames: (o.content as { dataNames?: unknown })?.dataNames });
    }
    const change = overallChange(changes);
    const finished = new Date();
    const result = {
      tool, toolVersion, status: "succeeded", mode: "real", started: started.toISOString(), finished: finished.toISOString(),
      durationMs: finished.getTime() - started.getTime(), parameterSource: r.source, nonOutputParameterSources: r.sources, effectiveParameters: p,
      ...w.resultExtra, outputPaths: written, outputChange: change, ...w.summary, diagnostics: w.diagnostics ?? [], logPath: logFile,
    };
    writeAtomic(resultPath, JSON.stringify(result, null, 2) + "\n");
    writeLastRun(r, { outcome: "succeeded", started: result.started, finished: result.finished, resultPath });
    log.entry("info", "run_finished", { status: "succeeded", durationMs: result.durationMs, resultPath });
    out({ status: "succeeded", ...ids, outputPath: written[0], outputPaths: written, outputChange: change, ...w.summary, logPath: logFile });
    return EXIT_OK;
  } catch (e) {
    const error = toDiagnostic(e);
    const finished = new Date();
    log.entry("error", "run_failed", { error });
    if (spec.hints?.[error.code]) log.comment("hint", spec.hints[error.code]);
    try {
      const result = {
        tool, toolVersion, status: "failed", mode: "real", started: started.toISOString(), finished: finished.toISOString(),
        durationMs: finished.getTime() - started.getTime(), parameterSource: r.source, nonOutputParameterSources: r.sources, effectiveParameters: p,
        error, outputPaths: [], logPath: logFile,
      };
      writeAtomic(resultPath, JSON.stringify(result, null, 2) + "\n");
      writeLastRun(r, { outcome: "failed", started: result.started, finished: result.finished, error, resultPath });
    } catch (inner) {
      log.entry("error", "result_not_written", { errorText: errText(inner) });
    }
    log.entry("info", "run_finished", { status: "failed" });
    process.stderr.write(`${tool}: run error ${error.code}: ${error.message}\n`);
    out({ status: "failed", ...ids, error, logPath: logFile });
    return EXIT_RUN_ERROR;
  }
}

/** TOOL-06, DATA-17: the same work, nothing written, everything on standard output, a final go / no-go line. */
function dryRun(r: Run): number {
  const { spec, p } = r;
  const { tool, toolVersion } = spec.info;
  const ids = spec.identity?.(p) ?? {};
  const log = stdoutLogger;
  log.entry("info", "run_started", { tool, toolVersion, mode: "dry-run", parameterSource: r.source, nonOutputParameterSources: r.sources, effectiveParameters: p });
  if (r.logCopy) log.entry("warn", "log_option_ignored", { reason: "a dry run writes nothing to the file system", logCopyPath: r.logCopy });
  try {
    const w = spec.work({ params: p, store: r.store, log, mode: "dry-run" });
    if (spec.preview) {
      const files = w.outputs.map((o) => path.join(r.store, o.path));
      const wouldWrite = [...files, path.join(r.store, "result.json"), path.join(r.store, "logs", "<timestamp>.log"), r.lastRunPath];
      w.outputs.forEach((o, i) => {
        out({ type: "preview", outputPath: files[i], outputChange: existingChange(files[i], JSON.stringify(o.content, null, 2) + "\n"), wouldWrite, content: o.content });
      });
    }
    out({ dryRun: "go", tool, toolVersion, ...ids, ...w.summary, diagnostics: w.diagnostics ?? [] });
    return EXIT_OK;
  } catch (e) {
    const error = toDiagnostic(e);
    if (spec.hints?.[error.code]) log.comment("hint", spec.hints[error.code]);
    out({ dryRun: "no-go", errorKind: "run", tool, toolVersion, ...ids, error });
    return EXIT_RUN_ERROR;
  }
}

/** Invocation errors write nothing and log nothing (toolset.md 4.5). A dry run also gets a no-go line (FND-13). */
function invocationFailure(spec: ToolSpec, e: unknown, dry: boolean): number {
  const error = e instanceof ToolError ? e.diagnostic : { severity: "error" as const, code: "E1", message: errText(e) };
  process.stderr.write(`${toolLabel(spec)}: invocation error ${error.code}: ${error.message}\n`);
  process.stderr.write(JSON.stringify({ invocationError: error }) + "\n");
  if (dry) out({ dryRun: "no-go", errorKind: "invocation", tool: spec.info.tool, toolVersion: spec.info.toolVersion, error });
  return EXIT_INVOCATION_ERROR;
}

/** Runs a tool from its command line. Returns the exit code. */
export function runTool(spec: ToolSpec, argv: string[]): number {
  let cli: Cli;
  try {
    cli = parseArgs(argv, parameterOptions(spec.info));
  } catch (e) {
    return invocationFailure(spec, e, argv.includes("--dry-run"));
  }
  if (cli.help) {
    process.stdout.write(spec.help);
    return EXIT_OK;
  }
  if (cli.version) {
    process.stdout.write(`${spec.info.tool} ${spec.info.toolVersion}\n`);
    return EXIT_OK;
  }
  if (cli.info) {
    process.stdout.write(JSON.stringify(spec.info, null, 2) + "\n");
    return EXIT_OK;
  }
  // The store: --store-path, else store_path in the JSON input, else <working folder>/zaansouvi/tools/<tool>/.
  // With no JSON input, last_run.json is looked for in the store from the command line, else the default one.
  const defaultStore = path.resolve(DEFAULT_STORE_ROOT, spec.info.tool);
  const cliStore = cli.params[STORE_PATH_PARAMETER];
  const lastRunStore = typeof cliStore === "string" ? path.resolve(cliStore) : defaultStore;
  let run: Run;
  try {
    const loaded = loadParams(cli, path.join(lastRunStore, "last_run.json"));
    checkGenericShape(spec.info, loaded.params);
    checkNotInSource(loaded.params);
    spec.checkShape?.(loaded.params);
    const storeParam = loaded.params[STORE_PATH_PARAMETER];
    const store = typeof storeParam === "string" ? path.resolve(storeParam) : defaultStore;
    run = {
      spec, p: loaded.params, source: loaded.source, sources: nonOutputSources(spec.info, loaded.params),
      store, lastRunPath: path.join(store, "last_run.json"), logCopy: cli.log,
    };
  } catch (e) {
    return invocationFailure(spec, e, cli.dryRun);
  }
  return cli.dryRun ? dryRun(run) : realRun(run);
}
