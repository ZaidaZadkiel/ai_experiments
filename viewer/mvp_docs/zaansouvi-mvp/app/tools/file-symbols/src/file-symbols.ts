// file-symbols (M1), ZaAnSouVi MVP.
//
// Reads ONE TypeScript file and lists its symbols and every reference to them.
// Depends on Node built-ins, the `typescript` package (used only as a parser, no type checking) and the
// tool helper, which carries the contract every tool shares (TOOL-45). It imports nothing from the Runner,
// the Viewer or another tool (ARCH-02).
//
// Contract: see ../README.md. Run `./file-symbols --help` or `./file-symbols --info`.

import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { COMMON_ERROR_CODES, ToolError, errText, runError, runTool } from "../../../tool-helper/tool.ts";
import type { Diagnostic, Location, Logger, Params, ToolSpec } from "../../../tool-helper/tool.ts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOL = "file-symbols";
const VERSION = "0.5.0";
const OUTPUT_FORMAT_VERSION = 3;

/** The tool's program folder: app/tools/file-symbols. Only code lives here; nothing is written here (toolset.md 4.5). */
const PROGRAM_DIR = path.resolve(import.meta.dirname, "..");

const ERROR_CODES: Record<string, string> = {
  ...COMMON_ERROR_CODES,
  E12: "run: a value is incorrect or incongruent, or the file has syntax errors",
  I1: "note: construct skipped (outside the supported constructs)",
  I2: "note: construct outside the supported constructs, handled on a best-effort basis",
};

// ---------------------------------------------------------------------------
// Data shapes (02_data_contracts.md, with the extras from 99_findings.md)
// ---------------------------------------------------------------------------

type SymbolKind = "function" | "variable" | "parameter" | "import";
type SymbolRecord = {
  id: string;
  name: string;
  kind: SymbolKind;
  exported: boolean;
  location: Location;
  range: Location;
  parent: string;
  import?: { moduleSpecifier: string; importedName: string; typeOnly?: boolean };
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

/** M1's parameters, after the helper's shape check from --info. */
type M1Params = { file_id: string; file_path?: string; source_root: string; store_path?: string; [extra: string]: unknown };

// ---------------------------------------------------------------------------
// --info (DATA-08, plus jsonKey and field names: FND-01, FND-02).
// Every key name has one meaning across the Runner, the tools and the Viewer (DATA-19, FND-40).
// ---------------------------------------------------------------------------

const INFO = {
  tool: TOOL,
  toolVersion: VERSION,
  description: "Reads one TypeScript file and lists its symbols and the references to them.",
  readsFiles: { filePatterns: ["*.ts"], parameter: "file_path", fallback: "source_root + file_id" }, // a tool that reads files declares source_root (toolset.md 4.2)
  invocation: "per-file",
  parameters: {
    file_id: {
      dataName: "files.file.id",
      affectsOutput: true,
      shape: "string",
      required: true,
      description: "Path of the file relative to the source root, with / separators, for example src/math.ts",
    },
    file_path: {
      dataName: "files.file.path",
      affectsOutput: true,
      shape: "string",
      required: false,
      description: "Path of the file to read, absolute or relative to source_root; it must lie inside source_root and match file_id. If absent, source_root + file_id is read",
    },
    source_root: {
      dataName: "project.source_root",
      affectsOutput: true,
      shape: "string",
      required: true,
      description: "Root of the examined source. Declaring it marks a tool that reads files; every file path is resolved against it (toolset.md 4.2)",
    },
    store_path: {
      dataName: "zaansouvi.store_path",
      affectsOutput: false,
      shape: "string",
      required: false,
      description: "Folder that is this tool's store: output, result and logs are written here. Doesn't affect the output. Read like any parameter: command line, then --json or --stdin, then last_run.json as a complete input",
      whenAbsent: "<working folder>/zaansouvi/tools/file-symbols/",
    },
  },
  outputs: [
    {
      dataName: "code.symbol",
      formatVersion: OUTPUT_FORMAT_VERSION,
      represents: "nodes",
      containedIn: "files.file",
      outputFilePattern: "output/<file-key>.json",
      jsonKey: "symbols",
      fields: { idField: "id", parentField: "parent", labelField: "name", kindField: "kind", locationField: "location" },
    },
    {
      dataName: "code.reference",
      formatVersion: OUTPUT_FORMAT_VERSION,
      represents: "relations",
      outputFilePattern: "output/<file-key>.json",
      jsonKey: "references",
      fields: { idField: "id", fromField: "from", toField: "to", kindField: "kind", locationField: "location" },
    },
  ],
  fileKey: "file_id with every / replaced by __, plus .json",
  storeLayout: {
    storePathPattern: "<store_path>, or <working folder>/zaansouvi/tools/file-symbols when store_path is absent",
    outputFilePattern: "output/<file-key>.json",
    resultFilePattern: "result.json",
    logFilePattern: "logs/<timestamp>_<file-key>.log",
    lastRunFilePattern: "<store>/last_run.json",
    relativeTo: "storePathPattern, except lastRunFilePattern",
  },
  options: {
    "--info": "print this description and exit",
    "--help": "print usage and exit",
    "--version": "print the version and exit",
    "--dry-run": "do the work, write nothing, print JSON lines and a final go / no-go line",
    "--json <path>": "read the parameters from a JSON file",
    "--stdin": "read the parameters as JSON from standard input",
    "--log <path>": "also copy the log to this file (the store log is always written)",
    "--file-id <v>, --file-path <v>, --source-root <v>, --store-path <v>":
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

Parameters (JSON keys): file_id (required), file_path, source_root, store_path.
With no store_path, the store is zaansouvi/tools/file-symbols/ in the working folder; last_run.json is kept
in the store. Never run a tool from inside the examined source (E14).
source_root is required: every file path is resolved against it.

Precedence: command-line parameter options, then --json or --stdin, then last_run.json.
Exit codes: 0 success / go, 1 run error / no-go, 2 invocation error.
`;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const fileKey = (fileId: string) => fileId.split("/").join("__") + ".json";
const sha256 = (data: Buffer) => crypto.createHash("sha256").update(data).digest("hex");

// ---------------------------------------------------------------------------
// Value checks and reading the file (E12, E6)
// ---------------------------------------------------------------------------

function resolveInput(p: M1Params): string {
  const id = p.file_id;
  if (id.includes("\\")) throw runError("E12", `file_id must use "/" separators; got "${id}".`);
  if (path.posix.isAbsolute(id) || /^[A-Za-z]:/.test(id)) {
    throw runError("E12", `file_id must be relative to the source root; got "${id}".`);
  }
  if (id.split("/").some((s) => s === ".." || s === "." || s === "")) {
    throw runError("E12", `file_id must be a plain relative path, with no empty, "." or ".." segments; got "${id}".`);
  }
  if (!id.endsWith(".ts")) throw runError("E12", `This tool reads only *.ts files; file_id is "${id}".`);

  const root = path.resolve(p.source_root!);
  if (p.file_path === undefined) return path.resolve(root, ...id.split("/"));

  const abs = path.resolve(root, p.file_path); // relative paths are resolved against source_root
  // The file must lie inside source_root, at file_id (toolset.md 4.2).
  const rel = path.relative(root, abs).split(path.sep).join("/");
  if (rel !== id) {
    throw runError(
      "E12",
      `file_path and file_id disagree: file_path is "${rel}" relative to source_root, but file_id is "${id}".`,
      undefined,
      { file_id: id, file_path: abs, source_root: root, relativePath: rel },
    );
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
    throw runError("E6", `Cannot read the file ${abs}: ${errText(e)}`, undefined, { sourcePath: abs });
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
        typeOnly || elementTypeOnly
          ? { moduleSpecifier: from, importedName: name, typeOnly: true }
          : { moduleSpecifier: from, importedName: name };
      if (!from.startsWith(".")) note(node, "I2", `import from a package ("${from}"): listed, cannot be linked to a file`);
      if (clause.name) {
        note(clause, "I2", "default import: listed with import.importedName \"default\"");
        addSymbol(clause.name, "import", scope, clause, false, imp("default"));
      }
      const nb = clause.namedBindings;
      if (nb && ts.isNamespaceImport(nb)) {
        note(nb, "I2", "namespace import: listed with import.importedName \"*\"");
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

const HINTS: Record<string, string> = {
  E6: "Check that the file exists and is readable, or fix file_path / source_root, then run again.",
  E12: "Fix the value or the source file named above. Running the tool with no parameters repeats this exact run.",
  E8: "This is unexpected. The details hold the stack trace; run again with no parameters to reproduce it.",
};

// ---------------------------------------------------------------------------
// The work, shared by real runs and dry runs; the tool helper does the rest
// ---------------------------------------------------------------------------

function work(params: Params, store: string, log: Logger) {
  const p = params as M1Params;
  log.comment("step", "checking parameter values");
  const abs = resolveInput(p);
  log.entry("info", "input_resolved", { file_id: p.file_id, sourcePath: abs, storePath: store });

  log.comment("step", `reading ${p.file_id}`);
  const buf = readSource(abs);
  const text = buf.toString("utf8");
  const read = { file_id: p.file_id, sourcePath: abs, sourceBytes: buf.length, sourceSha256: sha256(buf) };
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
    symbolCount: symbols.length,
    symbolCountByKind: count(symbols, (s) => s.kind),
    referenceCount: references.length,
    referenceCountByKind: count(references, (r) => r.kind),
    unresolvedReferenceCount: references.filter((r) => r.symbol === null).length,
    lineCount,
  };
  log.entry("info", "analysis_done", counts);

  // No times in the output, so two runs over the same file give identical output (FND-29).
  const output = {
    tool: TOOL,
    toolVersion: VERSION,
    formatVersion: OUTPUT_FORMAT_VERSION,
    file: p.file_id,
    sourceSha256: read.sourceSha256,
    dataNames: { "code.symbol": "symbols", "code.reference": "references" },
    counts,
    symbols,
    references,
  };
  // The I1 and I2 notes describe the run, so they go in result.json, not the output file (DATA-14).
  return { outputs: [{ path: path.join("output", fileKey(p.file_id)), content: output }], summary: { counts }, resultExtra: { read }, diagnostics };
}

const SPEC: ToolSpec = {
  info: INFO,
  help: HELP,
  programDir: PROGRAM_DIR,
  work: ({ params, store, log }) => work(params, store, log),
  identity: (p) => ({ file_id: p.file_id }),
  logName: (p) => fileKey(String(p.file_id)).replace(/\.json$/, ""),
  hints: HINTS,
  // The dry run prints the would-be output, so a Runner can chain dry runs (FND-04, RN-11).
  preview: true,
};

process.exitCode = runTool(SPEC, process.argv.slice(2));
