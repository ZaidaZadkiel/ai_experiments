# Proposed generic JSON schema for every step

> **Superseded on 2026-11-08** by `26-11-08 011800 Proposed JSON schema for every step, current parameters of input and output.md`, which describes the current parameters of input and output and keeps these section numbers. Kept for history.


**Status:** the reference schema of the MVP, built alongside the code (decided by the user on 2026-11-07, for the MVP; `DATA-20`). Every key name has one meaning across the Runner, the tools and the Viewer, and clashing meanings get different names (`DATA-19`); the clashes found so far are in `FND-40`. The Runner matches keys to data according to each tool's `--info` (`DATA-18`). This is not a validation schema: it describes the shape of every JSON file and JSON line that passes between the steps, so a person or a log reader knows what to expect. Nothing here changes a decision in the working files or in `mvp_docs/`.

**Source.** Derived from the files M1 actually wrote on `test-source/`, read on 2026-11-08, and updated for `file-symbols` 0.2.0 on 2026-11-07, after the key renames in `FND-40`:
- `data/tools/file-symbols/output/src__*.ts.json`
- `data/tools/file-symbols/result.json`
- `data/tools/file-symbols/logs/*.log`
- `app/tools/file-symbols/last_run.json`
- the output of `--info` and of `--dry-run`

M2, M3, the Runner and the Viewer don't exist yet. Their parts are written to the same pattern and marked *(not yet produced)*.

## Notation

The blocks are JSON with comments (JSONC), loosely written:

| Mark | Meaning |
|---|---|
| `// ...` | A comment |
| `"key?"` | Optional key |
| `"a" \| "b"` | One of these values |
| `<Name>` | A building block defined below, or a placeholder |
| `[ <X>, ... ]` | Array of X |
| `...` | Any extra keys. Readers ignore them (`toolset.md`, section 4.5) |

Every step file follows one rule: **readers look keys up by name and ignore what they don't know.** A new field never breaks a reader.

## Contents

1. Building blocks
2. The generic step output file
3. Generic records: nodes, relations, containment
4. Each step's output
5. `--info`
6. Parameters in, `last_run.json`
7. `result.json`
8. Logs and standard output lines
9. Runner events
10. Viewer graph model
11. Review notes: differences from `02_data_contracts.md`
12. Key names (`DATA-19`)
13. The Runner's cache (`RUN-27`)

## 1. Building blocks

```jsonc
// <Time>      ISO 8601, UTC, with milliseconds: "2026-11-07T03:52:36.649Z"
// <Path>      absolute path on this machine. Only in results, logs and last_run.json, never in step outputs
// <Sha256>    64 lowercase hex characters, of the file's bytes as read
// <FileID>    path relative to the source root, "/" separators: "src/counter.ts"
// <FileKey>   FileID with "/" replaced by "__", plus ".json": "src__counter.ts.json" (ARCH-07)
// <DataName>  dotted name of a kind of data: "code.symbol", "files.file.id" (data_topology.md)

// <Position>
{ "line": 5, "column": 17 }                  // both start at 1

// <Location>
{
  "file": "src/counter.ts",                  // <FileID>
  "start": <Position>,
  "end": <Position>                          // exclusive
}

// IDs: stable for an unchanged source (DATA-02 to DATA-04)
// <SymbolID>     "<FileID>#<name>@<line>:<column>"          "src/counter.ts#add@5:17"
// <ReferenceID>  "<FileID>#ref@<line>:<column>"              "src/counter.ts#ref@6:3"
// <ScopeID>      "<FileID>#scope@<line>:<column>" | "<FileID>#scope@file"
// <LinkID>       "<SymbolID>-><SymbolID>"
// <NodeID>       any of the above, or a <FileID>. A relation's "from" may be a FileID (code at file level)

// <Diagnostic>
{
  "severity": "error" | "warning" | "info",
  "code": "E1" | "E2" | "E3" | "E13" | "E6" | "E12" | "E8" | "I1" | "I2",   // error codes in 04_tools.md
  "message": "Syntax error: ',' expected.",
  "location?": <Location>,
  ...
}
```

## 2. The generic step output file

Every step that writes data (M1, M2, M3, and the Runner's file list) writes files in this one envelope. The **records** sit under the keys that `dataNames` names. A reader needs only `dataNames` and the `--info` `fields` map to find and read them, with no knowledge of the step (`FND-01`, `VIEW-14`).

```jsonc
{
  "tool": "file-symbols",                    // step name, as in --info
  "toolVersion": "0.2.0",                    // step version
  "formatVersion": 2,                        // version of this file's layout; equals --info outputs[].formatVersion

  // What was read. One of the two forms:
  "file?": "src/counter.ts",                 // per-file steps: the FileID read
  "sourceSha256?": "9e4bb379...ed93",        //   and the hash of its bytes
  // Once-only steps record nothing about their inputs: the Runner does (DATA-22)

  // Data name -> JSON key holding its records
  "dataNames": {
    "code.symbol": "symbols",
    "code.reference": "references"
  },

  // Counts, for logs and quick checks. Free-form: the step chooses what to count
  "counts": {
    "symbolCount": 4,                        // "<thing>Count", never the name of a record array
    "symbolCountByKind": { "import": 1, "variable": 1, "function": 1, "parameter": 1 },
    "referenceCount": 9,
    "referenceCountByKind": { "declaration": 4, "write": 1, "read": 3, "call": 1 },
    "unresolvedReferenceCount": 0,
    "diagnosticCount": 0,
    "lineCount": 7,
    ...
  },

  // One array per data name, under the key that dataNames gives
  "<jsonKey>": [ <Record>, ... ],

  // Notes about the input (I1, I2) and problems that didn't stop the step
  "diagnostics": [ <Diagnostic>, ... ]

  // No times and no absolute paths, so two runs over the same input give byte-identical files (FND-29)
}
```

## 3. Generic records

Every record is one of three kinds. The kind is the `represents` value of its output in `--info`. The field names below are the defaults; a step may use other names if `--info` maps them in `fields`, as long as each name keeps its one agreed meaning (`DATA-19`).

```jsonc
// represents: "nodes"
{
  "id": <NodeID>,                            // unique across all steps
  "parent": <NodeID>,                        // the container: a FileID, or a node of the containedIn data name
  "name": "add",                             // the label to show
  "kind": "function",                        // the step's own vocabulary
  "location": <Location>,                    // where the name is, for file:line (DATA-01)
  "range?": <Location>,                      // the whole thing, when it differs from location
  ...                                        // step-specific fields
}

// represents: "relations"
{
  "id": "<step-chosen, unique>",
  "from": <NodeID>,                          // source node, or a FileID for file-level code
  "to": <NodeID> | null,                     // target node; null = unresolved (VW-4)
  "kind": "call",                            // the step's own vocabulary
  "location": <Location>,                    // where the relation is written in the source
  ...
}

// represents: "containment", re-parenting nodes of another step (VIEW-11)
{
  "child": <NodeID>,                         // a node from the "contains" data name
  "parent": <NodeID>,                        // its new container
  ...
}
```

## 4. Each step's output

### 4.1 M1 file-symbols: `output/<FileKey>`

Exactly as written today. One file per source file; `dataNames` = `{ "code.symbol": "symbols", "code.reference": "references" }`.

```jsonc
// "symbols": a node record
{
  "id": "src/counter.ts#add@5:17",
  "name": "add",
  "kind": "function" | "variable" | "parameter" | "import",
  "exported": true,                          // declared with export, or named in an export list
  "location": { "file": "src/counter.ts", "start": { "line": 5, "column": 17 }, "end": { "line": 5, "column": 20 } },
  "range":    { "file": "src/counter.ts", "start": { "line": 5, "column": 1 },  "end": { "line": 8, "column": 2 } },
                                             // functions: the whole declaration, from export or function (FND-09)
                                             // variables: the declarator, "total = 0"; parameters: "amount: number"
  "parent": "src/counter.ts",                // always the FileID
  "import?": {                               // only when kind is "import"
    "moduleSpecifier": "./math",             // as written
    "importedName": "round",                 // name exported by that module; "default" or "*" are best-effort (I2)
    "typeOnly?": true
  }
}

// "references": a relation record
{
  "id": "src/counter.ts#ref@6:3",
  "name": "total",                           // the identifier as written
  "symbol": "src/counter.ts#total@3:5",      // same-file declaration it resolves to, or null ("console", "Math")
  "kind": "declaration" | "call" | "read" | "write",
  "location": { "file": "src/counter.ts", "start": { "line": 6, "column": 3 }, "end": { "line": 6, "column": 8 } },
  "enclosing": "src/counter.ts#add@5:17",    // innermost named function, or the FileID at file level (FND-02)
  "from": "src/counter.ts#add@5:17",         // = enclosing
  "to": "src/counter.ts#total@3:5"           // = symbol
}
// Every symbol has exactly one "declaration" reference, at its own location.
```

### 4.2 M2 cross-file-links: `output/links.json` *(not yet produced)*

Only the header and the links (DATA-06): no `counts`, no `inputs`, no `diagnostics`. `dataNames`: `{ "code.link": "links" }`. Links in import-position order.

```jsonc
{
  "tool": "cross-file-links", "toolVersion": "0.1.0", "formatVersion": 1,
  "dataNames": { "code.link": "links" },
  "links": [
    {                                        // a relation record
      "id": "src/main.ts#add@1:10->src/counter.ts#add@5:17",
      "from": "src/main.ts#add@1:10",        // the import symbol
      "to": "src/counter.ts#add@5:17",       // the exported declaration
      "kind": "import",
      "moduleSpecifier": "./counter",        // as written, for review
      "location": <Location of the import's name>
    },
    {                                        // a use of an imported name (TOOL-23)
      "id": "src/main.ts#ref@5:17->src/counter.ts#add@5:17",
      "from": "src/main.ts#run@4:10",        // the enclosing function (the reference's from)
      "to": "src/counter.ts#add@5:17",       // the declaration the import resolved to
      "kind": "call" | "read" | "write",     // the reference's kind
      "moduleSpecifier": "./counter",
      "location": <Location of the use>
    },
    {                                        // unresolved: not an error (B9, FND-42)
      "id": "src/main.ts#thing@13:10->",
      "from": "src/main.ts#thing@13:10", "to": null, "kind": "import",
      "reason": "external" | "no such file" | "not exported" | "unsupported",
      "moduleSpecifier": "./missing", "location": <Location>
    }
  ]
}
```

### 4.3 M3 symbol-scope: `output/scopes.json` *(not yet produced)*

Proposed `dataNames`: `{ "code.scope": "scopes", "code.membership": "membership" }`.

```jsonc
{
  "tool": "symbol-scope", "toolVersion": "0.1.0", "formatVersion": 1,
  "dataNames": { "code.scope": "scopes", "code.membership": "membership" },
  "counts": { "scopeCount": 6, "membershipCount": 13 },
  "scopes": [
    {                                        // a node record
      "id": "src/main.ts#scope@4:1",
      "parent": "src/main.ts",
      "name": "run",                         // the function's name, or the FileID for the file scope
      "kind": "file" | "function",
      "location": <Location of the function's range>,
      "function?": "src/main.ts#run@4:10"    // for review: the function symbol this scope belongs to
    }
  ],
  "membership": [
    {                                        // a containment record
      "child": "src/main.ts#first@5:9",      // the contained symbol (DATA-07)
      "parent": "src/main.ts#scope@4:1"      // its scope (DATA-07)
    }
  ],
  "diagnostics": []
}
// A function's own name belongs to the outer scope, even though its range contains it (TOOL-31).
```

### 4.4 Runner file list *(not yet produced; in `--read-cache` and `project_files`)*

The Runner isn't a tool, but it is the source of the `files.file` nodes, so it uses the same node record.

```jsonc
{
  "dataNames": { "files.file": "files" },
  "files": [
    { "id": "src/counter.ts", "parent": null, "name": "src/counter.ts", "kind": "file",
      "sourceBytes": 146, "sourceSha256": "9e4bb379...ed93" }
    // no location: a file node has no file:line (open point, see section 11)
  ]
}
```

## 5. `--info`

As M1 prints it, shortened. The keys marked *(M1 extra)* go beyond `DATA-08`.

```jsonc
{
  "tool": "file-symbols",
  "toolVersion": "0.2.0",
  "description?": "Reads one TypeScript file and lists its symbols and the references to them.",
  "readsFiles": { "filePatterns": ["*.ts"], "parameter": "file_path", "fallback": "source_root + file_id" } | false,
                                             // an object: the tool reads files and declares a required source_root; false: it reads none (DATA-09)
  "invocation": "per-file" | "once",
  "parameters": {
    "<key>": {
      "dataName": "files.file.id",           // what the Runner fills it with (DATA-11)
      "shape": "string",
      "required": true,
      "affectsOutput": true,                 // false: optional; when absent, the default applies (TOOL-43)
      "description?": "...",
      "whenAbsent?": "<program folder>"      // what applies when the parameter is absent
    }
  },
  "requires?": [["file_path", "source_root"]], // (M1 extra) at least one of each inner list
  "outputs": [
    {
      "dataName": "code.symbol",
      "formatVersion": 2,                    // equals the output file's formatVersion
      "represents": "nodes" | "relations" | "containment" | "diagnostics",
      "containedIn?": "files.file",          // nodes: what their parent is
      "contains?": "code.symbol",            // containment: whose nodes it re-parents
      "outputFilePattern": "output/<file-key>.json", // (M1 extra) where the records are, relative to the store
      "jsonKey": "symbols",                  // (M1 extra) the key holding them (FND-01)
      "fields": { "idField": "id", "parentField": "parent", "labelField": "name", "kindField": "kind", "locationField": "location" }
                                             // (M1 extra) "<role>Field" -> field name; relations use fromField and toField
    }
  ],
  "storeLayout?": { "storePathPattern": "<store_path>, or <program folder> when absent", "outputFilePattern": "...", "resultFilePattern": "...",
                    "logFilePattern": "...", "lastRunFilePattern": "...", "relativeTo": "..." },  // (M1 extra)
  "options?": { "--dry-run": "...", ... },   // (M1 extra)
  "exitCodes?": { "0": "...", "1": "...", "2": "..." },
  "errorCodes?": { "E1": "...", ... },
  "supportedConstructs?": [ "..." ]
  // Proposed later: "settings" for the config manager (toolset.md, section 4.1)
}
```

## 6. Parameters in, `last_run.json`

### 6.1 Parameters (`--json` file or `--stdin`)

A flat object. The keys are the `--info` parameter keys; extra keys are ignored (`TOOL-08`).

```jsonc
// M1, from the Runner (DATA-12)
{ "source_root": "<Path>", "file_id": "src/math.ts", "file_path?": "<Path>", "store_path?": "<Path>" }

// M2 and M3, from the Runner (DATA-13)
{ "symbols": [ <code.symbol record>, ... ], "references": [ <code.reference record>, ... ], "store_path": "<Path>" }   // only M1's records (DATA-13); references for M2; no source_root (DATA-09)
```

### 6.2 `last_run.json`, next to the launcher

The same flat parameters, so it can be passed back with `--json`, plus one reserved key that the tool removes when reading it.

```jsonc
{
  "source_root": "<Path>",
  "file_id": "src/math.ts",
  "_last_run": {
    "tool": "file-symbols",
    "toolVersion": "0.2.0",
    "outcome": "started" | "succeeded" | "failed",  // "started" is overwritten when the run ends
    "started": <Time>,
    "finished?": <Time>,
    "error?": <Diagnostic>,
    "resultPath": "<Path to result.json>"
  }
}
```

## 7. `result.json`, in the step's store

The report of the last real run. The Runner reads it after every invocation (`RUN-09`).

```jsonc
{
  "tool": "file-symbols",
  "toolVersion": "0.2.0",
  "status": "succeeded" | "failed",
  "mode": "real",
  "started": <Time>,
  "finished": <Time>,
  "durationMs": 43,
  "parameterSource": "json" | "stdin" | "last_run" | "command line" | "command line + last_run",
  "nonOutputParameterSources": { "store_path": "input" | "default" },   // TOOL-43
  "effectiveParameters": { ... },            // the values the run used; --info "parameters" describes them
  "read?": { "file_id": "src/math.ts", "sourcePath": "<Path>", "sourceBytes": 158, "sourceSha256": <Sha256> },
  "outputPaths": [ "<Path>", ... ],          // empty when failed; --info "outputs" describes the outputs
  "outputChange?": "create" | "update" | "unchanged",
  "counts?": { ... },                        // as in the output file
  "error?": <Diagnostic>,                    // only when failed
  "logPath": "<Path to this run's log>"
}
```

## 8. Logs and standard output lines

### 8.1 Log file, `logs/<timestamp>_<file-key>.log` (DATA-16)

Not JSON as a whole: one entry per line, four tab-separated fields, the last of which is JSON.

```
<Time>\t<level>\t<event>\t<JSON details>
# [<type>] free text
```

- `level`: `info`, `warn` or `error`.
- Comment lines start with `#` and carry no fact that isn't also in an entry.

Events M1 writes, in order:

| Event | Details |
|---|---|
| `run_started` | `tool`, `toolVersion`, `mode`, `parameterSource`, `effectiveParameters`, `argv`, `programDir`, `storePath`, `logCopyPath` |
| `last_run_saved` | `lastRunPath` |
| `input_resolved` | `file_id`, `sourcePath`, `storePath` |
| `file_read` | `file_id`, `sourcePath`, `sourceBytes`, `sourceSha256` |
| `analysis_done` | the `counts` object |
| `output_written` | `outputPath`, `outputChange`, `dataNames` |
| `run_failed` | `error` (a `<Diagnostic>`), followed by a `# [hint]` comment |
| `log_copy_failed` (warn) | `logCopyPath`, `errorText` |
| `result_not_written` (error) | `errorText` |
| `run_finished` | `status`, `durationMs`, `resultPath` |

Comment types seen: `run`, `step`, `hint`.

Proposed: every step uses `run_started`, `run_failed` and `run_finished` with these details, and is free to name its other events.

### 8.2 Standard output, one JSON object per line

| Situation | Lines |
|---|---|
| Real run | one summary line |
| Dry run | log lines, comment lines, one preview line, then a last go or no-go line (DATA-17) |
| Invocation error | one line on standard error. In a dry run, also a no-go line on standard output (FND-13) |

```jsonc
// real run, the only line
{ "status": "succeeded", "file_id": "src/math.ts", "outputPath": "<Path>", "outputChange": "unchanged", "counts": { ... }, "logPath": "<Path>" }
{ "status": "failed", "file_id": "src/nope.ts", "error": <Diagnostic>, "logPath": "<Path>" }

// dry run
{ "type": "log", "time": <Time>, "level": "info", "event": "file_read", "details": { ... } }
{ "type": "comment", "commentType": "step", "text": "reading src/math.ts" }
{ "type": "preview", "outputPath": "<Path>", "outputChange": "create" | "update" | "unchanged",
  "wouldWrite": [ "<Path>", ... ], "content": <the whole output file> }       // FND-04: lets dry runs chain
{ "dryRun": "go", "tool": "file-symbols", "toolVersion": "0.2.0", "file_id": "src/math.ts", "counts": { ... } }   // last line
{ "dryRun": "no-go", "errorKind": "run" | "invocation", "tool": "...", "toolVersion": "...", "file_id?": "...", "error": <Diagnostic> }

// invocation error, on standard error after a plain-text message line
{ "invocationError": <Diagnostic> }
```

## 9. Runner events *(not yet produced)*

Viewer mode, one JSON object per line on standard output (`03_runner.md`). The Runner log uses the same events in the section 8.1 format.

```jsonc
{ "event": "run_started",  "runId": "<id>", "mode": "real" | "dry-run", "sourceRoot": "<Path>", "time": <Time> }
{ "event": "files_listed", "fileCount": 3 }
{ "event": "tool_skipped", "tool": "file-symbols", "file_id?": "src/math.ts", "refreshReason": "up-to-date" }
{ "event": "tool_dry_run", "tool": "file-symbols", "file_id?": "src/math.ts",
  "refreshReason": "missing" | "never-run" | "last-failed" | "inputs-changed" | "upstream-refresh" | "up-to-date",
  "dryRun": "go" | "no-go", "errorKind?": "run" | "invocation", "error?": <Diagnostic>, "staleInputs": [ <FileID>, ... ] }
{ "event": "tool_run",     "tool": "file-symbols", "file_id?": "src/math.ts", "status": "succeeded" | "failed",
  "error?": <Diagnostic>, "logPath": "<Path>", "outputChange?": "create" | "update" | "unchanged" }
{ "event": "run_finished", "runId": "<id>", "outcome": "succeeded" | "failed" | "stopped", "exitCode": 0 | 1 | 2,
  "time": <Time>, "logPath": "<Path>" }

// --read-cache only (RUN-13)
{ "event": "cache", "cache": <the Runner's cache, section 13> | null }   // null: no run yet
  // proposed: only tools in the current record, and files in the current file list (FND-06)

// Proposed for the Runner log only (RUN-15): the exact command line and JSON sent
{ "event": "tool_invoked", "tool": "...", "argv": [ "..." ], "json": { ... }, "dryRun": true }
```

## 10. Viewer graph model *(not yet produced)*

What the Viewer backend sends the page (`VIEW-04`), built only from sections 2 and 3.

```jsonc
{
  "builtFrom": { "runId?": "<id>", "tools": [ "file-symbols", "cross-file-links", "symbol-scope" ] },
  "nodes": [
    { "id": <NodeID>, "parent": <NodeID> | null, "label": "add", "kind": "function",
      "location?": <Location>, "source": { "tool": "file-symbols", "dataName": "code.symbol" } }
  ],
  "edges": [
    { "id": "...", "from": <NodeID>, "to": <NodeID>, "kind": "call" | "read" | "write" | "import" | "aggregate",
      "location?": <Location>,
      "count?": 2,                           // aggregate edges only
      "members?": [ "<edge id>", ... ],      // aggregate edges: what they stand for, each with a location
      "source": { "tool": "...", "dataName": "..." } }
  ],
  "unresolved": { "count": 2, "names": [ "Math", "console" ] },   // VW-4, least effort: hidden, counted
  "diagnostics": [ <Diagnostic>, ... ]
}
```

## 11. Review notes: differences from `02_data_contracts.md`

**Fields M1 writes that the data contracts don't have:**
- In the output file: `tool`, `toolVersion`, `formatVersion`, `sourceSha256`, `dataNames` and `counts` (`DATA-05` has only `file`, `symbols`, `references`, `diagnostics`).
- On each reference: `enclosing`, `from` and `to` (`FND-02`).
- On imports: `import.typeOnly`.
- In `result.json`: `mode`, `durationMs`, `parameterSource`, `effectiveParameters`, `read`, `outputChange` and `counts` (`DATA-14` has fewer).
- In `--info`: `jsonKey`, `fields`, `outputFilePattern`, `requires`, `storeLayout`, `options`, `exitCodes`, `errorCodes` and `supportedConstructs`.

**Shape differences:**
- The dry-run last line carries `errorKind`, `tool`, `toolVersion` and `file_id` (DATA-17 has only `dryRun` and `error`).
- There are extra `preview`, `log` and `comment` lines before the last line.

**Naming:**
- Key names that carried two meanings, against `DATA-19`, are listed in `FND-40` and renamed in M1 0.2.0. Section 12 lists the names.
- Membership fields are `child` and `parent`, as section 3 proposed (`DATA-07`, `FND-41`).

**Open points:**
- **File nodes and aggregate edges have no location.** `DATA-01` doesn't cover them, so the Viewer can't show file:line for them (review question 5).
- **`--info` declares no settings yet.** The config manager needs that.
- **Relative paths are accepted.** M1 accepts a relative `source_root` and resolves it against the current folder. It should either be refused (E13) or the rule written down.
- **No reader checks `formatVersion`.** Section 6 of `viewer.md` (unknown schema version) needs one.

## 12. Key names (`DATA-19`)

Each key name has one meaning, with one shape, wherever it appears. This list starts with the names M1 0.2.0 uses that are easy to confuse; it grows as M2, M3, the Runner and the Viewer add keys.

**Generic keys** describe the record or object they sit on: `id`, `name`, `kind`, `parent`, `location`, `range`, `description`, `status`, `error` (always a `<Diagnostic>`), `counts`, `tool` (a step name).

| Key | Meaning | Not to be confused with |
|---|---|---|
| `toolVersion` | the step's version, `"0.2.0"` | `formatVersion` |
| `formatVersion` | the version of an output file's layout and its records; the same number in the file and in `--info` `outputs[]` | `toolVersion` |
| `file` | a `<FileID>` | `outputFilePattern`, the `...Path` keys |
| `file_id` | a `<FileID>`, as a parameter (parameters use snake case, `DATA-12`) | |
| `from`, `to` | the source and target `<NodeID>` of a relation | `import.moduleSpecifier` |
| `import.moduleSpecifier` | the module specifier of an import, as written | `from` |
| `import.importedName` | the name the imported module exports it under | the symbol's `name`, its local name |
| `parameters` | `--info` only: the description of each parameter | `effectiveParameters` |
| `effectiveParameters` | the parameter values a run used | `parameters` |
| `outputs` | `--info` only: the description of each output | `outputPaths` |
| `outputPaths`, `outputPath` | absolute paths of output files written, or (dry run) to be written | `outputFilePattern` |
| `outputFilePattern` | `--info` only: where an output file sits in the store, with placeholders | `outputPath` |
| `outputChange` | `create`, `update` or `unchanged`, for an output file | |
| `sourcePath`, `sourceBytes`, `sourceSha256` | the examined source file read: absolute path, size, hash | |
| `resultPath`, `logPath`, `logCopyPath`, `lastRunPath`, `storePath` | absolute paths of those files and folders | |
| `<thing>Count`, `<thing>CountByKind` | numbers in `counts`; never the name of a record array | `symbols`, `references` |
| `errorKind` | `run` or `invocation`, on a no-go line | record `kind` |
| `errorText` | a plain error message, where no `<Diagnostic>` exists | `error` |
| `<role>Field` | in `--info` `fields`: which record field plays that role (`idField`, `parentField`, `labelField`, `kindField`, `locationField`, `fromField`, `toField`) | the record fields themselves |
| `filePatterns` | in `readsFiles`: the file patterns a step reads | `kind` |
| `reason` | on a relation whose `to` is `null`: why it wasn't resolved (`external`, `no such file`, `not exported`, `unsupported`) | `refreshReason` |
| `diagnostic` | the data name every step may output for its diagnostics, JSON key `diagnostics`, `represents: "diagnostics"` (`DATA-23`) | `error`, one Diagnostic for a failed run |
| `store_path` | parameter: the folder that is the step's store (`DATA-21`) | `storePath`, the same folder in logs |
| `source_root` | parameter: the examined source's root; declaring it marks a step that reads files, and every file path it uses is resolved against it (`DATA-09`) | `sourceRoot` in Runner events |
| `readsFiles` | in `--info`: the file patterns a step reads, or `false` when it reads no files (`DATA-09`) | |
| `affectsOutput` | in `--info` parameters: whether the parameter can change the output (`TOOL-43`) | |
| `nonOutputParameterSources` | for each parameter with `affectsOutput: false`: `input` (the input gave it) or `default` | `parameterSource` |

## 13. The Runner's cache (`RUN-27`)

accepted by the user for the MVP on 2026-11-07. One file, `data/runner/cache.json`, replaced at the end of each real run (failed runs included); a dry-run-only pass replaces only `dryRun`. It is what `--read-cache` prints. Key names follow section 12.

```jsonc
{
  "formatVersion": 1,
  "run": { "runId": "<id>", "mode": "real", "outcome": "succeeded" | "failed", "exitCode": 0 | 1 | 2,
           "started": <Time>, "finished": <Time>, "sourceRoot": "<Path>", "logPath": "<Path>" },
  "files": [ { "id": "src/counter.ts", "sourceBytes": 146, "sourceSha256": <Sha256> }, ... ],   // in file ID order (RUN-28)
  "tools": [ { "tool": "file-symbols", "position": 1, "info": <--info> }, ... ],             // in run order
  "invocations": [
    { "tool": "file-symbols", "file_id?": "src/counter.ts",
      "refreshReason": "never-run" | ... | "up-to-date",
      "input": { ... },                    // the JSON sent; a value that is a tool output is "<dataRef>" instead of a copy
      "dryRun?": { "dryRun": "go" | "no-go", "errorKind?": "...", "error?": <Diagnostic> },
      "result?": <result.json>,             // absent when skipped
      "skipped?": true }
  ],
  "data": {
    "code.symbol": {
      "represents": "nodes", "containedIn": "files.file", "fields": { ... },   // from --info
      "outputs": [ { "tool": "file-symbols", "dataRef": "file-symbols:src/counter.ts", "file": "src/counter.ts", "records": [ ... ] }, ... ]
    },
    "code.reference": { ... }, "code.link": { ... }, "code.scope": { ... }, "code.membership": { ... },
    "diagnostic": { "represents": "diagnostics", "fields": { ... },        // from every tool (DATA-23)
      "outputs": [ { "tool": "file-symbols", "dataRef": "file-symbols:src/counter.ts", "file": "src/counter.ts", "records": [] }, ... ] }
  },
  "dryRun?": {                              // diagnostics of the latest dry-run-only pass; dropped by a real run
    "runId": "<id>", "time": <Time>,
    "invocations": [ { "tool": "...", "file_id?": "...", "refreshReason": "...", "dryRun": "go" | "no-go",
                       "error?": <Diagnostic>, "staleInputs": [ ... ] } ]
  }
}
```

- Each output is stored once, under `data`; `dataRef` names it (`<tool>:<file ID>` for a tool run once per file, `<tool>` for a tool run once), and an invocation's `input` refers to it instead of copying it.
- Only tools in the current record and files in the current file list appear (`FND-06`).
