# 03. Runner

The Runner as built for the MVP. The full design is in `runner.md`; this file keeps only what the MVP needs.

## Command line

```
zaansouvi-run <source-root>                 run everything
zaansouvi-run <source-root> --dry-run-only  dry-run every step; no tool writes anything
zaansouvi-run --read-cache                  print the stored data, run nothing
```

- **RUN-01** One command with only the source root runs the whole process (P2). There are no config files (`MVP_scope.md`, section 8.1).
- **RUN-02** Output is always the Viewer mode: JSON lines on standard output (`--human` is out of the MVP).
- **RUN-03** A missing or unreadable source root stops the Runner with exit code 2 and a diagnostic saying what is missing or wrong. It writes nothing. The source root comes from the command line, else from the saved configuration (`RUN-29`).

## On start

- **RUN-04** Open or create the database. Check `config_version`; if it is unknown, stop with a clear message. The first structure version is `1`; a new database is created with it (accepted by the user for the MVP on 2026-11-07). The same holds in a `--dry-run-only` pass (`RUN-23`).
- **RUN-05** Find the tools in `app/tools/`, call each one's `--info`, and fill `config_tools`. A tool is a folder holding an executable launcher with the folder's name; any other folder is skipped, with a log line (accepted by the user for the MVP on 2026-11-07). A tool's `--info` must say whether it reads files: `readsFiles` with a required `source_root`, or `readsFiles: false` with no `source_root` and not run once per file; otherwise the Runner refuses to start (`DATA-09`). Derive the order from the `dataName`s and write `config_ordering` (`02_data_contracts.md`, DATA-11). Installation and removal are out of the MVP; the tools are simply there. The same holds in a `--dry-run-only` pass (`RUN-23`).

## The run

- **RUN-06** ~~List every `*.ts` file under the source root (skipping `node_modules`), hash it, and write `project_files`.~~ *(For MVP 2, replaced by `RUN-34`: every file, accurately.)* List the files and write `project_files`. The Runner does this itself (`RN-13`). The same holds in a `--dry-run-only` pass (`RUN-23`).
- **RUN-07** For each tool in the ordering (M1 once per file), check whether its output needs refreshing, and build its JSON from the checked outputs of the earlier tools, in memory (`RUN-17` to `RUN-22`; `02_data_contracts.md`, DATA-12, DATA-13). A tool whose output is up to date is skipped; the others go on to `RUN-08`.
- **RUN-08** Dry-run the tool with `--dry-run --stdin`, passing the JSON. Parse the last line (DATA-17):
  - **go**: continue
  - **no-go** with exit code 2: an invocation error, so a Runner bug. Log it as such and stop
  - **no-go** with exit code 1: a problem in the data. Log it as the tool's error and stop
- **RUN-09** Run the tool for real with `--stdin` and the same JSON. Then read its `result.json` in the store it passed, the log named by `result.json`'s `logPath`, and its output.
- **RUN-35** **[Decided] for MVP 2: the listing records each entry's status, and lists folders** (decided by the user on 2026-11-09; `UI-48`; `FND-91`). While listing (`RUN-34`), from the file system alone, opening no file:
  - **for every file:** hidden (its name starts with `.`), a symbolic link (its target, and whether it lands inside or outside the source), read-only, unreadable (with the reason); also executable, empty and size, shown in words only;
  - **read-only and unreadable are judged for the user who ran the Runner** (by access checks, not mode bits);
  - **every folder is listed too, `node_modules` and `.git` included,** each with the number of files it holds, and its total size where available; the folders skipped as a whole (`RUN-34`) are counted, not listed file by file;
  - stored with each entry in the cache's file list and in `project_files`; the Viewer reads them from there (`UI-48`).
- **RUN-34** **[Decided] for MVP 2: the Runner lists every file, accurately** (decided by the user on 2026-11-09; `FND-79`, brought into MVP 2; `FND-90`). It replaces the `.ts` filter of `RUN-06`: the file list is every file under the source root, not only the files some tool reads; each tool still gets only the files its patterns match (`readsFile`, `DATA-23`). **[Proposed]** what "accurately" means:
  - **every regular file**, hidden files (names starting with `.`) included, at any depth;
  - **nothing dropped silently:** a folder skipped as a whole (~~suggested:~~ **decided** 2026-11-09, `RUN-34b`: `node_modules` and `.git`) is reported with how many files it holds and its size, and shown as a folder node (`UI-48`); a symbolic link is listed as a link, not followed (`SEC-2`); an entry that is neither a file nor a folder, or can't be read, is listed with the reason;
  - **path and size for every file; a content hash only for files some tool reads,** which change detection needs (`RUN-17` to `RUN-22`), so no other file is opened;
  - sorted by file ID (`RUN-28`); `files_listed` gives the total, the skipped folders, and each tool's count of matching files;
  - *(As built on 2026-11-09, `FND-98`: `listEntries` in `app/runner/src/runner.ts`; statuses by access checks for the user who ran the Runner; links listed with their target and whether they lead outside, never followed; `files_listed` with `folderCount`, `skippedFolders`, `perTool`, `ignoreFiles`. A tool given its files as a list with none to read stops the run before it starts, with a message built from its `--info` (the generic answer to `FND-75`). `RUN-33`'s list is `RUN_LIST` in `app/runner/src/tools.ts`; tool folders not listed give `tool_not_listed` events and the cache's `notListed`.)*
  - ~~**To define:** whether `.gitignore` and similar files are applied (`toolset.md`, section 6.2, [Proposed] that the Runner applies them), or listed files they ignore are only marked.~~ **[Decided]** (2026-11-09, `RUN-34a`): **ignore files are not applied**; every file is listed, and each run says ignore files were not applied. Marking ignored files may come later as a status (`UI-48`). *(This differs from `toolset.md`, section 6.2, [Proposed], which has the Runner apply them; that item is the product's and stays as it is.)*
- **RUN-33** **[Decided] for MVP 2: a hardcoded list of the tools to run** (decided by the user on 2026-11-09; `42_tool_ts_program.md`, `TPG-D1`). The Runner holds, in its code, the names of the tools it runs, and checks the list against the folders in `app/tools/` (`RUN-05`): a listed tool with no folder or no executable launcher stops the run before any tool starts, saying which; a tool folder not in the list is not run, and the Runner reports it as not listed. M1 (`file-symbols`) is not in the list (`TPG-01`). **The list holds `ts-program` alone** (decided by the user on 2026-11-09, `TPG-06`, `FND-94`): M2 and M3 are not run either, to see whether TypeScript's data alone gives a correct graph in the Viewer. This narrows `RUN-05`, which ran every tool folder found; the order still comes from `--info` alone. *(Naming tools in the Runner's code is a deliberate exception to "no code for any tool" (`RUN-25`, `FND-43`) for MVP 2; the product's way to add or omit tools is the named configurations of `runner.md`, section 2.)*
- **RUN-32** **The Runner starts every tool in its data folder** (`<zaansouvi-mvp>/data`), never in the folder it was itself started from, so a Runner started from inside the examined source never runs a tool there (`E14`; follows from the user's decision on 2026-11-08, `FND-59`; `runner.md`, section 4). Checked: a run started from `test-source/src` succeeds and writes nothing into the source.
- **RUN-26** **The Runner always sends `store_path`**: from the saved configuration, else the default `<zaansouvi-mvp>/data/tools/<tool>`, the layout in `01_architecture.md` (`DATA-12`, `DATA-13`, `RUN-29`). It never relies on a tool's default or on `last_run.json` for the store, and reads each tool's result and outputs only from that folder.
- **RUN-10** If the result is `failed`, stop. Otherwise write `project_outputs` and `project_tool_runs`, and go on.
- **RUN-11** M1 is invoked once per file, dry run then real run each time. For two or three files that is a handful of processes; record the time it takes as a finding (`TS-31`). There is no timeout: a tool that hangs blocks the run until it is stopped by hand. This is a scope cut, together with cancel (`FND-34`; accepted by the user for the MVP on 2026-11-07).
- **RUN-28** **One fixed order: sorted by file ID** (decided by the user on 2026-11-07). The Runner handles files in order of their file ID, by plain string comparison (character codes, case-sensitive: JavaScript's default sort). M1 is invoked in that order, and every array the Runner builds by file follows it: the file list, the `symbols` and `references` parameters of M2 and M3, and the Runner's cache. The order affects no tool output, since M1 reads one file per run. It makes the stop point after a failure, the events, the fingerprint (`RUN-20`) and the cache the same on every run. For the test source: `src/counter.ts`, `src/main.ts`, `src/math.ts`.
- **RUN-29** **Data the Runner provides** (decided by the user on 2026-11-07; `runner.md`, section 4). The Runner provides every value tools require that no tool produces. It reads the value from the saved configuration (the `config_` tables); if it isn't there, it creates it from a default; if the value isn't valid, it fails before any tool starts.
  - `files.file.id`, `files.file.path`: from the file list it builds (`RUN-06`, `RUN-28`). The order of the tools is derived the same way, from `--info` (`RUN-05`).
  - `zaansouvi.store_path`: default `<zaansouvi-mvp>/data/tools/<tool>` (`RUN-26`).
  - `project.source_root`: **user-defined, with no default.** It comes from the command line; the Runner saves it in `config_settings` and reads it back when a run gives none, for example from the Viewer's run button. If it is missing, the Runner prints a diagnostic saying what is missing and how to give it, and exits 2 (`RUN-03`). This is internal to the Runner and the Viewer; it goes only to tools that read files, those that declare `source_root` (`DATA-09`), and every file path they receive depends on it.
  - A required parameter whose data name is neither output by a tool nor in this list stops the Runner before any tool starts, with a diagnostic naming the tool and the parameter, exit 2. An optional parameter that doesn't affect the output is not sent (`TOOL-43`).
- **RUN-30** **One run at a time** (decided by the user on 2026-11-07; `runner.md`, section 4).
  - When a run starts, the Runner creates `data/runner/run.lock` with an exclusive create, holding its process ID and start time. It removes the lock when the run ends, whatever the outcome.
  - If the lock already exists and its process is alive, the new run prints a diagnostic naming the running run and exits 2, writing nothing. If its process is gone, the lock is stale: the Runner takes it over and notes it in its log.
  - A `--dry-run-only` pass takes the lock too; `--read-cache` doesn't (the cache is replaced in one step, `RUN-27`).
  - Tools take no lock; they are assumed to run only from the Runner. A tool run by hand is the user's action. If it changed an output, the problem shows up only when that output is read as wrong input: the Runner's shape check (`RUN-18`) or the reading tool's own checks (`E12`) detect it and write an error and a diagnostic.
- **RUN-31** **The Runner's exit codes** (accepted by the user for the MVP on 2026-11-07): `0` when the run finished, including when every invocation was skipped; `1` when a tool's no-go or failure stopped it; `2` for an invocation or start-up error: a bad or missing source root, missing user data, the lock held by another run, an unknown database version, a provided value that isn't valid, or a required parameter nobody provides. `run_finished` carries the exit code.
- **RUN-12** At the end, write `project_runs` and print `run_finished` with the outcome.
- **RUN-16** **Each tool's dry run works from the saved stores** (the MVP's answer to `RN-11`). The Runner builds a tool's JSON from what is saved: the earlier tools' outputs in their stores. Nothing passes from one dry run to the next through what it prints.
  - In a real run, each tool's dry run comes after the earlier tools' real runs, so it sees their fresh outputs.
  - In a `--dry-run-only` pass, it sees the outputs left by the last real run, so the pass previews each step against that run.
  - If the stores hold no output for a parameter, the Runner still sends the parameter, empty, so the tool's parameter check passes and the tool itself reports no-go (`TOOL-09`). As with any no-go, the Runner stops (`RUN-08`). On a fresh data folder, a `--dry-run-only` pass therefore reports go for M1 on every file, then no-go for M2, and stops. This is the status-check warning "a missing output from an earlier tool" (`toolset.md`, section 4.3).
  - The Runner takes saved outputs only for files in the current file list. If a file in the list has no saved output, or its hash differs from the one in `project_files`, the Runner sends what it has and lists those file IDs as `staleInputs` in the tool's `tool_dry_run` event. The tool's go / no-go stands.

## Refresh check

Before each invocation, the Runner works out whether the tool's output needs refreshing, and builds the tool's inputs from what earlier tools left. It does this only from `--info` and the outputs themselves, with no tool-specific code (`VIEW-14` applies to the Runner too). This brings in the [Decided] rule that later runs change only what is affected (`toolset.md`, section 5.3), and the skip in `runner.md`, section 2 ("skips tools whose inputs haven't changed").

- **RUN-17** **Check before running.** For each invocation in the ordering (each tool, and M1 once per file), the Runner decides whether a refresh is needed (`RUN-20`). If it is, the tool is dry-run and run as in `RUN-08` to `RUN-10`. If not, the tool is skipped: the Runner prints `tool_skipped`, starts no process, and leaves the output as it is. A `--dry-run-only` pass is the exception: it is a status check, so it dry-runs every invocation, and marks those a real run would skip as `up-to-date` in their `tool_dry_run` event.
- **RUN-18** **Shape check of the available outputs.** The Runner reads the saved outputs of every earlier tool in the ordering and checks their shape against each tool's `--info`:
  - the output file exists and parses as JSON
  - for every output the tool declares, the file holds an array under the output's `jsonKey` (`FND-01`), and the `formatVersion` recorded in the file matches the output's `formatVersion` in `--info`
  - every record has the fields `--info` maps for its kind (`represents`): an ID and a parent for nodes; a from and a to for relations (`to` may be `null`: an unresolved relation); a contained and a container field for containment; and a Location (`DATA-01`).
  - for a per-file tool, only the outputs of files in the current file list count; outputs of files no longer in the list are ignored (part of `FND-06`)

  An output that fails any of these counts as missing. The check is only of shape: it doesn't judge whether the content is right.
- **RUN-19** **Building the inputs.** For each parameter of the next tool, the Runner finds the earlier tool whose `--info` outputs the parameter's `dataName` (`DATA-11`) and builds the value from that tool's checked outputs: **only the records of that data name**, found under the output's `jsonKey` (`DATA-18`), never the rest of the output file (agreed by the user for the MVP on 2026-11-08). From a per-file tool, one flat array: files in file ID order (`RUN-28`), each file's records in their order. From a tool run once, its records. Values with a data name no tool outputs are provided by the Runner (`RUN-29`). In a real run, the earlier tools have just been refreshed or found up to date, so their outputs are all there; if one still fails the shape check, see the errors table. In a `--dry-run-only` pass, a missing output gives an empty parameter and the tool's no-go (`RUN-16`, `TOOL-09`).
- **RUN-20** **When a refresh is needed.** The Runner computes the invocation's **input fingerprint**: the SHA-256 of the tool's name, its `toolVersion` from `--info`, the JSON built in `RUN-19` with its keys sorted, and, for each parameter with a `files.file.*` data name, the current hash of that file from the file list. A refresh is needed, with the first matching reason, when:
  - `missing`: the tool's own saved output is absent, or fails the shape check in `RUN-18`
  - `never-run`: `project_tool_runs` has no successful run of this invocation
  - `last-failed`: its last real run failed
  - `inputs-changed`: the fingerprint differs from the one recorded for its last successful run (this covers a changed source file, a changed earlier output, and a new tool version)
  - in a `--dry-run-only` pass only, `upstream-refresh`: an earlier tool it takes input from would be refreshed. The saved outputs it would get are about to change, so it can't be judged up to date; its dry run uses the saved outputs and reports `staleInputs` (`RUN-16`)

  Otherwise the output is **up to date**. Skipping assumes tools are repeatable: the same input gives the same output (`DATA-04`, checked by `TEST-04`). For the MVP, repeatability is nice to have, not a hard requirement; the product decision depends on what the MVP finds (`MVP_scope.md`, section 1, decided by the user on 2026-11-08).
- **RUN-21** **How a change spreads.** Since a tool's fingerprint covers the earlier outputs it receives, a change spreads exactly as far as outputs actually change. Editing one file reruns M1 for that file only. M2 and M3 rerun only if that M1 output changed. An M1 rerun that gives a byte-identical output leaves M2 and M3 skipped. This is the MVP's answer to "how a change spreads" (`toolset.md`, section 5.3, to define).
- **RUN-22** **Recording.** A real run records the fingerprint in `project_tool_runs` and `project_outputs`. A skipped invocation is recorded in `project_tool_runs` as `skipped`, with the reason `up-to-date`. When nothing changed, no tool runs and no tool output is written; the Runner still writes its log and the `project_runs` row (`RUN-12`, `RUN-14`; see `FND-37`). A `--dry-run-only` pass makes the same decisions and reports them in its `tool_dry_run` events. It records no fingerprint, no `skipped` row and no output (`RUN-23`).

## Dry-run-only pass

- **RUN-23** **A `--dry-run-only` pass may read anything it needs, and the Runner may write whatever is useful.** The no-write rule of a dry run binds the tools only (`toolset.md`, section 4.3, decided by the user on 2026-11-07).
  - It may read the database, every tool's store, the examined source and each tool's `--info`.
  - It starts like a real run: it creates the database if missing, fills `config_tools` and `config_ordering` (`RUN-04`, `RUN-05`), writes `project_files` (`RUN-06`), and writes its log (`RUN-14`) and a `project_runs` row marked as a dry run.
  - It writes nothing that records a real run: no `project_outputs` row, and no fingerprint, success or `skipped` row in `project_tool_runs`. So the next real run's refresh check (`RUN-20`) is unaffected. It may record the dry-run results in `project_tool_runs`, marked as dry runs.
  - Its report goes to standard output, as Viewer-mode events.
  - Each tool's dry run in the pass writes nothing (`TOOL-06`, `TOOL-40`).

  This replaces the earlier rule that the pass writes nothing at all, and resolves `FND-05` another way.

- **RUN-24** **The Runner checks a tool only through its input and its output:** the JSON it builds, the dry-run lines and exit code, `result.json` and the output's shape (`RUN-18`). It doesn't watch or limit what a tool reads or writes. A tool that reads more than its one file, or the database, is a design error in that tool, not a Runner error (`toolset.md`, section 4.2).
- **RUN-25** **Matching keys to data is the Runner's job** (`DATA-18`). It finds every record only through the tools' `--info` (`jsonKey`, `fields`, parameter data names), never with tool-specific code. In the `cache` event (`RUN-13`) it hands the Viewer the records already grouped by data name, each group with the `--info` details the Viewer needs (`represents`, `containedIn`, `contains`, `fields`), so the Viewer never matches keys itself.

## Output events (Viewer mode)

Each line is one JSON object with an `event` field:

| Event | Fields |
|---|---|
| `run_started` | `runId`, `mode` (`real` or `dry-run`), `sourceRoot`, `time` |
| `files_listed` | `fileCount` |
| `tool_skipped` | `tool`, `file_id` (M1 only), `refreshReason`: `up-to-date` (`RUN-17`) |
| `tool_dry_run` | `tool`, `file_id` (M1 only), `refreshReason` (`RUN-20`, or `up-to-date` in a `--dry-run-only` pass, `RUN-17`), `dryRun` (`go` or `no-go`), `errorKind`, `error`, `staleInputs` (file IDs whose saved output is missing or out of date, `RUN-16`) |
| `tool_run` | `tool`, `file_id` (M1 only), `status` (`succeeded` or `failed`), `error`, `logPath`, `outputChange` |
| `run_finished` | `runId`, `outcome`, `exitCode` (`RUN-31`), `time`, `logPath` |
| `cache` | (only with `--read-cache`) `cache`: the Runner's cache, or `null` when there is none (`RUN-13`, `RUN-27`) |
| `run_refused` | `error` (a Diagnostic whose `code` names the reason, such as `source-root-missing` or `lock-held`), `exitCode` 2: a run that couldn't start (`RUN-31`). Added while building the Runner; see `FND-43` |

Key names follow `DATA-19` and the reference schema, section 9 (accepted by the user for the MVP on 2026-11-07).

- **RUN-13** `--read-cache` prints one `cache` event holding **exactly the Runner's cache** (`RUN-27`), with the records grouped by data name (`RUN-25`). It reads nothing else: not the tool stores, not the database. It starts no tool and writes nothing. With no cache yet, the event is empty.
- **RUN-27** **The Runner's cache** (decided by the user on 2026-11-07; `runner.md`, section 10.2).
  - The MVP has one implicit run configuration (`RUN-01`), so one cache: `data/runner/cache.json`.
  - **Each real run replaces it**, written to a temporary name and renamed at the end, failed runs included.
  - **What goes where** (accepted by the user for the MVP on 2026-11-07). The database keeps only what the refresh check needs: file hashes, fingerprints, the last result of each invocation, and the runs (`RUN-20`, `RUN-22`). The cache holds what the Viewer reads. The Viewer reads only the cache, through `--read-cache` (`VIEW-03`).
  - **Its shape** is one JSON object with `run`, `files`, `tools`, `invocations`, `data` and `dryRun`, described in the reference schema, section 13 (accepted by the user for the MVP on 2026-11-07). Each tool output is stored once under `data`; an invocation's input points to it instead of copying it.
  - It holds the run's input, result and intermediate data: run ID, outcome and times; the file list; the record of tools and the order used; for each invocation, the JSON sent, the dry-run result, the tool's `result.json`, and `skipped` with its reason; and the data each tool produced, grouped by data name with its `--info` details. Outputs of tools skipped as up to date are read from their stores (`RUN-18`) and included, so the cache always describes the whole current state.
  - It holds only tools in the current record and files in the current file list, so after check C1 or a deleted file the old data is gone from what the Viewer sees (`FND-06`).
  - Per-file results come from the cache too: M1 keeps one `result.json` per store, but the cache keeps each invocation's result.
  - **A `--dry-run-only` pass leaves alone the part of the cache the Viewer draws from** (decided by the user on 2026-11-07; `runner.md`, section 10.2). It replaces only a separate dry-run part: for each invocation, `go` or `no-go`, the refresh reason or `up-to-date`, the error, the diagnostics from the tool's go line (`DATA-17`) and `staleInputs`. After a real run, each invocation's diagnostics are in its `result` in the cache. The Viewer may show that part, but never in the graph. A real run replaces the whole cache, dry-run part included, which drops it.
  - Tools never read it; they work only from their inputs and manage their own cache if they need one.

## Log

- **RUN-14** Every run writes `data/runner/logs/<timestamp>.log` in the shared format (DATA-16), a `--dry-run-only` pass too, with the pass marked as a dry run in its first entry (`RUN-23`).
- **RUN-15** For every tool invocation, the log records the time, the exact command line, the JSON sent, the dry-run result and the real result. A user can repeat any step by hand from it.

## Errors

| Situation | Runner does |
|---|---|
| Unknown database version | Stops before anything, exit 2 |
| A tool's `--info` doesn't say whether it reads files, or contradicts itself (`RUN-05`, `DATA-09`) | Diagnostic naming the tool, code `tool-info-inconsistent`; stops before the run, exit 2 |
| Another run holds the lock (`RUN-30`) | Diagnostic naming the running run; stops before anything, exit 2 |
| User-defined data missing, such as the source root (`RUN-29`) | Diagnostic saying what is missing and how to give it; stops before anything, exit 2 |
| A provided value isn't valid, or a required parameter has no provider (`RUN-29`) | Diagnostic naming the value, or the tool and parameter; stops before any tool starts, exit 2 |
| A tool's `--info` fails or isn't valid JSON | Stops before the run, names the tool |
| Dry run no-go | Stops, starts no other tool, reports the tool's error and logs it |
| A dry run prints no valid last line, or invalid JSON | Treated as no-go with the tool's error; its exit code and standard error go to the Runner log; stops (accepted by the user for the MVP on 2026-11-07) |
| Real run failed | Stops; earlier tools' outputs and database rows stay (no staging, `RN-16`) |
| An earlier tool's output fails the shape check right after that tool ran (`RUN-19`) | Treated as that tool's failed real run, with the failed check in the Runner log; stops |
| A tool crashes (no result written) | Treated as a failed real run, with the exit code and standard error in the Runner log |
