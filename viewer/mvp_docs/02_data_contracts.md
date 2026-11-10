# 02. Data contracts

Answers `MVP-9`, `MVP-10` and `MVP-12` for the MVP. All data is JSON. Field names are fixed here; anything not listed is an extra value, which readers ignore (`toolset.md`, section 4.5).

## Building blocks

| Block | Shape | Notes |
|---|---|---|
| **File ID** | string | Path relative to the source root, with `/` separators, for example `src/math.ts` |
| **Position** | `{ "line": number, "column": number }` | Both start at 1 |
| **Location** | `{ "file": FileID, "start": Position, "end": Position }` | `end` is exclusive |
| **Symbol ID** | string | See the stable ID rule |
| **Scope ID** | string | M3 only, `DATA-03` |
| **Diagnostic** | `{ "severity": "error" \| "warning" \| "info", "code": string, "message": string, "location"?: Location }` | `code` is one of the error codes in `04_tools.md` |

- **DATA-01** Every symbol, reference, link and scope carries a Location, so the Viewer can always show file:line and the source line.

## Stable ID rule (`MVP-12`)

- **DATA-02** Symbol ID: `<file ID>#<name>@<line>:<column>`, where line and column are those of the declaring name. Example: `src/math.ts#round@3:17`.
- **DATA-04** IDs are the same on every run over an unchanged source. Renaming or moving a declaration changes its ID; all tools must then agree on the new one (`06_test_plan.md`, check C2). Stability across edits is a product concern, not an MVP one.

## Records

The tables give the records of M1, M2 and M3. `ts-program`'s records keep these shapes, extended where a correct graph needs more, as given in the MVP 2 schema (`DATA-24`; `TPG-03`); it writes `from` and `to` only, no `enclosing` or `symbol` (`TPG-D7`).

### Symbol (from M1)

| Field | Shape | Meaning |
|---|---|---|
| `id` | Symbol ID | |
| `name` | string | |
| `kind` | `"function"` \| `"variable"` \| `"parameter"` \| `"import"` | |
| `exported` | boolean | Declared with `export` |
| `location` | Location | Of the declaring name |
| `range` | Location | Of the whole declaration; for a function, its full body. M3 needs it |
| `parent` | File ID | Containment: every symbol sits in its file |
| `import` | `{ "moduleSpecifier": string, "importedName": string }` | Only for `kind: "import"`: the module specifier as written, and the name it is exported under in that module (it differs from `name` in `import { a as b }`) |

### Reference (from M1)

| Field | Shape | Meaning |
|---|---|---|
| `id` | string | `<file ID>#ref@<line>:<column>` |
| `name` | string | The identifier as written |
| `symbol` | Symbol ID \| `null` | The declaration in the same file it refers to; `null` if none (for example `console`) |
| `kind` | `"declaration"` \| `"call"` \| `"read"` \| `"write"` | |
| `location` | Location | Of the identifier |
| `enclosing` | Symbol ID \| File ID | The innermost named function the reference sits in, or the file at file level (`FND-02`) |
| `from` | Symbol ID \| File ID | The relation's source, equal to `enclosing` (`fields.fromField` in M1's `--info`) |
| `to` | Symbol ID \| `null` | The relation's target, equal to `symbol` (`fields.toField`) |

In M1's references, `enclosing` and `from`, and `symbol` and `to`, hold the same values (`FND-60`, item 6).

### Link (from M2)

| Field | Shape | Meaning |
|---|---|---|
| `id` | string | Import link: `<from symbol>-><to symbol>`, or `<from symbol>->` when `to` is `null`. Use-site link: `<reference id>-><to symbol>` |
| `from` | Symbol ID | An import symbol in one file |
| `to` | Symbol ID \| `null` | The exported declaration it refers to, in another file; `null` when the import can't be resolved |
| `reason` | `"external"` \| `"no such file"` \| `"not exported"` \| `"unsupported"` | Only when `to` is `null`: why the import wasn't resolved (`TOOL-24`) |
| `moduleSpecifier` | string | The module specifier as written, for review |
| `kind` | `"import"` \| `"call"` \| `"read"` \| `"write"` | `import` for the import itself; for a use of an imported name, the kind of the reference (`TOOL-23`, option A) |
| `location` | Location | Of the import's name |

### Scope and membership (from M3)

| Field | Shape | Meaning |
|---|---|---|
| scope `id` | Scope ID | |
| scope `kind` | `"file"` \| `"function"` | One level only: functions inside functions belong to the outer function's scope |
| scope `name` | string | The function's name, or the file ID for the file scope |
| scope `owner` | Symbol ID \| File ID | The node the scope belongs to: the function symbol, or the file for the file scope; the same IDs references use as `from` (`TOOL-33`) |
| scope `location` | Location | The scope's range: the function's `range`; for the file scope, from 1:1 to the furthest end among the file's symbols (`TOOL-34`) |
| scope `parent` | File ID | |
| membership `child` | Symbol ID | The contained symbol (named `child`, not `symbol`, so the name keeps one meaning, `DATA-19`) |
| membership `parent` | Scope ID | The scope the symbol's declaration sits in |

## Tool outputs

- **DATA-06** M2 writes `output/links.json` holding only its header and the links: `{ "tool", "toolVersion", "formatVersion", "dataNames": { "code.link": "links" }, "links": Link[] }`. No `counts`, no `inputs`, no `diagnostics`. Links are ordered by the import's position: file ID, then line, then column. An import it can't resolve is a link with `to: null` and a `reason`, not an error. *(`ts-program`'s links follow this link shape, `TPG-30`.)*
- **DATA-25** Diagnostics are not data. They describe how a tool's run went, so they go in its `result.json` and on its dry run's go line (`DATA-14`, `DATA-17`), never in an output file. No data name is output by more than one tool, and the Runner knows no special data name.
- **DATA-22** **Every output file starts with the same header**: `tool`, `toolVersion`, `formatVersion` and `dataNames` (data name to the JSON key holding its records). A tool run once per file adds `file` and `sourceSha256`. A tool run once adds nothing about its inputs: where its input came from is the Runner's to record, in its cache and fingerprint. The output file carries no times, so the same input gives the same bytes. The Runner's shape check relies on it (`RUN-18`). As in the reference schema, section 2.

## Key names and their data

Answers `FND-01` for the MVP.

- **DATA-18** **The Runner matches JSON keys to their data, according to each tool's `--info`.** From `--info` it knows which parameter key takes which data name, which key of an output file holds which data name (`jsonKey`), and which field of a record plays each role (`fields`: ID, parent, from, to, kind, location). It uses this when it checks outputs and builds each tool's input (`RUN-18`, `RUN-19`), and when it hands data to the Viewer (`RUN-13`, `RUN-25`). Neither the tools nor the Viewer read another tool's `--info` to find data.
- **DATA-19** **One meaning per key name.** The Runner, the tools and the Viewer agree on one specific meaning, with one shape, for each JSON key name, at any depth and in everything they exchange: outputs, `--info`, parameters, `last_run.json`, `result.json`, dry-run lines, log details and Runner events. A key name used in two places means the same thing in both. When two meanings clash, they get different key names. A new key reuses an existing name only if it has exactly that name's meaning. Clashes found so far, and the names M1 now uses: `FND-40`.
- **DATA-20** **A JSON schema is built alongside the MVP, for reference.** It lists every key name with its one meaning and shape, and the structure of every file and line in `DATA-19`. It is for people and log readers: nothing validates against it at run time (the Runner's own check is `RUN-18`). Whenever code adds or changes a key, the schema changes with it. It is `proposed_schema/26-11-09 081006 Proposed JSON schema for every step, the Runner and the Viewer, as built.md`; for MVP 2's contracts, see `DATA-24`.

## `--info` of each tool (`MVP-10`)

- **DATA-08** `--info` prints one JSON object to standard output and exits 0. It reads nothing. The examples below follow M1's actual `--info`, shortened; the Runner reads `parameters` (with `dataName`, `required` and `affectsOutput`), `outputs` (with `formatVersion`, `represents`, `outputFilePattern`, `jsonKey` and `fields`), `readsFiles` and `invocation`.

```json
{
  "tool": "file-symbols",
  "toolVersion": "0.5.0",
  "readsFiles": { "filePatterns": ["*.ts"], "parameter": "file_path", "fallback": "source_root + file_id" },
  "invocation": "per-file",
  "parameters": {
    "file_id":     { "dataName": "files.file.id",        "shape": "string", "required": true,  "affectsOutput": true },
    "file_path":   { "dataName": "files.file.path",      "shape": "string", "required": false, "affectsOutput": true },
    "source_root": { "dataName": "project.source_root",  "shape": "string", "required": true,  "affectsOutput": true },
    "store_path":  { "dataName": "zaansouvi.store_path", "shape": "string", "required": false, "affectsOutput": false }
  },
  "outputs": [
    { "dataName": "code.symbol", "formatVersion": 3, "represents": "nodes", "containedIn": "files.file",
      "outputFilePattern": "output/<file-key>.json", "jsonKey": "symbols",
      "fields": { "idField": "id", "parentField": "parent", "labelField": "name", "kindField": "kind", "locationField": "location" } },
    { "dataName": "code.reference", "formatVersion": 3, "represents": "relations",
      "outputFilePattern": "output/<file-key>.json", "jsonKey": "references",
      "fields": { "idField": "id", "fromField": "from", "toField": "to", "kindField": "kind", "locationField": "location" } }
  ]
}
```

```json
{
  "tool": "cross-file-links",
  "toolVersion": "0.1.0",
  "invocation": "once",
  "readsFiles": false,
  "parameters": {
    "symbols":     { "dataName": "code.symbol", "shape": "array of code.symbol records", "required": true, "affectsOutput": true },
    "references":  { "dataName": "code.reference", "shape": "array of code.reference records", "required": true, "affectsOutput": true },
    "store_path":  { "dataName": "zaansouvi.store_path", "shape": "string", "required": false, "affectsOutput": false }
  },
  "outputs": [
    { "dataName": "code.link", "formatVersion": 1, "represents": "relations",
      "outputFilePattern": "output/links.json", "jsonKey": "links",
      "fields": { "idField": "id", "fromField": "from", "toField": "to", "kindField": "kind", "locationField": "location" } }
  ]
}
```

```json
{
  "tool": "symbol-scope",
  "toolVersion": "0.1.0",
  "invocation": "once",
  "readsFiles": false,
  "parameters": {
    "symbols":     { "dataName": "code.symbol", "shape": "array of code.symbol records", "required": true, "affectsOutput": true },
    "store_path":  { "dataName": "zaansouvi.store_path", "shape": "string", "required": false, "affectsOutput": false }
  },
  "outputs": [
    { "dataName": "code.scope", "formatVersion": 1, "represents": "nodes", "containedIn": "files.file",
      "outputFilePattern": "output/scopes.json", "jsonKey": "scopes",
      "fields": { "idField": "id", "parentField": "parent", "labelField": "name", "kindField": "kind", "locationField": "location", "ownerField": "owner" } },
    { "dataName": "code.membership", "formatVersion": 1, "represents": "containment", "contains": "code.symbol",
      "outputFilePattern": "output/scopes.json", "jsonKey": "membership",
      "fields": { "childField": "child", "parentField": "parent" } }
  ]
}
```

The three examples above are M1's, M2's and M3's, which are not run in MVP 2 (`RUN-33`). `ts-program`'s, as built (`INFO` in `app/tools/ts-program/src/ts-program.ts`), shortened, with the keys of the MVP 2 schema (`DATA-24`): `readsFiles.scope`, a parameter's `list`, an output's `perFile`, a list `containedIn`:

```json
{
  "tool": "ts-program",
  "toolVersion": "0.2.0",
  "invocation": "once",
  "readsFiles": { "filePatterns": ["*.ts"], "scope": "program", "parameter": "files" },
  "parameters": {
    "source_root": { "dataName": "project.source_root",  "affectsOutput": true,  "shape": "string", "required": true },
    "files":       { "dataName": "files.file.id", "list": true, "affectsOutput": true, "shape": "array of strings", "required": true },
    "configs":     { "dataName": "ts.config", "list": true, "affectsOutput": true, "shape": "array of ts.config records", "required": false },
    "store_path":  { "dataName": "zaansouvi.store_path", "affectsOutput": false, "shape": "string", "required": false }
  },
  "outputs": [
    { "dataName": "code.symbol", "formatVersion": 1, "represents": "nodes", "containedIn": ["files.file", "code.symbol"], "perFile": true,
      "outputFilePattern": "output/<file-key>.json", "jsonKey": "symbols",
      "fields": { "idField": "id", "parentField": "parent", "labelField": "name", "kindField": "kind", "locationField": "location" } },
    { "dataName": "code.reference", "formatVersion": 1, "represents": "relations", "perFile": true,
      "outputFilePattern": "output/<file-key>.json", "jsonKey": "references",
      "fields": { "idField": "id", "fromField": "from", "toField": "to", "kindField": "kind", "locationField": "location", "labelField": "name" } },
    { "dataName": "code.link", "formatVersion": 1, "represents": "relations", "perFile": true,
      "outputFilePattern": "output/<file-key>.json", "jsonKey": "links",
      "fields": { "idField": "id", "fromField": "from", "toField": "to", "kindField": "kind", "locationField": "location", "labelField": "name" } }
  ]
}
```

- **DATA-09** **`source_root` marks a tool that reads files** (`toolset.md`, section 4.2). Such a tool states `readsFiles` and declares `source_root` as required; every file path it uses is resolved against it, and a path outside it is a run error (`E12`). A tool that reads no files states `"readsFiles": false` and doesn't take `source_root` (M2, M3). For M1: `file_path`, optional, is the path of the file to read, absolute or relative to `source_root`; it must lie inside `source_root`, at `file_id`. If absent, M1 reads `source_root` joined with `file_id`. The Runner sends `source_root` only to tools that declare it.
- **DATA-23** **`readsFiles` needs patterns for one file type** (`toolset.md`, section 4.2, [Decided]; `FND-79`): a tool that reads files states `readsFiles` with `filePatterns`, non-empty, naming the one file type it reads (M1: `["*.ts"]`). `readsFiles` with no or empty `filePatterns` is an inconsistent `--info`, and the Runner refuses the tool. *(As built, an absent list still means every listed file, `readsFile` in `app/runner/src/tools.ts`; to change with `FND-79`.)* A tool needing several kinds of file, or a composite file, is a design error and unsupported: each kind gets its own tool, and a tool reading no files combines their outputs.
- **DATA-24** **[Decided]** **The contracts of `ts-program`, the full file listing and the Viewer's model format 2** are in the reference schema `proposed_schema/26-11-09 201159 Proposed JSON schema for MVP 2, ts-program, the full file listing and the Viewer.md`: `ts-program`'s output (`code.symbol`, `code.reference`, `code.link` per source file, new keys `modifiers`, `declaredIn`, `declarations`, `heritage`, `member`, `union`, `viaImport`, `builtin`; `from` and `to` only, `TPG-D7`); the new `--info` keys `readsFiles.scope`, a parameter's `list`, an output's `perFile`, a list `containedIn`; the file list's entries with their status (`RUN-34`, `RUN-35`). Where this file and that schema differ for MVP 2, the schema is current. `ts-program` 0.2.0's `declaredWith` and `defaultExport`, the `override` and `accessor` modifiers, and `/api/source`'s `end` are in `proposed_schema/26-11-09 235850 Proposed JSON schema for ts-program 0.2.0 and the source range endpoint, as built.md`, which gives only what changes from the file above (`FND-110`). The next part of MVP 2 is proposed, not built, in `proposed_schema/26-11-10 165255 Proposed JSON schema for the next part of MVP 2, ranges, initializers, folders and attrs.md`, which also records that the model keeps a record's other keys as `attrs`, not `extra`.
- **DATA-10** `represents` is how the Runner and the Viewer know what an output is, with no tool-specific code: `nodes` become graph nodes inside `containedIn`; `relations` become edges, except a relation whose `to` is `null`, which is unresolved and counted, not drawn (`VW-4`); `containment` re-parents the nodes it names (`05_viewer.md`). These three are the only kinds (diagnostics aren't an output, `DATA-14`). This is the MVP's answer to `RN-12`.
- **DATA-11** The Runner derives the order from `dataName`: a tool whose parameters need `code.symbol` runs after the tool that outputs it. Data no tool outputs, such as `files.file.*`, `project.source_root` and `zaansouvi.store_path`, is provided by the Runner from saved configuration or defaults (`RUN-29`).

## Parameters sent by the Runner

- `ts-program`, once: `source_root`, `files` (every listed file matching `*.ts`) and `store_path` (`TOOL-51`); the shapes are in the MVP 2 schema (`DATA-24`).
- **DATA-21** **Every tool takes an optional `store_path`** (data name `zaansouvi.store_path`), the folder that is its store. It doesn't affect the output. If the input lacks it, the tool uses `./zaansouvi/tools/<tool>/` in the folder it was started from; `last_run.json` is never used to fill it in, only as a complete input (`toolset.md`, section 4.5, `TOOL-43`). Each parameter in `--info` carries `affectsOutput`: `true` for M1's `file_id`, `file_path` and `source_root`; `false` for `store_path`.

## M1, M2 and M3 only

M1, M2 and M3 are kept as built and are not run in MVP 2 (`TPG-01`, `RUN-33`). They are **stale and frozen**: not maintained, kept for future tests such as wrong data and wrong input (`97_second_implementation.md`, section 4). Their requirements are in `summary/00_definitions_mvp1.md` and `mvp1/docs_2026-11-10/02_data_contracts.md`:

- **DATA-03** Scope ID of M3's scopes
- **DATA-05** M1's per-file output file
- **DATA-07** M3's output file `scopes.json`
- **DATA-12** Parameters the Runner sends M1
- **DATA-13** Parameters the Runner sends M2 and M3

## Result, `last_run.json` and logs

- **DATA-14** `result.json` in the tool's data folder: `{ "tool", "toolVersion", "status": "succeeded" | "failed", "started", "finished", "error"?: Diagnostic, "outputPaths": [paths], "diagnostics": Diagnostic[], "logPath" }`. `diagnostics` holds the tool's notes on how the run went, for example M1's `I1` and `I2` on constructs outside the supported set; empty when there are none. Times in ISO 8601, UTC.
- **DATA-15** `last_run.json` in the tool's store holds exactly the parameters of the last real run that got past the parameter check (`toolset.md`, section 4.5), plus `_last_run` (tool, version, outcome, times, error, result path). It is used only as a complete input, when the invocation gives no other (`TOOL-02`). It doesn't record `store_path`: with no JSON input, the tool reads `last_run.json` from the store given with `--store-path`, else from its default store, and that store is the one it writes to.
- **DATA-16** Log format, shared by the Runner and the tools: one entry per line, `<ISO time>\t<level>\t<event>\t<JSON details>`. Comment lines start with `#`, and `# [type] text` gives the comment a type, for example `# [step] reading src/math.ts`. A reader can drop every `#` line and lose no fact.
- **DATA-17** Dry-run output on standard output: JSON lines. The last line is `{ "dryRun": "go", "diagnostics": Diagnostic[] }` or `{ "dryRun": "no-go", "error": Diagnostic }`; the go line carries the same diagnostics a real run would put in `result.json` (`DATA-14`).

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success, or dry run: go |
| 1 | Run error, or dry run: no-go for a run-type problem |
| 2 | Invocation error: nothing written (`toolset.md`, section 4.6) |

## Database tables

Starting point for the MVP's single database; the real schema is decided later (`MVP_scope.md`, section 4).

| Table | Holds |
|---|---|
| `config_version` | The structure version, `1` at first, checked on start by the Runner (`RUN-04`) |
| `config_tools` | The record of tools: name, launcher path, `--info` JSON, version |
| `config_ordering` | Position and tool name, derived from `--info` |
| `config_settings` | Key and value; in the MVP the enabled state of each tool (all enabled) and the saved source root (`RUN-29`) |
| `project_source` | The source root and when it was last listed |
| `project_files` | File ID, size, SHA-256 hash |
| `project_outputs` | Tool, data name, version, output path, when produced, input fingerprint (`RUN-20`) |
| `project_runs` | Run ID, `mode` (`real` or `dry-run`, `RUN-23`), start, end, outcome, exit code, Runner log path |
| `project_tool_runs` | Run ID, `mode` (`real` or `dry-run`), tool, file ID (for M1), refresh reason or `skipped`, dry-run result, real-run result, input fingerprint (`RUN-20`, `RUN-22`) |

The database keeps only what the refresh check needs; what the Viewer reads is in the Runner's cache (`RUN-27`).
