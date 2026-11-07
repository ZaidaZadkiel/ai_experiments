# 02. Data contracts

Answers `MVP-9`, `MVP-10` and `MVP-12` for the MVP. All data is JSON. Field names are fixed here; anything not listed is an extra value, which readers ignore (`toolset.md`, section 4.5).

## Building blocks

| Block | Shape | Notes |
|---|---|---|
| **File ID** | string | Path relative to the source root, with `/` separators, for example `src/math.ts` |
| **Position** | `{ "line": number, "column": number }` | Both start at 1 |
| **Location** | `{ "file": FileID, "start": Position, "end": Position }` | `end` is exclusive |
| **Symbol ID** | string | See the stable ID rule |
| **Scope ID** | string | See the stable ID rule |
| **Diagnostic** | `{ "severity": "error" \| "warning" \| "info", "code": string, "message": string, "location"?: Location }` | `code` is one of the error codes in `04_tools.md` |

- **DATA-01** Every symbol, reference, link and scope carries a Location, so the Viewer can always show file:line and the source line.

## Stable ID rule (`MVP-12`)

- **DATA-02** Symbol ID: `<file ID>#<name>@<line>:<column>`, where line and column are those of the declaring name. Example: `src/math.ts#round@3:17`.
- **DATA-03** Scope ID: `<file ID>#scope@<line>:<column>` for a function scope, at the start of the function; `<file ID>#scope@file` for the file scope.
- **DATA-04** IDs are the same on every run over an unchanged source. Renaming or moving a declaration changes its ID; all tools must then agree on the new one (`06_test_plan.md`, check C2). Stability across edits is a product concern, not an MVP one.

## Records

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
| `import` | `{ "from": string, "name": string }` | Only for `kind: "import"`: the module specifier as written, and the imported name |

### Reference (from M1)

| Field | Shape | Meaning |
|---|---|---|
| `id` | string | `<file ID>#ref@<line>:<column>` |
| `name` | string | The identifier as written |
| `symbol` | Symbol ID \| `null` | The declaration in the same file it refers to; `null` if none (for example `console`) |
| `kind` | `"declaration"` \| `"call"` \| `"read"` \| `"write"` | |
| `location` | Location | Of the identifier |

### Link (from M2)

| Field | Shape | Meaning |
|---|---|---|
| `id` | string | `<from symbol>-><to symbol>` |
| `from` | Symbol ID | An import symbol in one file |
| `to` | Symbol ID | The exported declaration it refers to, in another file |
| `kind` | `"import"` | The only kind in the MVP |
| `location` | Location | Of the import's name |

### Scope and membership (from M3)

| Field | Shape | Meaning |
|---|---|---|
| scope `id` | Scope ID | |
| scope `kind` | `"file"` \| `"function"` | One level only: functions inside functions belong to the outer function's scope |
| scope `name` | string | The function's name, or the file ID for the file scope |
| scope `location` | Location | The scope's range |
| scope `parent` | File ID | |
| membership `symbol` | Symbol ID | |
| membership `scope` | Scope ID | The scope the symbol's declaration sits in |

## Tool outputs

- **DATA-05** M1 writes `output/<file-key>.json`: `{ "file": FileID, "symbols": Symbol[], "references": Reference[], "diagnostics": Diagnostic[] }`.
- **DATA-06** M2 writes `output/links.json`: `{ "links": Link[], "unresolved": [{ "from": SymbolID, "reason": string }], "diagnostics": Diagnostic[] }`. An import it can't resolve is listed, not an error.
- **DATA-07** M3 writes `output/scopes.json`: `{ "scopes": Scope[], "membership": Membership[], "diagnostics": Diagnostic[] }`.

## `--info` of each tool (`MVP-10`)

- **DATA-08** `--info` prints one JSON object to standard output and exits 0. It reads nothing.

```json
{
  "tool": "file-symbols",
  "version": "0.1.0",
  "readsFiles": { "kinds": ["*.ts"] },
  "parameters": {
    "file_id":   { "dataName": "files.file.id",   "shape": "string", "required": true },
    "file_path": { "dataName": "files.file.path", "shape": "string", "required": false }
  },
  "outputs": [
    { "dataName": "code.symbol",    "version": 1, "represents": "nodes",     "containedIn": "files.file" },
    { "dataName": "code.reference", "version": 1, "represents": "relations" }
  ],
  "invocation": "per-file"
}
```

```json
{
  "tool": "cross-file-links",
  "version": "0.1.0",
  "parameters": {
    "files": { "dataName": "code.symbol", "shape": "array of M1 outputs", "required": true }
  },
  "outputs": [
    { "dataName": "code.link", "version": 1, "represents": "relations" }
  ],
  "invocation": "once"
}
```

```json
{
  "tool": "symbol-scope",
  "version": "0.1.0",
  "parameters": {
    "files": { "dataName": "code.symbol", "shape": "array of M1 outputs", "required": true }
  },
  "outputs": [
    { "dataName": "code.scope",      "version": 1, "represents": "nodes",       "containedIn": "files.file" },
    { "dataName": "code.membership", "version": 1, "represents": "containment", "contains": "code.symbol" }
  ],
  "invocation": "once"
}
```

- **DATA-09** `file_path` is the optional parameter giving the actual path of the file to read (`toolset.md`, section 4.2). If absent, M1 joins `source_root` (an extra value the Runner always sends) and `file_id`.
- **DATA-10** `represents` is how the Runner and the Viewer know what an output is, with no tool-specific code: `nodes` become graph nodes inside `containedIn`; `relations` become edges; `containment` re-parents the nodes it names (`05_viewer.md`). This is the MVP's answer to `RN-12`.
- **DATA-11** The Runner derives the order from `dataName`: a tool whose parameters need `code.symbol` runs after the tool that outputs it. `files.file.*` comes from the Runner's file list.

## Parameters sent by the Runner

- **DATA-12** M1, once per file: `{ "source_root": "<absolute path>", "file_id": "src/math.ts", "file_path": "<absolute path>" }`.
- **DATA-13** M2 and M3, once: `{ "source_root": "<absolute path>", "files": [ <every M1 output> ] }`.

## Result, `last_run.json` and logs

- **DATA-14** `result.json` in the tool's data folder: `{ "tool", "version", "status": "succeeded" | "failed", "started", "finished", "error"?: Diagnostic, "outputs": [paths] }`. Times in ISO 8601, UTC.
- **DATA-15** `last_run.json` next to the launcher holds exactly the parameters of the last real run that got past the parameter check (`toolset.md`, section 4.5).
- **DATA-16** Log format, shared by the Runner and the tools: one entry per line, `<ISO time>\t<level>\t<event>\t<JSON details>`. Comment lines start with `#`, and `# [type] text` gives the comment a type, for example `# [step] reading src/math.ts`. A reader can drop every `#` line and lose no fact.
- **DATA-17** Dry-run output on standard output: JSON lines. The last line is `{ "dryRun": "go" }` or `{ "dryRun": "no-go", "error": Diagnostic }`.

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
| `config_version` | The structure version, checked on start by the Runner and the Viewer |
| `config_tools` | The record of tools: name, launcher path, `--info` JSON, version |
| `config_ordering` | Position and tool name, derived from `--info` |
| `config_settings` | Key and value; in the MVP only the enabled state of each tool (all enabled) |
| `project_source` | The source root and when it was last listed |
| `project_files` | File ID, size, SHA-256 hash |
| `project_outputs` | Tool, data name, version, output path, when produced |
| `project_runs` | Run ID, start, end, outcome, Runner log path |
| `project_tool_runs` | Run ID, tool, file ID (for M1), dry-run result, real-run result |
