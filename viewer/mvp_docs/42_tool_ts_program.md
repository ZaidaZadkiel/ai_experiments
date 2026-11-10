# 42. The `ts-program` tool (design)

The design of the tool for MVP 2 whose purpose is explicitly **to run TypeScript** over the examined source and **extract the data the graph needs**, already processed into records the other programs can use as they are, for MVP 2's goal: a correct graph in the Viewer from real TypeScript data, correctness before consistency (`MVP_scope.md`, section 1.2).

**Status: a design, built as `ts-program` 0.2.0 in `app/tools/ts-program/`** (`FND-98`, `FND-110`). Items are marked **[Decided]**, **[Proposed]**, or **To define**. Items use the prefix `TPG`. It takes the place of phase 5 of `41_typescript_program_plan.md` and answers several of that plan's decisions (section 12).

## 1. Decided

- **TPG-01 [Decided]** **M1 (`file-symbols`) remains as it is,** code, tests and expected results unchanged, and is **explicitly not run by the Runner for now**. It can still be run by hand, and serves as the first stage's record and a point of comparison (section 10).
- **TPG-02 [Decided]** **A new tool, `ts-program`, whose purpose is explicitly running TypeScript** to extract the data the graph needs, and to process it in a way useful for further processing.
- **TPG-03 [Decided]** **It keeps in line with the existing contracts, but new keys are allowed in its JSON input and output:** the same options, JSON parameters, `--info`, data names, record shapes, `result.json`, logs, store and dry run as every tool (`04_tools.md`, `TOOL-01` to `TOOL-09`; `02_data_contracts.md`), extended where a correct graph needs more.

- **TPG-04 [Decided]** **The Runner runs a hardcoded list of tools, checked against the folders that exist** (`TPG-D1`; `03_runner.md`, `RUN-33`). M1 is not in it.
- **TPG-05 [Decided]** **`ts-program` runs TypeScript inside its own invocation and transforms what it can into the Viewer's format** (`TPG-D2`): its outputs are records the Viewer reads directly (`represents`, `fields` roles, `containedIn`), as far as the compiler's data allows.
- **TPG-06 Closed** **`ts-program`'s output is enough:** the Viewer builds a correct graph from `ts-program`'s records alone, with no further tool between them (links in M2's role, scopes in M3's, or others). **MVP 2 runs `ts-program` alone** (`RUN-33`), and the graph TypeScript's data gives in the Viewer is judged against the definition of a correct graph (`41_typescript_program_plan.md`, section 1.1) and the expected graph of `test-source-mvp2`. The one gap, frames, is closed by drawing a frame for any entered container (`TSP-D8`, `UI-37`; `FND-99`). Where the graph falls short, the shortfall is recorded, and only then is a tool (links, scopes, other) or a change to `ts-program` or the Viewer considered.

## 2. What it is

- **TPG-10 [Decided]** Name **`ts-program`**, in `app/tools/ts-program/`, on the tool helper (`TOOL-45`), like M2 and M3. Its dependency is the `typescript` package (pinned, as M1's), used as the compiler: parser, binder and type checker.
- **TPG-11 [Decided]** **One job:** build TypeScript's program from the examined source, ask its checker what every declaration and every use is, and write that as records. It does no graph work (no levels, no lifting), no scope grouping beyond what TypeScript states (declarations inside declarations), and no presentation.
- **TPG-12 [Decided]** **Invocation: once per run, over the whole program** (`invocation: "once"`), writing **one output file per source file**, so the per-file shape of the data the other programs read stays as it is. This uses the exception for program tools discussed in section 8 (`toolset.md`, section 4.2, `TS-37`).

## 3. Its input

The JSON parameters, in line with `DATA-09`, with new keys marked *new*:

| Key | Required | Meaning |
|---|---|---|
| `source_root` | yes | the root of the examined source; every path is resolved against it and must lie inside it (`DATA-09`) |
| `files` *(new)* | yes | the file IDs of the program: every listed file matching the tool's patterns, from the Runner (data name `files.file.id`, given as a list to a once tool). The program holds these and nothing else from the source |
| `configs` *(new)* | no | every `tsconfig*.json` of the source **as written**, one record each, from `ts-config` (data name `ts.config`, given as a list); `ts-program` merges them itself with TypeScript's API (section 3.1). Absent or empty: the options `tsc --init` writes (section 3.1), noted in `result.json`. Refused (`E12`) until `ts-config` exists (`TPG-D4a`) |
| `store_path` | no | the tool's store (`TOOL-43`) |

- **TPG-13 [Decided]** Unknown keys are ignored, as for every tool (`TOOL-08`).

### 3.1 Compiler options: `ts-config`, then TypeScript's own merging (`TPG-D4`)

**[Decided]** (`TPG-D4`). Reading a configuration correctly can take more than one file, since a config can `extend` another; so the reading and the merging are split, and **TypeScript itself does the merging**, which keeps it correct and keeps one file per invocation and one file type per tool.
1. **The Runner lists the files** (`RUN-34`); every `tsconfig*.json` is listed like any other.
2. **`ts-config` runs once per config file, reading only that file** (one file type: TypeScript project configuration). It parses it as TypeScript does (`ts.parseConfigFileTextToJson`: comments and trailing commas allowed) and outputs one `ts.config` record per config, **as written, not merged**: `compilerOptions`, `include`, `exclude`, `files`, `references`, and `extends` (a listed file's ID when it points to one; the name, with reason `package`, when it points to a package).
3. **`ts-program` builds the effective configuration, reading no config file itself:** it calls `ts.parseJsonConfigFileContent` with a **virtual host** that serves the other configs from the `ts.config` records and answers which files exist from the Runner's file list, never the disk. TypeScript applies its own rules: `extends` chains (arrays included), which keys merge and which replace, paths relative to the config that set them, `include` and `exclude`, `${configDir}`.
4. **The result:** the effective compiler options, and **the program's files**: the listed `.ts` files the configuration's `include`, `exclude` and `files` select. A listed `.ts` file outside them is not analyzed, and is reported as not read, with that reason.
5. **Change detection:** `ts-config` reruns when a config's hash changes; `ts-program`'s fingerprint includes the `ts.config` records, so editing a config refreshes the graph.

**Without `ts-config` for now** (`TPG-D4a`): MVP 2 runs `ts-program` alone (`RUN-33`), with no `configs` given; `ts-config` is built and joins the run list later. The options are then those `tsc --init` writes in TypeScript 5.6 (target ES2016, CommonJS modules, strict), with no `@types`: TypeScript's bare defaults (target ES5) declare neither `Map` nor `Promise`, so a modern source would read wrong. Each run's `result.json` says `compilerOptions: "defaults"`. A source whose `tsconfig.json` changes resolution (`paths`, `lib`…) gives a graph that may be wrong until `ts-config` runs; `test-source-mvp2` has no `tsconfig.json`, so its graph is unaffected.

**The cases:**
- **Which configuration applies: the `tsconfig.json` at the source root.** None there: the defaults above, noted in `result.json` (`test-source-mvp2` has none). Several configurations (one per package) and project `references` are reported and not followed in MVP 2.
- **An `extends` to a package** (its base in `node_modules`, which the Runner skips, `RUN-34b`): the local options over TypeScript's defaults, and the run **reports clearly that the base was not read**, naming it, since a missing base can change `paths` or `lib` and so the graph.
- **A malformed configuration: a no-go for the whole run,** naming the file and the line: wrong options give a wrong graph (correctness first, `MVP_scope.md`, section 1.2).
- **Not done:** `ts-program` reading `tsconfig.json` itself (simpler, but two file types in one tool, and `extends` means reading several files).

**The options that matter for a correct graph** (most only affect type checking or output): `paths`, `baseUrl`, `rootDirs`, `moduleResolution`, `module` (which file an import reaches); `esModuleInterop`, `allowSyntheticDefaultImports` (what a default import resolves to); `lib`, `target` (which built-ins exist, `TPG-D5`); `jsx` (whether `.tsx` parses, out of MVP 2); `experimentalDecorators` (how decorators parse); `include`, `exclude`, `files` (which files are in the program).

## 4. How it runs

- **TPG-20 [Decided]** **Build the program** from `files` and the compiler options (section 3.1), through a compiler host that shows TypeScript **only those files and its own library** (the strict host of `FND-83`): no probing of other paths, no `node_modules`, no `@types`. Imports of packages stay unresolved, each with a reason.
- **TPG-21 [Decided]** **Syntax errors** in any file make the run fail (`E12`, naming each file and position): a file TypeScript can't parse gives a wrong graph. **Type errors are not the tool's concern**: they don't stop the run; their count goes in `result.json`, and a name TypeScript can't resolve is an unresolved reference, as below.
  - On `test-source-mvp2`, `result.json` counts 2 type errors: the missing `./extra` and the decorator's signature.
- **TPG-22 [Decided]** **Walk every file's declarations and uses** and resolve each through the checker (`getSymbolAtLocation`), following import aliases to the declaration they name (section 5).
- **TPG-23 [Decided]** **Its dry run** checks the parameters, that every file exists inside `source_root` and parses; it builds the program through the same host and checks syntax only, with no checker. Go or no-go as every tool (`TOOL-06`, `TOOL-09`).
- **TPG-24 [Decided]** **Its log** lists every file the compiler opened, by kind (source file, library), so a check can prove it read nothing else (`TSP-04`).
- **TPG-25 [Decided]** **Deterministic:** the same files and options give byte-identical outputs, whatever the order of `files` (`FND-58`): records sorted by ID, keys in a fixed order, no times in outputs.

## 5. Its output

One file per source file, `output/<file-key>.json`, with the header every output has (`tool`, `toolVersion`, `formatVersion`, `file`, `sourceSha256`, `dataNames`, `counts`), and three data names. Existing keys keep their meaning (`DATA-19`); new keys are marked *new*. The records are in the MVP 2 schema (`DATA-24`) and its 0.2.0 addition (`proposed_schema/26-11-09 235850 …`).

### 5.1 `code.symbol` (nodes): every declaration

| Key | Meaning |
|---|---|
| `id` | the stable ID, `<file ID>#<name>@<line>:<column>` of the declaring name (`DATA-02`), for merged declarations the first one's (`TPG-D6`) |
| `name`, `kind` | the name; the kind, from the compiler: `function`, `variable`, `parameter`, `import`, and *new values* `class`, `method`, `constructor`, `property`, `accessor`, `enum`, `enumMember`, `namespace`, `interface`, `typeAlias` (`TPG-D3`) |
| `parent` | **the declaring symbol** (a method's class, a function's namespace, an enum member's enum), or the file for a top-level declaration. Imports contain nothing: the named imports inside a default import's clause belong to the file |
| `location`, `range` | as `DATA-04` and `FND-09` |
| `exported` | as M1's |
| `import` | for an import, `{ moduleSpecifier, importedName }` as M1's, `importedName` `"default"` or `"*"` included, `typeOnly` as M1's |
| `modifiers` *(new)* | `static`, `abstract`, `readonly`, `private`, `protected`, `public`, `async`, `declare`, `const` (a `const enum`), `override`, `accessor`, where present. Never `export` (the `exported` key) or `default` (`defaultExport`) |
| `declarations` *(new)* | for a symbol with several declarations (overloads, a getter and setter, merged namespaces): each one's name's `location`, the first being the ID's. No range: only the first declaration's is in `range` (`FND-106`) |
| `declaredWith` *(new)* | for a variable: `const`, `let`, `var`, `using` or `await using`, from its declaration list (a destructured name's too); absent for a catch clause's variable |
| `defaultExport` *(new)* | `true` on the declaration the file's `default` export names (`export default class …`, or `export default Circle` through the alias), when it is in that file |
| `heritage` *(new)* | for a class: the IDs of what it `extends` and `implements`, resolved; `null` where unresolved, with the name |

### 5.2 `code.reference` (relations): every use, resolved

| Key | Meaning |
|---|---|
| `id` | `<file ID>#ref@<line>:<column>`, as M1's |
| `name`, `kind` | the name; the kind: `read`, `write`, `call`, and *new values* `new` (a `new X()`), `type` (a use in a type position, `TPG-D3`), `extends` and `implements` (section 5.3a). A declaration itself is not a reference (`TSP-01`, point 9) |
| `from` | the innermost named declaration holding the use (`TSP-01`, point 5): function, method, constructor, accessor, a class for a field initializer, a top-level variable for the uses in its own declaration, a namespace for a use at its top level; the file at top level. **`from` only** (`TPG-D7`): no `enclosing` |
| `to` | **the declaration's ID, across files**: imports followed to what they name. `null` when TypeScript can't resolve it. **`to` only** (`TPG-D7`): no `symbol` |
| `member` *(new)* | `true` for a member access (`c.area()`, `this.radius`, `Color.Red`) |
| `viaImport` *(new)* | for a use of an imported name, the ID of the import symbol it goes through, so the Viewer can show the import as well as the target |
| `reason` *(new for references)* | when `to` is `null`: `built-in` (a declaration in TypeScript's library), `package` (an import from a package, not in the program), `unresolved` (TypeScript found nothing) |
| `builtin` *(new)* | with `reason: "built-in"`: the name of the library type that declares it, such as `Map`, `Console.log`, `ReadonlyArray.reduce`, `Math.PI` |
| `location` | as M1's |

### 5.3 `code.link` (relations): imports, as M2 gave them

- **TPG-30 [Decided]** One link per import symbol, from the import to the declaration it names, **in M2's shape** (`DATA-06`: `id`, `from`, `to`, `kind: "import"`, `moduleSpecifier`, `importedName`, `reason` when unresolved), resolved by TypeScript instead of by name: default and namespace imports and re-exports included. `ts-program` produces these links itself (`TPG-D2`).

### 5.3a What the definition of a correct graph adds

`ts-program`'s output also gives everything `41_typescript_program_plan.md`, section 1.1, names beyond sections 5.1 to 5.3:
- **Edge kinds:** `extends` and `implements` (a class to the class or interface it names), `type` (a use in a type position); a call edge for `super(…)` to the base constructor, and from a class to a decorator it applies.
- **A union marker** on a reference resolved to several declarations (one reference record per declaration, each marked).
- **A parameter property** as one `property` symbol of the class, marked as declared in the constructor.
- **Anonymous functions** are not symbols; their parameters and the uses inside them belong to the nearest named declaration. A top-level variable, in a file or a namespace, is the "from" of the uses in its own declaration (`TSP-01`, point 5).
- **Read edges from destructuring** to the properties read (`const { x } = by`).
- **The namespace import** links to the file; **export aliases** (`export { total as sumAreas }`) are not symbols.
- **What is left out**, as the definition's part F.

### 5.4 What is not output

- **TPG-31 [Decided]** No scopes: grouping into scopes stays M3's, from `parent` (section 7). No diagnostics in outputs: they go in `result.json` (`DATA-14`). No types of expressions, beyond what resolution needs.
- **`as const`:** the parser reads `const` as a type name; it is skipped, not reported as unresolved.

## 6. Its `--info`

In line with `DATA-08`, as built (`INFO` in `src/ts-program.ts`, printed by `./ts-program --info`), shortened: the `description` of the tool and of each parameter, the `errorCodes` and the `definition` are left out:

```json
{
  "tool": "ts-program",
  "toolVersion": "0.2.0",
  "invocation": "once",
  "readsFiles": { "filePatterns": ["*.ts"], "scope": "program", "parameter": "files" },
  "parameters": {
    "source_root": { "dataName": "project.source_root", "affectsOutput": true, "shape": "string", "required": true },
    "files": { "dataName": "files.file.id", "list": true, "affectsOutput": true, "shape": "array of strings", "required": true },
    "configs": { "dataName": "ts.config", "list": true, "affectsOutput": true, "shape": "array of ts.config records", "required": false },
    "store_path": { "dataName": "zaansouvi.store_path", "affectsOutput": false, "shape": "string", "required": false, "whenAbsent": "<working folder>/zaansouvi/tools/ts-program/" }
  },
  "outputs": [
    { "dataName": "code.symbol", "formatVersion": 1, "represents": "nodes", "containedIn": ["files.file", "code.symbol"], "perFile": true, "outputFilePattern": "output/<file-key>.json", "jsonKey": "symbols",
      "fields": { "idField": "id", "parentField": "parent", "labelField": "name", "kindField": "kind", "locationField": "location" } },
    { "dataName": "code.reference", "formatVersion": 1, "represents": "relations", "perFile": true, "outputFilePattern": "output/<file-key>.json", "jsonKey": "references",
      "fields": { "idField": "id", "fromField": "from", "toField": "to", "kindField": "kind", "locationField": "location", "labelField": "name" } },
    { "dataName": "code.link", "formatVersion": 1, "represents": "relations", "perFile": true, "outputFilePattern": "output/<file-key>.json", "jsonKey": "links",
      "fields": { "idField": "id", "fromField": "from", "toField": "to", "kindField": "kind", "locationField": "location", "labelField": "name" } }
  ]
}
```

New keys: `readsFiles.scope: "program"` (section 8; `readsFiles.parameter`, as M1's, names the parameter that gives the files, here `files`); `list: true` on a parameter (the Runner gives every value, not one per invocation); `perFile: true` on an output of a once tool (one file per source file, `<file-key>` filled per file); `containedIn` as a list (a symbol inside a file or inside a symbol). The `fields` roles are as M1's (`FND-01`), with `labelField` on the relations too; there is no `memberField` or `reasonField`: `member` and `reason` are keys of the reference records with no field role (section 5.2).

## 7. What the other programs need

| Program | Change |
|---|---|
| **Runner** | **a hardcoded list of tools to run** (`TPG-04`, `RUN-33`), checked against the folders, M1 not in it; it reports tool folders not listed, and still refuses two producers of one data name among the tools it runs. **A once tool reading the program:** give it `files` as a list and its options; read its per-file outputs (`outputPath` fills `<file-key>` per file it writes); rerun it when any of its files or options changed (`TSP-D11`). Its dry run |
| **Tool helper** | a once tool writing one output file per source file, each atomic, `outputChange` per file; the tool helper already supports it, with no change |
| **M2** | not in the run list, since `ts-program` gives the links (`TPG-05`); `TPG-06` found no need for it |
| **M3** | **not run in MVP 2** (`TPG-06`, `RUN-33`): `ts-program`'s `parent` nesting gives the Viewer's levels. If ever needed, nested scopes from `parent`: a scope for every symbol that holds declarations (function, method, constructor, accessor, class, namespace), each scope inside its parent's scope (option D of `MVP-4`) |
| **Viewer** | levels at any depth; a frame for any entered container (`UI-37`), not only for a node with an `owner` (`BE-109`); shapes for the new kinds; `member`, `viaImport` and built-ins in Details and Problems; built-ins out of the unresolved count. Keys it doesn't read are shown in Details (`VIEW-15`) |

## 8. The decisions it needs from the working files

Under correctness first, decisions that stand in its way are reopened where they live (`MVP_scope.md`, section 1.2):
- **A tool reads only one file per invocation** (`toolset.md`, section 4.2, [Decided]): `ts-program` reads the whole program, which a correct graph needs, since what a name means can depend on another file. Decided as `TS-37` in `toolset.md`: program tools are a named exception.
- **One file type for one tool** (`toolset.md`, section 4.2, [Decided]): kept; `ts-program` reads only `*.ts` (`.d.ts` included). `tsconfig.json` is read elsewhere (`TPG-D4`).
- **For a tool that reads files, plan one invocation per file** (`data_topology.md`, section 6, [Decided]): the same exception.

## 9. Checks

Built as `tests/ts-program/check.mjs` (exact match with `expected-mvp2/`, determinism with `files` reversed, the read log) and `tests/ts-program/check-definitions.mjs` (`TOOL-52`).

- **TPG-40 [Decided]** Exact match with expected results written by hand first, on the test source of MVP 2 (`97_second_implementation.md`, section 3.3), across files.
- **TPG-41 [Decided]** The read log shows only the listed files and TypeScript's library (`TSP-04`).
- **TPG-42 [Decided]** Determinism: two runs, and a run with `files` reversed, give byte-identical outputs.
- **TPG-43 [Proposed]** Broken inputs: a syntax error in one file (no-go, naming it); a file outside `source_root`; an empty `files`; a malformed configuration (no-go), an `extends` to a package (reported), several configurations (only the root one used, the others reported).

## 10. M1 beside it

- **TPG-50 [Proposed]** M1's tests keep passing as they are. A comparison check runs M1 by hand and `ts-program` on the first stage's test source and lists every difference in symbols and references: evidence of what the first stage got wrong, for the findings note.

## 11. Decisions

| ID | Question | Decision |
|---|---|---|
| `TPG-D1` | **How M1 is omitted** | **[Decided]** a hardcoded list of tools to run in the Runner, checked against the folders; M1 is not in it (`TPG-04`, `RUN-33`) |
| `TPG-D2` | **Links: `ts-program` or M2** | **[Decided]** links come from `ts-program`, not M2: `ts-program` runs TypeScript in its invocation and transforms what it can into the Viewer's format, links included (`TPG-05`). No further processing after it is needed (`TPG-06`) |
| `TPG-D3` | **Types in the graph** | **[Decided]** by the definition of a correct graph (`41_typescript_program_plan.md`, section 1.1): interfaces and type aliases are symbols; uses in type positions are references of kind `type`, which the Viewer can hide |
| `TPG-D4` | **Where compiler options come from** (`TSP-D5`) | **[Decided]** section 3.1: `ts-config` reads each config as written; `ts-program` merges them with TypeScript's API. The configuration that applies is the root `tsconfig.json`; an `extends` to a package is reported; a malformed config is a no-go |
| `TPG-D5` | **Built-ins** | **[Decided]** `to: null`, `reason: "built-in"`, `builtin` the name (section 5.2); listed apart in Problems, not counted as unresolved; built-in nodes later if wanted |
| `TPG-D6` | **IDs of merged declarations** | **[Decided]** the first declaration's position in source order (the three signatures of `total`: line 44; the `label` pair: the getter's); the others listed in `declarations`. Stability of IDs across edits stays a separate question |
| `TPG-D7` | **`from` and `enclosing` duplicates** (`FND-60`, item 6) | **[Decided]** **`ts-program` writes `from` and `to` only**, no `enclosing` or `symbol`: two names for one meaning breaks `DATA-19`; the Viewer finds them through `fromField` and `toField` |

## 12. Its place in the plan

`41_typescript_program_plan.md` phase 5 is "build `ts-program`"; phase 4 (the tool helper and the Runner) adds the list of tools to run (`RUN-33`); `TSP-D2` (how M1 runs), `TSP-D6` (M2's fate) and `TSP-D9` (member uses) are answered here by `TPG-12`, `TPG-D2` and section 5.2.
