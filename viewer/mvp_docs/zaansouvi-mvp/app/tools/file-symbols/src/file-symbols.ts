// file-symbols (M1), ZaAnSouVi MVP.
//
// Reads ONE TypeScript file and lists its symbols and every reference to them.
// Self-contained: depends only on Node built-ins and the `typescript` package
// (used only as a parser, no type checking). It imports nothing from the Runner,
// the Viewer or another tool (ARCH-02).
//
// Contract: see ../README.md. Run `./file-symbols --help` or `./file-symbols --info`.

import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOL = "file-symbols";
const VERSION = "0.1.0";
const OUTPUT_FORMAT_VERSION = 1;

/** The tool's program folder: app/tools/file-symbols. last_run.json sits here (toolset.md 4.5). */
const PROGRAM_DIR = path.resolve(import.meta.dirname, "..");
/** zaansouvi-mvp/, three levels above the program folder. */
const MVP_ROOT = path.resolve(PROGRAM_DIR, "..", "..", "..");
/** Used when the parameters give no output_root (FND-07). */
const DEFAULT_OUTPUT_ROOT = path.join(MVP_ROOT, "data", "tools");
const LAST_RUN_PATH = path.join(PROGRAM_DIR, "last_run.json");

const EXIT_OK = 0;
const EXIT_RUN_ERROR = 1;
const EXIT_INVOCATION_ERROR = 2;

const ERROR_CODES: Record<string, string> = {
  E1: "invocation: malformed invocation (both --json and --stdin, unknown option, option without its value)",
  E2: "invocation: explicit JSON input unusable (file missing or unreadable, not valid JSON, not an object)",
  E3: "invocation: no parameters and no usable last_run.json",
  E13: "invocation: a parameter is missing or has the wrong shape",
  E6: "run: the file to read is missing or unreadable",
  E12: "run: a value is incorrect or incongruent, or the file has syntax errors",
  E8: "run: unexpected failure",
  I1: "note: construct skipped (outside the supported constructs)",
  I2: "note: construct outside the supported constructs, handled on a best-effort basis",
};

// ---------------------------------------------------------------------------
// Data shapes (02_data_contracts.md, with the extras from 99_findings.md)
// ---------------------------------------------------------------------------

type Position = { line: number; column: number };
type Location = { file: string; start: Position; end: Position };
type Diagnostic = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  location?: Location;
  details?: unknown;
};

type SymbolKind = "function" | "variable" | "parameter" | "import";
type SymbolRecord = {
  id: string;
  name: string;
  kind: SymbolKind;
  exported: boolean;
  location: Location;
  range: Location;
  parent: string;
  import?: { from: string; name: string; typeOnly?: boolean };
};

type ReferenceKind = "declaration" | "call" | "read" | "write";
type ReferenceRecord = {
  id: string;
  name: string;
  symbol: string | null;
  kind: ReferenceKind;
  location: Location;
  /** The enclosing function's symbol ID, or the file ID (FND-02). */
  enclosing: string;
  /** Uniform relation fields (FND-02): from = enclosing, to = symbol. */
  from: string;
  to: string | null;
};

type Params = {
  file_id: string;
  file_path?: string;
  source_root?: string;
  output_root?: string;
  [extra: string]: unknown;
};

type ParamSource = "json" | "stdin" | "last_run" | "command line" | "command line + last_run";

class ToolError extends Error {
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

const invocationError = (code: string, message: string, details?: unknown) =>
  new ToolError("invocation", code, message, undefined, details);
const runError = (code: string, message: string, location?: Location, details?: unknown) =>
  new ToolError("run", code, message, location, details);

// ---------------------------------------------------------------------------
// --info (DATA-08, plus jsonKey and field names: FND-01, FND-02)
// ---------------------------------------------------------------------------

const INFO = {
  tool: TOOL,
  version: VERSION,
  description: "Reads one TypeScript file and lists its symbols and the references to them.",
  readsFiles: { kinds: ["*.ts"], parameter: "file_path", fallback: "source_root + file_id" },
  invocation: "per-file",
  parameters: {
    file_id: {
      dataName: "files.file.id",
      shape: "string",
      required: true,
      description: "Path of the file relative to the source root, with / separators, for example src/math.ts",
    },
    file_path: {
      dataName: "files.file.path",
      shape: "string",
      required: false,
      description: "Actual path of the file to read. If absent, source_root + file_id is read",
    },
    source_root: {
      dataName: "project.source_root",
      shape: "string",
      required: false,
      description: "Root of the examined source. Needed when file_path is absent; checked against file_path when both are given",
    },
    output_root: {
      dataName: "zaansouvi.output_root",
      shape: "string",
      required: false,
      description: "Folder holding every tool's store. The tool writes to <output_root>/file-symbols",
      whenAbsent: "<zaansouvi-mvp>/data/tools",
    },
  },
  requires: [["file_path", "source_root"]],
  requiresMeaning: "at least one parameter from each inner list must be present",
  outputs: [
    {
      dataName: "code.symbol",
      version: OUTPUT_FORMAT_VERSION,
      represents: "nodes",
      containedIn: "files.file",
      file: "output/<file-key>.json",
      jsonKey: "symbols",
      fields: { id: "id", parent: "parent", label: "name", kind: "kind", location: "location" },
    },
    {
      dataName: "code.reference",
      version: OUTPUT_FORMAT_VERSION,
      represents: "relations",
      file: "output/<file-key>.json",
      jsonKey: "references",
      fields: { id: "id", from: "from", to: "to", kind: "kind", location: "location" },
    },
  ],
  fileKey: "file_id with every / replaced by __, plus .json",
  store: {
    output: "<output_root>/file-symbols/output/<file-key>.json",
    result: "<output_root>/file-symbols/result.json",
    logs: "<output_root>/file-symbols/logs/<timestamp>_<file-key>.log",
    lastRun: "<program folder>/last_run.json",
  },
  options: {
    "--info": "print this description and exit",
    "--help": "print usage and exit",
    "--version": "print the version and exit",
    "--dry-run": "do the work, write nothing, print JSON lines and a final go / no-go line",
    "--json <path>": "read the parameters from a JSON file",
    "--stdin": "read the parameters as JSON from standard input",
    "--log <path>": "also copy the log to this file (the store log is always written)",
    "--file-id <v>, --file-path <v>, --source-root <v>, --output-root <v>":
      "set one parameter; overrides the JSON input and last_run.json",
  },
  exitCodes: { "0": "success, or dry run: go", "1": "run error, or dry run: no-go", "2": "invocation error: nothing written" },
  errorCodes: ERROR_CODES,
  supportedConstructs: [
    "function declarations with parameters, including export function",
    "const, let and var (simple names; destructured names are listed too)",
    "named imports from relative paths (default and namespace imports are listed best-effort)",
    "calls, reads and assignments to a simple name",
    "nested blocks inside functions",
  ],
};

const HELP = `${TOOL} ${VERSION}: ZaAnSouVi MVP tool M1

Reads one TypeScript file and lists its symbols and references.

Usage:
  ${TOOL} --stdin < params.json        parameters as JSON on standard input
  ${TOOL} --json params.json           parameters from a JSON file
  ${TOOL}                              repeat the last real run (last_run.json)
  ${TOOL} --file-id src/a.ts --source-root ./project
  ${TOOL} --dry-run --stdin < params.json
  ${TOOL} --info | --help | --version

Parameters (JSON keys): file_id (required), file_path, source_root, output_root.
At least one of file_path and source_root is required.

Precedence: command-line parameter options, then --json or --stdin, then last_run.json.
Exit codes: 0 success / go, 1 run error / no-go, 2 invocation error.
`;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const out = (value: unknown) => process.stdout.write(JSON.stringify(value) + "\n");

function errText(e: unknown): string {
  if (e && typeof e === "object" && "code" in e && typeof (e as { code: unknown }).code === "string") {
    return `${(e as { code: string }).code} (${(e as unknown as Error).message})`;
  }
  return e instanceof Error ? e.message : String(e);
}

function describe(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "an array";
  return typeof v === "string" ? `"${v}"` : `a ${typeof v}`;
}

const fileKey = (fileId: string) => fileId.split("/").join("__") + ".json";
const stamp = (d: Date) => d.toISOString().replace(/:/g, "-");
const sha256 = (data: Buffer) => crypto.createHash("sha256").update(data).digest("hex");
const storeDir = (p: Params) => path.join(path.resolve(p.output_root ?? DEFAULT_OUTPUT_ROOT), TOOL);

/** Write to a temporary name, then rename, so a file is never half-written (TOOL-05). */
function writeAtomic(file: string, content: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

// ---------------------------------------------------------------------------
// Command line
// ---------------------------------------------------------------------------

type Cli = {
  info: boolean;
  help: boolean;
  version: boolean;
  dryRun: boolean;
  stdin: boolean;
  json?: string;
  log?: string;
  params: Record<string, string>;
};

const PARAM_OPTIONS: Record<string, string> = {
  "--file-id": "file_id",
  "--file-path": "file_path",
  "--source-root": "source_root",
  "--output-root": "output_root",
};
const FLAG_OPTIONS = ["--info", "--help", "--version", "--dry-run", "--stdin"];

function parseArgs(argv: string[]): Cli {
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
    if (inline !== undefined && FLAG_OPTIONS.includes(arg)) {
      throw invocationError("E1", `Option ${arg} takes no value.`);
    }
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
        if (arg in PARAM_OPTIONS) {
          cli.params[PARAM_OPTIONS[arg]] = takeValue();
          break;
        }
        throw invocationError(
          "E1",
          arg.startsWith("-")
            ? `Unknown option ${arg}. Run with --help to see the options.`
            : `Unexpected argument "${arg}". This tool takes no positional arguments.`,
        );
    }
  }
  if (cli.json !== undefined && cli.stdin) {
    throw invocationError("E1", "Both --json and --stdin were given. Pass the parameters one way only.");
  }
  return cli;
}

// ---------------------------------------------------------------------------
// Parameters: reading (E1, E2, E3) and shape check (E13)
// ---------------------------------------------------------------------------

function parseJsonObject(text: string, what: string, code: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    throw invocationError(code, `${what} is not valid JSON: ${errText(e)}`);
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw invocationError(code, `${what} must be a JSON object, not ${describe(value)}.`);
  }
  return value as Record<string, unknown>;
}

/** The parameters of the last real run, or the reason they can't be used. */
function readLastRun(): Record<string, unknown> | string {
  let text: string;
  try {
    text = fs.readFileSync(LAST_RUN_PATH, "utf8");
  } catch {
    return `there is no last_run.json at ${LAST_RUN_PATH}`;
  }
  try {
    const v = JSON.parse(text);
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  } catch {
    // fall through
  }
  return `last_run.json at ${LAST_RUN_PATH} is not a usable JSON object`;
}

function loadParams(cli: Cli): { params: Record<string, unknown>; source: ParamSource } {
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
    // No JSON input: repeat last_run.json, with command-line parameters on top (TS-30, MVP answer).
    const hasCli = Object.keys(cli.params).length > 0;
    const last = readLastRun();
    if (typeof last === "string") {
      if (!hasCli) throw invocationError("E3", `No parameters were given, and ${last}. Nothing to repeat.`);
      source = "command line";
    } else {
      base = last;
      source = hasCli ? "command line + last_run" : "last_run";
    }
  }
  const params: Record<string, unknown> = { ...base, ...cli.params };
  delete params._last_run; // metadata written next to the parameters, not a parameter
  return { params, source };
}

/** Shape problems only: these are invocation errors (TOOL-03, toolset.md 4.4). */
function checkShape(p: Record<string, unknown>): Params {
  if (p.file_id === undefined || p.file_id === null) {
    throw invocationError("E13", 'Required parameter "file_id" is missing.', { parameter: "file_id" });
  }
  if (typeof p.file_id !== "string" || p.file_id === "") {
    throw invocationError("E13", `Parameter "file_id" must be a non-empty string; got ${describe(p.file_id)}.`, {
      parameter: "file_id",
    });
  }
  for (const name of ["file_path", "source_root", "output_root"]) {
    const v = p[name];
    if (v !== undefined && (typeof v !== "string" || v === "")) {
      throw invocationError("E13", `Parameter "${name}" must be a non-empty string; got ${describe(v)}.`, {
        parameter: name,
      });
    }
  }
  if (p.file_path === undefined && p.source_root === undefined) {
    throw invocationError("E13", 'Either "file_path" or "source_root" is required, to find the file to read.', {
      parameter: ["file_path", "source_root"],
    });
  }
  return p as Params;
}

// ---------------------------------------------------------------------------
// Value checks and reading the file (E12, E6)
// ---------------------------------------------------------------------------

function resolveInput(p: Params): string {
  const id = p.file_id;
  if (id.includes("\\")) throw runError("E12", `file_id must use "/" separators; got "${id}".`);
  if (path.posix.isAbsolute(id) || /^[A-Za-z]:/.test(id)) {
    throw runError("E12", `file_id must be relative to the source root; got "${id}".`);
  }
  if (id.split("/").some((s) => s === ".." || s === "." || s === "")) {
    throw runError("E12", `file_id must be a plain relative path, with no empty, "." or ".." segments; got "${id}".`);
  }
  if (!id.endsWith(".ts")) throw runError("E12", `This tool reads only *.ts files; file_id is "${id}".`);

  if (p.file_path === undefined) return path.resolve(p.source_root!, ...id.split("/"));

  const abs = path.resolve(p.file_path);
  if (p.source_root !== undefined) {
    const rel = path.relative(path.resolve(p.source_root), abs).split(path.sep).join("/");
    if (rel !== id) {
      throw runError(
        "E12",
        `file_path and file_id disagree: file_path is "${rel}" relative to source_root, but file_id is "${id}".`,
        undefined,
        { file_id: id, file_path: abs, source_root: path.resolve(p.source_root), relative: rel },
      );
    }
  }
  return abs;
}

function readSource(abs: string): Buffer {
  try {
    const st = fs.statSync(abs);
    if (!st.isFile()) throw runError("E6", `${abs} is not a regular file.`);
    return fs.readFileSync(abs);
  } catch (e) {
    if (e instanceof ToolError) throw e;
    throw runError("E6", `Cannot read the file ${abs}: ${errText(e)}`, undefined, { path: abs });
  }
}

/** Syntax errors through the public API (FND-15): transpileModule reports syntactic diagnostics only. */
function syntaxErrors(fileId: string, text: string): Diagnostic[] {
  const r = ts.transpileModule(text, {
    fileName: fileId,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
  });
  const result: Diagnostic[] = [];
  for (const d of r.diagnostics ?? []) {
    if (d.category !== ts.DiagnosticCategory.Error || !d.file || d.start === undefined) continue;
    const s = d.file.getLineAndCharacterOfPosition(d.start);
    const e = d.file.getLineAndCharacterOfPosition(d.start + (d.length ?? 0));
    result.push({
      severity: "error",
      code: "E12",
      message: `Syntax error TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`,
      location: {
        file: fileId,
        start: { line: s.line + 1, column: s.character + 1 },
        end: { line: e.line + 1, column: e.character + 1 },
      },
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

function isFunctionLike(n: ts.Node): n is ts.FunctionLikeDeclaration {
  return (
    ts.isFunctionDeclaration(n) ||
    ts.isFunctionExpression(n) ||
    ts.isArrowFunction(n) ||
    ts.isMethodDeclaration(n) ||
    ts.isConstructorDeclaration(n) ||
    ts.isGetAccessorDeclaration(n) ||
    ts.isSetAccessorDeclaration(n)
  );
}

/** Subtrees with no runtime names: type annotations and type-only declarations. */
function isTypeOnly(n: ts.Node): boolean {
  return ts.isTypeNode(n) || ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n);
}

function hasExportModifier(n: ts.Node): boolean {
  return !!(ts.canHaveModifiers(n) && ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword));
}

function analyze(fileId: string, text: string) {
  const sf = ts.createSourceFile(fileId, text, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS);

  const toLoc = (start: number, end: number): Location => {
    const s = sf.getLineAndCharacterOfPosition(start);
    const e = sf.getLineAndCharacterOfPosition(end);
    return {
      file: fileId,
      start: { line: s.line + 1, column: s.character + 1 },
      end: { line: e.line + 1, column: e.character + 1 },
    };
  };
  const nodeLoc = (n: ts.Node) => toLoc(n.getStart(sf), n.getEnd());
  const posTag = (n: ts.Node) => {
    const p = sf.getLineAndCharacterOfPosition(n.getStart(sf));
    return `${p.line + 1}:${p.character + 1}`;
  };

  const symbols: SymbolRecord[] = [];
  const diagnostics: Diagnostic[] = [];
  /** Declaring name node -> its symbol. */
  const byNameNode = new Map<ts.Node, SymbolRecord>();
  /** Scope node (the source file or a function-like node) -> name -> declarations in source order. */
  const scopeDecls = new Map<ts.Node, Map<string, { sym: SymbolRecord; pos: number }[]>>();
  const exportListNames = new Set<string>();

  const note = (n: ts.Node, code: "I1" | "I2", construct: string) =>
    diagnostics.push({
      severity: "info",
      code,
      message: code === "I1" ? `Skipped: ${construct}.` : `Best effort: ${construct}.`,
      location: nodeLoc(n),
    });

  function addSymbol(
    nameNode: ts.Identifier,
    kind: SymbolKind,
    scope: ts.Node,
    rangeNode: ts.Node,
    exported: boolean,
    imp?: SymbolRecord["import"],
  ) {
    const sym: SymbolRecord = {
      id: `${fileId}#${nameNode.text}@${posTag(nameNode)}`,
      name: nameNode.text,
      kind,
      exported,
      location: nodeLoc(nameNode),
      range: nodeLoc(rangeNode),
      parent: fileId,
    };
    if (imp) sym.import = imp;
    symbols.push(sym);
    byNameNode.set(nameNode, sym);
    let names = scopeDecls.get(scope);
    if (!names) scopeDecls.set(scope, (names = new Map()));
    const list = names.get(sym.name) ?? [];
    list.push({ sym, pos: nameNode.getStart(sf) });
    names.set(sym.name, list);
  }

  function addBindingNames(name: ts.BindingName, kind: SymbolKind, scope: ts.Node, rangeNode: ts.Node, exported: boolean) {
    if (ts.isIdentifier(name)) {
      addSymbol(name, kind, scope, rangeNode, exported);
      return;
    }
    note(name, "I2", "destructuring: each bound name is listed as its own symbol");
    for (const el of name.elements) {
      if (!ts.isOmittedExpression(el)) addBindingNames(el.name, kind, scope, rangeNode, exported);
    }
  }

  // Pass 1: declarations. `scope` is the nearest function-like node, or the file.
  function collect(node: ts.Node, scope: ts.Node): void {
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      note(node, "I1", "type-only declaration");
      return;
    }
    if (isTypeOnly(node)) return;

    if (ts.isFunctionDeclaration(node)) {
      // A function's own name belongs to the scope it is declared in (TOOL-31).
      if (node.name) addSymbol(node.name, "function", scope, node, hasExportModifier(node));
      else note(node, "I1", "function declaration without a name (export default function)");
      if (!node.body) note(node, "I2", "function without a body (overload signature): listed as a function");
      for (const prm of node.parameters) addBindingNames(prm.name, "parameter", node, prm, false);
      ts.forEachChild(node, (c) => collect(c, node));
      return;
    }
    if (isFunctionLike(node)) {
      if (!ts.isFunctionExpression(node) || node.name) {
        if (ts.isArrowFunction(node)) note(node, "I2", "arrow function: its parameters are listed, it gets no symbol of its own");
        else if (!ts.isFunctionExpression(node)) note(node, "I2", "method, constructor or accessor: parameters are listed");
      }
      for (const prm of node.parameters) addBindingNames(prm.name, "parameter", node, prm, false);
      ts.forEachChild(node, (c) => collect(c, node));
      return;
    }
    if (ts.isVariableDeclaration(node)) {
      const stmt = node.parent?.parent;
      const exported = !!stmt && ts.isVariableStatement(stmt) && hasExportModifier(stmt);
      addBindingNames(node.name, "variable", scope, node, exported);
      ts.forEachChild(node, (c) => collect(c, scope));
      return;
    }
    if (ts.isImportDeclaration(node)) {
      const spec = node.moduleSpecifier;
      const from = ts.isStringLiteral(spec) ? spec.text : spec.getText(sf);
      const clause = node.importClause;
      if (!clause) {
        note(node, "I1", `side-effect import of "${from}"`);
        return;
      }
      const typeOnly = clause.isTypeOnly;
      const imp = (name: string, elementTypeOnly = false) =>
        typeOnly || elementTypeOnly ? { from, name, typeOnly: true } : { from, name };
      if (!from.startsWith(".")) note(node, "I2", `import from a package ("${from}"): listed, cannot be linked to a file`);
      if (clause.name) {
        note(clause, "I2", "default import: listed with import.name \"default\"");
        addSymbol(clause.name, "import", scope, clause, false, imp("default"));
      }
      const nb = clause.namedBindings;
      if (nb && ts.isNamespaceImport(nb)) {
        note(nb, "I2", "namespace import: listed with import.name \"*\"");
        addSymbol(nb.name, "import", scope, nb, false, imp("*"));
      }
      if (nb && ts.isNamedImports(nb)) {
        for (const el of nb.elements) {
          addSymbol(el.name, "import", scope, el, false, imp((el.propertyName ?? el.name).text, el.isTypeOnly));
        }
      }
      return;
    }
    if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier) {
        note(node, "I1", "re-export");
        return;
      }
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const el of node.exportClause.elements) exportListNames.add((el.propertyName ?? el.name).text);
      }
      return;
    }
    if (ts.isExportAssignment(node)) note(node, "I2", "export default / export =: the expression is analyzed, nothing is marked exported");
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      note(node, "I2", "class: its name and members are not symbols; method bodies are analyzed");
    }
    if (ts.isEnumDeclaration(node)) {
      note(node, "I1", "enum");
      return;
    }
    if (ts.isModuleDeclaration(node)) {
      note(node, "I1", "namespace or module declaration");
      return;
    }
    ts.forEachChild(node, (c) => collect(c, scope));
  }

  collect(sf, sf);

  // `export { a, b }` marks file-level declarations as exported.
  for (const name of exportListNames) {
    for (const d of scopeDecls.get(sf)?.get(name) ?? []) d.sym.exported = true;
  }

  // Pass 2: references.
  const references: ReferenceRecord[] = [];

  /** Identifiers that are names but not references: property names, member names, labels... (TOOL-12) */
  function isNonReference(id: ts.Identifier): boolean {
    const p = id.parent;
    if (!p) return true;
    if (ts.isPropertyAccessExpression(p) && p.name === id) return true;
    if (ts.isQualifiedName(p)) return true;
    if (
      (ts.isPropertyAssignment(p) ||
        ts.isPropertyDeclaration(p) ||
        ts.isMethodDeclaration(p) ||
        ts.isGetAccessorDeclaration(p) ||
        ts.isSetAccessorDeclaration(p) ||
        ts.isPropertySignature(p) ||
        ts.isMethodSignature(p) ||
        ts.isEnumMember(p) ||
        ts.isClassDeclaration(p) ||
        ts.isClassExpression(p) ||
        ts.isFunctionExpression(p) ||
        ts.isFunctionDeclaration(p) ||
        ts.isTypeParameterDeclaration(p)) &&
      (p as { name?: ts.Node }).name === id
    ) {
      return true;
    }
    if (ts.isBindingElement(p) && p.propertyName === id) return true;
    if (ts.isImportSpecifier(p) || ts.isExportSpecifier(p) || ts.isImportClause(p) || ts.isNamespaceImport(p)) return true;
    if (ts.isNamespaceExport(p) || ts.isLabeledStatement(p) || ts.isBreakOrContinueStatement(p)) return true;
    if (ts.isMetaProperty(p)) return true;
    return false;
  }

  /** TOOL-14, with FND-10: only a bare-name callee is a call. */
  function referenceKind(id: ts.Identifier): ReferenceKind {
    const p = id.parent;
    if (
      ts.isBinaryExpression(p) &&
      p.left === id &&
      p.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      p.operatorToken.kind <= ts.SyntaxKind.LastAssignment
    ) {
      return "write";
    }
    if (
      (ts.isPrefixUnaryExpression(p) || ts.isPostfixUnaryExpression(p)) &&
      (p.operator === ts.SyntaxKind.PlusPlusToken || p.operator === ts.SyntaxKind.MinusMinusToken)
    ) {
      return "write";
    }
    if ((ts.isCallExpression(p) || ts.isNewExpression(p)) && p.expression === id) return "call";
    return "read";
  }

  /** TOOL-13: nearest declaration by name in the enclosing functions, then the file. */
  function resolve(id: ts.Identifier): string | null {
    const pos = id.getStart(sf);
    for (let n: ts.Node | undefined = id.parent; n; n = n.parent) {
      if (!(n === sf || isFunctionLike(n))) continue;
      const list = scopeDecls.get(n)?.get(id.text);
      if (list && list.length > 0) {
        // The last declaration before the reference, or the first one (hoisting).
        let best = list[0];
        for (const c of list) if (c.pos <= pos) best = c;
        return best.sym.id;
      }
    }
    return null;
  }

  /** FND-02: the enclosing function's symbol ID, or the file ID. */
  function enclosingOf(id: ts.Identifier): string {
    let n: ts.Node | undefined = id.parent;
    // A function's own name sits in the outer scope.
    if (n && ts.isFunctionDeclaration(n) && n.name === id) n = n.parent;
    for (; n; n = n.parent) {
      if (ts.isFunctionDeclaration(n) && n.name) {
        const s = byNameNode.get(n.name);
        if (s) return s.id;
      }
      if (
        (ts.isFunctionExpression(n) || ts.isArrowFunction(n)) &&
        ts.isVariableDeclaration(n.parent) &&
        ts.isIdentifier(n.parent.name)
      ) {
        const s = byNameNode.get(n.parent.name);
        if (s) return s.id;
      }
    }
    return fileId;
  }

  function visitIdentifier(id: ts.Identifier) {
    const decl = byNameNode.get(id);
    let kind: ReferenceKind;
    let target: string | null;
    if (decl) {
      kind = "declaration";
      target = decl.id;
    } else {
      if (isNonReference(id)) return;
      kind = referenceKind(id);
      target = resolve(id);
    }
    const enclosing = enclosingOf(id);
    references.push({
      id: `${fileId}#ref@${posTag(id)}`,
      name: id.text,
      symbol: target,
      kind,
      location: nodeLoc(id),
      enclosing,
      from: enclosing,
      to: target,
    });
  }

  function walk(node: ts.Node): void {
    if (isTypeOnly(node)) return;
    if (ts.isIdentifier(node)) {
      visitIdentifier(node);
      return;
    }
    ts.forEachChild(node, walk);
  }
  walk(sf);

  const byPosition = (a: { location: Location }, b: { location: Location }) =>
    a.location.start.line - b.location.start.line || a.location.start.column - b.location.start.column;
  symbols.sort(byPosition);
  references.sort(byPosition);
  diagnostics.sort((a, b) => (a.location && b.location ? byPosition(a as { location: Location }, b as { location: Location }) : 0));

  return { symbols, references, diagnostics, lineCount: sf.getLineAndCharacterOfPosition(sf.getEnd()).line + 1 };
}

// ---------------------------------------------------------------------------
// Logging (DATA-16): `<ISO time>\t<level>\t<event>\t<JSON details>`, comments `# [type] text`.
// In a dry run, the same entries go to standard output as JSON lines.
// ---------------------------------------------------------------------------

type Logger = {
  entry: (level: "info" | "warn" | "error", event: string, details?: Record<string, unknown>) => void;
  comment: (type: string, text: string) => void;
};

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
      fs.appendFileSync(
        file,
        `${new Date().toISOString()}\twarn\tlog_copy_failed\t${JSON.stringify({ path: failed, error: errText(e) })}\n`,
      );
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

const HINTS: Record<string, string> = {
  E6: "Check that the file exists and is readable, or fix file_path / source_root, then run again.",
  E12: "Fix the value or the source file named above. Running the tool with no parameters repeats this exact run.",
  E8: "This is unexpected. The details hold the stack trace; run again with no parameters to reproduce it.",
};

// ---------------------------------------------------------------------------
// The work, shared by real runs and dry runs
// ---------------------------------------------------------------------------

function work(p: Params, source: ParamSource, log: Logger) {
  const store = storeDir(p);
  log.comment("step", "checking parameter values");
  const abs = resolveInput(p);
  log.entry("info", "input_resolved", { file_id: p.file_id, path: abs, store });

  log.comment("step", `reading ${p.file_id}`);
  const buf = readSource(abs);
  const text = buf.toString("utf8");
  const read = { file_id: p.file_id, path: abs, bytes: buf.length, sha256: sha256(buf) };
  log.entry("info", "file_read", read);

  log.comment("step", "checking syntax");
  const syntax = syntaxErrors(p.file_id, text);
  if (syntax.length > 0) {
    throw runError(
      "E12",
      `${p.file_id} has ${syntax.length} syntax error(s). First: ${syntax[0].message}`,
      syntax[0].location,
      { syntaxErrors: syntax },
    );
  }

  log.comment("step", "listing symbols and references");
  const { symbols, references, diagnostics, lineCount } = analyze(p.file_id, text);
  for (const d of diagnostics) log.entry("info", "diagnostic", d as unknown as Record<string, unknown>);

  const count = <T, K extends string>(items: T[], key: (t: T) => K) =>
    items.reduce<Record<string, number>>((acc, t) => ((acc[key(t)] = (acc[key(t)] ?? 0) + 1), acc), {});
  const counts = {
    symbols: symbols.length,
    symbolsByKind: count(symbols, (s) => s.kind),
    references: references.length,
    referencesByKind: count(references, (r) => r.kind),
    unresolvedReferences: references.filter((r) => r.symbol === null).length,
    diagnostics: diagnostics.length,
    lines: lineCount,
  };
  log.entry("info", "analysis_done", counts);

  // No times in the output, so two runs over the same file give identical output (FND-29).
  const output = {
    tool: TOOL,
    version: VERSION,
    formatVersion: OUTPUT_FORMAT_VERSION,
    file: p.file_id,
    sha256: read.sha256,
    dataNames: { "code.symbol": "symbols", "code.reference": "references" },
    counts,
    symbols,
    references,
    diagnostics,
  };
  const outputPath = path.join(store, "output", fileKey(p.file_id));
  return { output, outputPath, read, counts, store, source };
}

function existingChange(file: string, content: string): "create" | "update" | "unchanged" {
  try {
    return fs.readFileSync(file, "utf8") === content ? "unchanged" : "update";
  } catch {
    return "create";
  }
}

function toDiagnostic(e: unknown): Diagnostic {
  if (e instanceof ToolError) return e.diagnostic;
  return {
    severity: "error",
    code: "E8",
    message: `Unexpected failure: ${errText(e)}`,
    details: { stack: e instanceof Error ? e.stack : undefined },
  };
}

// ---------------------------------------------------------------------------
// Real run
// ---------------------------------------------------------------------------

function writeLastRun(p: Params, meta: Record<string, unknown>) {
  // Flat parameters, so the file can be passed back with --json. `_last_run` is an extra value, ignored on input.
  writeAtomic(LAST_RUN_PATH, JSON.stringify({ ...p, _last_run: { tool: TOOL, version: VERSION, ...meta } }, null, 2) + "\n");
}

function realRun(p: Params, source: ParamSource, logCopy: string | undefined): number {
  const started = new Date();
  const store = storeDir(p);
  const resultPath = path.join(store, "result.json");
  const logFile = path.join(store, "logs", `${stamp(started)}_${fileKey(p.file_id).replace(/\.json$/, "")}.log`);

  let log: Logger;
  try {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    log = fileLogger(logFile, logCopy);
  } catch (e) {
    process.stderr.write(`${TOOL}: run error E8: cannot create the store at ${store}: ${errText(e)}\n`);
    return EXIT_RUN_ERROR;
  }

  log.comment("run", `${TOOL} ${VERSION}: real run on ${p.file_id}`);
  log.entry("info", "run_started", {
    tool: TOOL,
    version: VERSION,
    mode: "real",
    parameterSource: source,
    parameters: p,
    argv: process.argv.slice(2),
    programDir: PROGRAM_DIR,
    store,
    logCopy: logCopy ?? null,
  });

  try {
    // The parameters passed the shape check, so the run has begun: save them (TOOL-04).
    writeLastRun(p, { outcome: "started", started: started.toISOString() });
    log.entry("info", "last_run_saved", { path: LAST_RUN_PATH });

    const r = work(p, source, log);
    const content = JSON.stringify(r.output, null, 2) + "\n";
    const change = existingChange(r.outputPath, content);
    writeAtomic(r.outputPath, content);
    log.entry("info", "output_written", { path: r.outputPath, change, dataNames: r.output.dataNames });

    const finished = new Date();
    const result = {
      tool: TOOL,
      version: VERSION,
      status: "succeeded",
      mode: "real",
      started: started.toISOString(),
      finished: finished.toISOString(),
      durationMs: finished.getTime() - started.getTime(),
      parameterSource: source,
      parameters: p,
      read: r.read,
      outputs: [r.outputPath],
      outputChange: change,
      counts: r.counts,
      log: logFile,
    };
    writeAtomic(resultPath, JSON.stringify(result, null, 2) + "\n");
    writeLastRun(p, { outcome: "succeeded", started: result.started, finished: result.finished, result: resultPath });
    log.entry("info", "run_finished", { status: "succeeded", durationMs: result.durationMs, result: resultPath });
    out({ result: "succeeded", file_id: p.file_id, output: r.outputPath, change, counts: r.counts, log: logFile });
    return EXIT_OK;
  } catch (e) {
    const error = toDiagnostic(e);
    const finished = new Date();
    log.entry("error", "run_failed", { error });
    if (HINTS[error.code]) log.comment("hint", HINTS[error.code]);
    try {
      const result = {
        tool: TOOL,
        version: VERSION,
        status: "failed",
        mode: "real",
        started: started.toISOString(),
        finished: finished.toISOString(),
        durationMs: finished.getTime() - started.getTime(),
        parameterSource: source,
        parameters: p,
        error,
        outputs: [],
        log: logFile,
      };
      writeAtomic(resultPath, JSON.stringify(result, null, 2) + "\n");
      writeLastRun(p, { outcome: "failed", started: result.started, finished: result.finished, error, result: resultPath });
    } catch (inner) {
      log.entry("error", "result_not_written", { error: errText(inner) });
    }
    log.entry("info", "run_finished", { status: "failed" });
    process.stderr.write(`${TOOL}: run error ${error.code}: ${error.message}\n`);
    out({ result: "failed", file_id: p.file_id, error, log: logFile });
    return EXIT_RUN_ERROR;
  }
}

// ---------------------------------------------------------------------------
// Dry run (TOOL-06, DATA-17): same work, nothing written, everything on standard output.
// The preview line carries the would-be output, so a Runner can chain dry runs (FND-04, RN-11).
// ---------------------------------------------------------------------------

function dryRun(p: Params, source: ParamSource, logCopy: string | undefined): number {
  const log = stdoutLogger;
  log.entry("info", "run_started", { tool: TOOL, version: VERSION, mode: "dry-run", parameterSource: source, parameters: p });
  if (logCopy) log.entry("warn", "log_option_ignored", { reason: "a dry run writes nothing to the file system", path: logCopy });
  try {
    const r = work(p, source, log);
    const content = JSON.stringify(r.output, null, 2) + "\n";
    out({
      type: "preview",
      output: r.outputPath,
      change: existingChange(r.outputPath, content),
      wouldWrite: [r.outputPath, path.join(r.store, "result.json"), path.join(r.store, "logs", "<timestamp>.log"), LAST_RUN_PATH],
      content: r.output,
    });
    out({ dryRun: "go", tool: TOOL, version: VERSION, file_id: p.file_id, counts: r.counts });
    return EXIT_OK;
  } catch (e) {
    const error = toDiagnostic(e);
    if (HINTS[error.code]) log.comment("hint", HINTS[error.code]);
    out({ dryRun: "no-go", kind: "run", tool: TOOL, version: VERSION, file_id: p.file_id, error });
    return EXIT_RUN_ERROR;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/** Invocation errors write nothing and log nothing (toolset.md 4.5). A dry run also gets a no-go line (FND-13). */
function invocationFailure(e: unknown, dry: boolean): number {
  const error = e instanceof ToolError ? e.diagnostic : { severity: "error" as const, code: "E1", message: errText(e) };
  process.stderr.write(`${TOOL}: invocation error ${error.code}: ${error.message}\n`);
  process.stderr.write(JSON.stringify({ invocationError: error }) + "\n");
  if (dry) out({ dryRun: "no-go", kind: "invocation", tool: TOOL, version: VERSION, error });
  return EXIT_INVOCATION_ERROR;
}

function main(argv: string[]): number {
  let cli: Cli;
  try {
    cli = parseArgs(argv);
  } catch (e) {
    return invocationFailure(e, argv.includes("--dry-run"));
  }
  if (cli.help) {
    process.stdout.write(HELP);
    return EXIT_OK;
  }
  if (cli.version) {
    process.stdout.write(`${TOOL} ${VERSION}\n`);
    return EXIT_OK;
  }
  if (cli.info) {
    process.stdout.write(JSON.stringify(INFO, null, 2) + "\n");
    return EXIT_OK;
  }

  let params: Params;
  let source: ParamSource;
  try {
    const loaded = loadParams(cli);
    params = checkShape(loaded.params);
    source = loaded.source;
  } catch (e) {
    return invocationFailure(e, cli.dryRun);
  }
  return cli.dryRun ? dryRun(params, source, cli.log) : realRun(params, source, cli.log);
}

process.exitCode = main(process.argv.slice(2));
