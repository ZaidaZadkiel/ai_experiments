# Proposed JSON schema for every step, the Runner and the Viewer, as built

**Status:** the reference schema of the MVP (`DATA-20`), current on 2026-11-09. It describes what the code produces today: M1 `file-symbols` 0.5.0, M2 `cross-file-links` 0.2.0, M3 `symbol-scope` 0.2.0, the tool helper, the Runner and the Viewer backend `zaansouvi-view` 0.1.0. Every part was checked against the code and the files it wrote on `test-source/` on 2026-11-09.

It replaces `26-11-08 011800 Proposed JSON schema for every step, current parameters of input and output.md`, kept for history with its struck wording, and keeps its section numbers, so references such as "the schema, section 13" still hold. What changed:
- **Clean text:** the decisions struck through in the earlier file are applied and their old wording left out; the history stays in the earlier file and in `99_findings.md`.
- **Section 10** describes the Viewer's graph model in full, as built (format 1), instead of pointing to `55_viewer_backend.md`.
- **Section 15**, the activity log, is now produced; its event names are the ones the backend writes.
- **New sections:** 16, the Viewer's own store (`data/viewer/`); 17, the Viewer's API and live stream.
- **Small corrections:** M3's version and row in the `--info` table; `E14` among the error codes; the default store in the working folder (`DATA-21`).

It is for people and log readers; nothing validates against it at run time (the Runner's own check is `RUN-18`, the Viewer's is `BE-60`). Every key name has one meaning wherever it appears (`DATA-19`, section 12).

## Notation

| Mark | Meaning |
|---|---|
| `// ...` | A comment |
| `"key?"` | Optional key |
| `"a" \| "b"` | One of these values |
| `<Name>` | A building block from section 1, or a placeholder |
| `[ <X>, ... ]` | Array of X |
| `...` | Any extra keys; readers ignore them (`TOOL-08`) |

## Contents

1. Building blocks
2. The generic step output file
3. Generic records: nodes, relations, containment
4. Each step's output
5. `--info`
6. Parameters in, `last_run.json`
7. `result.json`
8. Logs and standard output lines
9. Runner events, log and lock
10. The Viewer's graph model
11. Review notes and open points
12. Key names (`DATA-19`)
13. The Runner's cache (`RUN-27`)
14. Parameters and keys the programs know by name
15. The Viewer's activity log
16. The Viewer's own store
17. The Viewer's API and live stream

## 1. Building blocks

```jsonc
// <Time>      ISO 8601, UTC, with milliseconds: "2026-11-08T05:51:42.776Z"
// <Path>      absolute path on this machine. In results, logs, last_run.json, events, the caches and the Viewer's store;
//             never in a step's output file
// <Sha256>    64 lowercase hex characters, of the bytes named
// <FileID>    path relative to the source root, "/" separators: "src/counter.ts"
// <FileKey>   FileID with "/" replaced by "__": "src__counter.ts" (ARCH-07); output files add ".json"
// <DataName>  dotted name of a kind of data: "code.symbol", "files.file.id"
// <RunID>     the Runner's ID for a run: "<Time with ':' replaced by '-'>-<pid>", "2026-11-09T07-39-51.494Z-153258"
// <SourceKey> the Viewer's key for an examined source: the first 16 hex digits of the SHA-256 of its real path (BE-31)

// <Position>  { "line": 5, "column": 17 }   both start at 1
// <Location>  { "file": <FileID>, "start": <Position>, "end": <Position> }   end is exclusive

// IDs, stable for an unchanged source (DATA-02 to DATA-04)
// <SymbolID>     "<FileID>#<name>@<line>:<column>"            "src/counter.ts#add@5:17"
// <ReferenceID>  "<FileID>#ref@<line>:<column>"                "src/counter.ts#ref@6:3"
// <LinkID>       import:      "<SymbolID>-><SymbolID>"        "src/main.ts#add@1:10->src/counter.ts#add@5:17"
//                unresolved:  "<SymbolID>->"                  "src/main.ts#thing@13:10->"
//                use:         "<ReferenceID>-><SymbolID>"     "src/main.ts#ref@5:17->src/counter.ts#add@5:17"
// <ScopeID>      "<FileID>#scope@<line>:<column>" | "<FileID>#scope@file"     (M3; the declaration start, TOOL-34)
// <NodeID>       a SymbolID, ScopeID or FileID. A relation's "from" may be a FileID (code at file level)
// <EdgeID>       an edge of a Viewer view: "<NodeID>-><NodeID>", its two ends (BE-53)

// <Diagnostic>
{
  "severity": "error" | "warning" | "info",
  "code": "E1" | "E2" | "E3" | "E6" | "E8" | "E12" | "E13" | "E14" | "I1" | "I2",   // 04_tools.md, "Error codes"
  "message": "Syntax error TS1003: Identifier expected.",
  "location?": <Location>,
  "details?": { ... }
}
```

`E14` (since 2026-11-08): the working folder is inside `source_root`; tools must never be run from the source path (`toolset.md`, section 4.5). `I1` and `I2` are M1's only.

## 2. The generic step output file

Every step writes its output files in this one envelope (`DATA-22`). The records sit under the keys `dataNames` names; a reader needs only `dataNames` and the `--info` `fields` map to find them (`DATA-18`).

```jsonc
{
  "tool": "file-symbols",                    // the step's name, as in --info
  "toolVersion": "0.5.0",
  "formatVersion": 3,                        // equals --info outputs[].formatVersion; the Runner's shape check compares them (RUN-18)

  // A step run once per file says which file it read. A step run once says nothing about its inputs (DATA-22):
  // an output records nothing about the data the tool was given (toolset.md, section 4.1).
  "file?": <FileID>,
  "sourceSha256?": <Sha256>,                 // of the source file read; the Runner uses it for staleInputs (RUN-16)

  "dataNames": { "<DataName>": "<jsonKey>", ... },
  "counts?": { ... },                        // optional, for logs; "<thing>Count", never a record array's name. M1 and M3 write it, M2 doesn't
  "<jsonKey>": [ <Record>, ... ],            // one array per data name
  ...
  // No times and no absolute paths: the same input gives the same bytes (FND-29), whatever the input's order (TOOL-35)
}
```

## 3. Generic records

The kind of a record is the `represents` value of its output in `--info`. The `fields` map names which field plays each role (`<role>Field`); the defaults below apply when a role isn't mapped.

```jsonc
// represents: "nodes"
{ "id": <NodeID>, "parent": <NodeID>, "name": "add", "kind": "function", "location": <Location>,
  "owner?": <NodeID>,                        // a node that belongs to another (a scope to its function or file, TOOL-33)
  ... }

// represents: "relations"
{ "id": "...", "from": <NodeID>, "to": <NodeID> | null, "kind": "call", "location": <Location>,
  "reason?": "external" | "no such file" | "not exported" | "unsupported",   // only when "to" is null: unresolved (FND-42)
  ... }

// represents: "containment": re-parents nodes of another data name (VIEW-11)
{ "child": <NodeID>, "parent": <NodeID> }
```

Every node and relation carries a Location (`DATA-01`); the Runner's shape check requires one (`RUN-18`). There are no other kinds: a tool's diagnostics are not data, they go in its `result.json` and on its dry run's go line (sections 7 and 8.2; `DATA-14`, `FND-53`).

## 4. Each step's output

### 4.1 M1 `file-symbols` 0.5.0: `output/<FileKey>.json`

One file per source file. `dataNames`: `{ "code.symbol": "symbols", "code.reference": "references" }`. Its `I1` and `I2` notes go in `result.json` (section 7).

```jsonc
{
  "tool": "file-symbols", "toolVersion": "0.5.0", "formatVersion": 3,
  "file": "src/counter.ts", "sourceSha256": <Sha256>,
  "dataNames": { "code.symbol": "symbols", "code.reference": "references" },
  "counts": {
    "symbolCount": 4, "symbolCountByKind": { "import": 1, "variable": 1, "function": 1, "parameter": 1 },
    "referenceCount": 9, "referenceCountByKind": { "declaration": 4, "write": 1, "read": 3, "call": 1 },
    "unresolvedReferenceCount": 0, "lineCount": 9
  },
  "symbols": [ <Symbol>, ... ],
  "references": [ <Reference>, ... ]
}

// <Symbol>: a node
{
  "id": "src/counter.ts#add@5:17",
  "name": "add",
  "kind": "function" | "variable" | "parameter" | "import",
  "exported": true,                          // declared with export, or named in an export list
  "location": <Location of the name>,
  "range": <Location of the whole declaration>,   // functions: from export or function to the closing brace (FND-09)
  "parent": "src/counter.ts",                // always the FileID
  "import?": { "moduleSpecifier": "./math", "importedName": "round", "typeOnly?": true }   // only on kind "import"
}

// <Reference>: a relation
{
  "id": "src/counter.ts#ref@6:3",
  "name": "total",                           // the identifier as written
  "symbol": "src/counter.ts#total@3:5",      // the same-file declaration, or null ("console", "Math")
  "kind": "declaration" | "call" | "read" | "write",
  "location": <Location of the identifier>,
  "enclosing": "src/counter.ts#add@5:17",    // innermost named function, or the FileID at file level (FND-02)
  "from": "src/counter.ts#add@5:17",         // = enclosing
  "to": "src/counter.ts#total@3:5"           // = symbol
}
```

### 4.2 M2 `cross-file-links` 0.2.0: `output/links.json`

Only the header and the links (`DATA-06`). `dataNames`: `{ "code.link": "links" }`. Links ordered by position: file ID, line, column. No `counts`, no `diagnostics`.

```jsonc
{
  "tool": "cross-file-links", "toolVersion": "0.2.0", "formatVersion": 1,
  "dataNames": { "code.link": "links" },
  "links": [
    { "id": "src/counter.ts#round@1:10->src/math.ts#round@3:17",     // an import, resolved (TOOL-20)
      "from": "src/counter.ts#round@1:10", "to": "src/math.ts#round@3:17", "kind": "import",
      "moduleSpecifier": "./math", "location": <Location of the import's name> },
    { "id": "src/counter.ts#ref@7:10->src/math.ts#round@3:17",       // a use of an imported name (TOOL-23)
      "from": "src/counter.ts#add@5:17", "to": "src/math.ts#round@3:17", "kind": "call" | "read" | "write",
      "moduleSpecifier": "./math", "location": <Location of the use> },
    { "id": "src/main.ts#thing@13:10->",                              // an import, unresolved (TOOL-21, TOOL-24)
      "from": "src/main.ts#thing@13:10", "to": null, "kind": "import",
      "reason": "external" | "no such file" | "not exported" | "unsupported",
      "moduleSpecifier": "./missing", "location": <Location> }
  ]
}
```

### 4.3 M3 `symbol-scope` 0.2.0: `output/scopes.json`

`dataNames`: `{ "code.scope": "scopes", "code.membership": "membership" }`. Lexical scope only, each scope naming its `owner` (`MVP-4`, `TOOL-33`); it keeps `counts` (`DATA-07`); a scope's ID and location start at the declaration start, and the file scope runs from 1:1 to the furthest end among the file's symbols (`TOOL-34`). Memberships are ordered by their scope's file ID and position, then by the symbol's ID, whatever the input's order (`TOOL-35`); errors in `TOOL-36`. As `expected/symbol-scope.json` has it:

```jsonc
{
  "tool": "symbol-scope", "toolVersion": "0.2.0", "formatVersion": 1,
  "dataNames": { "code.scope": "scopes", "code.membership": "membership" },
  "counts": { "scopeCount": 6, "membershipCount": 13 },
  "scopes": [
    { "id": "src/main.ts#scope@file", "kind": "file", "name": "src/main.ts", "owner": "src/main.ts",
      "location": { "file": "src/main.ts", "start": { "line": 1, "column": 1 }, "end": { "line": 10, "column": 2 } },
      "parent": "src/main.ts" },
    { "id": "src/main.ts#scope@4:1", "kind": "function", "name": "run", "owner": "src/main.ts#run@4:10",
      "location": <the function's range>, "parent": "src/main.ts" }
  ],
  "membership": [
    { "child": "src/main.ts#first@5:9", "parent": "src/main.ts#scope@4:1" }     // the contained symbol, its scope (DATA-07)
  ]
}
```

### 4.4 The Runner's file list

The Runner isn't a step, but it provides the file list (`RUN-06`, `RUN-29`), in file-ID order (`RUN-28`): in the database (`project_files`) and in its cache (section 13). The MVP lists files ending in `.ts`, skipping `node_modules`.

```jsonc
{ "id": "src/counter.ts", "sourceBytes": 146, "sourceSha256": <Sha256> }
```

## 5. `--info`

Printed with `--info`, one JSON object, exit 0 (`DATA-08`). The Runner reads the keys marked *(read)*; the others are for people.

```jsonc
{
  "tool": "file-symbols",                                     // (read)
  "toolVersion": "0.5.0",                                     // (read) also part of the fingerprint (RUN-20)
  "description?": "...",
  "invocation": "per-file" | "once",                          // (read)
  "readsFiles": { "filePatterns": [ "*.ts" ], ... } | false,  // (read) an object: reads files, declares source_root; false: reads none (DATA-09)
  "parameters": {                                             // (read)
    "<key>": {
      "dataName": "files.file.id",                            // (read) what fills it (DATA-11, RUN-19, RUN-29)
      "shape": "string" | "array of code.symbol records" | ...,   // (read by the tool helper: string and array shapes)
      "required": true,                                       // (read)
      "affectsOutput": true,                                  // false: optional, default when absent (TOOL-43)
      "description?": "...",
      "whenAbsent?": "<working folder>/zaansouvi/tools/<tool>/"   // store_path's default (DATA-21)
    }
  },
  "outputs": [                                                // (read)
    {
      "dataName": "code.symbol",
      "formatVersion": 3,
      "represents": "nodes" | "relations" | "containment",
      "containedIn?": "files.file",                           // nodes: what their parent is
      "contains?": "code.symbol",                             // containment: whose nodes it re-parents
      "outputFilePattern": "output/<file-key>.json",          // relative to the store
      "jsonKey": "symbols",
      "fields?": { "idField": "id", "parentField": "parent", "labelField": "name", "kindField": "kind", "locationField": "location" }
    }
  ],
  // For people: "options", "exitCodes", "errorCodes" (E1, E2, E3, E6, E8, E12, E13, E14; M1 also I1, I2), "supportedConstructs";
  // M1 also "fileKey", "storeLayout"; M2 also "reasons"
  ...
}
```

The three steps:

| Step | `invocation` | `readsFiles` | `parameters` | `outputs` (data name: jsonKey, represents, `fields`) |
|---|---|---|---|---|
| M1 `file-symbols` 0.5.0 | `per-file` | `{ "filePatterns": ["*.ts"], "parameter": "file_path", "fallback": "source_root + file_id" }` | `file_id`, `file_path`, `source_root`, `store_path` | `code.symbol`: `symbols`, nodes in `files.file` (id, parent, label `name`, kind, location); `code.reference`: `references`, relations (id, from, to, kind, location) |
| M2 `cross-file-links` 0.2.0 | `once` | `false` | `symbols`, `references`, `store_path` | `code.link`: `links`, relations (id, from, to, kind, location) |
| M3 `symbol-scope` 0.2.0 | `once` | `false` | `symbols`, `store_path` | `code.scope`: `scopes`, nodes in `files.file` (id, parent, label `name`, kind, location, owner); `code.membership`: `membership`, containment of `code.symbol` (child, parent) |

## 6. Parameters in, `last_run.json`

### 6.1 Parameters (`--json` file, `--stdin`, or command-line options)

A flat object; extra keys are ignored (`TOOL-08`). Read in order: command-line options, then `--json` or `--stdin`, then `last_run.json`, which is only ever a complete input (`TOOL-02`, `TOOL-43`). Every parameter whose shape is a string also has an option: `file_id` gives `--file-id` (the tool helper).

| Step | Key | Data name | Shape | Required | Affects output | From the Runner |
|---|---|---|---|---|---|---|
| M1 | `source_root` | `project.source_root` | string | yes | yes | the source root, saved or from the command line (`RUN-29`) |
| M1 | `file_id` | `files.file.id` | string | yes | yes | the file list |
| M1 | `file_path` | `files.file.path` | string | no | yes | the file list (absolute; relative is resolved against `source_root`) |
| M1 | `store_path` | `zaansouvi.store_path` | string | no | no | saved, else `<zaansouvi-mvp>/data/tools/<tool>` (`RUN-26`) |
| M2 | `symbols` | `code.symbol` | array of `<Symbol>` | yes | yes | M1's symbol records, flat, in file order (`RUN-19`) |
| M2 | `references` | `code.reference` | array of `<Reference>` | yes | yes | M1's reference records, flat, in file order |
| M2 | `store_path` | `zaansouvi.store_path` | string | no | no | as for M1 |
| M3 | `symbols` | `code.symbol` | array of `<Symbol>` | yes | yes | as for M2 |
| M3 | `store_path` | `zaansouvi.store_path` | string | no | no | as for M1 |

Run by hand with no `store_path`, a tool's store is `./zaansouvi/tools/<tool>/` in the folder it was started from (`DATA-21`); started inside `source_root`, it stops with `E14`. The Runner starts every tool with the data folder as its working folder (`RUN-32`), and sends each only the records it asks for (`RUN-19`).

```jsonc
// M1, from the Runner (DATA-12)
{ "source_root": "<Path>", "file_id": "src/math.ts", "file_path": "<Path>", "store_path": "<Path>" }

// M2, from the Runner (DATA-13); M3 the same without "references"
{ "symbols": [ <Symbol>, ... ], "references": [ <Reference>, ... ], "store_path": "<Path>" }
```

### 6.2 `last_run.json`, in the tool's store

The flat parameters of the last real run that passed the shape check, so it can be passed back with `--json`, plus `_last_run`, which a tool removes when reading it (`DATA-15`). It sits in the store, so copying a data folder elsewhere and running a tool there by hand picks it up (`FND-59`).

```jsonc
{
  "source_root": "<Path>", "file_id": "src/math.ts",   // the step's own parameters; never store_path: the store is where this file is
  "_last_run": {
    "tool": "file-symbols", "toolVersion": "0.5.0",
    "outcome": "started" | "succeeded" | "failed",    // "started" is overwritten when the run ends
    "started": <Time>,
    "finished?": <Time>,
    "error?": <Diagnostic>,
    "resultPath?": "<Path to result.json>"
  }
}
```

A `store_path` found in an older `last_run.json` is dropped when read.

## 7. `result.json`, in the step's store

Written by the tool helper after every real run that passed the shape check (`DATA-14`). The Runner reads it right after each invocation (`RUN-09`); for a step run once per file it describes only the last file, and the Runner's cache keeps every invocation's result (`RUN-27`).

```jsonc
{
  "tool": "file-symbols", "toolVersion": "0.5.0",
  "status": "succeeded" | "failed",
  "mode": "real",
  "started": <Time>, "finished": <Time>, "durationMs": 43,
  "parameterSource": "json" | "stdin" | "last_run" | "command line" | "command line + last_run",
  "nonOutputParameterSources": { "store_path": "input" | "default" },   // TOOL-43
  "effectiveParameters": { ... },            // the values the run used; --info "parameters" describes them
  "read?": { "file_id": "src/math.ts", "sourcePath": "<Path>", "sourceBytes": 158, "sourceSha256": <Sha256> },   // M1
  "outputPaths": [ "<Path>", ... ],          // empty when failed
  "outputChange?": "create" | "update" | "unchanged",   // over all output files
  "counts?": { ... },                        // M1 and M3: as in their output; M2: linkCount, importLinkCount, useLinkCount, unresolvedCount
  "diagnostics": [ <Diagnostic>, ... ],      // the run's notes, such as M1's I1 and I2; empty when none (DATA-14, FND-53)
  "error?": <Diagnostic>,                    // only when failed
  "logPath": "<Path to this run's log>"
}
```

## 8. Logs and standard output lines

### 8.1 A step's log: `logs/<timestamp>[_<FileKey>].log` (DATA-16)

```
<Time>\t<level>\t<event>\t<JSON details>
# [<type>] free text            (comments: dropping them loses no fact)
```

| Event | Written by | Details |
|---|---|---|
| `run_started` | tool helper | `tool`, `toolVersion`, `mode`, `parameterSource`, `nonOutputParameterSources`, `effectiveParameters`, `argv`, `programDir`, `storePath`, `logCopyPath` |
| `last_run_saved` | tool helper | `lastRunPath` |
| `output_written` | tool helper | `outputPath`, `outputChange`, `dataNames` |
| `run_failed` (error) | tool helper | `error`, then a `# [hint]` comment when the tool has one |
| `run_finished` | tool helper | `status`, `durationMs`, `resultPath` |
| `log_copy_failed` (warn), `result_not_written` (error) | tool helper | `logCopyPath`, `errorText` |
| `input_resolved`, `file_read`, `diagnostic`, `analysis_done` | M1 | `file_id`, `sourcePath`, `storePath`; `sourceBytes`, `sourceSha256`; a Diagnostic; the `counts` |
| `input_checked`, `links_done` | M2 | `symbolCount`, `referenceCount`; the `counts` |

Comment types: `run`, `step`, `hint`.

### 8.2 A step's standard output

| Situation | Lines |
|---|---|
| Real run | one summary line |
| Dry run | log lines, comment lines, a preview line per output file (M1 only), then a go or no-go line (`DATA-17`) |
| Invocation error | a message and one JSON line on standard error; in a dry run also a no-go line on standard output (`FND-13`) |

```jsonc
// real run, the only line ("file_id" is M1's identity; M2 and M3 have none)
{ "status": "succeeded", "file_id?": "src/math.ts", "outputPath": "<Path>", "outputPaths": [ "<Path>" ],
  "outputChange": "create" | "update" | "unchanged", "counts?": { ... }, "logPath": "<Path>" }
{ "status": "failed", "file_id?": "src/nope.ts", "error": <Diagnostic>, "logPath": "<Path>" }

// dry run
{ "type": "log", "time": <Time>, "level": "info", "event": "file_read", "details": { ... } }
{ "type": "comment", "commentType": "step", "text": "reading src/math.ts" }
{ "type": "preview", "outputPath": "<Path>", "outputChange": "...", "wouldWrite": [ "<Path>", ... ], "content": <the output file> }   // M1
{ "dryRun": "go", "tool": "...", "toolVersion": "...", "file_id?": "...", "counts?": { ... }, "diagnostics": [ <Diagnostic>, ... ] }      // last line
{ "dryRun": "no-go", "errorKind": "run" | "invocation", "tool": "...", "toolVersion": "...", "file_id?": "...", "error": <Diagnostic> }

// invocation error, on standard error after a plain-text message line
{ "invocationError": <Diagnostic> }
```

## 9. Runner events, log and lock

### 9.1 Events: Viewer mode, one JSON object per line on standard output (`03_runner.md`)

```jsonc
{ "event": "run_started",  "runId": <RunID>, "mode": "real" | "dry-run", "sourceRoot": "<Path>", "time": <Time> }
{ "event": "files_listed", "fileCount": 3 }
{ "event": "tool_skipped", "tool": "file-symbols", "file_id?": "src/math.ts", "refreshReason": "up-to-date" }
{ "event": "tool_dry_run", "tool": "file-symbols", "file_id?": "src/math.ts",
  "refreshReason": "missing" | "never-run" | "last-failed" | "inputs-changed" | "upstream-refresh" | "up-to-date",
  "dryRun": "go" | "no-go", "errorKind?": "run" | "invocation", "error?": <Diagnostic>, "staleInputs": [ <FileID>, ... ] }
{ "event": "tool_run", "tool": "file-symbols", "file_id?": "src/math.ts", "status": "succeeded" | "failed",
  "error?": <Diagnostic>, "logPath?": "<Path>", "outputChange?": "create" | "update" | "unchanged" }
{ "event": "run_finished", "runId": <RunID>, "outcome": "succeeded" | "failed", "exitCode": 0 | 1 | 2, "time": <Time>, "logPath": "<Path>" }
{ "event": "run_refused", "error": <Diagnostic>, "exitCode": 2 }       // a run that couldn't start; error.code names why (FND-43)
{ "event": "cache", "cache": <the Runner's cache, section 13> | null }  // --read-cache only
```

`run_refused` codes: `invocation`, `source-root-missing`, `source-root-unreadable`, `lock-held`, `database-version`, `tools-folder-missing`, `tool-info-failed`, `tool-info-inconsistent`, `no-provider`, `data-produced-twice`, `order-cycle`, `provided-value-invalid`, `cache-unreadable`.

### 9.2 The Runner's log: `data/runner/logs/<timestamp>.log`

The same format as 8.1. Besides every event above (except `cache`):

| Event | Details |
|---|---|
| `runner_started` | `runId`, `mode`, `sourceRoot`, `argv`, `pid` |
| `stale_lock_taken_over` (warn) | `previous`: the old lock |
| `tool_folder_skipped` | `folder`, `reason` |
| `tools_ordered` | `order`, `stores` |
| `tool_invoked` | `tool`, `file_id?`, `mode` (`dry-run` or `real`), `argv`, `json`: the exact command line and JSON sent (`RUN-15`) |
| `tool_dry_run_result` | `tool`, `file_id?`, `dryRun`, `exitCode`, `lastLine`, `stderr?` |
| `tool_real_run_result` | `tool`, `file_id?`, `status`, `exitCode`, `resultPath`, `error?`, `stderr?` |
| `tool_log_read`, `tool_log_unreadable` (warn) | `tool`, `file_id?`, `logPath`, `entryCount`, `errors` |
| `cache_written` | `path`, `part`: `whole cache` or `dryRun only` |

Comment types: `run`, `step`, `runner-bug`.

### 9.3 The lock: `data/runner/run.lock` (`RUN-30`)

```jsonc
{ "pid": 102921, "runId": <RunID>, "started": <Time> }
```

## 10. The Viewer's graph model

Built by the Viewer backend from the Runner's cache alone (`VIEW-03`, `BE-50` to `BE-55`), sent to the page (section 17) and stored as each source's last good graph (section 16). Format 1. It carries no build time, so the same cache gives the same bytes. Node and edge styles are not in it: the page picks them from `dataName` and `kind` (`UI-41`), and lays the graph out itself (`UI-32`, `UI-37`).

```jsonc
{
  "formatVersion": 1,                        // a stored entry in another format is refused, never guessed (BE-34)
  "viewerVersion": "0.1.0",
  "sourceKey": <SourceKey>,
  "sourceRoot": "<Path>",
  "run": { "runId": <RunID>, "finished": <Time>, "outcome": "succeeded" },   // the Runner's run it was built from
  "files": [ <FileID>, ... ],                // the cache's file list, in order

  "nodes": [ <ModelNode>, ... ],             // files first in file order, then by ID
  "relations": [ <ModelRelation>, ... ],     // every relation kept, by ID: for details and unresolved counts
  "levels": { "": <View>, "<NodeID>": <View>, ... },   // one view per enterable node; "" is the top level
  "checks": { "invalid": [ <Invalid>, ... ], "extra": [ <Extra>, ... ] }
}

// <ModelNode>
{ "id": <NodeID>,
  "kind": "file" | "function" | "variable" | "parameter" | "import" | ...,   // the record's kind; files are "file"
  "dataName": "files.file" | "code.symbol" | "code.scope" | ...,            // where it came from
  "tool?": "file-symbols",                   // absent on files, which the Runner provides
  "label": "add",                            // the label role; a file's name for files
  "container": <NodeID> | null,              // the node it is shown inside, after containment (VIEW-11); null for files
  "location?": <Location>,                   // absent on files
  "owner?": <NodeID> }                       // the owner role, when declared: a scope's function symbol or file (TOOL-33)

// <ModelRelation>
{ "id": "...", "from": <NodeID>, "to": <NodeID> | null, "kind": "call" | "read" | "write" | "import",
  "dataName": "code.reference" | "code.link" | ..., "tool": "file-symbols",
  "location": <Location>,
  "reason?": "external" | ...,               // when unresolved
  "label?": "console" }                      // the record's "name", when it has one: names unresolved relations
// References of kind "declaration" are dropped (UI-34).

// <View>: what is drawn when a node is entered (BE-53)
{ "nodes": [ <NodeID>, ... ],                // the entered node's direct children: drawn inside it
  "stubs": [ <NodeID>, ... ],                // ends outside it, each at the child of the lowest common ancestor
  "thisNode": <NodeID> | null,               // the entered node itself, when edges reach it ("this scope", UI-36)
  "edges": [ { "id": <EdgeID>, "from": <NodeID>, "to": <NodeID>,
               "kind": "call" | "read" | "write" | "import" | "mixed",   // "mixed" when the members differ
               "count": 2,                   // how many relations it stands for
               "members": [ <relation id>, ... ] } ],                     // VIEW-13
  "unresolved": [ <relation id>, ... ] }     // relations with "to" null whose "from" lands in this view

// <Invalid>: a record skipped by the checks (BE-60)
{ "dataName": "code.membership", "tool": "symbol-scope", "recordId": "<id, or #<index> without one>",
  "problem": "the child isn't a known node" }

// <Extra>: data the Viewer found and doesn't use, listed once per data name (BE-60)
{ "dataName": "code.symbol", "tool": "file-symbols", "what": "represents" | "keys",
  "detail": "not read by the Viewer: exported, import, range" }
```

**Lifting** (`VIEW-13`, `BE-53`): each relation's ends are first moved to their owners' scopes (an edge at a function symbol starts or ends at its scope: the mirror rule); each end is then placed in the view as a child of the entered node, as the entered node itself, or as a stub; an edge with both ends on one node is dropped; edges with the same two ends are merged.

## 11. Review notes and open points

- **The summary line** of a real run carries `outputPaths` as well as `outputPath`, from the tool helper; `DATA-17` doesn't list either.
- **M1's dry run prints a preview line**; M2's and M3's don't (`TOOL-24`). The Runner uses neither (`RUN-16`).
- **`tool_invoked` logs the full JSON sent**, which for M2 and M3 holds every symbol record, and for M2 every reference.
- **File nodes and merged edges have no location** (`DATA-01` doesn't cover them).
- **`--info` declares no settings yet**; the config manager needs that.
- **No reader checks the Runner cache's `formatVersion`** yet; the Viewer checks only its own stored graph's (section 16).
- **Record keys the Viewer doesn't read count as extra data**, so the test source always shows three extra items (section 10, `<Extra>`). Whether they should is open (`FND-69`).
- **The Viewer's event names and the verbosity of each** are the backend's (section 15); `UI-62` suggested most of them.

## 12. Key names (`DATA-19`)

Each key name has one meaning, with one shape, wherever it appears.

**Generic keys** describe the record or object they sit on: `id`, `name`, `kind`, `parent`, `location`, `range`, `description`, `status`, `error` (always a Diagnostic, except in the Viewer API's error answer, section 17), `counts`, `tool` (a step name).

| Key | Meaning | Not to be confused with |
|---|---|---|
| `toolVersion` | a step's version, `"0.5.0"` | `formatVersion`, `viewerVersion` |
| `formatVersion` | the version of a file's layout: an output file and its `--info` output entry, the Runner's cache, the Viewer's graph model and `sources.json` | `toolVersion` |
| `viewerVersion` | the Viewer's version, in its graph model | `toolVersion` |
| `file` | a FileID | `files`, the `...Path` keys |
| `files` | a file list: the Runner's file entries (section 4.4), or the graph model's FileIDs | `symbols` |
| `file_id` | a FileID, as a parameter (parameters use snake case) | |
| `symbols` | an array of `code.symbol` records: in M1's output, and as M2's and M3's parameter | `files` |
| `references` | an array of `code.reference` records: in M1's output, and as M2's parameter | |
| `source_root` | parameter: the examined source's root; declaring it marks a step that reads files (`DATA-09`) | `sourceRoot`, the same folder in Runner events, the caches and the Viewer |
| `store_path` | parameter: the folder that is the step's store (`DATA-21`) | `storePath`, the same folder in logs |
| `readsFiles` | in `--info`: the file patterns a step reads, or `false` (`DATA-09`) | |
| `affectsOutput` | in `--info` parameters: whether the parameter can change the output (`TOOL-43`) | |
| `from`, `to` | the source and target NodeID of a relation or edge; a relation's `to` may be `null` | `import.moduleSpecifier` |
| `reason` | on a relation whose `to` is `null`: why it wasn't resolved; in the Viewer API, why a graph isn't the latest | `refreshReason` |
| `refreshReason` | why the Runner ran, dry-ran or skipped an invocation (`RUN-20`) | `reason` |
| `import.moduleSpecifier`, `moduleSpecifier` | a module specifier as written | `from` |
| `import.importedName` | the name the imported module exports it under | the symbol's `name` |
| `enclosing` | on a reference: the innermost named function around it, or the FileID (`FND-02`) | `from`, which equals it |
| `child`, `parent` (containment) | the contained node and its container | |
| `owner` | on a scope: the node it belongs to, the function symbol or the file (`TOOL-33`) | `parent`, its container |
| `parameters` | `--info` only: the description of each parameter | `effectiveParameters` |
| `effectiveParameters` | the parameter values a run used | `parameters` |
| `outputs` | `--info` only: the description of each output | `outputPaths` |
| `outputPath`, `outputPaths` | absolute paths of output files written, or to be written in a dry run | `outputFilePattern` |
| `outputFilePattern` | `--info` only: where an output file sits in the store | `outputPath` |
| `outputChange` | `create`, `update` or `unchanged`, for output files | |
| `sourcePath`, `sourceBytes`, `sourceSha256` | the examined source file read: path, size, hash | |
| `resultPath`, `logPath`, `logCopyPath`, `lastRunPath`, `storePath` | absolute paths of those files and folders | |
| `nonOutputParameterSources` | for each parameter with `affectsOutput: false`: `input` or `default` | `parameterSource` |
| `<thing>Count`, `<thing>CountByKind` | numbers in `counts`; never a record array's name | `symbols`, `references`, `count` |
| `count` | on an edge of a Viewer view: how many relations it stands for (`BE-53`) | `counts` |
| `errorKind` | `run` or `invocation`, on a no-go line | record `kind` |
| `errorText` | a plain error message, where no Diagnostic exists | `error` |
| `<role>Field` | in `--info` `fields`: which record field plays that role | the record fields themselves |
| `dataRef` | in the Runner's cache: which output a group's records came from, `<tool>:<FileID>` or `<tool>` | |
| `dataName` | a data name (section 1): in `--info`, and on each node, relation and check item of the Viewer's model | `dataNames`, the output file's map |
| `runId`, `exitCode`, `fileCount`, `staleInputs` | in Runner events, the caches and the Viewer | |
| `level` | the severity of a log entry: `info`, `warn` or `error` (`DATA-16`) | `verbosity`, `levels` |
| `levels` | in the Viewer's graph model: one view per enterable node (`BE-50`) | `level` |
| `verbosity` | in the Viewer's activity log: how much detail an entry belongs to, `minimal`, `normal` or `verbose` (`VIEW-17`, `UI-62`) | `level`, the severity |
| `actor` | in the Viewer's activity log: who did what the entry records, `user` or `app` (`UI-62`) | `tool` |
| `text` | free text for people: a comment's text (section 8.2), or the sentence an activity log entry shows (section 15) | `message`, a Diagnostic's message |
| `runnerEvent` | in the Viewer's activity log: a Runner event (section 9.1), nested whole, so its own keys keep their meaning | `event`, the entry's own event name |
| `nodeId` | in the Viewer's activity log and API: the NodeID or EdgeID the user acted on; `""` for the top level | `id`, the record's own ID |
| `port` | the TCP port the Viewer backend listens on | |
| `label` | in the Viewer's model: the text a node is named by, or an unresolved relation's name (`BE-51`, `BE-52`) | `name`, the record's own |
| `container` | in the Viewer's graph model: the node a node is shown inside, after containment (`BE-50`, `VIEW-11`) | `parent`, the record's own container |
| `thisNode` | in a view of the graph model: the entered node itself, when edges reach it (`BE-53`, `UI-36`) | |
| `stubs` | in a view: nodes outside the entered node that edges reach (`BE-53`) | `nodes` |
| `members` | on an edge of a view: the IDs of the relations it stands for (`BE-53`) | |
| `unresolved` | in a view: the IDs of its unresolved relations | `reason` |
| `checks`, `invalid`, `extra` | in the Viewer's graph model: what its checks found (`BE-60`) | `diagnostics` |
| `recordId` | in the model's checks: the ID of the record found invalid, or `#<index>` without one (`BE-60`) | `id` |
| `problem` | in the model's checks: why a record is invalid | `error` |
| `what`, `detail` | in the model's checks: what kind of extra data was found (`represents` or `keys`), and which | `kind` |
| `item` | in the Viewer's activity log: the invalid record or extra data an entry is about (`BE-105`) | |
| `sourceKey`, `source` | the Viewer's key for an examined source (section 1); `source` holds one in the Viewer's API | `sourceRoot`, the folder itself |
| `current` | the Viewer's API: the source key the page has open | |
| `which` | the Viewer's API: `auto` or `last-good`, the graph asked for (`BE-57`) | |
| `firstLine`, `lines` | the Viewer's `/api/source` answer: the first line's number, and the lines (`BE-72`) | |
| `lastGood` | the Viewer's `/api/graph` answer: the stored graph's run, `runId` and `finished` (`BE-57`) | |
| `running` | the Viewer's live stream: whether a run is in progress | |
| `diagnostics` | a run's notes: in `result.json`, on a dry run's go line, and in the Runner's cache (`DATA-14`). Not a data name (`FND-53`) | `error`, `checks` |

## 13. The Runner's cache (`RUN-27`)

`data/runner/cache.json`, what `--read-cache` prints. A real run replaces it whole, failed runs included; a dry-run-only pass replaces only `dryRun` (with no earlier cache, the file holds only `formatVersion` and `dryRun`). It holds the last run of whichever source was run last; the Viewer keeps each source's graph itself (section 16).

```jsonc
{
  "formatVersion": 1,
  "run": { "runId": <RunID>, "mode": "real", "outcome": "succeeded" | "failed", "exitCode": 0 | 1,
           "started": <Time>, "finished": <Time>, "sourceRoot": "<Path>", "logPath": "<Path>" },
  "files": [ { "id": <FileID>, "sourceBytes": 146, "sourceSha256": <Sha256> }, ... ],   // file-ID order
  "tools": [ { "tool": "file-symbols", "position": 1, "info": <--info> }, ... ],           // run order
  "invocations": [
    { "tool": "file-symbols", "file_id?": "src/counter.ts",
      "refreshReason": "missing" | ... | "up-to-date",
      "input": { ... },                      // the JSON sent; a value that is another step's output is its dataRefs: [ "file-symbols:src/counter.ts", ... ]
      "dryRun?": { "dryRun": "go" | "no-go", "errorKind?": "...", "error?": <Diagnostic>, "diagnostics?": [ <Diagnostic>, ... ] },
      "result?": <result.json>,              // absent when skipped
      "skipped?": true }
  ],
  "data": {                                  // only tools in the record and files in the list (FND-06)
    "<DataName>": {
      "represents": "nodes" | "relations" | "containment",
      "containedIn?": "files.file", "contains?": "code.symbol", "fields?": { ... },   // from --info
      "outputs": [ { "tool": "file-symbols", "dataRef": "file-symbols:src/counter.ts", "file?": "src/counter.ts", "records": [ ... ] }, ... ]
    }
  },
  "dryRun?": {                               // the latest dry-run-only pass; dropped by a real run
    "runId": <RunID>, "time": <Time>,
    "invocations": [ { "tool": "...", "file_id?": "...", "refreshReason": "...", "dryRun": "go" | "no-go",
                       "error?": <Diagnostic>, "diagnostics?": [ <Diagnostic>, ... ], "staleInputs": [ ... ] } ]
  }
}
```

## 14. Parameters and keys the programs know by name

Everything else is learned from `--info`: the Runner matches parameters to data by data name and finds records by `jsonKey` and `fields` (`DATA-18`, `RUN-25`), so a step's own parameter keys and record keys need no change in the Runner.

### 14.1 Data names the Runner provides (`RUN-29`)

| Data name | Value | Sent to |
|---|---|---|
| `files.file.id` | the file's ID | steps run once per file |
| `files.file.path` | the file's absolute path | steps run once per file |
| `project.source_root` | the source root: from the command line, else saved in `config_settings` | steps that read files (`DATA-09`) |
| `zaansouvi.store_path` | saved as `store_path.<tool>` in `config_settings`, else `<zaansouvi-mvp>/data/tools/<tool>` | every step that declares it |

Any data name starting with `files.file.`, `project.` or `zaansouvi.` counts as provided by the Runner; a required one it doesn't know stops the run before any step starts (`no-provider`).

### 14.2 Known parameter keys and data names

| Name | Known by | Rule |
|---|---|---|
| `source_root` (data name `project.source_root`) | the Runner (`app/shared/types.ts`) and the tool helper (`E14`) | declared, required, exactly when `readsFiles` is an object (`DATA-09`, `tool-info-inconsistent`) |
| `store_path` | the tool helper (`app/tool-helper/tool.ts`) | the store, else `./zaansouvi/tools/<tool>/` in the working folder (`DATA-21`). The Runner fills it by data name `zaansouvi.store_path`; the two must agree |

### 14.3 Keys the Runner and the Viewer read from steps' files

| File | Keys |
|---|---|
| `--info` | `tool`, `toolVersion`, `invocation`, `readsFiles` (`filePatterns`), `parameters` (`dataName`, `required`), `outputs` (`dataName`, `formatVersion`, `represents`, `containedIn`, `contains`, `outputFilePattern`, `jsonKey`, `fields`) |
| `fields` roles | `idField`, `parentField`, `labelField`, `kindField`, `fromField`, `toField`, `childField`, `locationField`, `ownerField`; defaults `id`, `parent`, `name`, `kind`, `from`, `to`, `child`, `location`, `owner`. The Viewer also reads `reason` and `name` on relations (`BE-52`) |
| An output file's header | `formatVersion`; `sourceSha256` (for `staleInputs`) |
| `result.json` | `tool`, `status`, `error`, `logPath`, `outputChange` |

### 14.4 Keys the tool helper reads from `--info`

`tool`, `toolVersion`, and for each parameter `shape` (string or array), `required` and `affectsOutput`: they drive the options, the generic shape check and `nonOutputParameterSources`.

## 15. The Viewer's activity log

`data/viewer/activity.log`, one file, appended; only one backend uses it, so it may be deleted and recreated at any time, and the activity line can clear it (`VIEW-17`, `UI-71`, `UI-72`). Each entry opens, appends and closes the file (`BE-81`). The format is the shared log format of section 8.1 (`DATA-16`); the details of every entry hold `verbosity`, `actor` and `text`, and the facts as their own keys. Counts go in `counts`, as everywhere (section 12).

```
# [session] zaansouvi-view 0.1.0, port 4310             (a comment for people; dropping it loses no fact)
<Time>\tinfo\tviewer_started\t{"verbosity":"minimal","actor":"app","text":"Viewer 0.1.0 started on port 4310","port":4310}
<Time>\tinfo\tsource_opened\t{"verbosity":"normal","actor":"user","text":"You opened folder \"<Path>\" for examination","sourceRoot":"<Path>"}
<Time>\tinfo\tcached_graph_loaded\t{"verbosity":"normal","actor":"app","text":"Loaded the graph from the run of 2026-11-09 07:39","runId":<RunID>}
<Time>\tinfo\tdry_run_requested\t{"verbosity":"normal","actor":"user","text":"You started a dry run","sourceRoot":"<Path>"}
<Time>\tinfo\trunner_event\t{"verbosity":"verbose","actor":"app","text":"0 files listed","runnerEvent":{"event":"files_listed","fileCount":0}}
<Time>\twarn\tdry_run_result\t{"verbosity":"minimal","actor":"app","text":"Dry run resulted in 1 no-go: 0 of 1 go","counts":{"goCount":0,"noGoCount":1}}
<Time>\tinfo\trun_requested\t{"verbosity":"normal","actor":"user","text":"You executed a manual run","sourceRoot":"<Path>"}
<Time>\tinfo\trun_result\t{"verbosity":"minimal","actor":"app","text":"Run succeeded: 2 ran, 3 skipped, 0 errors","outcome":"succeeded","counts":{"ranCount":2,"skippedCount":3,"errorCount":0}}
<Time>\tinfo\toutput_checked\t{"verbosity":"normal","actor":"app","text":"Checked the run's output: 0 records invalid, 3 extra","runId":<RunID>,"counts":{"invalidCount":0,"extraCount":3}}
<Time>\tinfo\toutput_checked\t{"verbosity":"verbose","actor":"app","text":"Extra: code.symbol: not read by the Viewer: exported, import, range","item":<Extra>}
<Time>\tinfo\tlevel_entered\t{"verbosity":"verbose","actor":"user","text":"You entered main.ts","nodeId":"src/main.ts"}
<Time>\tinfo\tnode_selected\t{"verbosity":"verbose","actor":"user","text":"You selected scope run","nodeId":"src/main.ts#scope@4:1"}
<Time>\twarn\trun_refused\t{"verbosity":"minimal","actor":"app","text":"Run refused: a run is already in progress"}
<Time>\tinfo\tlog_cleared\t{"verbosity":"normal","actor":"user","text":"You cleared the log"}      (the first entry of a cleared file)
```

The events the backend writes, with their usual severity, verbosity and actor:

| Event | Level | Verbosity | Actor | Facts |
|---|---|---|---|---|
| `viewer_started` | info | minimal | app | `port` |
| `viewer_stopped` | info | minimal | app | |
| `source_added`, `source_opened` | info | normal | user | `sourceRoot` |
| `cached_graph_loaded` | info | normal | app | `runId` |
| `run_requested`, `dry_run_requested` | info | normal | user | `sourceRoot` |
| `run_refused` | warn | minimal | app | |
| `runner_event` | info | verbose | app | `runnerEvent` |
| `run_result` | info, or error when failed | minimal | app | `outcome`, `counts` (`ranCount`, `skippedCount`, `errorCount`) |
| `dry_run_result` | info, or warn with a no-go | minimal | app | `counts` (`goCount`, `noGoCount`) |
| `output_checked` | info | normal (the counts), verbose (one per item) | app | `runId`, `counts` (`invalidCount`, `extraCount`); or `item` |
| `output_partly_invalid` | warn | minimal | app | `runId` |
| `entry_unusable` | warn | minimal | app | |
| `level_entered`, `level_left`, `node_selected` | info | verbose | user | `nodeId` |
| `log_opened`, `graph_switched` | info | normal | user | |
| `log_cleared` | info | normal | user | |
| `backend_warning` | warn | minimal or normal | app | `sourceRoot`, when about a source |
| `backend_error` | error | minimal | app | |

- **Event names** are the Viewer's own and never reuse a Runner event name: `run_result` and `dry_run_result`, not `run_finished`. A Runner event appears only nested, under `runnerEvent`.
- **`level`** is the severity, as in every log; **`verbosity`** is the activity line's filter. A refused run is `warn` whatever its verbosity, so the line can show it in red.
- **The page reports only an event name and a node ID** (section 17); the backend writes the sentence, from the node's label, and refuses an unknown event name (`BE-82`).

## 16. The Viewer's own store

`data/viewer/`, written only by the Viewer backend (`VIEW-06`, `BE-30` to `BE-34`); it can be deleted at any time, and clearing the Runner's and the tools' data leaves it alone (`VIEW-09`). Every JSON file is written atomically.

```jsonc
// data/viewer/sources.json: the sources added, rebuilt from the entries if missing or unreadable
{
  "formatVersion": 1,
  "sources": [
    { "sourceKey": <SourceKey>, "sourceRoot": "<Path>",      // the real path, as added
      "name": "test-source",                                  // the folder's name, for the source picker
      "runId?": <RunID>, "finished?": <Time> }                // the stored graph's run, when there is one
  ]
}

// data/viewer/sources/<SourceKey>/last-good-graph.json: the graph model of section 10, as built
// from the source's last run whose output was usable; replaced only by a newer usable run (BE-57)
```

```
data/viewer/
  sources.json
  sources/<SourceKey>/last-good-graph.json
  activity.log                               (section 15)
```

## 17. The Viewer's API and live stream

Served on `127.0.0.1` only, to the page the backend serves (`BE-10` to `BE-14`): the printed URL's one-time `token` becomes an HttpOnly, SameSite=Strict cookie; every request must carry it, name the backend's own `Host`, and, if it changes anything, its own `Origin`. Bodies are JSON, at most 64 KiB. Every error answer is `{ "error": "<a sentence for people>" }` with its status: 400, 403, 404, 409 (a run is in progress) or 500.

| Request | Body or query | Answer |
|---|---|---|
| `GET /api/sources` | | `{ "current": <SourceKey> \| null, "sources": [ <the entries of sources.json> ] }` |
| `POST /api/sources` | `{ "sourceRoot": "<Path>" }` | 201 (added) or 200 (known): the source entry |
| `POST /api/sources/current` | `{ "source": <SourceKey> }` | 204 |
| `GET /api/graph` | `?source=<SourceKey>&which=auto\|last-good` | `<GraphAnswer>` |
| `GET /api/tools` | `?source=<SourceKey>` | `{ "tools": [ { "tool", "position", "toolVersion" } ], "run": <cache run> \| null, "invocations": [ { "tool", "file_id", "refreshReason", "skipped", "dryRun", "result" } ], "dryRun": <cache dryRun> \| null }` |
| `POST /api/run`, `POST /api/dry-run` | `{ "source": <SourceKey> }` | 202 `{ "started": "run" \| "dry-run" }` |
| `GET /api/source` | `?source=<SourceKey>&file=<FileID>&line=<n>` | `{ "file": <FileID>, "firstLine": 3, "lines": [ "<text>", ... ] }`: the line and two around it |
| `GET /api/log` | `?path=<Path to a .log under data/>` | the log, as plain text |
| `POST /api/activity` | `{ "event": "level_entered" \| "level_left" \| "node_selected" \| "log_opened" \| "graph_switched", "source?": <SourceKey>, "nodeId?": "<NodeID or EdgeID>", "path?": "<Path>", "which?": "auto" \| "last-good" }` | 204 |
| `POST /api/activity/clear` | | 204 |
| `GET /api/events` | | the live stream, below |

```jsonc
// <GraphAnswer> (BE-57)
{ "status": "latest"           // the graph of the source's latest run
          | "stored"           // the stored graph; the Runner's cache is another source's
          | "partly-invalid"   // the latest run had invalid records; the last good graph is shown
          | "last-good"        // the last good graph, asked for or because the last run failed
          | "no-good-data" | "no-run" | "unusable",   // nothing to show, and why
  "reason?": "Not the latest: the last run failed.",
  "model?": <the graph model, section 10>,
  "lastGood?": { "runId": <RunID>, "finished": <Time> } }
```

**The live stream** (`GET /api/events`, server-sent events, `BE-70`): on connecting, every activity entry so far, then the run state; afterwards as they happen.

| Event | Data |
|---|---|
| `activity` | an activity entry: `{ "time", "level", "event", "verbosity", "actor", "text", <facts> }` (section 15) |
| `run_state` | `{ "running": true, "kind": "run" \| "dry-run", "source": <SourceKey> }` or `{ "running": false, ... }` |
| `runner` | a Runner event, as received (section 9.1) |
| `graph_updated` | `{ "source": <SourceKey>, "kind": "run" \| "dry-run" }`: a run ended; the page asks for the graph again |
