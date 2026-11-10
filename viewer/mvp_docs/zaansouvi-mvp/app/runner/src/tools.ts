// Everything the Runner knows about tools, learned only from their --info (RUN-25): finding them (RUN-05),
// the order (DATA-11), the data the Runner provides (RUN-29), output paths and the shape check (RUN-18),
// and invoking them (RUN-08, RUN-09). No branch on a tool's name.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { Diagnostic, OutputInfo, ToolInfo } from "../../shared/types.ts";
import { SOURCE_ROOT_DATA_NAME, SOURCE_ROOT_PARAMETER } from "../../shared/types.ts";
import { readJson } from "../../shared/fsutil.ts";

export type Tool = { name: string; launcher: string; info: ToolInfo };

const MAX_BUFFER = 512 * 1024 * 1024;

export class StartupError extends Error {
  code: string;
  details?: unknown;
  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// Finding the tools (RUN-05)
// ---------------------------------------------------------------------------

function isExecutableFile(p: string): boolean {
  try {
    if (!fs.statSync(p).isFile()) return false;
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * RUN-33: the tools the Runner runs, by name. A deliberate exception to "no code
 * for any tool" (RUN-25): the product adds and omits tools through named configurations instead (runner.md, section 2).
 */
export const RUN_LIST = ["ts-program"];

/** The listed tools, checked against the folders (RUN-33): a listed tool with no folder or launcher stops the run before
 *  any tool starts; a tool folder not listed is not run, and reported. Only listed tools' --info is read. */
export function findListedTools(toolsDir: string, runList: string[]): { tools: Tool[]; notListed: string[] } {
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(toolsDir, { withFileTypes: true });
  } catch {
    throw new StartupError("tools-folder-missing", `The tools folder ${toolsDir} can't be read.`);
  }
  const folders = entries.filter((d) => d.isDirectory()).map((d) => d.name).sort();
  const tools: Tool[] = [];
  for (const name of [...runList].sort()) {
    const launcher = path.join(toolsDir, name, name);
    if (!folders.includes(name) || !isExecutableFile(launcher)) {
      throw new StartupError("tool-not-found", `Tool "${name}" is in the Runner's run list but ${toolsDir}/${name}/${name} is missing or not executable.`, { tool: name });
    }
    tools.push({ name, launcher, info: readInfo(name, launcher) });
  }
  const notListed = folders.filter((f) => !runList.includes(f) && isExecutableFile(path.join(toolsDir, f, f)));
  return { tools, notListed };
}

/** A tool is a folder holding an executable launcher with the folder's name; other folders are skipped. */
export function findTools(toolsDir: string, onSkip: (folder: string, reason: string) => void): Tool[] {
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(toolsDir, { withFileTypes: true });
  } catch {
    throw new StartupError("tools-folder-missing", `The tools folder ${toolsDir} can't be read.`);
  }
  const tools: Tool[] = [];
  for (const e of entries.filter((d) => d.isDirectory()).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const launcher = path.join(toolsDir, e.name, e.name);
    if (!isExecutableFile(launcher)) {
      onSkip(e.name, `no executable launcher ${e.name}/${e.name}`);
      continue;
    }
    tools.push({ name: e.name, launcher, info: readInfo(e.name, launcher) });
  }
  return tools;
}

function readInfo(name: string, launcher: string): ToolInfo {
  const r = spawnSync(launcher, ["--info"], { encoding: "utf8", maxBuffer: MAX_BUFFER });
  const fail = (why: string) =>
    new StartupError("tool-info-failed", `Tool "${name}": --info ${why}.`, { tool: name, exitCode: r.status, stderr: r.stderr?.slice(0, 2000) });
  if (r.error) throw fail(`couldn't be started (${r.error.message})`);
  if (r.status !== 0) throw fail(`exited with code ${r.status}`);
  let info: unknown;
  try {
    info = JSON.parse(r.stdout);
  } catch {
    throw fail("didn't print valid JSON");
  }
  const i = info as Partial<ToolInfo>;
  if (!i || typeof i !== "object" || typeof i.toolVersion !== "string" || (i.invocation !== "per-file" && i.invocation !== "once") ||
      !i.parameters || typeof i.parameters !== "object" || !Array.isArray(i.outputs)) {
    throw fail("lacks toolVersion, invocation, parameters or outputs");
  }
  for (const o of i.outputs) {
    if (!o || typeof o.dataName !== "string" || typeof o.jsonKey !== "string" || typeof o.outputFilePattern !== "string" ||
        typeof o.formatVersion !== "number" || typeof o.represents !== "string") {
      throw fail("has an output without dataName, jsonKey, outputFilePattern, formatVersion or represents");
    }
    if (!["nodes", "relations", "containment"].includes(o.represents)) throw fail(`has an output whose represents is "${o.represents}"`);
  }
  // Whether a tool reads files must be stated, and agree with source_root (toolset.md 4.2).
  const inconsistent = (why: string) => new StartupError("tool-info-inconsistent", `Tool "${name}": --info ${why}.`, { tool: name });
  const rf = (i as { readsFiles?: unknown }).readsFiles;
  const root = i.parameters[SOURCE_ROOT_PARAMETER];
  if (rf === undefined) throw inconsistent('doesn\'t say whether the tool reads files (readsFiles: an object with filePatterns, or false)');
  if (rf === false) {
    if (root) throw inconsistent('says the tool reads no files (readsFiles: false) but declares "source_root"');
    if (i.invocation === "per-file") throw inconsistent('says the tool reads no files but asks to be run once per file');
  } else if (typeof rf === "object" && rf !== null) {
    if (!root || root.dataName !== SOURCE_ROOT_DATA_NAME || !root.required) {
      throw inconsistent(`says the tool reads files but doesn't declare a required "source_root" with data name "${SOURCE_ROOT_DATA_NAME}"`);
    }
  } else throw inconsistent("has a readsFiles that is neither an object nor false");
  return info as ToolInfo;
}

// ---------------------------------------------------------------------------
// Data the Runner provides (RUN-29) and the order (DATA-11)
// ---------------------------------------------------------------------------

/** Data names no tool produces, which the Runner provides itself. */
export function isRunnerProvided(dataName: string): boolean {
  return dataName.startsWith("files.file.") || dataName.startsWith("project.") || dataName.startsWith("zaansouvi.");
}

/** Which tool outputs each data name; one tool per data name. */
export function producers(tools: Tool[]): Map<string, Tool> {
  const map = new Map<string, Tool>();
  for (const t of tools) {
    for (const o of t.info.outputs) {
      const other = map.get(o.dataName);
      if (other) throw new StartupError("data-produced-twice", `Data "${o.dataName}" is output by both "${other.name}" and "${t.name}".`);
      map.set(o.dataName, t);
    }
  }
  return map;
}

/**
 * The run order: a tool runs after every tool that outputs data it needs; ties break by tool name (ARCH-04).
 * Fails before any tool starts when a required parameter has no provider, or on a cycle (RUN-29).
 */
export function workOutOrder(tools: Tool[]): Tool[] {
  const prod = producers(tools);
  const needs = new Map<string, Set<string>>();
  for (const t of tools) {
    const deps = new Set<string>();
    for (const [key, p] of Object.entries(t.info.parameters)) {
      const from = prod.get(p.dataName);
      if (from && from !== t) deps.add(from.name);
      else if (!from && !isRunnerProvided(p.dataName) && p.required) {
        throw new StartupError("no-provider",
          `Tool "${t.name}" requires parameter "${key}" (data "${p.dataName}"), which no tool outputs and the Runner doesn't provide.`,
          { tool: t.name, parameter: key, dataName: p.dataName });
      }
    }
    needs.set(t.name, deps);
  }
  const order: Tool[] = [];
  const done = new Set<string>();
  while (order.length < tools.length) {
    const ready = tools.filter((t) => !done.has(t.name) && [...needs.get(t.name)!].every((d) => done.has(d)));
    if (ready.length === 0) {
      throw new StartupError("order-cycle", `The tools depend on each other in a cycle: ${tools.filter((t) => !done.has(t.name)).map((t) => t.name).join(", ")}.`);
    }
    const next = ready.sort((a, b) => (a.name < b.name ? -1 : 1))[0];
    order.push(next);
    done.add(next.name);
  }
  return order;
}

// ---------------------------------------------------------------------------
// Files a tool reads, and where its outputs are
// ---------------------------------------------------------------------------

function globToRegExp(glob: string): RegExp {
  const re = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]");
  return new RegExp(`^${re}$`);
}

/** Whether a per-file tool reads this file: its readsFiles.filePatterns against the file name; all files when it states none. */
export function readsFile(tool: Tool, fileId: string): boolean {
  if (tool.info.readsFiles === false) return false;
  const patterns = tool.info.readsFiles.filePatterns;
  if (!patterns || patterns.length === 0) return true;
  const base = fileId.split("/").pop()!;
  return patterns.some((p) => globToRegExp(p).test(p.includes("/") ? fileId : base));
}

export const fileKey = (fileId: string) => fileId.split("/").join("__");

/** The output file of `output` in `store`, for one file (per-file tools) or none (tools run once). */
export function outputPath(store: string, output: OutputInfo, fileId?: string): string {
  const rel = output.outputFilePattern.replace(/<file-key>(\.json)?/g, (_m, ext) => fileKey(fileId ?? "") + (ext ?? ""));
  return path.join(store, rel);
}

/** The distinct output files of one invocation, with the outputs each holds. A once tool whose outputs are `perFile`
 *  (MVP 2) writes one file per file it was given: `perFileIds`. */
export function outputFiles(tool: Tool, store: string, fileId?: string, perFileIds: string[] = []): Map<string, OutputInfo[]> {
  const files = new Map<string, OutputInfo[]>();
  for (const o of tool.info.outputs) {
    const ids = o.perFile && tool.info.invocation === "once" ? perFileIds : [fileId];
    for (const id of ids) {
      const p = outputPath(store, o, id);
      files.set(p, [...(files.get(p) ?? []), o]);
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// The shape check (RUN-18): only shape, never whether the content is right
// ---------------------------------------------------------------------------

const isLocation = (v: unknown) => {
  const l = v as { file?: unknown; start?: { line?: unknown }; end?: { line?: unknown } } | null;
  return !!l && typeof l.file === "string" && typeof l.start?.line === "number" && typeof l.end?.line === "number";
};

/** Checks one output file against the outputs --info says it holds. Returns the parsed file, or the first problem. */
export function checkOutputFile(file: string, outputs: OutputInfo[]): { json: Record<string, unknown> } | { problem: string } {
  const json = readJson(file) as Record<string, unknown> | undefined;
  if (json === undefined) return { problem: fs.existsSync(file) ? `${file} is not valid JSON` : `${file} is missing` };
  if (!json || typeof json !== "object" || Array.isArray(json)) return { problem: `${file} is not a JSON object` };
  for (const o of outputs) {
    if (json.formatVersion !== o.formatVersion) {
      return { problem: `${file}: formatVersion ${String(json.formatVersion)}, --info says ${o.formatVersion} for "${o.dataName}"` };
    }
    const records = json[o.jsonKey];
    if (!Array.isArray(records)) return { problem: `${file}: no array under "${o.jsonKey}" for "${o.dataName}"` };
    const f = (role: string, fallback: string) => o.fields?.[`${role}Field`] ?? fallback;
    const required: string[] =
      o.represents === "nodes" ? [f("id", "id"), f("parent", "parent")]
      : o.represents === "relations" ? [f("from", "from")]
      : [f("child", "child"), f("parent", "parent")];
    const needsLocation = o.represents === "nodes" || o.represents === "relations";
    for (const [i, r] of records.entries()) {
      const rec = r as Record<string, unknown>;
      if (!rec || typeof rec !== "object") return { problem: `${file}: "${o.jsonKey}"[${i}] is not an object` };
      for (const k of required) {
        if (rec[k] === undefined || rec[k] === null) return { problem: `${file}: "${o.jsonKey}"[${i}] lacks "${k}"` };
      }
      if (o.represents === "relations" && !(f("to", "to") in rec)) return { problem: `${file}: "${o.jsonKey}"[${i}] lacks "${f("to", "to")}"` };
      if (needsLocation && !isLocation(rec[f("location", "location")])) return { problem: `${file}: "${o.jsonKey}"[${i}] has no valid Location` };
    }
  }
  return { json };
}

// ---------------------------------------------------------------------------
// Invoking a tool (ARCH-03: an argument array, never a shell string)
// ---------------------------------------------------------------------------

export type DryRunOutcome = {
  dryRun: "go" | "no-go";
  errorKind?: "run" | "invocation";
  error?: Diagnostic;
  exitCode: number | null;
  stderr: string;
  lastLine?: unknown;
};

// cwd: the folder a tool is started in. The Runner passes its data folder, so a tool is never started from inside the
// examined source, whatever folder the Runner was started from (toolset.md 4.5, E14).
export function dryRun(tool: Tool, input: Record<string, unknown>, cwd: string): DryRunOutcome {
  const r = spawnSync(tool.launcher, ["--dry-run", "--stdin"], { input: JSON.stringify(input), encoding: "utf8", maxBuffer: MAX_BUFFER, cwd });
  const exitCode = r.status;
  const stderr = (r.stderr ?? "").slice(0, 4000);
  if (r.error) {
    return { dryRun: "no-go", errorKind: "run", exitCode, stderr, error: { severity: "error", code: "E8", message: `Couldn't start ${tool.name}: ${r.error.message}` } };
  }
  const lines = (r.stdout ?? "").trim().split("\n").filter((l) => l !== "");
  let last: { dryRun?: unknown; error?: Diagnostic } | undefined;
  try {
    last = lines.length ? JSON.parse(lines[lines.length - 1]) : undefined;
  } catch {
    last = undefined;
  }
  // A dry run with no valid last line is a no-go with the tool's error (errors table).
  if (!last || (last.dryRun !== "go" && last.dryRun !== "no-go")) {
    return {
      dryRun: "no-go", errorKind: exitCode === 2 ? "invocation" : "run", exitCode, stderr,
      error: { severity: "error", code: "E8", message: `${tool.name}: the dry run printed no valid go / no-go line (exit code ${exitCode}).`, details: { stderr } },
    };
  }
  if (last.dryRun === "go" && exitCode === 0) return { dryRun: "go", exitCode, stderr, lastLine: last };
  return {
    dryRun: "no-go", errorKind: exitCode === 2 ? "invocation" : "run", exitCode, stderr, lastLine: last,
    error: last.error ?? { severity: "error", code: "E8", message: `${tool.name}: the dry run ended with exit code ${exitCode}.` },
  };
}

export type RealRunOutcome = { exitCode: number | null; stderr: string; startError?: string };

export function realRun(tool: Tool, input: Record<string, unknown>, cwd: string): RealRunOutcome {
  const r = spawnSync(tool.launcher, ["--stdin"], { input: JSON.stringify(input), encoding: "utf8", maxBuffer: MAX_BUFFER, cwd });
  return { exitCode: r.status, stderr: (r.stderr ?? "").slice(0, 4000), startError: r.error?.message };
}
