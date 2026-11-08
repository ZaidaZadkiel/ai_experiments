// cross-file-links (M2), ZaAnSouVi MVP.
//
// Links each import to the declaration it imports, and each use of an imported name to that declaration
// (04_tools.md, TOOL-20 to TOOL-23). Reads no files: it works only from the symbol and reference records the
// Runner sends (DATA-13), and writes only its header and the links (DATA-06).
// Depends on Node built-ins and the tool helper, which carries the contract every tool shares (TOOL-45).
// It imports nothing from the Runner, the Viewer or another tool (ARCH-02).
//
// Contract: see ../README.md. Run `./cross-file-links --help` or `./cross-file-links --info`.

import path from "node:path";
import { COMMON_ERROR_CODES, describe, invocationError, runError, runTool } from "../../../tool-helper/tool.ts";
import type { Location, Logger, Params, ToolSpec } from "../../../tool-helper/tool.ts";

// ---------------------------------------------------------------------------
// Constants and --info (DATA-08)
// ---------------------------------------------------------------------------

const TOOL = "cross-file-links";
const VERSION = "0.2.0";
const OUTPUT_FORMAT_VERSION = 1;
const PROGRAM_DIR = path.resolve(import.meta.dirname, "..");

const INFO = {
  tool: TOOL,
  toolVersion: VERSION,
  description: "Links each import to the declaration it imports, and each use of an imported name to that declaration.",
  invocation: "once",
  readsFiles: false, // it reads no files, so it takes no source_root (toolset.md 4.2, DATA-09)
  parameters: {
    symbols: {
      dataName: "code.symbol",
      shape: "array of code.symbol records",
      required: true,
      affectsOutput: true,
      description: "Every symbol record, as one flat array; each carries its file in parent",
    },
    references: {
      dataName: "code.reference",
      shape: "array of code.reference records",
      required: true,
      affectsOutput: true,
      description: "Every reference record, as one flat array; used to find uses of imported names (TOOL-23)",
    },
    store_path: {
      dataName: "zaansouvi.store_path",
      shape: "string",
      required: false,
      affectsOutput: false,
      description: "Folder that is this tool's store: output, result and logs are written here. Doesn't affect the output",
      whenAbsent: "<program folder>, the folder of this tool's launcher",
    },
  },
  outputs: [
    {
      dataName: "code.link",
      formatVersion: OUTPUT_FORMAT_VERSION,
      represents: "relations",
      outputFilePattern: "output/links.json",
      jsonKey: "links",
      fields: { idField: "id", fromField: "from", toField: "to", kindField: "kind", locationField: "location" },
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
  errorCodes: { ...COMMON_ERROR_CODES, E12: "run: no symbol records, or two symbol records with the same id" },
  reasons: {
    external: "the module specifier doesn't start with '.' (a package)",
    "no such file": "no symbol of the target file is in the input",
    "not exported": "the target file has no exported symbol with that name",
    unsupported: "a default or namespace import",
  },
  supportedConstructs: [
    "named imports from relative paths, including type-only imports",
    "uses of an imported name: calls, reads and writes",
    "specifiers without an extension: <specifier>.ts, then <specifier>/index.ts",
  ],
};

const HELP = `${TOOL} ${VERSION}: ZaAnSouVi MVP tool M2

Links each import to the declaration it imports, and each use of an imported name to that declaration.
Reads no files: it takes symbol and reference records as JSON.

Usage:
  ${TOOL} --stdin < params.json        parameters as JSON on standard input
  ${TOOL} --json params.json           parameters from a JSON file
  ${TOOL}                              repeat the last real run (last_run.json)
  ${TOOL} --dry-run --stdin < params.json
  ${TOOL} --info | --help | --version

Parameters (JSON keys): symbols (symbol records, required), references (reference records, required), store_path.
With no store_path, the store is this tool's own program folder.

Exit codes: 0 success / go, 1 run error / no-go, 2 invocation error.
`;

const HINTS: Record<string, string> = {
  E12: "Fix the input named above. Running the tool with no parameters repeats this exact run.",
  E8: "This is unexpected. The details hold the stack trace; run again with no parameters to reproduce it.",
};

// ---------------------------------------------------------------------------
// Records (02_data_contracts.md)
// ---------------------------------------------------------------------------

type SymbolRecord = {
  id: string;
  name: string;
  kind: string;
  exported?: boolean;
  location: Location;
  parent: string;
  import?: { moduleSpecifier: string; importedName: string; typeOnly?: boolean };
};
type ReferenceRecord = { id: string; kind: string; from: string; to: string | null; location: Location };
type Link = {
  id: string;
  from: string;
  to: string | null;
  kind: string;
  reason?: string;
  moduleSpecifier: string;
  location: Location;
};

// ---------------------------------------------------------------------------
// Shape check of the records (TOOL-03; E13, nothing written)
// ---------------------------------------------------------------------------

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isLocation = (v: unknown) => {
  const l = v as { file?: unknown; start?: { line?: unknown; column?: unknown }; end?: { line?: unknown; column?: unknown } } | null;
  return isObject(l) && typeof l.file === "string" && typeof l.start?.line === "number" && typeof l.start?.column === "number" &&
    typeof l.end?.line === "number" && typeof l.end?.column === "number";
};

function checkShape(p: Params) {
  const bad = (what: string, i: number, why: string, v: unknown) =>
    invocationError("E13", `Parameter "${what}" item ${i} ${why}; got ${describe(v)}.`, { parameter: what, index: i });
  (p.symbols as unknown[]).forEach((s, i) => {
    if (!isObject(s)) throw bad("symbols", i, "must be a symbol record (an object)", s);
    for (const k of ["id", "kind", "parent"]) if (typeof s[k] !== "string" || s[k] === "") throw bad("symbols", i, `needs a non-empty string "${k}"`, s[k]);
    if (!isLocation(s.location)) throw bad("symbols", i, 'needs a Location in "location"', s.location);
    if (s.kind === "import") {
      const imp = s.import as Record<string, unknown> | undefined;
      if (!isObject(imp) || typeof imp.moduleSpecifier !== "string" || typeof imp.importedName !== "string") {
        throw bad("symbols", i, 'is an import and needs "import" with string "moduleSpecifier" and "importedName"', imp);
      }
    }
  });
  (p.references as unknown[]).forEach((r, i) => {
    if (!isObject(r)) throw bad("references", i, "must be a reference record (an object)", r);
    for (const k of ["id", "kind", "from"]) if (typeof r[k] !== "string" || r[k] === "") throw bad("references", i, `needs a non-empty string "${k}"`, r[k]);
    if (!("to" in r) || (r.to !== null && typeof r.to !== "string")) throw bad("references", i, 'needs "to": a string or null', r.to);
    if (!isLocation(r.location)) throw bad("references", i, 'needs a Location in "location"', r.location);
  });
}

// ---------------------------------------------------------------------------
// The work (TOOL-20 to TOOL-23)
// ---------------------------------------------------------------------------

/** Candidate files for a relative specifier, as plain string work: `<x>.ts`, then `<x>/index.ts` (TOOL-20). */
function candidates(importingFile: string, specifier: string): string[] {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(importingFile), specifier));
  return [`${base}.ts`, `${base}/index.ts`];
}

const byPosition = (a: Link, b: Link) =>
  (a.location.file < b.location.file ? -1 : a.location.file > b.location.file ? 1 : 0) ||
  a.location.start.line - b.location.start.line || a.location.start.column - b.location.start.column;

function work(params: Params, log: Logger) {
  const symbols = params.symbols as SymbolRecord[];
  const references = params.references as ReferenceRecord[];
  log.comment("step", "checking the input");
  // TOOL-09, TOOL-22: an empty input lacks what the tool needs; duplicate IDs are incongruent.
  if (symbols.length === 0) throw runError("E12", "There are no symbol records in symbols: the input lacks what this tool needs (code.symbol).");
  const seen = new Set<string>();
  for (const s of symbols) {
    if (seen.has(s.id)) throw runError("E12", `Two symbol records have the same id "${s.id}".`, s.location, { id: s.id });
    seen.add(s.id);
  }
  log.entry("info", "input_checked", { symbolCount: symbols.length, referenceCount: references.length });

  const byFile = new Map<string, SymbolRecord[]>();
  for (const s of symbols) byFile.set(s.parent, [...(byFile.get(s.parent) ?? []), s]);

  // TOOL-20, TOOL-21: each import, resolved or not; type-only imports are linked like any other.
  log.comment("step", "resolving imports");
  const links: Link[] = [];
  const resolved = new Map<string, Link>();
  for (const s of symbols) {
    if (s.kind !== "import" || !s.import) continue;
    const { moduleSpecifier, importedName } = s.import;
    const unresolved = (reason: string) =>
      links.push({ id: `${s.id}->`, from: s.id, to: null, kind: "import", reason, moduleSpecifier, location: s.location });
    if (!moduleSpecifier.startsWith(".")) {
      unresolved("external");
      continue;
    }
    if (importedName === "default" || importedName === "*") {
      unresolved("unsupported");
      continue;
    }
    // A specifier written with an extension ("./a.js") resolves to no such file: an acceptable failure (MVP-11).
    const target = candidates(s.parent, moduleSpecifier).find((f) => byFile.has(f));
    if (!target) {
      unresolved("no such file");
      continue;
    }
    const to = byFile.get(target)!.find((t) => t.exported === true && t.kind !== "import" && t.name === importedName);
    if (!to) {
      unresolved("not exported");
      continue;
    }
    const link: Link = { id: `${s.id}->${to.id}`, from: s.id, to: to.id, kind: "import", moduleSpecifier, location: s.location };
    links.push(link);
    resolved.set(s.id, link);
  }

  // TOOL-23: each use of a resolved import, from the reference's enclosing function, at the use's location.
  log.comment("step", "linking uses of imported names");
  let useCount = 0;
  for (const r of references) {
    if (r.kind === "declaration" || r.to === null) continue;
    const imp = resolved.get(r.to);
    if (!imp) continue;
    links.push({ id: `${r.id}->${imp.to}`, from: r.from, to: imp.to, kind: r.kind, moduleSpecifier: imp.moduleSpecifier, location: r.location });
    useCount++;
  }
  links.sort(byPosition);

  const unresolvedCount = links.filter((l) => l.to === null).length;
  const counts = { linkCount: links.length - unresolvedCount, importLinkCount: resolved.size, useLinkCount: useCount, unresolvedCount };
  log.entry("info", "links_done", counts);

  // DATA-06: only the header and the links. No times, so the same input gives the same bytes.
  const output = { tool: TOOL, toolVersion: VERSION, formatVersion: OUTPUT_FORMAT_VERSION, dataNames: { "code.link": "links" }, links };
  return { outputs: [{ path: "output/links.json", content: output }], summary: { counts } };
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
