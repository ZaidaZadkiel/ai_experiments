# Proposed JSON schema for every step: current parameters of input and output

**Status:** the reference schema of the MVP (`DATA-20`), current on 2026-11-08. It describes what the code produces today: M1 `file-symbols` 0.5.0, M2 `cross-file-links` 0.2.0, the tool helper and the Runner. M3 `symbol-scope` is not built; its parts follow `02_data_contracts.md` and are marked *(proposed, not built)*. It replaces `26-11-08 004014 Proposed generic JSON schema for every step, derived from M1 output.md`, kept for history, and keeps its section numbers, so references such as "the schema, section 13" still hold. Section 14 is new: the parameters and keys the programs know by name.

It is for people and log readers; nothing validates against it at run time (the Runner's own check is `RUN-18`). Every key name has one meaning wherever it appears (`DATA-19`, section 12).

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
10. Viewer graph model
11. Review notes and open points
12. Key names (`DATA-19`)
13. The Runner's cache (`RUN-27`)
14. Parameters and keys the programs know by name

## 1. Building blocks

```jsonc
// <Time>      ISO 8601, UTC, with milliseconds: "2026-11-08T05:51:42.776Z"
// <Path>      absolute path on this machine. In results, logs, last_run.json, events and the cache; never in a step's output file
// <Sha256>    64 lowercase hex characters, of the bytes named
// <FileID>    path relative to the source root, "/" separators: "src/counter.ts"
// <FileKey>   FileID with "/" replaced by "__": "src__counter.ts" (ARCH-07); output files add ".json"
// <DataName>  dotted name of a kind of data: "code.symbol", "files.file.id"

// <Position>  { "line": 5, "column": 17 }   both start at 1
// <Location>  { "file": <FileID>, "start": <Position>, "end": <Position> }   end is exclusive

// IDs, stable for an unchanged source (DATA-02 to DATA-04)
// <SymbolID>     "<FileID>#<name>@<line>:<column>"            "src/counter.ts#add@5:17"
// <ReferenceID>  "<FileID>#ref@<line>:<column>"                "src/counter.ts#ref@6:3"
// <LinkID>       import:      "<SymbolID>-><SymbolID>"        "src/main.ts#add@1:10->src/counter.ts#add@5:17"
//                unresolved:  "<SymbolID>->"                  "src/main.ts#thing@13:10->"
//                use:         "<ReferenceID>-><SymbolID>"     "src/main.ts#ref@5:17->src/counter.ts#add@5:17"
// <ScopeID>      "<FileID>#scope@<line>:<column>" | "<FileID>#scope@file"     (proposed, not built: M3)
// <NodeID>       a SymbolID, ScopeID or FileID. A relation's "from" may be a FileID (code at file level)

// <Diagnostic>
{
  "severity": "error" | "warning" | "info",
  "code": "E1" | "E2" | "E3" | "E13" | "E6" | "E12" | "E8" | "I1" | "I2",   // 04_tools.md, "Error codes"
  "message": "Syntax error TS1003: Identifier expected.",
  "location?": <Location>,
  "details?": { ... }
}
```

## 2. The generic step output file

Every step writes its output files in this one envelope (`DATA-22`). The records sit under the keys `dataNames` names; a reader needs only `dataNames` and the `--info` `fields` map to find them (`DATA-18`).

```jsonc
{
  "tool": "file-symbols",                    // the step's name, as in --info
  "toolVersion": "0.5.0",
  "formatVersion": 3,                        // equals --info outputs[].formatVersion; the Runner's shape check compares them (RUN-18)

  // A step run once per file says which file it read. A step run once says nothing about its inputs (DATA-22).
  "file?": <FileID>,
  "sourceSha256?": <Sha256>,                 // of the source file read; the Runner uses it for staleInputs (RUN-16)

  "dataNames": { "<DataName>": "<jsonKey>", ... },
  "counts?": { ... },                        // optional, for logs; "<thing>Count", never a record array's name. M1 writes it, M2 doesn't
  "<jsonKey>": [ <Record>, ... ],            // one array per data name
  ...
  // No times and no absolute paths: the same input gives the same bytes (FND-29)
}
```

## 3. Generic records

The kind of a record is the `represents` value of its output in `--info`. The `fields` map names which field plays each role (`<role>Field`); the defaults below apply when a role isn't mapped.

```jsonc
// represents: "nodes"
{ "id": <NodeID>, "parent": <NodeID>, "name": "add", "kind": "function", "location": <Location>, "range?": <Location>, ... }

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

### 4.3 M3 `symbol-scope`: `output/scopes.json` *(proposed, not built)*

`dataNames`: `{ "code.scope": "scopes", "code.membership": "membership" }`. Open: whether it also outputs `counts` (M2 doesn't), where a file scope's location comes from (`FND-11`), and where a scope ID starts (`FND-12`). Decided: lexical scope only, each scope naming its `owner` (`MVP-4`, option C with C1, `TOOL-33`). As `expected/symbol-scope.json` has it today:

```jsonc
{
  "tool": "symbol-scope", "toolVersion": "0.1.0", "formatVersion": 1,
  "dataNames": { "code.scope": "scopes", "code.membership": "membership" },
  "counts": { "scopeCount": 6, "membershipCount": 13 },
  "scopes": [
    { "id": "src/main.ts#scope@file", "kind": "file", "name": "src/main.ts", "owner": "src/main.ts",
      "parent": "src/main.ts" },                                 // no location yet: FND-11
    { "id": "src/main.ts#scope@4:1", "kind": "function", "name": "run", "owner": "src/main.ts#run@4:10",   // TOOL-33
      "location": <the function's range>, "parent": "src/main.ts" }
  ],
  "membership": [
    { "child": "src/main.ts#first@5:9", "parent": "src/main.ts#scope@4:1" }     // the contained symbol, its scope (DATA-07)
  ]
}
```

### 4.4 The Runner's file list

The Runner isn't a step, but it provides the file list (`RUN-06`, `RUN-29`), in file-ID order (`RUN-28`): in the database (`project_files`) and in its cache (section 13).

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
      "whenAbsent?": "<program folder>"
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
  // For people: "options", "exitCodes", "errorCodes", "supportedConstructs"; M1 also "fileKey", "storeLayout"; M2 also "reasons"
  ...
}
```

The three steps:

| Step | `invocation` | `readsFiles` | `parameters` | `outputs` (data name: jsonKey, represents) |
|---|---|---|---|---|
| M1 `file-symbols` 0.5.0 | `per-file` | `{ "filePatterns": ["*.ts"], "parameter": "file_path", "fallback": "source_root + file_id" }` | `file_id`, `file_path`, `source_root`, `store_path` | `code.symbol`: `symbols`, nodes in `files.file`; `code.reference`: `references`, relations |
| M2 `cross-file-links` 0.2.0 | `once` | `false` | `symbols`, `references`, `store_path` | `code.link`: `links`, relations |
| M3 `symbol-scope` *(proposed)* | `once` | `false` | `symbols`, `store_path` | `code.scope`: `scopes`, nodes in `files.file`; `code.membership`: `membership`, containment of `code.symbol` |

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
| M3 | `symbols` | `code.symbol` | array of `<Symbol>` | yes | yes | as for M2 *(proposed)* |
| M3 | `store_path` | `zaansouvi.store_path` | string | no | no | as for M1 *(proposed)* |

```jsonc
// M1, from the Runner (DATA-12)
{ "source_root": "<Path>", "file_id": "src/math.ts", "file_path": "<Path>", "store_path": "<Path>" }

// M2, from the Runner (DATA-13); M3 the same without "references"
{ "symbols": [ <Symbol>, ... ], "references": [ <Reference>, ... ], "store_path": "<Path>" }
```

### 6.2 `last_run.json`, next to the launcher

The flat parameters of the last real run that passed the shape check, so it can be passed back with `--json`, plus `_last_run`, which a tool removes when reading it (`DATA-15`).

```jsonc
{
  "source_root": "<Path>", "file_id": "src/math.ts", "store_path": "<Path>",   // the step's own parameters
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
  "counts?": { ... },                        // M1: as in its output; M2: linkCount, importLinkCount, useLinkCount, unresolvedCount
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
// real run, the only line ("file_id" is M1's identity; M2 has none)
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
{ "event": "run_started",  "runId": "<id>", "mode": "real" | "dry-run", "sourceRoot": "<Path>", "time": <Time> }
{ "event": "files_listed", "fileCount": 3 }
{ "event": "tool_skipped", "tool": "file-symbols", "file_id?": "src/math.ts", "refreshReason": "up-to-date" }
{ "event": "tool_dry_run", "tool": "file-symbols", "file_id?": "src/math.ts",
  "refreshReason": "missing" | "never-run" | "last-failed" | "inputs-changed" | "upstream-refresh" | "up-to-date",
  "dryRun": "go" | "no-go", "errorKind?": "run" | "invocation", "error?": <Diagnostic>, "staleInputs": [ <FileID>, ... ] }
{ "event": "tool_run", "tool": "file-symbols", "file_id?": "src/math.ts", "status": "succeeded" | "failed",
  "error?": <Diagnostic>, "logPath?": "<Path>", "outputChange?": "create" | "update" | "unchanged" }
{ "event": "run_finished", "runId": "<id>", "outcome": "succeeded" | "failed", "exitCode": 0 | 1 | 2, "time": <Time>, "logPath": "<Path>" }
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
{ "pid": 102921, "runId": "<id>", "started": <Time> }
```

## 10. Viewer graph model *(not yet produced)*

Unchanged from the earlier file. What the Viewer backend sends the page (`VIEW-04`), built only from the Runner's cache (`VIEW-03`).

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
  "unresolved": { "count": 2, "names": [ "Math", "console" ] },   // VW-4: relations with to null, hidden and counted
  "diagnostics": [ <Diagnostic>, ... ]
}
```

## 11. Review notes and open points

- **M3 is not built.** Its parts follow `02_data_contracts.md` and `expected/`. Open before writing it: `MVP-4` (what "scope" shows), `FND-11` (a file scope's location, which the Runner's shape check requires), `FND-12` (where a scope ID starts), and whether its output keeps `counts` and `diagnostics`.
- **The summary line** of a real run carries `outputPaths` as well as `outputPath`, from the tool helper; `DATA-17` doesn't list either.
- **M1's dry run prints a preview line**; M2's doesn't (`TOOL-24`). The Runner uses neither (`RUN-16`).
- **`tool_invoked` logs the full JSON sent**, which for M2 holds every symbol and reference record.
- **File nodes and aggregate edges have no location** (`DATA-01` doesn't cover them).
- **`--info` declares no settings yet**; the config manager needs that.
- **No reader checks the cache's `formatVersion`** yet.

## 12. Key names (`DATA-19`)

Each key name has one meaning, with one shape, wherever it appears.

**Generic keys** describe the record or object they sit on: `id`, `name`, `kind`, `parent`, `location`, `range`, `description`, `status`, `error` (always a Diagnostic), `counts`, `tool` (a step name).

| Key | Meaning | Not to be confused with |
|---|---|---|
| `toolVersion` | a step's version, `"0.5.0"` | `formatVersion` |
| `formatVersion` | the version of a file's layout: an output file and its `--info` output entry, or the Runner's cache | `toolVersion` |
| `file` | a FileID | `files`, the `...Path` keys |
| `files` | the Runner's file list: an array of file entries (section 4.4) | `symbols`; until 2026-11-08 also M2's parameter (`FND-49`) |
| `file_id` | a FileID, as a parameter (parameters use snake case) | |
| `symbols` | an array of `code.symbol` records: in M1's output, and as M2's and M3's parameter | `files` |
| `references` | an array of `code.reference` records: in M1's output, and as M2's parameter | |
| `source_root` | parameter: the examined source's root; declaring it marks a step that reads files (`DATA-09`) | `sourceRoot`, the same folder in Runner events and the cache |
| `store_path` | parameter: the folder that is the step's store (`DATA-21`) | `storePath`, the same folder in logs |
| `readsFiles` | in `--info`: the file patterns a step reads, or `false` (`DATA-09`) | |
| `affectsOutput` | in `--info` parameters: whether the parameter can change the output (`TOOL-43`) | |
| `from`, `to` | the source and target NodeID of a relation; `to` may be `null` | `import.moduleSpecifier` |
| `reason` | on a relation whose `to` is `null`: why it wasn't resolved | `refreshReason` |
| `refreshReason` | why the Runner ran, dry-ran or skipped an invocation (`RUN-20`) | `reason` |
| `import.moduleSpecifier`, `moduleSpecifier` | a module specifier as written | `from` |
| `import.importedName` | the name the imported module exports it under | the symbol's `name` |
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
| `<thing>Count`, `<thing>CountByKind` | numbers in `counts`; never a record array's name | `symbols`, `references` |
| `errorKind` | `run` or `invocation`, on a no-go line | record `kind` |
| `errorText` | a plain error message, where no Diagnostic exists | `error` |
| `<role>Field` | in `--info` `fields`: which record field plays that role | the record fields themselves |
| `dataRef` | in the Runner's cache: which output a group's records came from, `<tool>:<FileID>` or `<tool>` | |
| `runId`, `exitCode`, `fileCount`, `staleInputs` | in Runner events and the cache | |
| `diagnostics` | a run's notes: in `result.json`, on a dry run's go line, and in the Runner's cache (`DATA-14`). Not a data name (`FND-53`) | `error`, one Diagnostic for a failed run |

## 13. The Runner's cache (`RUN-27`)

`data/runner/cache.json`, what `--read-cache` prints. A real run replaces it whole, failed runs included; a dry-run-only pass replaces only `dryRun` (with no earlier cache, the file holds only `formatVersion` and `dryRun`).

```jsonc
{
  "formatVersion": 1,
  "run": { "runId": "<id>", "mode": "real", "outcome": "succeeded" | "failed", "exitCode": 0 | 1,
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
    "runId": "<id>", "time": <Time>,
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
| `source_root` (data name `project.source_root`) | the Runner (`app/shared/types.ts`) | declared, required, exactly when `readsFiles` is an object (`DATA-09`, `tool-info-inconsistent`) |
| `store_path` | the tool helper (`app/tool-helper/tool.ts`) | the store, else the program folder (`DATA-21`). The Runner fills it by data name `zaansouvi.store_path`; the two must agree |

### 14.3 Keys the Runner reads from steps' files

| File | Keys |
|---|---|
| `--info` | `tool`, `toolVersion`, `invocation`, `readsFiles` (`filePatterns`), `parameters` (`dataName`, `required`), `outputs` (`dataName`, `formatVersion`, `represents`, `containedIn`, `contains`, `outputFilePattern`, `jsonKey`, `fields`) |
| `fields` roles | `idField`, `parentField`, `fromField`, `toField`, `childField`, `locationField`, `ownerField` (read by the Viewer, `VIEW-13`); defaults `id`, `parent`, `from`, `to`, `child`, `location`, `owner` |
| An output file's header | `formatVersion`; `sourceSha256` (for `staleInputs`) |
| `result.json` | `tool`, `status`, `error`, `logPath`, `outputChange` |

### 14.4 Keys the tool helper reads from `--info`

`tool`, `toolVersion`, and for each parameter `shape` (string or array), `required` and `affectsOutput`: they drive the options, the generic shape check and `nonOutputParameterSources`.
