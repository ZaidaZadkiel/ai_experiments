# 06. Test plan

Answers `MVP-14` for the MVP: the examined test source and its expected graph, the automatic checks, the broken inputs and the human review, and where the tests of M1, M2 and M3 are. The expected result is written by hand **before** the tools exist.

## The examined source

`test-source-mvp2/`: six TypeScript files under `src/`, in subfolders, and a `README.md` naming what each file exercises (`FND-92`, `FND-104`):

| File | What it exercises |
|---|---|
| `src/shapes.ts` | interfaces, a type alias, enums, an abstract class and two subclasses (one generic), parameter properties, accessors, a decorated method, an overloaded function, a namespace, a class expression, re-exports and a default export |
| `src/app.ts` | default, named, type-only and namespace imports from `shapes.ts`; a class of its own; member calls on imported classes; destructuring; `try`/`catch`/`finally` |
| `src/util/numbers.ts` | imports from `shapes.ts` one folder up; a call to a method of an imported interface |
| `src/report/format.ts` | an import from a sibling folder |
| `src/report/summary.ts` | imports from `app.ts`, `shapes.ts`, the same folder and a sibling folder; a method call on a class `app.ts` doesn't export |
| `src/report/charts/bars.ts` | two folders down: the default export and a function from `shapes.ts`, imports from its parent folder and from `util/` |

Deliberate: `export * from "./extra"` in `shapes.ts` names a file that doesn't exist (an unresolved re-export); there is no `tsconfig.json` (`TPG-D4`); built-ins are used (`TPG-D5`).

**Expected graph:** `expected-mvp2/`, written by hand in `write_expected.py` (`expected-graph.json`): 120 nodes, 156 edges, 20 links, 25 built-ins and 1 unresolved (`FND-104`), and per node its facts `exported`, `defaultExport`, `declaredWith`, `modifiers` and the number of `declarations` (60 facts, `FND-110`). What a correct graph is: `41_typescript_program_plan.md`, section 1.1.

MVP 1's three-file test source (`test-source/`) and its expected result written by hand (`expected/`: symbols, references, links, scopes and file edges) belong to M1, M2 and M3, which are kept as built and are not run in MVP 2 (`TPG-01`, `RUN-33`); their checks still exist and pass. They are in `mvp1/docs_2026-11-10/06_test_plan.md`, sections "The basic examined source" and "Expected result".

## Automatic checks

All tests run on Node 22.23.1, and each test that needs a clean state starts by deleting `data/`.

### MVP 2's checks

From `zaansouvi-mvp/`; all pass (`FND-98`, `FND-99`, `FND-104`, `FND-110`). **All of them in one command: `bash tests/run-all.sh`**, which prepares the sources the browser steps need (a copy of the Runner's code as `runner`, the source with every status), seeds their graphs, and runs the steps in an order that works on any `data/`, an empty one included; `--no-browser` runs the scripted checks only. The browser steps use the real `data/`, so the script refuses to run them while a Viewer runs (`zaansouvi-mvp/tests/viewer/browse/README.md`):

| Check | What |
|---|---|
| `node tests/ts-program/check.mjs` | `ts-program` against the hand-written `expected-mvp2/`: nodes, edges, links, built-ins, unresolved, and each node's facts, exact |
| `node tests/ts-program/check-definitions.mjs` | every edge's target against TypeScript's "go to definition" (156 of 156; a namespace import and a union's second target accepted as known differences, each still checked) |
| `node tests/runner/run-tests.mjs` | `TEST-01` to `TEST-05` and `R1` to `R11` below: 28 checks on a copy |
| `node tests/viewer/check-server.mjs` | the backend on `test-source-mvp2`: security, reads, the activity log, runs, bad data across restarts: 37 checks |
| `node tests/viewer/check-model.mjs` | MVP 1's model check (`TEST-09`), still passing on its saved cache |
| `tests/viewer/browse/mvp2.json` | the page on `test-source-mvp2` and on a source with every status |
| `tests/viewer/browse/b7.sh` | `B7` through the page: a syntax error gives a no-go with its reason; the last good graph stays shown |

### Runner checks

`tests/runner/run-tests.mjs` works on a temporary copy of `zaansouvi-mvp/` (its `node_modules` linked) and a copy of `test-source-mvp2` outside it, so the real `data/` is never touched. It prints every check and exits 1 if any fails.

- **TEST-01** Starting from an empty data folder (delete `data/`), the Runner runs on the copy of `test-source-mvp2`: the run succeeds with exit code 0; `ts-program` runs once, with refresh reason `missing`; and its output matches `expected-mvp2/` exactly (`tests/ts-program/check.mjs` on the tool's output folder).
- **TEST-02** Run after TEST-01, so the store holds a real run's outputs (`RUN-16`). A `--dry-run-only` pass exits 0 and reports `go` for `ts-program`, marked `up-to-date` and with no `staleInputs`, and leaves the tools' stores (`data/tools/`) unchanged (compare file hashes before and after).
- **TEST-03** With `data/tools/` deleted, a `--dry-run-only` pass exits 0 and reports `go` for `ts-program`, with reason `missing`; no tool writes any output.
- **TEST-04** Refresh check (`RUN-17` to `RUN-22`, `TSP-D11`), each step after a real run:
  - **Nothing changed:** a second run skips `ts-program` (`tool_skipped`) and starts no tool.
  - **A file touched, its content the same** (a new modification time on `src/app.ts`): still skipped.
  - **A file changed** (a line appended to `src/app.ts`): `ts-program` runs, with reason `inputs-changed`, and succeeds.
  - **A `.ts` file added** (`src/extra.ts`): `ts-program` runs, given 7 files.
  - **Its outputs deleted:** `ts-program` runs, with reason `missing`.
  - **A file no tool reads added** (`notes.txt`): still skipped.
- **TEST-05** After a real run, `zaansouvi-run --read-cache`: one `cache` event; `run.outcome` is `succeeded`; `files` lists every entry, folders included, in ID order (`README.md`, `src`, `src/app.ts`, `src/report`, `src/report/charts`, `src/report/charts/bars.ts`, `src/report/format.ts`, `src/report/summary.ts`, `src/shapes.ts`, `src/util`, `src/util/numbers.ts`); `tools` lists `ts-program` alone, and the three other tool folders are reported as not listed; `data` holds 120 `code.symbol`, 182 `code.reference` and 20 `code.link` records.
- **Stand-in tools.** Small programs under `tests/fixtures/tools/`, one per behavior, each answering `--info` like a real tool and taking the `code.symbol` records: `stub-go` (says go, writes a valid output), `stub-no-go`, `stub-crash` (exits without writing `result.json`) and `stub-garbage` (prints invalid JSON on its dry run). The tests copy the ones they need into the copy's `app/tools/` and put them in its run list after `ts-program` (`RUN-33`).

| # | Situation | Expected |
|---|---|---|
| R1 | database with an unknown `config_version` (99) | exit 2, a diagnostic naming the version |
| R2 | a listed tool whose `--info` isn't JSON | exit 2, names the tool |
| R3 | `stub-crash`, listed after `ts-program` | treated as a failed real run; exit 1 |
| R4 | `stub-garbage`, listed after `ts-program` | treated as no-go; exit 1 |
| R5 | a run while a live process holds `data/runner/run.lock` | exit 2, a diagnostic naming the running run, nothing written |
| R6 | a stale lock (its process gone) | the run takes it over, notes it in the log (`stale_lock_taken_over`), runs normally, exit 0 |
| R7 | no source root on the command line and none saved | exit 2, a diagnostic saying the source root is missing and how to give it |
| R8 | an empty folder in `app/tools/` | the run is unaffected, exit 0; the folder is not reported as a tool |
| R9 | a listed tool with no folder | exit 2 before any tool runs, naming it |
| R10 | tool folders not in the run list (`file-symbols`, `cross-file-links`, `symbol-scope`) | reported as not listed, not run |
| R11 | no file to read (a source holding only a `.js` file) | stops before the tool: no-go, the message saying none of the listed files matches, exit 1 |

### Viewer checks

- **TEST-09** `tests/viewer/check-model.mjs`: the graph model built from `expected/runner-cache.json` matches `expected/graph-views.json` view by view (nodes, stubs, the "this" node, edges with their counts and kinds, unresolved counts); two builds give the same bytes; six damaged caches give the expected invalid or extra items (`BE-91`, `BE-92`).
- **TEST-10** `tests/viewer/check-server.mjs`: the backend on a temporary copy of the MVP, whose data it makes itself by running the copied Runner on a copy of `test-source-mvp2` (`ts-program` alone, `RUN-33`): the token, `Host` and `Origin` checks, the 64 KiB limit, sources, the graph (format 2, 32 views, nothing invalid or extra; the top view's 1 unresolved use and 25 built-ins; every listed entry a node) and its storing, reads limited to listed files a tool read and to `data/` (a range with `end`, a listed file no tool read, a symbolic link out included), the activity log (deleted while running, unknown events, Clear), a run and a refused second run, and bad data across restarts (partly invalid, failed, an entry in another format, a damaged `sources.json`, cleared Runner data). 37 checks (`BE-92` to `BE-94`). The 32-check version on MVP 1's data is `tests/viewer/check-server-stage1.mjs`.
- **The page** stays a human review (P3, `BE-95`; `97_second_implementation.md`, `M2Q-8`).

## Broken inputs

Each one is run and must give the stated result. "By hand" means invoking the tool directly.

| # | Input | How | Expected |
|---|---|---|---|
| B7 | `export class Broken {` (an unclosed class) appended to `src/app.ts` in a copy of `test-source-mvp2`, after a good run | Runner, through the page (`tests/viewer/browse/b7.sh`) | `ts-program`'s dry run is no-go (`E12`), the Runner stops, the Viewer shows the no-go with its reason and keeps showing the last good graph |
| B10 | source root that doesn't exist | Runner | Runner exit 2, nothing written |

## M1, M2 and M3's tests

M1, M2 and M3 are kept as built and are not run in MVP 2 (`TPG-01`, `RUN-33`). They are **stale and frozen**: not maintained, kept for future tests such as wrong data and wrong input (`97_second_implementation.md`, section 4). Their requirements are in `summary/00_definitions_mvp1.md` and `mvp1/docs_2026-11-10/06_test_plan.md`:

- **TEST-06** M3 against `expected/symbol-scope.json`; **TEST-07** M3 on nested functions and file-level symbols; **TEST-08** M1 to M3 run by hand, byte-identical.
- Broken inputs run on M1, M2 or M3: **B1** both `--json` and `--stdin`; **B2** `--json` naming a missing file; **B3** JSON missing `file_id`; **B4** no parameters, no `last_run.json`; **B5** no parameters, repeating the last run; **B6** a file path that doesn't exist; **B8** M2 with duplicate symbol IDs; **B9** an import of a missing file; **B11** M3 with empty `symbols`; **B12** M3 with duplicate symbol IDs; **B13** M3 with a function lacking `range`; **B14** M3 with `symbols` missing or malformed; **B15** M3 with a malformed symbol record.
- **C2** renaming `round` across two files.
- The expected end states of `B7`, `B9`, `C1` and `C2` on `test-source/` (`FND-25`).

- **C1** Not in force in MVP 2: MVP 2 never runs M3; the run list holds `ts-program` alone (`RUN-33`). MVP 1 text: `mvp1/docs_2026-11-10/06_test_plan.md`.

## Human review of the Viewer (P3)

The person deciding whether the Viewer passes goes through these and answers yes, no or partly, with a note:
1. Can you start a run and a dry run from the page, and see each tool's go / no-go and result?
2. Does level 1 show the three files and the three file edges, each counting 2?
3. Can you go into `main.ts`, see the `run` scope, and go into it to see `first` and `label`?
4. Do the links leaving a file lead you to the right symbol in the other file?
5. Does selecting any node or edge show the right file:line and source line?
6. When B7 is run, is the error clear enough to know what to fix?
7. Overall: would this be worth building further? Why or why not?

*To update for MVP 2:* questions 2 and 3 name MVP 1's test source (`test-source/`) and M3's scopes. What they ask of `test-source-mvp2/` (which files and edges the top view should show, which file and which container to go into, and what should be inside) is not written down, and needs the views of `test-source-mvp2` (`50_viewer_ui.md`, section 4.1); the user decides them.

The answers go into the findings note (`07_delivery.md`).
