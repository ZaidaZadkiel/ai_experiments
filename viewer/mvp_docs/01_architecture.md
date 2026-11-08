# 01. Architecture

## Components

| Component | Language | Role in the MVP |
|---|---|---|
| **Runner** | TypeScript (Node) | Builds the file list, keeps the record of tools and the ordering, builds each tool's JSON, dry-runs then runs each tool, reads outputs and logs, updates the database, answers the Viewer |
| **Viewer backend** | TypeScript (Node) | Local HTTP server. Calls the Runner, reads the database, reads source lines, serves the UI |
| **Viewer UI** | TypeScript in the browser | Shows the levels, the details of a selection, the tool list and go / no-go results. Only displays |
| **Shared library** | TypeScript | Used by the Runner and the Viewer backend: database access, log reader, `--info` types, Runner output types (`runner.md`, section 1.0) |
| **M1 file-symbols** | TypeScript (Node) | Reads one source file, outputs its symbols and references |
| **M2 cross-file-links** | TypeScript (Node) | Reads no files; links imports to the declarations they refer to |
| **M3 symbol-scope** | TypeScript (Node) | Reads no files; outputs scopes and which scope each symbol belongs to |

- **ARCH-01** The Runner and the Viewer are one unit, in one repository, built together.
- **ARCH-02** Each tool is a separate program with its own entry point. It imports nothing from the Runner, the Viewer or another tool. It may import a small tool helper module (parameters, logs, `last_run.json`) that knows nothing about any specific tool.
- **ARCH-03** Tools are started as separate processes, with arguments passed as an array, never through a shell command string (`security.md`, section 7).

## Flow of a run

```mermaid
sequenceDiagram
  participant U as User or Viewer
  participant R as Runner
  participant DB as Database
  participant T as Tool (M1, M2, M3)
  U->>R: run <source root>
  R->>DB: read config_ tables (record of tools, ordering)
  R->>R: list files, hash them
  R->>DB: write project_files
  loop each tool in the ordering (M1 once per file)
    R->>R: check the shape of the earlier tools' saved outputs
    R->>R: build the tool's JSON from them, and its input fingerprint
    R->>DB: read the fingerprint of the tool's last successful run
    alt output up to date
      R->>R: skip the tool (tool_skipped)
    else refresh needed
      R->>T: --dry-run --stdin (JSON)
      T-->>R: go / no-go on standard output
      alt no-go
        R->>R: log, stop the run
      else go
        R->>T: --stdin (same JSON)
        T->>T: write output, result, log, last_run.json
        T-->>R: exit code
        R->>R: read the tool's result, log and output
        R->>DB: write project_outputs, project_tool_runs (with the fingerprint)
      end
    end
  end
  R-->>U: Viewer-mode events on standard output
```

- **ARCH-04** The order is M1 (once per file), then M2, then M3. It comes from the ordering in the database, derived from `--info` (`02_data_contracts.md`). M2 and M3 don't depend on each other; ties break by tool name.
- **ARCH-05** A run refreshes only the outputs that need it (`RUN-17` to `RUN-22`). With nothing saved, every tool runs and every output is produced; with nothing changed, no tool runs. This follows `toolset.md`, section 5.3 [Decided], and departs from `MVP_scope.md`, section 6, which leaves incremental runs out of the MVP (`FND-36`).

## Layout on disk

Answers `MVP-13` for the MVP.

```
zaansouvi-mvp/
  app/
    shared/                         Runner–Viewer library
    tool-helper/                    small helper any TypeScript tool may use
    runner/
    viewer/
      server/
      ui/
    tools/
      file-symbols/
        file-symbols                launcher (the "tool_name.bin")
        last_run.json
      cross-file-links/
        cross-file-links
        last_run.json
      symbol-scope/
        symbol-scope
        last_run.json
  data/
    zaansouvi.sqlite                the single database (config_ and project_ tables)
    tools/
      file-symbols/
        output/<file-key>.json      one per examined file
        result.json
        logs/<timestamp>.log
        state/                      unused in the MVP
      cross-file-links/
        output/links.json
        result.json
        logs/<timestamp>.log
      symbol-scope/
        output/scopes.json
        result.json
        logs/<timestamp>.log
    runner/
      logs/<timestamp>.log
      cache.json                    the Runner's cache: what --read-cache prints (RUN-27)
  test-source/                      the basic examined source (06_test_plan.md)
  expected/                         the expected result, written by hand
```

- **ARCH-06** `last_run.json` sits next to each tool's launcher, as decided (`toolset.md`, section 4.5). With one codebase, sharing it is harmless (`TS-25`).
- **ARCH-07** `<file-key>` is the file ID with `/` replaced by `__`, so `src/math.ts` becomes `src__math.ts.json`.
- **ARCH-08** The examined source is never written to. Nothing goes outside `zaansouvi-mvp/` except the system temp, which the MVP doesn't need.
- **ARCH-09** The data folder can be deleted at any time; the next run rebuilds it, except the database's `config_` tables, which the Runner recreates on start (`03_runner.md`).

## The single database

- **ARCH-10** One SQLite file holds both configuration and codebase data (`MVP_scope.md`, section 4). Tables start with `config_` or `project_`. The tables are listed in `02_data_contracts.md`.
- **ARCH-11** The Runner writes all tables. In the MVP the Viewer backend reads none of them: it reads only the Runner's cache, through `--read-cache` (`RUN-27`), and writes nothing (no config manager).

## Technology choices for the MVP

These satisfy "use a library or built-in when one does the job". Versions are pinned when the project is set up.

| Need | Choice | Why |
|---|---|---|
| Runtime for the Runner, the Viewer backend and the tools | Node.js, with TypeScript | Decided stack; one runtime for everything |
| Parsing TypeScript in M1 | The TypeScript compiler's own parser (`typescript` package, `ts.createSourceFile`) | Exact syntax tree with positions, no type checking needed, one file at a time (`MVP-7`) |
| Database | SQLite through Node's built-in `node:sqlite` (still experimental in Node 22; its warning hidden as in M1's launcher). `better-sqlite3` only if `node:sqlite` fails (accepted by the user for the MVP on 2026-11-07) | Single file, no server, nothing to install |
| Starting tools | Node's `child_process.spawn` with an argument array | No shell, so no injection from file names |
| HTTP server | Node's built-in `http` module | Least effort; a handful of endpoints |
| Graph in the browser | Cytoscape.js | Supports compound nodes (nodes inside nodes) and has built-in layouts |
| Hashing files | Node's built-in `crypto` (SHA-256) | Built in |
