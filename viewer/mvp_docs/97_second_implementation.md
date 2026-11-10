# 97. MVP 2: state, decisions and open questions

**The MVP's main working file.** It holds where MVP 2 stands, its decisions, its phases, the parts still to reconsider, and its open questions (`M2Q-`). The plan is `41_typescript_program_plan.md`, the tool's design `42_tool_ts_program.md`, the findings `99_findings.md`, the dated change log `96_mvp2_change_log.md`. MVP 1 and the docs as they stood before 2026-11-10 are frozen in `mvp1/`; the readable summaries are in `summary/`.

## 1. How this file is kept

- When something is decided, built or checked: update this file (sections 3 to 6), state it as current text in the file that owns it, record a finding in `99_findings.md` where there is one, and add a line at the top of `96_mvp2_change_log.md`.
- The docs hold no history and no struck wording: a changed item is rewritten to its current text. The history is in the change log, the findings and `mvp1/`.
- An open question gets the next free `M2Q-` number in section 6 and keeps it. When answered, it moves to section 7 with its answer and where it is recorded.
- A [Decided] item in a working file that stands in the way of a correct graph is reopened in that working file, never overridden here (`MVP_scope.md`, section 1.2).

## 2. Goal

**A correct graph in the Viewer, from real TypeScript data** (`MVP_scope.md`, section 1.2; `TSP-D1`). **Correctness comes before consistency with earlier work**: every part of the MVP is reconsidered against that goal, and kept only where it serves a correct graph. What "correct" means is `TSP-01` (`41_typescript_program_plan.md`, section 1.1): the graph shows what TypeScript itself knows, and nothing it doesn't.

## 3. Where MVP 2 stands

The code is in `zaansouvi-mvp/`.

| Part | Version | State |
|---|---|---|
| `ts-program` | 0.2.0 | built; the only tool the Runner runs (`RUN-33`); writes `code.symbol`, `code.reference`, `code.link` per source file, with `declaredWith`, `defaultExport`, the `override` and `accessor` modifiers (`FND-98`, `FND-110`) |
| Runner `zaansouvi-run` | 0.1.0 | built: the run list, every file listed with its status, per-file outputs from a program tool, a rerun when any input changes, a clear stop when no file matches a tool |
| Viewer `zaansouvi-view` | 0.1.0, model format 2 | built: levels at any depth, a frame for any entered container titled by the entered node, the "Not connected" frame with files, folders and status icons, built-ins apart, other keys in Details, the range's text in Details. **The human review (P3) is in progress** |
| Tool helper, shared library | | built; unchanged for `ts-program` |
| M1, M2, M3 | 0.5.0, 0.2.0, 0.2.0 | kept as built, **not run** (`TPG-01`); **stale and frozen**, with MVP 1's checks, `test-source/` and `expected/` (`zaansouvi-mvp/README.md`) |

**Checks**, all passing when last run (`06_test_plan.md`, "MVP 2's checks"):
- `tests/ts-program/check.mjs`: `ts-program` against the hand-written `expected-mvp2/`, exact: 120 nodes, 156 edges, 20 links, 25 built-ins, 1 unresolved; 60 node facts against a hand-written table.
- `tests/ts-program/check-definitions.mjs`: every edge against TypeScript's "go to definition", 156 of 156.
- Determinism with the file list reversed; the read log (only the listed `.ts` files and TypeScript's library).
- `tests/runner/run-tests.mjs`: 28 checks. `tests/viewer/check-server.mjs`: 37 checks.
- `tests/viewer/browse/`: the page in headless Firefox, `b7.sh` included. **Not all rerun after the last page changes** (see section 5, first step).

**Measured on real code**, ZaAnSouVi's own `app/`, 17 files, about 6,000 lines (`FND-99`): a full run 4.4 s (`ts-program` 1.3 s), unchanged 1.2 s, a dry run 2.3 s; a run through the Viewer to its graph 8 s; 69% of 12,533 uses resolved, 14% built-ins, 585 to packages and 1,464 unresolved, almost all through packages with no type declarations in the program (`TPG-D8`); one file's view of 110 nodes and 349 edges is unreadable, which is the main design problem MVP 2 found (`VW-39`).

**Against the success criteria** (`MVP_scope.md`, section 7):

| Criterion | State |
|---|---|
| 1. One command runs `ts-program` and leaves the Viewer's data (P2) | met |
| 2. The output matches the hand-written expected graph; every edge agrees with "go to definition" (P2, P5) | met |
| 3. The Viewer starts the Runner, shows the graph at every depth, traces back to file and line (P1, P3, P5) | built and checked by script; **the human review is in progress** |
| 4. A broken input gives a clear no-go, shown in the Viewer with the last good graph (P1) | met (`B7`) |
| 5. A dry-run-only pass reports go and writes nothing; a source with no file to read stops, saying why (P1) | met |
| 6. On real code, run times and the share of uses resolved are measured and their limits recorded (P5) | met |

## 4. Decisions

All decided. Each is stated as current text in the file named.

| ID | Decides | Decision | Where |
|---|---|---|---|
| `TSP-D1` | Inside the MVP, or after it | a second stage of the MVP, MVP 2; goal a correct graph, correctness first | `MVP_scope.md` 1.2 |
| `TSP-01` | What a correct graph is | what TypeScript knows, nothing more: nodes, edges, the forced cases, the Viewer, checks, limits | `41`, 1.1 |
| `TPG-01` | M1 | kept as is, not run | `42`, 1 |
| MVP 1's code | M1, M2, M3, MVP 1's checks, `test-source/`, `expected/` | stale and frozen: not maintained, kept for future tests, for example as a source of wrong data and wrong input (`M2Q-14`) | `zaansouvi-mvp/README.md` |
| `TPG-02` | A tool running TypeScript | `ts-program`, extracting the data the graph needs | `42` |
| `TPG-03` | Its contracts | in line with the existing ones; new keys allowed in JSON input and output | `42`, 1 |
| `TPG-D1` | How M1 is left out | a hardcoded run list in the Runner, checked against the folders; `ts-program` alone | `RUN-33` |
| `TPG-D2`, `TSP-D6` | Links | `ts-program` gives them; M2 not run | `42`, 5.3 |
| `TPG-06` | Is `ts-program`'s output enough? | yes; frames for any entered container close the one gap | `42`, `TSP-D8` |
| `TSP-D2`, `TSP-D3`, `TS-37` | How a whole-program tool runs | once over the program, one output file per source file; program tools a named exception to one file per invocation, declared in `--info` | `toolset.md` 4.2; `42`, 4 |
| `TSP-D4` | What the program holds | the listed `.ts` files and TypeScript's library only | `42`, `TPG-20` |
| `TSP-D5`, `TPG-D4` | Compiler options | from a `ts-config` tool reading each config as written, merged by TypeScript's API; the root `tsconfig.json`; a package `extends` reported; a malformed config a no-go | `42`, 3.1 |
| `TPG-D4a` | `ts-config` in the run list | not yet: `ts-program` runs on TypeScript's defaults, noted in each run's result | `42`, 3.1 |
| `TSP-D7`, `TPG-D3` | What a node is | every declaration TypeScript binds, types included; type uses are edges of kind `type` | `41`, 1.1 |
| `TSP-D8` | Nesting | from `parent`, the declaring symbol; M3 not run; a frame for any entered container | `41`; `UI-37` |
| `TSP-D9` | Member uses | ordinary references marked `member` | `42`, 5.2 |
| `TSP-D10`, `TPG-D5` | Built-ins | `to: null`, `reason: "built-in"`, the library type's name; listed apart | `42`, 5.2 |
| `TPG-D6` | IDs of merged declarations | the first declaration's position; the others listed | `42`, 5.1 |
| `TPG-D7` | References' keys | `from` and `to` only | `42`, 5.2 |
| `TSP-D11` | Refresh | rerun when any input file or config changes; only changed outputs written; no incremental state | `03_runner.md` |
| `TSP-D12` | JavaScript and JSX | out of MVP 2 | `41` |
| `RUN-34`, `UI-47a` | Which files are listed | every file, accurately | `03_runner.md` |
| `RUN-34a` | Ignore files | not applied; every file listed; each run says ignore files were not applied | `03_runner.md` |
| `RUN-34b` | Folders skipped as a whole | `node_modules` and `.git`, shown as folder nodes with file count and size | `03_runner.md` |
| `UI-47` | The top view | every file a node; files and folders connected to no graph in a "Not connected" frame, in a grid | `50_viewer_ui.md` |
| `UI-47b` | A file's type | its extension, labeled as one ("· .ts"); "unknown" without one | `50_viewer_ui.md` |
| `UI-48`, `UI-48a`, `RUN-35` | Status icons | hidden (grey circle), link inside (blue diamond) and outside (orange diamond), read-only (purple square), unreadable (red triangle); in a column on the left inside the node; all shown | `50_viewer_ui.md` |
| `VIEW-15` | Keys beyond a record's field roles | shown in Details, so not extra data | `05_viewer.md` |
| Test source | MVP 2's test source | the class-heavy test, `test-source-mvp2/`, with subfolders | `06_test_plan.md` |

## 5. Phases

| Phase | Work | State |
|---|---|---|
| 0 | the decisions | done |
| 1 | documents: working files, `mvp_docs/`, the reference schema | the MVP docs rewritten for MVP 2 (2026-11-10); the reference schema for MVP 2 in `proposed_schema/` (`DATA-24`); items the docs could not yet state for MVP 2 are marked *To update for MVP 2* where they are |
| 2 | test source and expected graph, by hand, first | done: `expected-mvp2/` |
| 3 | the `ts-config` tool | deferred (`TPG-D4a`) |
| 4 | the tool helper and the Runner | done |
| 5 | `ts-program` | done: 0.2.0 |
| 6 | M3 with nested scopes | not needed: M3 not run (`TPG-06`) |
| 7 | the Viewer at any depth | done |
| 8 | measure on real code; findings | measured (`FND-99`); the findings note after the human review |

**First step of the next session:** run every browser check once (`tests/viewer/browse/`). After the last page changes only the checks they touch were rerun (`frame-title`, `frame-notes`, `frame-notes-run`, `range-text`, `selection`, `frame-views`, `enter-marks`); `mvp2`, `members`, `builtins`, `zoom-controls`, `problems`, `problem-items`, `tools-pane`, `contains`, `activity-count`, `layout-repeat` and `b7.sh` were not.

**Done when** (`41_typescript_program_plan.md`, section 5): `TSP-01` to `TSP-05` hold; the documents say what was built; the human review (P3) is done on a real codebase.

### 5.1 Parts to reconsider

Under correctness first, each part is kept, changed or replaced, with the reason.

| Part | Question | State |
|---|---|---|
| Stable IDs (`DATA-02`, `DATA-03`) | is a position-based ID correct for merged declarations, overloads, accessors and members, and stable across edits? | to reconsider; merged declarations take the first one's position (`TPG-D6`) |
| The `--info` contract (`DATA-08` to `DATA-10`, `DATA-23`) | program tools; per-file outputs from a once tool; attributes | to reconsider |
| The tool helper | whatever the new contract needs | to reconsider; it needed no change for `ts-program` |
| The Runner (`03_runner.md`) | listing, invocation, refresh, the cache and database, dry runs | the run list and the full listing decided; the rest to reconsider |
| The Viewer's graph model (`05_viewer.md`, `55_viewer_backend.md`) | do the lifting and owner rules give a correct graph at any depth? | to reconsider |
| The Viewer's page (`50_viewer_ui.md`) | how members, kinds and built-ins read; arrow direction (`VW-40`) | the top view decided (`UI-47`); the rest to reconsider |
| Checks | checks of the graph itself against the hand-written expected graph | to reconsider |
| The reference schema (`DATA-20`) | rewritten from the new contracts | the MVP 2 schema files stand (`DATA-24`); to reconsider |
| MVP 1's test source | keep `test-source/` beside `test-source-mvp2/`? | to reconsider (`TSP-03`) |

## 6. Open questions

Each names what it decides and a suggested answer. Nothing is built until it is answered.

- `M2Q-1` **Files inside their folders** (`FND-104`). In the top view, files are drawn loose and their folders sit apart in "Not connected", so the folder structure is not visible. Should each folder be a frame holding its files and subfolders, and a level you can enter? *Suggested:* yes to both: folders as nested frames in the top view, enterable like files, edges between files drawn across them.
- `M2Q-2` **A range per declaration** (`FND-106`, `FND-110`). Merged declarations keep only the first one's `range` (`total`: the first overload; `label`: the getter, not the setter), so Details shows one column where there should be three or two. Should `ts-program` record each declaration's range, for example `declarations` holding `location` and `range`? *Suggested:* yes; the expected graph and the check gain those ranges by hand.
- `M2Q-3` **A variable's range** (`FND-107`). A variable's range starts at its name (`Anonymous = class …`), a class's at `export` (`export abstract class Base …`), because `export const` belongs to the statement. Should a variable's range cover its whole statement? *Suggested:* yes for one-name statements; a statement declaring several names keeps each name's own.
- `M2Q-4` **`ro`/`rw` markers and default values.** `readonly` and `declaredWith` give the marker; a default needs a new key, for example `initializer`, the source text, capped. (a) Which kinds get a marker: properties and variables only, or also accessors, enum members, imports and parameters? (b) Under the node's label, or only in Details? (c) How long may a default be on the label before it is cut? *Suggested:* properties and variables; the label shows `= "anon" · ro` only on a node drawn on its own, Details the full text; cut at 24 characters.
- `M2Q-5` **Link and "other" shapes** (`FND-103`). Their slanted rectangles slant more the wider the node. The same fixed angle as folders? *Suggested:* yes, the same per-node polygon.
- `M2Q-6` **Crowded views** (`FND-104`, `VW-39`). In `bars.ts` an edge runs under a node; on real code one file's view had 110 nodes and 349 edges. Which first: edges routed around nodes, a different layout for files, or filtering (hide types, built-ins, parameters)? *Suggested:* filtering first, since it also helps reading; routing later.
- `M2Q-7` **Type parameters as nodes.** `in` and `out` on type parameters are not recorded, as type parameters are not symbols. Should they become nodes? *Suggested:* not for MVP 2.
- `M2Q-8` **The human review (P3).** Who reviews, on which codebase, and what counts as a pass (`FND-32`, `DEL-06`)? Its result feeds the findings note (`DEL-07`), `MVP-5` and `MVP-8`. *Suggested:* the user, on `test-source-mvp2` and a real codebase, judged against `TSP-01`.
- `M2Q-9` **The Runner's user and the Viewer's** (`RUN-35`, `FND-91`). Read-only and unreadable are judged for the Runner's user; the Viewer starts the Runner itself, but the Runner can also be run by hand. Check whether they are the same user, once MVP 2 works.
- `M2Q-10` **Package type declarations** (`TPG-D8`). Leaving them out leaves 585 uses of imported packages and 1,464 uses through them unresolved on Node code. *Suggested:* `ts-program` reads the type declarations (`.d.ts`) of the packages a source imports, declarations only, still one file type.
- `M2Q-11` **Keys known by name in one place** (`FND-56`): whether one shared module lists the keys and data names the programs know by name.
- `M2Q-12` **The MVP's cuts in one place** (`FND-60`, item 7; `FND-17`): the parts of the working files the MVP leaves out, such as Ctrl + wheel, are not listed in one place.
- `M2Q-13` **MVP 1's test source under `ts-program`** (`TSP-03`, `TPG-50`): run `ts-program` on `test-source/` and list every difference from M1's output, each explained? *Suggested:* yes, as evidence of what MVP 1 missed; M1's own checks stay as they are.
- `M2Q-14` **Broken-input checks for `ts-program`** (`TPG-43`): only the syntax error is checked (`B7`); configs can't be tested until `ts-config` exists. Which broken inputs to add now? The frozen M1 to M3 can supply wrong data and wrong input for these tests: records for the same source that differ from `ts-program`'s.
- `M2Q-15` **Tool options and invocation errors** (`FND-13`, `FND-14`): do tools need `--help` and `--version`, and does a dry-run no-go on an invocation error print a JSON line on standard output, or only on standard error?
- `M2Q-16` **The Viewer's list of sources.** The checks added sources in temporary folders, some of which no longer exist. Remove them in the page, or leave them (a missing folder only fails its run)?
- `M2Q-17` **File statuses in the database** (`RUN-35`). The statuses (hidden, link, read-only, unreadable, and the rest) are kept only in the cache's file list; `project_files` holds each file's ID, size and content hash. Should `project_files` hold the statuses too? *Suggested:* not for MVP 2: the Viewer reads them from the cache, and nothing else needs them yet.
- `M2Q-18` **Which views of `test-source-mvp2` to document.** Its 32 views are not written down anywhere, and no check compares them view by view (`50_viewer_ui.md` 4.1, `VIEW-13`, `BE-55`, the human review's questions 2 and 3 in `06_test_plan.md`, each marked *To update for MVP 2*). Which views are written as expected, and by hand? *Suggested:* the top view and the views of `shapes.ts`, `Circle` and `app.ts`, by hand in `expected-mvp2/`, with a model check comparing them, as `check-model.mjs` does for MVP 1.
- `M2Q-19` **Four places where docs and code disagree** (found 2026-11-10): `TSP-D11` says only changed outputs are written, but the tool helper rewrites every output and records `outputChange`; `ts-program`'s `--info` lists `E6` for a missing file, but the code gives `E12`; `configs`' description in its `--info` still says 0.1.0; `DEL-08` keeps MVP 1's time box. *Suggested:* the docs follow the code for `TSP-D11` and `DEL-08` (MVP 2's estimate in `41`, section 3); the code's `--info` is corrected for `E6` and `configs`, with `tests/ts-program/check.mjs` rerun.

Also open, under their own IDs:
- `TPG-D8` **Package type declarations in the program:** open, asked as `M2Q-10`.
- `MVP-5` **Contracts kept** (`MVP_scope.md`): answered in the findings note.
- `MVP-8` **Success criteria and a time target** (`MVP_scope.md`): answered in the findings note.

## 7. Answered questions

None yet.

## 8. Deferred until after the MVP

- File kinds: the kind checkers and the kinds database (`40_tools_fileKind.md`, `FND-80`).
- `ts-config` (`TPG-D4a`).
- JavaScript and JSX (`FND-81`, `TSP-D12`).
- From `MVP_scope.md`, section 10.3: arrow direction (`VW-40`), navigation and search (`VW-41`), layout strategy (`VW-39`), nested and block scopes, P4's test (section 10.1), and the rest listed there.
