// ts-program, ZaAnSouVi MVP 2.
//
// Runs TypeScript's own compiler (parser, binder and type checker) over the whole examined program, and writes, for each
// source file, every declaration, every use resolved to the declaration TypeScript says it means, and every import link,
// in the records the Viewer reads (mvp_docs/42_tool_ts_program.md; the definition of a correct graph,
// mvp_docs/41_typescript_program_plan.md, section 1.1). A program tool (toolset.md 4.2, TS-37): it reads every listed
// .ts file in one invocation, and nothing else from the source. It imports nothing from the Runner, the Viewer or another
// tool (ARCH-02); the shared contract comes from the tool helper (TOOL-45).

import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { COMMON_ERROR_CODES, invocationError, runError, runTool } from "../../../tool-helper/tool.ts";
import type { Diagnostic, Location, Logger, Params, ToolSpec, WorkResult } from "../../../tool-helper/tool.ts";

const TOOL = "ts-program";
const VERSION = "0.2.0";
const FORMAT_VERSION = 1;
const PROGRAM_DIR = path.resolve(import.meta.dirname, "..");
const LIB_DIR = path.dirname(createRequire(import.meta.url).resolve("typescript"));

/** With no configuration (TPG-D4a): the options `tsc --init` writes in TypeScript 5.6, so built-ins such as Map and
 *  Promise exist (TypeScript's bare default, ES5, has neither). No @types, no node_modules (TPG-20). */
const DEFAULT_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2016, module: ts.ModuleKind.CommonJS, esModuleInterop: true, strict: true,
  skipLibCheck: true, forceConsistentCasingInFileNames: true, types: [], noEmit: true,
};

const ERROR_CODES: Record<string, string> = {
  ...COMMON_ERROR_CODES,
  E12: "run: a value is incorrect (a file outside source_root, missing, or with syntax errors)",
};

// ---------------------------------------------------------------------------
// --info (DATA-08; the new keys of the MVP 2 schema, section 5)
// ---------------------------------------------------------------------------

const nodeFields = { idField: "id", parentField: "parent", labelField: "name", kindField: "kind", locationField: "location" };
const relFields = { idField: "id", fromField: "from", toField: "to", kindField: "kind", locationField: "location", labelField: "name" };
const INFO = {
  tool: TOOL,
  toolVersion: VERSION,
  description: "Runs TypeScript's compiler over the whole program and writes, per source file, its declarations, every use resolved to its declaration, and its import links.",
  invocation: "once",
  readsFiles: { filePatterns: ["*.ts"], scope: "program", parameter: "files" },
  parameters: {
    source_root: {
      dataName: "project.source_root", affectsOutput: true, shape: "string", required: true,
      description: "Root of the examined source. Every file path is resolved against it and must lie inside it",
    },
    files: {
      dataName: "files.file.id", list: true, affectsOutput: true, shape: "array of strings", required: true,
      description: "The program's files: every listed file matching *.ts, relative to source_root, / separators",
    },
    configs: {
      dataName: "ts.config", list: true, affectsOutput: true, shape: "array of ts.config records", required: false,
      description: "Every tsconfig*.json as written, from ts-config (TPG-D4). Not supported in 0.1.0: without it, the options of `tsc --init` apply",
    },
    store_path: {
      dataName: "zaansouvi.store_path", affectsOutput: false, shape: "string", required: false,
      description: "Folder that is this tool's store. Doesn't affect the output",
      whenAbsent: "<working folder>/zaansouvi/tools/ts-program/",
    },
  },
  outputs: [
    { dataName: "code.symbol", formatVersion: FORMAT_VERSION, represents: "nodes", containedIn: ["files.file", "code.symbol"], perFile: true,
      outputFilePattern: "output/<file-key>.json", jsonKey: "symbols", fields: nodeFields },
    { dataName: "code.reference", formatVersion: FORMAT_VERSION, represents: "relations", perFile: true,
      outputFilePattern: "output/<file-key>.json", jsonKey: "references", fields: relFields },
    { dataName: "code.link", formatVersion: FORMAT_VERSION, represents: "relations", perFile: true,
      outputFilePattern: "output/<file-key>.json", jsonKey: "links", fields: relFields },
  ],
  errorCodes: ERROR_CODES,
  definition: "mvp_docs/41_typescript_program_plan.md, section 1.1",
};

const HELP = `ts-program ${VERSION}: runs TypeScript over the whole program; one output file per source file.

Usage: ts-program [--dry-run] (--stdin | --json <file>) [--log <file>]
       ts-program --info | --help | --version

Parameters (JSON): source_root (required), files (required, array of file IDs), configs (not supported in 0.2.0), store_path.
Output: <store>/output/<file-key>.json per file: symbols, references, links (mvp_docs/42_tool_ts_program.md, section 5).
`;

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

type Sym = {
  id: string; name: string; kind: string; parent: string; location: Location; range: Location;
  exported?: true; modifiers?: string[]; declaredIn?: string; declarations?: Location[];
  /** FND-110: how a variable is declared, and the file's default export. */
  declaredWith?: "const" | "let" | "var" | "using" | "await using"; defaultExport?: true;
  heritage?: { extends?: (string | null)[]; implements?: (string | null)[] };
  import?: { moduleSpecifier: string; importedName: string; typeOnly?: true };
};
type Ref = {
  id: string; name: string; kind: string; from: string; to: string | null; location: Location;
  member?: true; union?: true; viaImport?: string; reason?: string; builtin?: string;
};
type Link = { id: string; from: string; to: string | null; kind: "import"; moduleSpecifier: string; importedName: string; location: Location; reason?: string };

const sha256 = (b: Buffer | string) => crypto.createHash("sha256").update(b).digest("hex");
const fileKey = (id: string) => id.split("/").join("__") + ".json";
const cmpLoc = (a: { location: Location; id: string }, b: { location: Location; id: string }) =>
  a.location.start.line - b.location.start.line || a.location.start.column - b.location.start.column || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

// ---------------------------------------------------------------------------
// The program, through a host that shows TypeScript only the listed files and its own library (FND-83, TSP-04)
// ---------------------------------------------------------------------------

type Program = { program: ts.Program; checker: ts.TypeChecker; byPath: Map<string, string>; filesRead: string[]; libRead: number };

function buildProgram(root: string, files: string[], log: Logger): Program {
  const byPath = new Map<string, string>(); // absolute path -> file ID
  for (const id of files) byPath.set(path.join(root, id), id);
  const host = ts.createCompilerHost(DEFAULT_OPTIONS, true);
  const inLib = (p: string) => p.startsWith(LIB_DIR + path.sep);
  const allowed = (p: string) => byPath.has(p) || inLib(p);
  const dirs = new Set<string>();
  for (const p of byPath.keys()) for (let d = path.dirname(p); d.length > 1 && !dirs.has(d); d = path.dirname(d)) dirs.add(d);
  const filesRead: string[] = [];
  let libRead = 0;
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (p, ...rest) => {
    if (!allowed(p)) return undefined;
    if (inLib(p)) libRead++;
    else filesRead.push(p);
    return getSourceFile(p, ...rest);
  };
  const readFile = host.readFile.bind(host);
  host.readFile = (p) => (allowed(p) ? readFile(p) : undefined);
  host.fileExists = (p) => allowed(p) && fs.existsSync(p);
  host.directoryExists = (d) => dirs.has(d) || d === LIB_DIR || inLib(d);
  host.getDirectories = () => [];
  host.realpath = (p) => p;
  const program = ts.createProgram([...byPath.keys()].sort(), DEFAULT_OPTIONS, host);
  log.entry("info", "program_built", { files: byPath.size, libraryFiles: libRead, compilerOptions: "tsc --init defaults (no configs, TPG-D4a)" });
  return { program, checker: program.getTypeChecker(), byPath, filesRead: filesRead.sort(), libRead };
}

// ---------------------------------------------------------------------------
// Extraction (the definition of a correct graph, parts A to C, refinements R1 to R6)
// ---------------------------------------------------------------------------

const MODIFIER_NAMES: Partial<Record<ts.SyntaxKind, string>> = {
  [ts.SyntaxKind.StaticKeyword]: "static", [ts.SyntaxKind.AbstractKeyword]: "abstract", [ts.SyntaxKind.ReadonlyKeyword]: "readonly",
  [ts.SyntaxKind.PrivateKeyword]: "private", [ts.SyntaxKind.ProtectedKeyword]: "protected", [ts.SyntaxKind.PublicKeyword]: "public",
  [ts.SyntaxKind.AsyncKeyword]: "async", [ts.SyntaxKind.DeclareKeyword]: "declare", [ts.SyntaxKind.ConstKeyword]: "const",
  // FND-110. export is the exported key; default is defaultExport.
  [ts.SyntaxKind.OverrideKeyword]: "override", [ts.SyntaxKind.AccessorKeyword]: "accessor",
};

/** How a variable is declared (FND-110), from its declaration list: a destructured name's too; none for a catch
 *  clause's variable, which has no list. */
function declaredWithOf(n: ts.Node): Sym["declaredWith"] {
  let p: ts.Node | undefined = n;
  while (p && !ts.isVariableDeclarationList(p)) {
    if (ts.isCatchClause(p) || ts.isParameter(p) || isFunctionLike(p)) return undefined;
    p = p.parent;
  }
  if (!p) return undefined;
  const f = p.flags & (ts.NodeFlags.Let | ts.NodeFlags.Const | ts.NodeFlags.Using);
  return f === ts.NodeFlags.Const ? "const" : f === ts.NodeFlags.Let ? "let" : f === ts.NodeFlags.Using ? "using" : f === ts.NodeFlags.AwaitUsing ? "await using" : "var";
}
const PARAM_PROPERTY = new Set([ts.SyntaxKind.PublicKeyword, ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.ProtectedKeyword, ts.SyntaxKind.ReadonlyKeyword]);
const isParameterProperty = (n: ts.Node): boolean =>
  ts.isParameter(n) && ts.isConstructorDeclaration(n.parent) && !!ts.getModifiers(n)?.some((m) => PARAM_PROPERTY.has(m.kind));
const hasBody = (f: ts.SignatureDeclaration) => "body" in f && !!(f as { body?: ts.Node }).body;
const isFunctionLike = (n: ts.Node) =>
  ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n) || ts.isConstructorDeclaration(n) || ts.isGetAccessor(n) || ts.isSetAccessor(n) ||
  ts.isArrowFunction(n) || ts.isFunctionExpression(n);

/** A variable at the top level of a file or namespace: no function-like or class between it and its container (R3). */
function isTopLevelVariable(n: ts.Node): n is ts.VariableDeclaration {
  if (!ts.isVariableDeclaration(n)) return false;
  for (let p: ts.Node | undefined = n.parent; p; p = p.parent) {
    if (ts.isSourceFile(p) || ts.isModuleBlock(p)) return true;
    if (isFunctionLike(p) || ts.isClassLike(p)) return false;
  }
  return false;
}

/** The kind of node a declaration makes, or undefined when it makes none. */
function nodeKind(d: ts.Node): string | undefined {
  if (ts.isClassDeclaration(d)) return d.name ? "class" : undefined;
  if (ts.isInterfaceDeclaration(d)) return "interface";
  if (ts.isTypeAliasDeclaration(d)) return "typeAlias";
  if (ts.isEnumDeclaration(d)) return "enum";
  if (ts.isEnumMember(d)) return "enumMember";
  if (ts.isModuleDeclaration(d)) return ts.isIdentifier(d.name) ? "namespace" : undefined;
  if (ts.isFunctionDeclaration(d)) return "function";
  if (ts.isMethodDeclaration(d) || ts.isMethodSignature(d)) return ts.isObjectLiteralExpression(d.parent) ? undefined : "method";
  if (ts.isConstructorDeclaration(d)) return "constructor";
  if (ts.isGetAccessor(d) || ts.isSetAccessor(d)) return ts.isObjectLiteralExpression(d.parent) ? undefined : "accessor";
  if (ts.isPropertyDeclaration(d)) return "property";
  if (ts.isPropertySignature(d)) {
    // Members of an interface, or of a type alias's own object type; not of an anonymous type elsewhere.
    const lit = d.parent;
    if (ts.isInterfaceDeclaration(lit)) return "property";
    if (ts.isTypeLiteralNode(lit) && ts.isTypeAliasDeclaration(lit.parent)) return "property";
    return undefined;
  }
  if (ts.isParameter(d)) {
    if (isParameterProperty(d)) return "property";
    const f: ts.Node = d.parent;
    if (!ts.isIdentifier(d.name)) return undefined;
    if (ts.isFunctionTypeNode(f) || ts.isConstructorTypeNode(f) || ts.isCallSignatureDeclaration(f) || ts.isIndexSignatureDeclaration(f)) return undefined;
    return hasBody(f as ts.SignatureDeclaration) ? "parameter" : undefined; // R2: no body, no parameter nodes
  }
  if (ts.isVariableDeclaration(d)) return ts.isIdentifier(d.name) ? "variable" : undefined;
  if (ts.isBindingElement(d)) return ts.isIdentifier(d.name) ? "variable" : undefined;
  if (ts.isImportClause(d)) return d.name ? "import" : undefined;
  if (ts.isImportSpecifier(d) || ts.isNamespaceImport(d)) return "import";
  return undefined;
}

class Extractor {
  readonly declId = new Map<ts.Node, string>();        // declaration -> node ID (merged declarations share one)
  readonly symbols = new Map<string, Sym[]>();         // file ID -> its symbols
  readonly references = new Map<string, Ref[]>();
  readonly links = new Map<string, Link[]>();
  private readonly symById = new Map<string, Sym>();

  private readonly p: Program;
  // Written out, not as parameter properties: Node's type stripping refuses those (BE-103).
  constructor(p: Program) {
    this.p = p;
  }

  fileIdOf(sf: ts.SourceFile): string | undefined { return this.p.byPath.get(sf.fileName); }

  loc(n: ts.Node, sf = n.getSourceFile()): Location {
    const s = sf.getLineAndCharacterOfPosition(n.getStart(sf));
    const e = sf.getLineAndCharacterOfPosition(n.getEnd());
    return { file: this.fileIdOf(sf)!, start: { line: s.line + 1, column: s.character + 1 }, end: { line: e.line + 1, column: e.character + 1 } };
  }

  /** The token that names a declaration, and its name. */
  nameOf(d: ts.Node): { node: ts.Node; text: string } {
    if (ts.isConstructorDeclaration(d)) {
      const kw = d.getChildren().find((c) => c.kind === ts.SyntaxKind.ConstructorKeyword) ?? d;
      return { node: kw, text: "constructor" };
    }
    const name = (d as { name?: ts.Node }).name;
    if (name && (ts.isIdentifier(name) || ts.isPrivateIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name))) return { node: name, text: name.text };
    return { node: d, text: "default" };
  }

  /** The node ID of the nearest container of a declaration: the declaring symbol, or the file (A4, R1, R3). */
  parentOf(d: ts.Node): string {
    if (isParameterProperty(d)) return this.declId.get(d.parent.parent)!;
    for (let p = d.parent; p; p = p.parent) {
      if (ts.isSourceFile(p)) return this.fileIdOf(p)!;
      const id = this.declId.get(p);
      // Imports contain no declarations: the named imports inside a default import's clause are the file's, not its.
      if (id && !ts.isImportClause(p) && (isTopLevelVariable(p) || !ts.isVariableDeclaration(p))) return id;
    }
    return this.fileIdOf(d.getSourceFile())!;
  }

  /** Pass 1: every declaration that makes a node. */
  declare(sf: ts.SourceFile) {
    const fid = this.fileIdOf(sf)!;
    const list: Sym[] = [];
    this.symbols.set(fid, list);
    const visit = (n: ts.Node) => {
      const kind = nodeKind(n);
      if (kind) {
        const symbol = (n as { symbol?: ts.Symbol }).symbol;
        // Merged declarations (overloads, a getter and setter) share the node of the first (TPG-D6).
        const first = symbol?.declarations?.find((x) => this.declId.has(x));
        if (first && !isParameterProperty(n)) {
          const id = this.declId.get(first)!;
          this.declId.set(n, id);
          const s = this.symById.get(id)!;
          s.declarations = [...(s.declarations ?? [this.loc(this.nameOf(first).node)]), this.loc(this.nameOf(n).node)];
        } else {
          const { node, text } = this.nameOf(n);
          const location = this.loc(node, sf);
          const id = `${fid}#${text}@${location.start.line}:${location.start.column}`;
          this.declId.set(n, id);
          const s: Sym = { id, name: text, kind, parent: this.parentOf(n), location, range: this.loc(n, sf) };
          const mods = (ts.canHaveModifiers(n) ? ts.getModifiers(n) : undefined)?.map((m) => MODIFIER_NAMES[m.kind]).filter((x): x is string => !!x);
          const exportedStmt = ts.isVariableDeclaration(n) && n.parent.parent && ts.canHaveModifiers(n.parent.parent) &&
            ts.getModifiers(n.parent.parent)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
          if (exportedStmt || (ts.canHaveModifiers(n) && ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))) s.exported = true;
          if (mods && mods.length && kind !== "parameter") s.modifiers = mods;
          if (isParameterProperty(n)) s.declaredIn = "constructor";
          if (kind === "variable") { const w = declaredWithOf(n); if (w) s.declaredWith = w; }
          if (kind === "import") s.import = this.importInfo(n);
          list.push(s);
          this.symById.set(id, s);
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }

  /** The file's default export (FND-110): what "default" names in the module's exports, through an alias
   *  (export default Circle), marked on its declaration when that is in this file. */
  markDefault(sf: ts.SourceFile) {
    const checker = this.p.checker;
    const mod = checker.getSymbolAtLocation(sf);
    const exp = mod && checker.tryGetMemberInModuleExports("default", mod);
    if (!exp) return;
    const target = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
    for (const d of target.declarations ?? []) {
      const id = d.getSourceFile() === sf ? this.declId.get(d) : undefined;
      if (id) this.symById.get(id)!.defaultExport = true;
    }
  }

  importInfo(n: ts.Node): Sym["import"] {
    let decl: ts.Node = n;
    while (decl && !ts.isImportDeclaration(decl)) decl = decl.parent;
    const imp = decl as ts.ImportDeclaration;
    const moduleSpecifier = (imp.moduleSpecifier as ts.StringLiteral).text;
    const importedName = ts.isImportClause(n) ? "default" : ts.isNamespaceImport(n) ? "*" : ((n as ts.ImportSpecifier).propertyName ?? (n as ts.ImportSpecifier).name).text;
    const typeOnly = (ts.isImportSpecifier(n) && n.isTypeOnly) || imp.importClause?.isTypeOnly;
    return typeOnly ? { moduleSpecifier, importedName, typeOnly: true } : { moduleSpecifier, importedName };
  }

  /** The ID a declaration resolves to: a node, a file (a namespace import's module), or a built-in, or nothing. */
  target(d: ts.Declaration): { id: string } | { builtin: string } | undefined {
    const sf = d.getSourceFile();
    if (sf.fileName.startsWith(LIB_DIR + path.sep)) return { builtin: this.builtinName(d) };
    if (ts.isSourceFile(d)) {
      const fid = this.fileIdOf(d);
      return fid ? { id: fid } : undefined;
    }
    const id = this.declId.get(d);
    return id ? { id } : undefined; // a declaration that is no node (a type parameter, an object literal's property): no edge (R6)
  }

  builtinName(d: ts.Declaration): string {
    const own = (d as { name?: ts.Node }).name;
    const name = own && ts.isIdentifier(own) ? own.text : "";
    const container = d.parent;
    if (container && (ts.isInterfaceDeclaration(container) || ts.isClassDeclaration(container) || ts.isModuleBlock(container))) {
      const cname = ts.isModuleBlock(container) ? (container.parent.name as ts.Identifier).text : container.name?.text;
      if (cname) return `${cname}.${name}`;
    }
    return name;
  }

  /** The "from" of a use: the innermost named declaration holding it (B5, R3, R4); the file at top level. */
  fromOf(n: ts.Node): string {
    for (let p = n.parent; p; p = p.parent) {
      if (ts.isSourceFile(p)) return this.fileIdOf(p)!;
      if (ts.isDecorator(p)) {
        // A decorator runs when the class is defined: from the class (TSP-01 C).
        let c: ts.Node = p.parent;
        while (c && !ts.isClassLike(c)) c = c.parent;
        if (c) return this.containerId(c);
      }
      if (ts.isHeritageClause(p)) return this.containerId(p.parent);
      if (ts.isFunctionDeclaration(p) || ts.isMethodDeclaration(p) || ts.isConstructorDeclaration(p) || ts.isGetAccessor(p) || ts.isSetAccessor(p) ||
          ts.isModuleDeclaration(p) || ts.isInterfaceDeclaration(p) || ts.isTypeAliasDeclaration(p) || ts.isEnumDeclaration(p)) {
        const id = this.declId.get(p);
        if (id) return id;
      }
      if (ts.isPropertyDeclaration(p) && ts.isClassLike(p.parent)) return this.containerId(p.parent); // a field initializer: the class
      if (ts.isClassLike(p)) return this.containerId(p);
      if (isTopLevelVariable(p)) return this.declId.get(p)!;
    }
    return this.fileIdOf(n.getSourceFile())!;
  }

  /** A class's node, or, for an anonymous class expression, the variable holding it (R1). */
  containerId(c: ts.Node): string {
    const id = this.declId.get(c);
    if (id) return id;
    for (let p = c.parent; p; p = p.parent) {
      if (ts.isSourceFile(p)) return this.fileIdOf(p)!;
      const pid = this.declId.get(p);
      if (pid) return pid;
    }
    return this.fileIdOf(c.getSourceFile())!;
  }

  useKind(id: ts.Node): string {
    let e: ts.Node = id;
    if (ts.isPropertyAccessExpression(e.parent) && e.parent.name === e) e = e.parent;
    const p = e.parent;
    if (ts.isExpressionWithTypeArguments(p) && ts.isHeritageClause(p.parent)) return p.parent.token === ts.SyntaxKind.ImplementsKeyword ? "implements" : "extends";
    if (isInTypePosition(id)) return "type";
    if (ts.isDecorator(p)) return "call";
    if (ts.isNewExpression(p) && p.expression === e) return "new";
    if (ts.isCallExpression(p) && p.expression === e) return "call";
    if (ts.isBinaryExpression(p) && p.left === e && p.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && p.operatorToken.kind <= ts.SyntaxKind.LastAssignment) return "write";
    if ((ts.isPrefixUnaryExpression(p) || ts.isPostfixUnaryExpression(p)) &&
        (p.operator === ts.SyntaxKind.PlusPlusToken || p.operator === ts.SyntaxKind.MinusMinusToken)) return "write";
    return "read";
  }

  /** Pass 2: every use, resolved; every import link. */
  resolve(sf: ts.SourceFile) {
    const fid = this.fileIdOf(sf)!;
    const refs: Ref[] = [];
    const links: Link[] = [];
    this.references.set(fid, refs);
    this.links.set(fid, links);
    const checker = this.p.checker;

    const record = (n: ts.Node, name: string, kind: string, sym: ts.Symbol | undefined, extra: Partial<Ref> = {}) => {
      const location = this.loc(n, sf);
      const base = `${fid}#ref@${location.start.line}:${location.start.column}`;
      const from = extra.from ?? this.fromOf(n);
      let s = sym;
      let viaImport: string | undefined;
      if (s && s.flags & ts.SymbolFlags.Alias) {
        const importDecl = s.declarations?.find((d) => ts.isImportSpecifier(d) || ts.isImportClause(d) || ts.isNamespaceImport(d));
        if (importDecl) viaImport = this.declId.get(importDecl);
        const aliased = checker.getAliasedSymbol(s);
        s = aliased && aliased.declarations?.length ? aliased : undefined;
        if (!s) {
          refs.push({ id: base, name, kind, from, to: null, location, ...extra, ...(viaImport ? { viaImport } : {}), reason: this.unresolvedImportReason(importDecl) });
          return;
        }
      }
      if (!s) {
        refs.push({ id: base, name, kind, from, to: null, location, ...extra, reason: "unresolved" });
        return;
      }
      // A name TypeScript resolves but declares nowhere is one of its intrinsics (undefined, globalThis, arguments):
      // a built-in, not an unresolved name (FND-99).
      if (!s.declarations?.length) {
        refs.push({ id: base, name, kind, from, to: null, location, ...extra, reason: "built-in", builtin: s.name });
        return;
      }
      const targets: string[] = [];
      let builtin: string | undefined;
      for (const d of s.declarations) {
        const t = this.target(d);
        if (!t) continue;
        if ("builtin" in t) builtin ??= t.builtin;
        else if (!targets.includes(t.id)) targets.push(t.id);
      }
      if (targets.length === 0) {
        if (builtin !== undefined) refs.push({ id: base, name, kind, from, to: null, location, ...extra, reason: "built-in", builtin });
        return; // resolved to something that is no node (R6, contextual properties): no edge, not listed
      }
      targets.sort();
      targets.forEach((to, i) => {
        const r: Ref = { id: targets.length > 1 ? `${base}.${i + 1}` : base, name, kind, from, to, location, ...extra };
        if (targets.length > 1) r.union = true;
        if (viaImport) r.viaImport = viaImport;
        refs.push(r);
      });
    };

    const visit = (n: ts.Node) => {
      // Imports: the link (B8); the names are declarations, not uses.
      if (ts.isImportDeclaration(n)) {
        n.importClause && this.importLinks(n, links);
        return;
      }
      // Exports are not edges (R5); an unresolved re-export is listed (B10).
      if (ts.isExportDeclaration(n)) {
        if (n.moduleSpecifier && !checker.getSymbolAtLocation(n.moduleSpecifier)) {
          const spec = (n.moduleSpecifier as ts.StringLiteral).text;
          const location = this.loc(n, sf);
          location.end = this.loc(n.getFirstToken(sf)!, sf).end;
          refs.push({ id: `${fid}#ref@${location.start.line}:${location.start.column}`, name: spec, kind: "re-export", from: fid, to: null, location,
            reason: isRelative(spec) ? "missing module" : "package" });
        }
        return;
      }
      if (ts.isExportAssignment(n)) return;
      // super(...): a call to the base class's constructor (TSP-01 C).
      if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.SuperKeyword) {
        const sig = checker.getResolvedSignature(n);
        const d = sig?.declaration;
        const s = d ? (d as { symbol?: ts.Symbol }).symbol : undefined;
        if (d && ts.isConstructorDeclaration(d)) record(n.expression, "super", "call", s);
      }
      // Destructuring reads the properties it names (TSP-01 C).
      if (ts.isBindingElement(n) && ts.isObjectBindingPattern(n.parent)) {
        const prop = n.propertyName ?? n.name;
        if (ts.isIdentifier(prop)) {
          const type = checker.getTypeAtLocation(n.parent);
          const s = type.getProperty(prop.text);
          if (s) record(prop, prop.text, "read", s, { member: true });
        }
        if (n.initializer) visit(n.initializer);
        if (!ts.isIdentifier(n.name)) visit(n.name);
        return;
      }
      if (ts.isIdentifier(n) || ts.isPrivateIdentifier(n)) {
        if (isDeclarationName(n) || isSkippedName(n)) return;
        const member = ts.isPropertyAccessExpression(n.parent) && n.parent.name === n;
        const sym = ts.isShorthandPropertyAssignment(n.parent) ? checker.getShorthandAssignmentValueSymbol(n.parent) : checker.getSymbolAtLocation(n);
        record(n, n.text, this.useKind(n), sym, member ? { member: true } : {});
        return;
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }

  importLinks(imp: ts.ImportDeclaration, links: Link[]) {
    const checker = this.p.checker;
    const clause = imp.importClause!;
    const decls: ts.Node[] = [];
    if (clause.name) decls.push(clause);
    const nb = clause.namedBindings;
    if (nb && ts.isNamespaceImport(nb)) decls.push(nb);
    if (nb && ts.isNamedImports(nb)) decls.push(...nb.elements);
    for (const d of decls) {
      const from = this.declId.get(d);
      if (!from) continue;
      const info = this.importInfo(d)!;
      const nameNode = (d as { name?: ts.Identifier }).name ?? d;
      const s = checker.getSymbolAtLocation(nameNode);
      const aliased = s ? checker.getAliasedSymbol(s) : undefined;
      let to: string | null = null;
      for (const decl of aliased?.declarations ?? []) {
        const t = this.target(decl);
        if (t && "id" in t) { to = t.id; break; }
      }
      const link: Link = { id: `${from}->${to ?? ""}`, from, to, kind: "import", moduleSpecifier: info.moduleSpecifier, importedName: info.importedName, location: this.loc(nameNode) };
      if (!to) link.reason = this.unresolvedImportReason(d);
      links.push(link);
    }
  }

  unresolvedImportReason(d: ts.Node | undefined): string {
    let imp = d;
    while (imp && !ts.isImportDeclaration(imp)) imp = imp.parent;
    const spec = imp ? ((imp as ts.ImportDeclaration).moduleSpecifier as ts.StringLiteral).text : "";
    if (!isRelative(spec)) return "package";
    return imp && this.p.checker.getSymbolAtLocation((imp as ts.ImportDeclaration).moduleSpecifier) ? "unresolved" : "missing module";
  }
}

const isRelative = (spec: string) => spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/");

/** A name that declares something (a declaration's own name), not a use. */
function isDeclarationName(n: ts.Identifier | ts.PrivateIdentifier): boolean {
  const p = n.parent;
  if (!p || (p as { name?: ts.Node }).name !== n) return ts.isBindingElement(p) && p.propertyName === n;
  return ts.isFunctionDeclaration(p) || ts.isClassDeclaration(p) || ts.isInterfaceDeclaration(p) || ts.isTypeAliasDeclaration(p) ||
    ts.isEnumDeclaration(p) || ts.isModuleDeclaration(p) || ts.isClassElement(p) || ts.isTypeElement(p) || ts.isEnumMember(p) ||
    ts.isParameter(p) || ts.isVariableDeclaration(p) || ts.isBindingElement(p) || ts.isTypeParameterDeclaration(p) ||
    ts.isImportSpecifier(p) || ts.isImportClause(p) || ts.isNamespaceImport(p) || ts.isClassExpression(p) || ts.isFunctionExpression(p) ||
    ts.isPropertyAssignment(p) || ts.isNamespaceExport(p) || ts.isExportSpecifier(p);
}

/** Names that are no use of a declaration: labels, export specifiers (R5), meta properties (`import.meta`). */
function isSkippedName(n: ts.Identifier | ts.PrivateIdentifier): boolean {
  const p = n.parent;
  // `as const` and `<const>x`: the parser reads `const` as a type name; it is a keyword, and names nothing.
  const asConst = ts.isTypeReferenceNode(p) && p.typeName === n && n.text === "const" && (ts.isAsExpression(p.parent) || ts.isTypeAssertionExpression(p.parent));
  return asConst || ts.isLabeledStatement(p) || ts.isBreakOrContinueStatement(p) || ts.isExportSpecifier(p) || ts.isMetaProperty(p);
}

/** A name used as a type: in a type reference, a `typeof` type, or type arguments outside a heritage clause. */
function isInTypePosition(n: ts.Node): boolean {
  let p = n.parent;
  while (p && ts.isQualifiedName(p)) p = p.parent;
  if (!p) return false;
  if (ts.isTypeReferenceNode(p) || ts.isTypeQueryNode(p) || ts.isImportTypeNode(p)) return true;
  if (ts.isExpressionWithTypeArguments(p)) return !ts.isHeritageClause(p.parent);
  return false;
}

// ---------------------------------------------------------------------------
// The work
// ---------------------------------------------------------------------------

type TsParams = { source_root: string; files: string[]; configs?: unknown[]; store_path?: string };

function checkFiles(p: TsParams): { root: string; files: string[] } {
  const root = path.resolve(p.source_root);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw runError("E12", `source_root ${root} is not a folder.`);
  const files = [...new Set(p.files.map(String))].sort();
  for (const id of files) {
    const abs = path.resolve(root, id);
    const rel = path.relative(root, abs);
    if (rel.startsWith("..") || path.isAbsolute(rel) || id.includes("\\")) throw runError("E12", `File ${id} lies outside source_root ${root}.`);
    if (!id.endsWith(".ts")) throw runError("E12", `This tool reads only *.ts files; ${id} is not one.`);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) throw runError("E12", `File ${id} is missing under ${root}.`);
  }
  if (p.configs && p.configs.length) throw runError("E12", "configs are not supported in ts-program 0.2.0 (TPG-D4a): run it without ts-config.");
  return { root, files };
}

function syntaxErrors(sources: ts.SourceFile[], byPath: Map<string, string>, getDiags: (sf: ts.SourceFile) => readonly ts.Diagnostic[]): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const sf of sources) {
    for (const d of getDiags(sf)) {
      const pos = d.start !== undefined ? sf.getLineAndCharacterOfPosition(d.start) : { line: 0, character: 0 };
      const at = { line: pos.line + 1, column: pos.character + 1 };
      out.push({ severity: "error", code: "E12", message: `Syntax error TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`,
        location: { file: byPath.get(sf.fileName) ?? sf.fileName, start: at, end: at } });
    }
  }
  return out;
}

function work(params: Params, log: Logger, mode: "real" | "dry-run"): WorkResult {
  const p = params as unknown as TsParams;
  const { root, files } = checkFiles(p);
  log.comment("step", `${files.length} file(s) under ${root}`);

  const prog = buildProgram(root, files, log);
  const sources = files.map((id) => prog.program.getSourceFile(path.join(root, id))!);
  const errors = syntaxErrors(sources, prog.byPath, (sf) => prog.program.getSyntacticDiagnostics(sf));
  if (errors.length) throw runError("E12", `${errors.length} syntax error(s). First, in ${errors[0].location!.file}: ${errors[0].message}`, errors[0].location, { syntaxErrors: errors });
  // The dry run stops here: parameters checked, every file parses; no checker (TPG-23).
  if (mode === "dry-run") return { outputs: [], summary: { files: files.length } };
  const typeErrorCount = sources.reduce((n, sf) => n + prog.program.getSemanticDiagnostics(sf).length, 0);

  const x = new Extractor(prog);
  for (const sf of sources) x.declare(sf);
  for (const sf of sources) x.markDefault(sf);
  for (const sf of sources) x.resolve(sf);

  const outputs: WorkResult["outputs"] = [];
  const totals = { symbols: 0, references: 0, links: 0, builtins: 0, unresolved: 0 };
  for (const [i, id] of files.entries()) {
    const sf = sources[i];
    const symbols = (x.symbols.get(id) ?? []).sort(cmpLoc);
    const references = (x.references.get(id) ?? []).sort(cmpLoc);
    const links = (x.links.get(id) ?? []).sort(cmpLoc);
    const byKind = (list: { kind: string }[]) => Object.fromEntries([...list.reduce((m, r) => m.set(r.kind, (m.get(r.kind) ?? 0) + 1), new Map<string, number>())].sort());
    const builtinCount = references.filter((r) => r.reason === "built-in").length;
    const unresolvedCount = references.filter((r) => r.to === null && r.reason !== "built-in").length + links.filter((l) => l.to === null).length;
    totals.symbols += symbols.length; totals.references += references.length; totals.links += links.length;
    totals.builtins += builtinCount; totals.unresolved += unresolvedCount;
    outputs.push({
      path: path.join("output", fileKey(id)),
      content: {
        tool: TOOL, toolVersion: VERSION, formatVersion: FORMAT_VERSION, file: id, sourceSha256: sha256(fs.readFileSync(sf.fileName)),
        dataNames: { "code.symbol": "symbols", "code.reference": "references", "code.link": "links" },
        counts: { symbolCount: symbols.length, symbolCountByKind: byKind(symbols), referenceCount: references.length, referenceCountByKind: byKind(references),
          builtinCount, unresolvedCount, linkCount: links.length, lineCount: sf.getLineAndCharacterOfPosition(sf.getEnd()).line + 1 },
        symbols, references, links,
      },
    });
  }
  log.entry("info", "extracted", totals);
  return {
    outputs,
    summary: { files: files.length, counts: totals },
    resultExtra: { program: { files: files.length, libraryFiles: prog.libRead, compilerOptions: "defaults", typeErrorCount, filesRead: prog.filesRead } },
  };
}

const SPEC: ToolSpec = {
  info: INFO as unknown as ToolSpec["info"],
  help: HELP,
  programDir: PROGRAM_DIR,
  checkShape: (p) => {
    if (!Array.isArray(p.files) || p.files.some((f) => typeof f !== "string" || f === "")) {
      throw invocationError("E13", 'Parameter "files" must be an array of file IDs.');
    }
  },
  work: ({ params, log, mode }) => work(params, log, mode),
  identity: () => ({}),
  logName: () => "program",
  hints: { E12: "Fix the file or the parameter named above, then run again." },
};

process.exitCode = runTool(SPEC, process.argv.slice(2));
