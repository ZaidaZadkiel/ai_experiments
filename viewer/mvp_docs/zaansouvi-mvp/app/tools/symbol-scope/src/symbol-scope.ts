// symbol-scope (M3), ZaAnSouVi MVP.
//
// Groups each file's symbols into lexical scopes: the file scope and one scope per top-level function, each naming
// the node that owns it (04_tools.md, TOOL-30 to TOOL-36; MVP-4, option C with C1). Reads no files: it works only
// from the symbol records the Runner sends (DATA-13), and depends on nothing else from M1. It shows no uses: the
// Viewer lifts references and links up to the scope their source owns (VIEW-13).
// Depends on Node built-ins and the tool helper, which carries the contract every tool shares (TOOL-45).
// It imports nothing from the Runner, the Viewer or another tool (ARCH-02).
//
// Contract: see ../README.md. Run `./symbol-scope --help` or `./symbol-scope --info`.

import path from "node:path";
import { COMMON_ERROR_CODES, describe, invocationError, runError, runTool } from "../../../tool-helper/tool.ts";
import type { Location, Logger, Params, ToolSpec } from "../../../tool-helper/tool.ts";

// ---------------------------------------------------------------------------
// Constants and --info (DATA-08)
// ---------------------------------------------------------------------------

const TOOL = "symbol-scope";
const VERSION = "0.2.0"; // 0.2.0: memberships no longer follow the input order (TOOL-35, FND-58)
const OUTPUT_FORMAT_VERSION = 1;
const PROGRAM_DIR = path.resolve(import.meta.dirname, "..");

const INFO = {
  tool: TOOL,
  toolVersion: VERSION,
  description: "Groups each file's symbols into lexical scopes: the file scope and one scope per top-level function.",
  invocation: "once",
  readsFiles: false, // it reads no files, so it takes no source_root (toolset.md 4.2, DATA-09)
  parameters: {
    symbols: {
      dataName: "code.symbol",
      shape: "array of code.symbol records",
      required: true,
      affectsOutput: true,
      description: "Every symbol record, as one flat array; each carries its file in parent, and functions their range",
    },
    store_path: {
      dataName: "zaansouvi.store_path",
      shape: "string",
      required: false,
      affectsOutput: false,
      description: "Folder that is this tool's store: output, result and logs are written here. Doesn't affect the output",
      whenAbsent: "<working folder>/zaansouvi/tools/symbol-scope/",
    },
  },
  outputs: [
    {
      dataName: "code.scope",
      formatVersion: OUTPUT_FORMAT_VERSION,
      represents: "nodes",
      containedIn: "files.file",
      outputFilePattern: "output/scopes.json",
      jsonKey: "scopes",
      fields: { idField: "id", parentField: "parent", labelField: "name", kindField: "kind", locationField: "location", ownerField: "owner" },
    },
    {
      dataName: "code.membership",
      formatVersion: OUTPUT_FORMAT_VERSION,
      represents: "containment",
      contains: "code.symbol",
      outputFilePattern: "output/scopes.json",
      jsonKey: "membership",
      fields: { childField: "child", parentField: "parent" },
    },
  ],
  options: {
    "--info": "print this description and exit",
    "--help": "print usage and exit",
    "--version": "print the version and exit",
    "--dry-run": "do the work, write nothing, print JSON lines and a final go / no-go line",
    "--json <path>": "read the parameters from a JSON file",
    "--stdin": "read the parameters as JSON from standard input",
    "--log <path>": "also copy the log to this file (the store log is always written)",
    "--store-path <v>": "set the store; overrides the JSON input and last_run.json",
  },
  exitCodes: { "0": "success, or dry run: go", "1": "run error, or dry run: no-go", "2": "invocation error: nothing written" },
  errorCodes: {
    ...COMMON_ERROR_CODES,
    E12: "run: no symbol records, two symbol records with the same id, or a function symbol without a range",
  },
  supportedConstructs: [
    "the file scope, from 1:1 to the furthest end among the file's symbols",
    "one scope per top-level function declaration; functions inside functions belong to the outer function's scope",
  ],
};

const HELP = `${TOOL} ${VERSION}: ZaAnSouVi MVP tool M3

Groups each file's symbols into lexical scopes: the file scope and one scope per top-level function.
Reads no files: it takes symbol records as JSON.

Usage:
  ${TOOL} --stdin < params.json        parameters as JSON on standard input
  ${TOOL} --json params.json           parameters from a JSON file
  ${TOOL}                              repeat the last real run (last_run.json)
  ${TOOL} --dry-run --stdin < params.json
  ${TOOL} --info | --help | --version

Parameters (JSON keys): symbols (symbol records, required), store_path.
With no store_path, the store is zaansouvi/tools/symbol-scope/ in the working folder; last_run.json is kept
in the store. Never run a tool from inside the examined source (E14).

Exit codes: 0 success / go, 1 run error / no-go, 2 invocation error.
`;

const HINTS: Record<string, string> = {
  E12: "Fix the input named above. Running the tool with no parameters repeats this exact run.",
  E8: "This is unexpected. The details hold the stack trace; run again with no parameters to reproduce it.",
};

// ---------------------------------------------------------------------------
// Records (02_data_contracts.md)
// ---------------------------------------------------------------------------

type Position = { line: number; column: number };
type SymbolRecord = { id: string; name: string; kind: string; location: Location; range?: Location; parent: string };
type Scope = { id: string; kind: "file" | "function"; name: string; owner: string; location: Location; parent: string };
type Membership = { child: string; parent: string };

// ---------------------------------------------------------------------------
// Shape check of the records (TOOL-36; E13, nothing written)
// ---------------------------------------------------------------------------

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isLocation = (v: unknown) => {
  const l = v as { file?: unknown; start?: { line?: unknown; column?: unknown }; end?: { line?: unknown; column?: unknown } } | null;
  return isObject(l) && typeof l.file === "string" && typeof l.start?.line === "number" && typeof l.start?.column === "number" &&
    typeof l.end?.line === "number" && typeof l.end?.column === "number";
};

function checkShape(p: Params) {
  const bad = (i: number, why: string, v: unknown) =>
    invocationError("E13", `Parameter "symbols" item ${i} ${why}; got ${describe(v)}.`, { parameter: "symbols", index: i });
  (p.symbols as unknown[]).forEach((s, i) => {
    if (!isObject(s)) throw bad(i, "must be a symbol record (an object)", s);
    for (const k of ["id", "kind", "parent"]) if (typeof s[k] !== "string" || s[k] === "") throw bad(i, `needs a non-empty string "${k}"`, s[k]);
    if (!isLocation(s.location)) throw bad(i, 'needs a Location in "location"', s.location);
    // A range that is present must be a Location; a function with no range at all is a run error (TOOL-32).
    if (s.range !== undefined && !isLocation(s.range)) throw bad(i, 'has a "range" that isn\'t a Location', s.range);
  });
}

// ---------------------------------------------------------------------------
// The work (TOOL-30 to TOOL-35)
// ---------------------------------------------------------------------------

const atOrBefore = (a: Position, b: Position) => a.line < b.line || (a.line === b.line && a.column <= b.column);
const inside = (loc: Location, range: Location) => atOrBefore(range.start, loc.start) && atOrBefore(loc.end, range.end);
const byStart = (a: Location, b: Location) => a.start.line - b.start.line || a.start.column - b.start.column;
const compareIds = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0); // plain string order, as the Runner's (RUN-28)

function work(params: Params, log: Logger) {
  const symbols = params.symbols as SymbolRecord[];
  log.comment("step", "checking the input");
  // TOOL-09, TOOL-36: an empty input lacks what the tool needs; duplicate IDs are incongruent.
  if (symbols.length === 0) throw runError("E12", "There are no symbol records in symbols: the input lacks what this tool needs (code.symbol).");
  const seen = new Set<string>();
  for (const s of symbols) {
    if (seen.has(s.id)) throw runError("E12", `Two symbol records have the same id "${s.id}".`, s.location, { id: s.id });
    seen.add(s.id);
  }
  // TOOL-32: a function needs its range, the whole declaration, to place its scope and its members.
  for (const s of symbols) {
    if (s.kind === "function" && !s.range) {
      throw runError("E12", `The function symbol "${s.id}" has no range: the input lacks what this tool needs.`, s.location, { id: s.id });
    }
  }
  log.entry("info", "input_checked", { symbolCount: symbols.length });

  // Symbols by file, keeping their order; files in file ID order (TOOL-35).
  const byFile = new Map<string, SymbolRecord[]>();
  for (const s of symbols) byFile.set(s.parent, [...(byFile.get(s.parent) ?? []), s]);
  const files = [...byFile.keys()].sort(compareIds);

  log.comment("step", "building scopes");
  const scopes: Scope[] = [];
  const scopeOf = new Map<string, string>(); // symbol ID -> scope ID
  for (const file of files) {
    const syms = byFile.get(file)!;

    // TOOL-34: the file scope runs from 1:1 to the furthest end among the file's symbols.
    let end = (syms[0].range ?? syms[0].location).end;
    for (const s of syms) {
      const e = (s.range ?? s.location).end;
      if (atOrBefore(end, e)) end = e;
    }
    const fileScope: Scope = {
      id: `${file}#scope@file`, kind: "file", name: file, owner: file, // owner: the file (TOOL-33)
      location: { file, start: { line: 1, column: 1 }, end }, parent: file,
    };
    scopes.push(fileScope);

    // TOOL-30: one scope per top-level function, i.e. not inside another function's range; by position (TOOL-35).
    const functions = syms.filter((s) => s.kind === "function");
    const topLevel = functions
      .filter((s) => !functions.some((o) => o !== s && inside(s.range!, o.range!)))
      .sort((a, b) => byStart(a.range!, b.range!));
    const fnScopes = topLevel.map((fn) => ({
      fn,
      scope: {
        // TOOL-34, DATA-03: ID and location at the declaration start, the start of the range.
        id: `${file}#scope@${fn.range!.start.line}:${fn.range!.start.column}`,
        kind: "function" as const, name: fn.name, owner: fn.id, location: fn.range!, parent: file,
      },
    }));
    for (const x of fnScopes) scopes.push(x.scope);

    // TOOL-31: a symbol belongs to the function scope whose range holds its location, else to the file scope.
    // A function's own name sits inside its own range, so a function never belongs to its own scope.
    for (const s of syms) {
      const home = fnScopes.find((x) => x.fn !== s && inside(s.location, x.fn.range!));
      scopeOf.set(s.id, home ? home.scope.id : fileScope.id);
    }
  }

  // TOOL-35: memberships by file ID, then the symbol's position, then its ID; never the input order (toolset.md 2,
  // FND-58), so a script that lists files in another order gets the same bytes as the Runner.
  const membership: Membership[] = [...symbols]
    .sort((a, b) => compareIds(a.parent, b.parent) || byStart(a.location, b.location) || compareIds(a.id, b.id))
    .map((s) => ({ child: s.id, parent: scopeOf.get(s.id)! }));

  const counts = { scopeCount: scopes.length, membershipCount: membership.length };
  log.entry("info", "scopes_done", counts);

  // DATA-07: header, counts, scopes and membership. No times, so the same input gives the same bytes (DATA-22).
  const output = {
    tool: TOOL, toolVersion: VERSION, formatVersion: OUTPUT_FORMAT_VERSION,
    dataNames: { "code.scope": "scopes", "code.membership": "membership" },
    counts, scopes, membership,
  };
  return { outputs: [{ path: "output/scopes.json", content: output }], summary: { counts } };
}

const SPEC: ToolSpec = {
  info: INFO,
  help: HELP,
  programDir: PROGRAM_DIR,
  checkShape,
  work: ({ params, log }) => work(params, log),
  hints: HINTS,
  // No preview line: the Runner doesn't use one (RUN-16); the dry run prints its log and the go / no-go line.
};

process.exitCode = runTool(SPEC, process.argv.slice(2));
