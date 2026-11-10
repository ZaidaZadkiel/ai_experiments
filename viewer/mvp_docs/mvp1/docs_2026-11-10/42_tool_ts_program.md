# 42. The `ts-program` tool (design)

The design of a new tool for MVP 2 whose purpose is explicitly **to run TypeScript** over the examined source and **extract the data the graph needs**, already processed into records the other programs can use as they are. Written on 2026-11-09 at the user's request (`FND-87`), for MVP 2's goal: a correct graph in the Viewer from real TypeScript data, correctness before consistency (`MVP_scope.md`, section 1.2).

**Status: a design; nothing built.** Items are marked **[Decided]** (by the user, dated), **[Proposed]** (this design), or **To define**. Items use the prefix `TPG`. It replaces section 3, phase 5 ("M1 on the program") of `41_typescript_program_plan.md`, and answers several of that plan's decisions differently (section 11).

## 1. Decided

- **TPG-01 [Decided]** **M1 (`file-symbols`) remains as it is,** code, tests and expected results unchanged, and is **explicitly not run by the Runner for now** (decided by the user on 2026-11-09). It can still be run by hand, and serves as the first stage's record and a point of comparison (section 10).
- **TPG-02 [Decided]** **A new tool, whose purpose is explicitly running TypeScript** to extract the data the graph needs, and to process it in a way useful for further processing (decided by the user on 2026-11-09).
- **TPG-03 [Decided]** **It keeps in line with the existing contracts, but new keys are allowed in its JSON input and output** (decided by the user on 2026-11-09): the same options, JSON parameters, `--info`, data names, record shapes, `result.json`, logs, store and dry run as every tool (`04_tools.md`, `TOOL-01` to `TOOL-09`; `02_data_contracts.md`), extended where a correct graph needs more.

- **TPG-04 [Decided]** **The Runner runs a hardcoded list of tools, checked against the folders that exist** (decided by the user on 2026-11-09; answers `TPG-D1`; `03_runner.md`, `RUN-33`). M1 is not in it.
- **TPG-05 [Decided]** **`ts-program` runs TypeScript inside its own invocation and transforms what it can into the Viewer's format** (decided by the user on 2026-11-09; answers `TPG-D2`): its outputs are records the Viewer reads directly (`represents`, `fields` roles, `containedIn`), as far as the compiler's data allows.
- **TPG-06 Open** **Is `ts-program`'s output enough, or does it need more processing after TypeScript?** (raised by the user on 2026-11-09). That is, whether the Viewer can build a correct graph from `ts-program`'s records alone, or whether further tools are needed between them: links in M2's role, scopes in M3's (section 7), or others not yet named. To be answered by building `ts-program` and looking at the graph it gives; the list of tools to run (`TPG-04`) follows from the answer. ~~Suggested start: the list holds `ts-program` alone, and a tool is added only where the graph shows something missing or wrong.~~ **The approach decided** (by the user on 2026-11-09, `FND-94`): **MVP 2 runs `ts-program` alone** (`RUN-33`), and the graph TypeScript's data gives in the Viewer is judged against the definition of a correct graph (`41_typescript_program_plan.md`, section 1.1) and the expected graph of `test-source-mvp2`. Where it falls short, the shortfall is recorded, and only then is a tool (links, scopes, other) or a change to `ts-program` or the Viewer considered. The question itself stays open until that is seen.
  - **Known before building:** the page draws a frame only for a node with an `owner`, which only M3's scopes have (`UI-37`, `BE-109`); with `ts-program` alone, the levels follow TypeScript's own nesting (file › namespace › class › member) and **no frames appear**. Whether that reads correctly is part of what the run shows.

## 2. What it is

- **TPG-10 [Proposed]** Name **`ts-program`**, in `app/tools/ts-program/`, on the tool helper (`TOOL-45`), like M2 and M3. Its dependency is the `typescript` package (pinned, as M1's), used as the compiler: parser, binder and type checker.
- **TPG-11 [Proposed]** **One job:** build TypeScript's program from the examined source, ask its checker what every declaration and every use is, and write that as records. It does no graph work (no levels, no lifting), no scope grouping beyond what TypeScript states (declarations inside declarations), and no presentation.
- **TPG-12 [Proposed]** **Invocation: once per run, over the whole program** (`invocation: "once"`), writing **one output file per source file**, so the per-file shape of the data the other programs read stays as it is. This needs the exception discussed in section 8.

## 3. Its input

The JSON parameters, in line with `DATA-09`, with new keys marked *new*:

| Key | Required | Meaning |
|---|---|---|
| `source_root` | yes | the root of the examined source; every path is resolved against it and must lie inside it (`DATA-09`) |
| `files` *(new)* | yes | the file IDs of the program: every listed file matching the tool's patterns, from the Runner (data name `files.file.id`, given as a list to a once tool). The program holds these and nothing else from the source |
| ~~`compiler_options` *(new)*~~ | ~~no~~ | ~~TypeScript's compiler options as an object (`target`, `module`, `strict`, `jsx`…), as `tsconfig.json`'s `compilerOptions` say. Absent: TypeScript's defaults for a modern ES module project, noted in `result.json`. Where they come from is `TPG-D4`~~ *(replaced by `configs`, `TPG-D4`)* |
| `configs` *(new)* | no | every `tsconfig*.json` of the source **as written**, one record each, from `ts-config` (data name `ts.config`, given as a list); `ts-program` merges them itself with TypeScript's API (section 3.1). Absent or empty: TypeScript's defaults, noted in `result.json` |
| `store_path` | no | the tool's store (`TOOL-43`) |

- **TPG-13 [Proposed]** Unknown keys are ignored, as for every tool (`TOOL-08`).

### 3.1 Compiler options: `ts-config`, then TypeScript's own merging (`TPG-D4`)

**Decided by the user on 2026-11-09** (suggestions accepted, `FND-95`). Reading a configuration correctly can take more than one file, since a config can `extend` another; so the reading and the merging are split, and **TypeScript itself does the merging**, which keeps it correct and keeps one file per invocation and one file type per tool.
1. **The Runner lists the files** (`RUN-34`); every `tsconfig*.json` is listed like any other.
2. **`ts-config` runs once per config file, reading only that file** (one file type: TypeScript project configuration). It parses it as TypeScript does (`ts.parseConfigFileTextToJson`: comments and trailing commas allowed) and outputs one `ts.config` record per config, **as written, not merged**: `compilerOptions`, `include`, `exclude`, `files`, `references`, and `extends` (a listed file's ID when it points to one; the name, with reason `package`, when it points to a package).
3. **`ts-program` builds the effective configuration, reading no config file itself:** it calls `ts.parseJsonConfigFileContent` with a **virtual host** that serves the other configs from the `ts.config` records and answers which files exist from the Runner's file list, never the disk. TypeScript applies its own rules: `extends` chains (arrays included), which keys merge and which replace, paths relative to the config that set them, `include` and `exclude`, `${configDir}`.
4. **The result:** the effective compiler options, and **the program's files**: the listed `.ts` files the configuration's `include`, `exclude` and `files` select. A listed `.ts` file outside them is not analyzed, and is reported as not read, with that reason.
5. **Change detection:** `ts-config` reruns when a config's hash changes; `ts-program`'s fingerprint includes the `ts.config` records, so editing a config refreshes the graph.

**To start with, without `ts-config`** (decided by the user on 2026-11-09, `TPG-D4a`): MVP 2's first runs have `ts-program` alone (`RUN-33`), with no `configs` given, so TypeScript's defaults apply and each run's `result.json` says so; `ts-config` is built and joins the run list later. A source whose `tsconfig.json` changes resolution (`paths`, `lib`…) gives a graph that may be wrong until then; `test-source-mvp2` has no `tsconfig.json`, so its graph is unaffected.

**The cases, decided:**
- **Which configuration applies: the `tsconfig.json` at the source root.** None there: TypeScript's defaults, noted in `result.json` (`test-source-mvp2` has none). Several configurations (one per package) and project `references` are reported and not followed in MVP 2.
- **An `extends` to a package** (its base in `node_modules`, which the Runner skips, `RUN-34b`): the local options over TypeScript's defaults, and the run **reports clearly that the base was not read**, naming it, since a missing base can change `paths` or `lib` and so the graph.
- **A malformed configuration: a no-go for the whole run,** naming the file and the line: wrong options give a wrong graph (correctness first, `MVP_scope.md`, section 1.2).
- **Not done:** `ts-program` reading `tsconfig.json` itself (simpler, but two file types in one tool, and `extends` means reading several files).

**The options that matter for a correct graph** (most only affect type checking or output): `paths`, `baseUrl`, `rootDirs`, `moduleResolution`, `module` (which file an import reaches); `esModuleInterop`, `allowSyntheticDefaultImports` (what a default import resolves to); `lib`, `target` (which built-ins exist, `TPG-D5`); `jsx` (whether `.tsx` parses, out of MVP 2); `experimentalDecorators` (how decorators parse); `include`, `exclude`, `files` (which files are in the program).

## 4. How it runs

- **TPG-20 [Proposed]** **Build the program** from `files` and `compiler_options`, through a compiler host that shows TypeScript **only those files and its own library** (the strict host of `FND-83`): no probing of other paths, no `node_modules`, no `@types`. Imports of packages stay unresolved, each with a reason.
- **TPG-21 [Proposed]** **Syntax errors** in any file make the run fail (`E12`, naming each file and position): a file TypeScript can't parse gives a wrong graph. **Type errors are not the tool's concern**: they don't stop the run; their count goes in `result.json`, and a name TypeScript can't resolve is an unresolved reference, as below.
- **TPG-22 [Proposed]** **Walk every file's declarations and uses** and resolve each through the checker (`getSymbolAtLocation`), following import aliases to the declaration they name (section 5).
- **TPG-23 [Proposed]** **Its dry run** checks the parameters, that every file exists inside `source_root` and parses; it builds no checker. Go or no-go as every tool (`TOOL-06`, `TOOL-09`).
- **TPG-24 [Proposed]** **Its log** lists every file the compiler opened, by kind (source file, library), so a check can prove it read nothing else (`TSP-04`).
- **TPG-25 [Proposed]** **Deterministic:** the same files and options give byte-identical outputs, whatever the order of `files` (`FND-58`): records sorted by ID, keys in a fixed order, no times in outputs.

## 5. Its output

One file per source file, `output/<file-key>.json`, with the header every output has (`tool`, `toolVersion`, `formatVersion`, `file`, `sourceSha256`, `dataNames`, `counts`), and three data names. Existing keys keep their meaning (`DATA-19`); new keys are marked *new*.

### 5.1 `code.symbol` (nodes): every declaration

| Key | Meaning |
|---|---|
| `id` | the stable ID, `<file ID>#<name>@<line>:<column>` of the declaring name (`DATA-02`), for merged declarations the first one's (`TPG-D6`) |
| `name`, `kind` | the name; the kind, now from the compiler: `function`, `variable`, `parameter`, `import`, and *new values* `class`, `method`, `constructor`, `property`, `accessor`, `enum`, `enumMember`, `namespace`, and, if types are in (`TPG-D3`), `interface`, `typeAlias` |
| `parent` | **the declaring symbol** (a method's class, a function's namespace, an enum member's enum), or the file for a top-level declaration. *New meaning in practice*: until now always the file |
| `location`, `range` | as `DATA-04` and `FND-09` |
| `exported` | as now |
| `import` | for an import, `{ moduleSpecifier, importedName }` as now, `importedName` `"default"` or `"*"` included, `typeOnly` as now |
| `modifiers` *(new)* | `static`, `abstract`, `readonly`, `private`, `protected`, `public`, `async`, `declare`, `const` (a `const enum`), where present; *0.2.0* (`FND-110`) also `override` and `accessor`, which 0.1.0 dropped. Never `export` (the `exported` key) or `default` (`defaultExport`) |
| `declarations` *(new)* | for a symbol with several declarations (overloads, a getter and setter, merged namespaces): each one's ~~`location` and `range`~~ name's `location` (as built: no range; only the first declaration's is in `range`, `FND-106`), the first being the ID's |
| `declaredWith` *(0.2.0, `FND-110`)* | for a variable: `const`, `let`, `var`, `using` or `await using`, from its declaration list (a destructured name's too); absent for a catch clause's variable |
| `defaultExport` *(0.2.0, `FND-110`)* | `true` on the declaration the file's `default` export names (`export default class …`, or `export default Circle` through the alias), when it is in that file |
| `heritage` *(new)* | for a class: the IDs of what it `extends` (and `implements`, if types are in), resolved; `null` where unresolved, with the name |

### 5.2 `code.reference` (relations): every use, resolved

| Key | Meaning |
|---|---|
| `id` | `<file ID>#ref@<line>:<column>`, as now |
| `name`, `kind` | as now: `read`, `write`, `call`, `declaration`; *new value* `new` (a `new X()`), and `type` for a use in a type position if types are in |
| `from` ~~, `enclosing`~~ | the innermost **function-like declaration** holding the use: function, method, constructor, accessor, or a class for a field initializer; the file at top level. ~~Same value as now in both keys (`FND-60`, item 6, to settle)~~ **`from` only** (`TPG-D7`, decided 2026-11-09): no `enclosing` |
| `to` ~~, `symbol`~~ | **the declaration's ID, across files**: imports followed to what they name. `null` when TypeScript can't resolve it. **`to` only** (`TPG-D7`): no `symbol` |
| `member` *(new)* | `true` for a member access (`c.area()`, `this.radius`, `Color.Red`) |
| `viaImport` *(new)* | for a use of an imported name, the ID of the import symbol it goes through, so the Viewer can show the import as well as the target |
| `reason` *(new for references)* | when `to` is `null`: `built-in` (a declaration in TypeScript's library), `package` (an import from a package, not in the program), `unresolved` (TypeScript found nothing) |
| `builtin` *(new)* | with `reason: "built-in"`: the library name, such as `Map`, `console.log` |
| `location` | as now |

### 5.3 `code.link` (relations): imports, as M2 gave them

- **TPG-30 [Proposed]** One link per import symbol, from the import to the declaration it names, **in M2's shape** (`DATA-06`: `id`, `from`, `to`, `kind: "import"`, `moduleSpecifier`, `importedName`, `reason` when unresolved), resolved by TypeScript instead of by name: default and namespace imports and re-exports included. Whether `ts-program` produces these, or M2 keeps producing them from `ts-program`'s symbols, is `TPG-D2`.

### 5.3a What the definition of a correct graph adds (to fold into 5.1 to 5.3)

Since 2026-11-09, `ts-program`'s output must give everything `41_typescript_program_plan.md`, section 1.1, names, which this section did not yet have:
- **Edge kinds:** `extends` and `implements` (a class to the class or interface it names), `type` (a use in a type position); a call edge for `super(…)` to the base constructor, and from a class to a decorator it applies.
- **A union marker** on a reference resolved to several declarations (one reference record per declaration, each marked).
- **A parameter property** as one `property` symbol of the class, marked as declared in the constructor.
- **Anonymous functions** are not symbols; their parameters and the uses inside them belong to the nearest named declaration, and a variable whose value is a function counts as one.
- **Read edges from destructuring** to the properties read (`const { x } = by`).
- **The namespace import** links to the file; **export aliases** (`export { total as sumAreas }`) are not symbols.
- **What is left out**, as the definition's part F.

### 5.4 What is not output

- **TPG-31 [Proposed]** No scopes: grouping into scopes stays M3's, from `parent` (section 7). No diagnostics in outputs: they go in `result.json` (`DATA-14`). No types of expressions, beyond what resolution needs.

## 6. Its `--info`

In line with `DATA-08`, new keys marked:

```json
{
  "tool": "ts-program",
  "toolVersion": "0.1.0",
  "invocation": "once",
  "readsFiles": { "filePatterns": ["*.ts"], "scope": "program" },
  "parameters": [
    { "name": "source_root", "dataName": "project.source_root", "required": true, "affectsOutput": true },
    { "name": "files", "dataName": "files.file.id", "list": true, "required": true, "affectsOutput": true },
    { "name": "configs", "dataName": "ts.config", "list": true, "required": false, "affectsOutput": true },
    { "name": "store_path", "dataName": "zaansouvi.store_path", "required": false, "affectsOutput": false }
  ],
  "outputs": [
    { "dataName": "code.symbol", "represents": "nodes", "containedIn": ["files.file", "code.symbol"], "outputFilePattern": "output/<file-key>.json", "perFile": true, "jsonKey": "symbols" },
    { "dataName": "code.reference", "represents": "relations", "outputFilePattern": "output/<file-key>.json", "perFile": true, "jsonKey": "references" },
    { "dataName": "code.link", "represents": "relations", "outputFilePattern": "output/<file-key>.json", "perFile": true, "jsonKey": "links" }
  ]
}
```

New keys: `readsFiles.scope: "program"` (section 8); `list: true` on a parameter (the Runner gives every value, not one per invocation); `perFile: true` on an output of a once tool (one file per source file, `<file-key>` filled per file); `containedIn` as a list (a symbol inside a file or inside a symbol). The `fields` roles are as M1's (`FND-01`), plus `memberField`, `reasonField`.

## 7. What the other programs need

| Program | Change |
|---|---|
| **Runner** | ~~**omit M1** (`TPG-01`): an explicit list of omitted tools in its configuration, as `runner.md` decides tools can be omitted (section 2), until now not built; it reports omitted tools in its events,~~ **a hardcoded list of tools to run** (`TPG-04`, `RUN-33`), checked against the folders, M1 not in it; it reports tool folders not listed, and still refuses two producers of one data name among the tools it runs. **A once tool reading the program:** give it `files` as a list and its options; read its per-file outputs (`outputPath` fills `<file-key>` only for per-file tools today); rerun it when any of its files or options changed (`TSP-D11`). Its dry run |
| **Tool helper** | a once tool writing one output file per source file, each atomic, `outputChange` per file |
| **M2** | ~~per `TPG-D2`: not run (omitted like M1), or kept consuming `ts-program`'s symbols~~ not in the list to start with, since `ts-program` gives the links (`TPG-05`); added back only if `TPG-06` finds a need |
| **M3** | **not run in MVP 2 for now** (`TPG-06`, `RUN-33`, decided 2026-11-09); per `TPG-06`: in the list only if `ts-program`'s `parent` nesting isn't enough for the Viewer's levels; if needed, nested scopes from `parent`: a scope for every symbol that holds declarations (function, method, constructor, accessor, class, namespace), each scope inside its parent's scope (option D of `MVP-4`) |
| **Viewer** | levels at any depth; shapes for the new kinds; `member`, `viaImport` and built-ins in Details and Problems; built-ins out of the unresolved count. Keys it doesn't read add to "extra data" (`FND-69`, item 2, now more pressing) |

## 8. The decisions it needs from the working files

Under correctness first, decisions that stand in its way are reopened where they live (`MVP_scope.md`, section 1.2):
- **A tool reads only one file per invocation** (`toolset.md`, section 4.2, [Decided]): `ts-program` reads the whole program, which a correct graph needs, since what a name means can depend on another file. Reopened as `TS-37` in `toolset.md`.
- **One file type for one tool** (`toolset.md`, section 4.2, [Decided]): kept; `ts-program` reads only `*.ts` (`.d.ts` included). `tsconfig.json` is read elsewhere (`TPG-D4`).
- **For a tool that reads files, plan one invocation per file** (`data_topology.md`, section 6, [Decided]): the same exception.

## 9. Checks

- **TPG-40 [Proposed]** Exact match with expected results written by hand first, on the test source of MVP 2 (`97_second_implementation.md`, section 3.3), across files.
- **TPG-41 [Proposed]** The read log shows only the listed files and TypeScript's library (`TSP-04`).
- **TPG-42 [Proposed]** Determinism: two runs, and a run with `files` reversed, give byte-identical outputs.
- **TPG-43 [Proposed]** Broken inputs: a syntax error in one file (no-go, naming it); a file outside `source_root`; an empty `files`; ~~malformed `compiler_options`~~ a malformed configuration (no-go), an `extends` to a package (reported), several configurations (only the root one used, the others reported).

## 10. M1 beside it

- **TPG-50 [Proposed]** M1's tests keep passing as they are. A comparison check runs M1 by hand and `ts-program` on the first stage's test source and lists every difference in symbols and references: evidence of what the first stage got wrong, for the findings note.

## 11. Decisions to take

| ID | Decision | Suggested answer |
|---|---|---|
| `TPG-D1` | **How M1 is omitted** | **Decided** (2026-11-09): a hardcoded list of tools to run in the Runner, checked against the folders (`TPG-04`, `RUN-33`). ~~an omit list in the Runner's configuration (`runner.md`, section 2), naming `file-symbols`; the Runner reports it as omitted in every run~~ |
| `TPG-D2` | **Links: `ts-program` or M2** | **Decided** (2026-11-09): `ts-program` transforms what it can into the Viewer's format, links included (`TPG-05`); whether more processing is needed after it is open (`TPG-06`). ~~`ts-program` produces `code.link`, resolved by TypeScript, and M2 is omitted like M1: name matching is less correct than the compiler's resolution (correctness first). Against: P4's early evidence, since one tool takes over another's job~~ |
| `TPG-D3` | **Types in the graph** | **Decided** (2026-11-09, by the definition of a correct graph, `41_typescript_program_plan.md`, section 1.1): interfaces and type aliases are symbols; uses in type positions are references of kind `type`, which the Viewer can hide. ~~interfaces and type aliases as symbols, uses in type positions as references of kind `type`, so `implements` and `extends` of interfaces are edges; the Viewer can hide them. A correct graph of TypeScript includes its types; leaving them out loses what a class implements~~ |
| `TPG-D4` | **Where `compiler_options` come from** | **Decided** (2026-11-09): section 3.1, `ts-config` reading each config as written, `ts-program` merging them with TypeScript's API; the root `tsconfig.json`; a package `extends` reported; a malformed config a no-go. ~~a small `ts-config` tool reads `tsconfig.json` (one file type) and outputs them as `ts.compiler_options` (`TSP-D5`); until it exists, the Runner provides none and TypeScript's defaults apply, noted~~ |
| `TPG-D5` | **Built-ins** | **Decided** (2026-11-09, as suggested): `to: null`, `reason: "built-in"`, `builtin` the name (section 5.2); listed apart in Problems, not counted as unresolved; built-in nodes later if wanted |
| `TPG-D6` | **IDs of merged declarations** | **Decided** (2026-11-09, as suggested): the first declaration's position in source order (the three signatures of `total`: line 44; the `label` pair: the getter's); the others listed in `declarations`. Stability of IDs across edits stays a separate question |
| `TPG-D7` | **`from` and `enclosing` duplicates** (`FND-60`, item 6) | **Decided** (2026-11-09): **`ts-program` writes `from` and `to` only**, no `enclosing` or `symbol`: they were kept for consistency with M1, which no longer runs, and two names for one meaning breaks `DATA-19`; the Viewer finds them through `fromField` and `toField`. ~~keep both for now, same value, to change once for every tool~~ |

## 12a. As built (0.1.0, 2026-11-09)

Built in `app/tools/ts-program/` (`FND-98`); checked by `tests/ts-program/check.mjs` against `expected-mvp2/` (exact match), with byte-identical outputs whatever the order of `files`, and a read log showing only the listed `.ts` files and TypeScript's library. Settled while building:
- **With no configuration** (`TPG-D4a`), the options are those `tsc --init` writes in TypeScript 5.6 (target ES2016, CommonJS modules, strict), with no `@types`: TypeScript's bare defaults (target ES5) declare neither `Map` nor `Promise`, so a modern source would have read wrong. `result.json` says `compilerOptions: "defaults"`.
- **A built-in's name** is the name of the library type that declares it: `Console.log`, `ReadonlyArray.reduce`, `Math.PI` (the expected graph corrected to match: `console.log` and `Array.reduce` were mine, not TypeScript's).
- **`as const`:** the parser reads `const` as a type name; it is skipped, not reported as unresolved.
- **Imports contain nothing:** the named imports inside a default import's clause belong to the file.
- **Its dry run** builds the program through the same host and checks syntax only; no checker.
- **`configs`** is refused in 0.1.0 (`E12`), since `ts-config` doesn't exist yet.
- Type errors are counted in `result.json` (2 on `test-source-mvp2`: the missing `./extra` and the decorator's signature), never a stop.

## 12. Its place in the plan

`41_typescript_program_plan.md` phase 5 becomes "build `ts-program`"; phase 4 (the tool helper and the Runner) adds the omit list; `TSP-D2` (how M1 runs), `TSP-D6` (M2's fate) and `TSP-D9` (member uses) are answered here by `TPG-12`, `TPG-D2` and section 5.2.
