# Proposed JSON schema for MVP 2: ts-program, the full file listing and the Viewer

**Status:** proposed for MVP 2 on 2026-11-09, before building, **then built the same day and checked against it** (`FND-98`): the code produces what this file describes, with these differences, applied below: a built-in's `builtin` name is the library type declaring it (`Console.log`, `ReadonlyArray.reduce`); `result.json`'s `program.compilerOptions` is `"defaults"` with the options of `tsc --init`; the cache's file entries keep `kind` optional (a first-stage cache has none); a name TypeScript resolves but declares nowhere (`undefined`, `globalThis`, `arguments`) is a built-in, `builtin` its own name (`FND-99`); the Viewer's `/api/tools` answer gives a dry run's error as `dryRunError`. Re-read against real output on 2026-11-09 (events, cache, `result.json`): no other difference. ~~**Status:** proposed for MVP 2 on 2026-11-09, **before building**~~ (`DATA-20`; `mvp_docs/97_second_implementation.md`, section 3). It describes what MVP 2's code is to produce: `ts-program` 0.1.0, the Runner listing every file with its status (`RUN-34`, `RUN-35`) and running a hardcoded list of tools (`RUN-33`), the tool helper running a tool once over a program with one output file per source file, and the Viewer's graph model reading them. Once built, it is corrected to "as built" and the differences recorded.

**Later changes** (2026-11-09, after this file): `ts-program` 0.2.0's new keys and `/api/source`'s `end` are in `26-11-09 235850 Proposed JSON schema for ts-program 0.2.0 and the source range endpoint, as built.md`, which describes only what changes from this file.

It **keeps the section numbers** of `26-11-09 081006 Proposed JSON schema for every step, the Runner and the Viewer, as built.md` (the first stage, as built), and **describes in full only what MVP 2 changes**; a section not given here is unchanged, and read in that file. M1, M2 and M3 stay as described there (sections 4.1 to 4.3): they are kept, not run (`TPG-01`, `FND-94`).

Every key keeps one meaning wherever it appears (`DATA-19`). New keys are marked *new*.

## Contents of this file

- 1. Building blocks: what changes
- 4.4 The Runner's file list: every entry, with its status
- 4.5 `ts-program` 0.1.0: `output/<FileKey>.json`
- 5. `--info`: the new keys, and `ts-program`'s
- 6. Parameters: list parameters
- 7. `result.json`: what `ts-program` adds
- 9. Runner events: what changes
- 10. The Viewer's graph model: what changes (format 2)
- 12. New key names
- 13. The Runner's cache: what changes
- 14. Data names and keys known by name: what changes

## 1. Building blocks: what changes

```jsonc
// <ReferenceID>  "<FileID>#ref@<line>:<column>"                  as before: one use at one place
//                "<FileID>#ref@<line>:<column>.<n>"   new        a use resolved to several declarations (a union, TSP-01 C):
//                                                                 one record per declaration, n = 1, 2, … in the order of their IDs
// <LinkID>       import:      "<SymbolID>-><SymbolID>"            as before
//                unresolved:  "<SymbolID>->"                      as before
// <EntryKind>    new  "file" | "folder" | "link" | "other"        what a listed entry is (RUN-34)
// <SymbolKind>   "function" | "variable" | "parameter" | "import"                         (as M1)
//                new  "class" | "constructor" | "method" | "property" | "accessor" | "enum" | "enumMember"
//                     | "namespace" | "interface" | "typeAlias"
// <UseKind>      "read" | "write" | "call"                                               (as M1; "declaration" is not output)
//                new  "new" | "type" | "extends" | "implements" | "re-export"
```

## 4.4 The Runner's file list: every entry, with its status

Every entry under the source root, in ID order (`RUN-28`), files and folders (`RUN-34`, `RUN-35`): in the database (`project_files`) and in the cache (section 13). `node_modules` and `.git` are listed as folders, not file by file. Ignore files are not applied (`RUN-34a`).

```jsonc
// a file
{
  "id": "src/shapes.ts",
  "kind": "file",                          // new <EntryKind>
  "sourceBytes": 2378,
  "sourceSha256?": <Sha256>,               // only for a file some tool reads (its patterns match); no other file is opened
  "readBy?": [ "ts-program" ],             // new  the tools whose patterns match it, in run order
  "hidden?": true,                         // new  its name, or a folder's on its path, starts with "."
  "readOnly?": true,                       // new  not writable by the user who ran the Runner
  "unreadable?": "EACCES: permission denied",   // new  not readable by that user, with the reason
  "executable?": true                      // new
}
// a folder
{ "id": "src", "kind": "folder", "fileCount": 2, "totalBytes": 3224, "hidden?": true, "readOnly?": true, "unreadable?": "…" }
// a folder skipped as a whole (RUN-34b)
{ "id": "node_modules", "kind": "folder", "skipped": true, "fileCount": 4211, "totalBytes": 61234567 }
// a symbolic link: listed, never followed (SEC-2)
{ "id": "docs/latest", "kind": "link", "link": { "target": "../build/docs", "outside": false } }
// anything else (a socket, a device)
{ "id": "run/app.sock", "kind": "other" }
```

`fileCount` and `totalBytes` count every file below the folder, at any depth. A folder's `id` is its path relative to the source root, like a file's; the source root itself is not an entry.

## 4.5 `ts-program` 0.1.0: `output/<FileKey>.json`

One file per source file of the program (`TPG-12`), written in one invocation over the whole program (`TS-37`, `readsFiles.scope: "program"`). Output format 1. The records follow `mvp_docs/41_typescript_program_plan.md`, section 1.1 (the definition of a correct graph and its refinements R1 to R6), and `mvp_docs/42_tool_ts_program.md`, section 5.

```jsonc
{
  "tool": "ts-program",
  "toolVersion": "0.1.0",
  "formatVersion": 1,
  "file": "src/shapes.ts",
  "sourceSha256": <Sha256>,
  "dataNames": { "code.symbol": "symbols", "code.reference": "references", "code.link": "links" },
  "counts": { "symbolCount": 63, "symbolCountByKind": { ... }, "referenceCount": 97, "referenceCountByKind": { ... },
              "builtinCount": 10, "unresolvedCount": 1, "linkCount": 0, "lineCount": 62 },
  "symbols": [
    {
      "id": "src/shapes.ts#Base@12:23",
      "name": "Base",
      "kind": <SymbolKind>,
      "parent": "src/shapes.ts",                    // the declaring symbol, or the file at top level (TPG-D8)
      "location": <Location>,                       // the name
      "range": <Location>,                          // the whole declaration
      "exported?": true,
      "modifiers?": [ "abstract" ],                 // new  static, abstract, readonly, private, protected, public, async, declare, const
      "declaredIn?": "constructor",                 // new  a parameter property (TSP-01 C)
      "declarations?": [ <Location>, ... ],         // new  merged declarations, the first being the ID's (TPG-D6)
      "heritage?": { "extends": [ <SymbolID> | null ], "implements": [ <SymbolID> | null ] },   // new  a class
      "import?": { "moduleSpecifier": "./shapes", "importedName": "Circle" | "default" | "*", "typeOnly?": true }
    }
  ],
  "references": [
    {
      "id": <ReferenceID>,
      "name": "area",
      "kind": <UseKind>,
      "from": <SymbolID> | <FileID>,                // the innermost named declaration holding the use (TSP-01 B5, R3, R4); no "enclosing" (TPG-D7)
      "to": <SymbolID> | <FileID> | null,           // the declaration TypeScript resolves it to; a FileID for a namespace import; no "symbol" (TPG-D7)
      "location": <Location>,
      "member?": true,                              // new  a member access: c.area(), this.radius, Color.Red
      "union?": true,                               // new  one of several declarations the use resolves to
      "viaImport?": <SymbolID>,                     // new  the import the use goes through
      "reason?": "built-in" | "package" | "unresolved" | "missing module",   // when "to" is null
      "builtin?": "Math.PI"                         // new  with reason "built-in": the library name, from the type declaring it: "Console.log", "ReadonlyArray.reduce" (TPG-D5)
    }
  ],
  "links": [                                        // in M2's shape (DATA-06), resolved by TypeScript
    { "id": <LinkID>, "from": <SymbolID>, "to": <SymbolID> | <FileID> | null, "kind": "import",
      "moduleSpecifier": "./shapes", "importedName": "default", "location": <Location>, "reason?": "package" | "missing module" | "unresolved" }
  ]
}
```

- A source file with no symbols still has its output file, with empty lists.
- No times in outputs: the same files and options give the same bytes, whatever the order of `files` (`TPG-25`).
- Diagnostics are not in the output (`DATA-14`): they go in `result.json` (section 7).

## 5. `--info`: the new keys, and `ts-program`'s

New keys any tool may state:

```jsonc
"readsFiles": { "filePatterns": [ "*.ts" ], "scope": "program" },   // new  a program tool: every listed file of its type in one invocation (TS-37)
"parameters": { "<key>": { "dataName": "files.file.id", "list": true, ... } },   // new  "list": the Runner gives every value as one array
"outputs": [ { ..., "perFile": true, "containedIn": [ "files.file", "code.symbol" ] } ]
//            new  "perFile": a once tool writing one output file per file it was given (<file-key> filled per file)
//            new  "containedIn" may be a list: a node's parent may be of any of these data names
```

`ts-program`'s:

| Key | Value |
|---|---|
| `invocation` | `once` |
| `readsFiles` | `{ "filePatterns": ["*.ts"], "scope": "program" }` |
| `parameters` | `source_root` (`project.source_root`, required); `files` (`files.file.id`, `list`, required); `configs` (`ts.config`, `list`, optional, none until `ts-config` runs, `TPG-D4a`); `store_path` (`zaansouvi.store_path`, optional, `affectsOutput: false`) |
| `outputs` | `code.symbol`: `symbols`, nodes, `containedIn` `["files.file", "code.symbol"]`, fields `idField` `id`, `parentField` `parent`, `labelField` `name`, `kindField` `kind`, `locationField` `location`; `code.reference`: `references`, relations, fields `idField`, `fromField` `from`, `toField` `to`, `kindField`, `locationField`, `labelField` `name`; `code.link`: `links`, relations, fields as `code.reference`. All three `perFile`, in `output/<file-key>.json` |

## 6. Parameters: list parameters

A `list` parameter is an array of the values of its data name: for `files`, every listed file whose ID matches the tool's `filePatterns`, in ID order: `[ "src/app.ts", "src/shapes.ts" ]`. The tool helper checks the shape (an array of strings) as for any parameter (`TOOL-03`).

## 7. `result.json`: what `ts-program` adds

```jsonc
"outputPaths": [ <Path>, ... ],                  // one per source file, as for any tool writing several files
"program": {                                     // new
  "files": 2,                                    // source files in the program
  "libraryFiles": 63,                            // TypeScript's own library files read
  "compilerOptions": "defaults" | "from configs",   // "defaults" until ts-config runs (TPG-D4a)
  "typeErrorCount": 0,                           // type errors don't stop the run (TPG-21); counted here
  "filesRead": [ <Path>, ... ]                   // every source file the compiler opened (TSP-04)
}
```

## 9. Runner events: what changes

```jsonc
{ "event": "files_listed", "fileCount": 3, "folderCount": 2,
  "skippedFolders": [ { "id": "node_modules", "fileCount": 4211, "totalBytes": 61234567 } ],   // new
  "perTool": { "ts-program": 2 },                                                                // new  files each tool's patterns match
  "ignoreFiles": "not applied" }                                                                 // new  (RUN-34a)
{ "event": "tool_not_listed", "tool": "file-symbols" }      // new  a tool folder not in the run list (RUN-33)
```

A listed tool with no folder or launcher stops the run before any tool starts: a start-up error, `tool-not-found`, naming it (`RUN-33`). A once tool appears in `tool_dry_run`, `tool_run` and `tool_skipped` with no `file_id`, as before.

## 10. The Viewer's graph model: what changes (format 2)

- **Every listed entry is a node at the top level** (`UI-47`, `UI-48`): files and folders, each with its status keys (section 4.4) and, for a file, its type: its extension (`UI-47b`), `"type": ".ts"` or `"unknown"`.
- **A node's container may be a symbol** (`containedIn` a list): levels go to any depth (file › namespace › class › member).
- **Built-ins** (`to: null`, `reason: "built-in"`) are listed under the view's `builtins`, apart from `unresolved`.
- **A record's other keys** are kept on the node or relation as `extra`, `{ key: value }`, for Details (`VIEW-15`, `FND-69`, item 2): not counted as extra data.
- `formatVersion` 2; a stored graph of format 1 is rebuilt from the cache.

## 12. New key names

| Key | One meaning |
|---|---|
| `builtin` | the library name of a built-in a use resolves to |
| `declarations` | every declaration of a merged symbol, as Locations |
| `declaredIn` | where a property was declared, when not in the class body (`"constructor"`) |
| `executable` | a listed file the user may execute |
| `fileCount` | files below a folder, at any depth (a file list's count stays `fileCount` in `files_listed`, the same meaning: how many files) |
| `heritage` | what a class `extends` and `implements` |
| `hidden` | a listed entry whose name, or a folder's on its path, starts with `.` |
| `link` | a symbolic link's target and whether it leads outside the source |
| `list` | in `--info`, a parameter given as one array |
| `member` | a reference that is a member access |
| `modifiers` | a declaration's modifiers |
| `perFile` | in `--info`, a once tool writing one output per file |
| `perTool` | in `files_listed`, files each tool's patterns match |
| `program` | in `result.json`, what a program tool read and found |
| `readBy` | the tools whose patterns match a listed file |
| `readOnly` | a listed entry not writable by the user who ran the Runner |
| `skipped`, `skippedFolders` | a folder listed as a whole, not file by file |
| `totalBytes` | bytes of every file below a folder |
| `union` | a reference resolved to one of several declarations |
| `unreadable` | why a listed entry can't be read |
| `viaImport` | the import a use goes through |

`kind` keeps its meaning, "what sort of thing this record is", with the new value lists of section 1.

## 13. The Runner's cache: what changes

`files` holds every entry of section 4.4, not only `.ts` files. `tools` holds only the tools of the run list (`RUN-33`), with a `notListed` array beside it naming the tool folders found and not run. A once tool's per-file outputs appear in `data` with `dataRef` `"<tool>:<FileID>"` and `file`, as a per-file tool's did.

## 14. Data names and keys known by name: what changes

- **Data names the Runner provides:** `files.file.id` (now also as a list), `files.file.path`, `project.source_root`, `zaansouvi.store_path` (as before).
- **New data name, not provided until `ts-config` runs:** `ts.config` (`TPG-D4`).
- **Keys the Runner reads from `--info`:** as before, plus `readsFiles.scope`, a parameter's `list`, an output's `perFile` and a list `containedIn`.
- **The run list:** the tool names in the Runner's code (`RUN-33`): `ts-program`.
