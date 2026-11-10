# 97. Second implementation

**The main working file for the MVP from 2026-11-09 on.** It holds where the MVP stands, the second stage of its implementation (real TypeScript: M1 on the whole program), what is open, and a dated record of changes. It supersedes `98_first_implementation.md`, which is kept as the record of the first stage and no longer updated.

## 1. How this file is kept

- **This file** holds the MVP's current state: what is built and checked, the second stage's decisions and phases with their status, the open items, and the change record (section 6). Update it whenever something is decided, built or checked.
- **`98_first_implementation.md`** (superseded on 2026-11-09): what the first stage built, 2026-11-07 to 2026-11-09, part by part. Read it for the first stage's detail; don't update it.
- **`99_findings.md`** keeps the findings (`FND-`), each with what was found, decided or built. A finding is still recorded there; this file points to it. Its section 10.6 ("Current state") gives way to this file.
- **`41_typescript_program_plan.md`** is the plan for the second stage; its decisions (`TSP-D1` to `TSP-D12`) and phases are tracked in section 3 here.
- **The requirements** stay where they are (`01` to `07`, `50`, `55`), changed as the second stage's decisions are taken.

## 2. Where the MVP stands (first stage)

Built from 2026-11-07 to 2026-11-08, refined on 2026-11-09; in detail in `98_first_implementation.md`. The code is in `zaansouvi-mvp/`; the user backed up the whole folder on 2026-11-09, before the second stage.

| Part | Version | State |
|---|---|---|
| Tool helper, shared library | | done |
| M1 `file-symbols` | 0.5.0 | done; hand-written name resolution, functions and variables only (`FND-82`) |
| M2 `cross-file-links` | 0.2.0 | done |
| M3 `symbol-scope` | 0.2.0 | done; file scope and top-level functions (`MVP-4`, option C) |
| `ts-program` | 0.2.0 | done (0.1.0 on 2026-11-09, `FND-98`); 0.2.0 adds `declaredWith`, `defaultExport`, the `override` and `accessor` modifiers (`FND-110`) |
| Runner `zaansouvi-run` | 0.1.0 | done; automatic tests not written |
| Viewer `zaansouvi-view` | 0.1.0 | done; refined after use on 2026-11-09 (below); human review (P3) pending |

**Refined on 2026-11-09, page only** (`FND-71` to `FND-78`): the edges of a selected node highlighted, pale (`UI-38`); several selected items in Details, each group's bar in its file's color (`UI-56`); a mark on nodes that can be entered (`UI-45`); a Text (100%) button and the zoom readout beside Fit (`UI-46`), the wheel's sensitivity 0.7 (`UI-31`); Problems led by names, unresolved relations grouped, for this view or all (`UI-54`, `UI-57`); Contains in the same item form (`UI-52`); Tools as item boxes with "not run" (`UI-58`); the activity line's count as "shown / logged" (`UI-73`); a guideline for display controls in the bottom right corner (`viewer.md`, section 4.8; `UI-15`).

**Checks of MVP 2** (2026-11-09): `tests/ts-program/check.mjs` (`ts-program` against `expected-mvp2/`, exact: ~~87 nodes, 117 edges, 8 links, 18 built-ins, 1 unresolved~~ 120 nodes, 156 edges, 20 links, 25 built-ins, 1 unresolved since the subfolders were added, `FND-104`); determinism with the file list reversed; the read log (only the listed `.ts` files and TypeScript's library); the Runner on `test-source-mvp2` (run, skip when unchanged, rerun after a change) and on a source with no `.ts` file (the clear stop); `tests/viewer/browse/mvp2.json` (the page on `test-source-mvp2` and on a source with every status); the type checks of `ts-program`, the Runner and the Viewer. ~~**Failing, first-stage checks to rewrite:** `tests/viewer/check-server.mjs`, 4 of 25 (it expects M1 to M3's data: 10 views, `code.membership`, scope-based activity text).~~ Since `FND-99`, all of MVP 2's checks pass: `tests/viewer/check-server.mjs` rewritten (35), `tests/runner/run-tests.mjs` (28), `tests/ts-program/check-definitions.mjs` (~~117 of 117~~ 156 of 156 edges), `tests/viewer/browse/b7.sh`; the list is in `06_test_plan.md`, "MVP 2's checks".

**Checks of the first stage** (all passing when last run): M1, M2 and M3 against `expected/` (2026-11-09); the graph model (2026-11-09); the backend, 32 of 32 (2026-11-08); the hand run, `TEST-08` (2026-11-08); the page in headless Firefox, `tests/viewer/browse/` (11 steps files, 2026-11-09).

**Against the success criteria** (`MVP_scope.md`, section 7):

| Criterion | State |
|---|---|
| 1. One command runs every tool and leaves the Viewer's data (P2) | met |
| 2. The output matches the expected result (P2) | met |
| 3. The Viewer runs the Runner, moves between levels, traces back to file and line (P1, P3) | built and checked by script; **the human review is still to do** |
| 4. A broken input gives a clear no-go, shown in the Viewer (P1) | met for the tools and the Runner; **`B7` through the page not tried** |
| 5. A dry-run-only pass reports go and writes nothing (P1) | met |
| 6. A run without M3 still shows a graph (P1, P3) | **`C1` not tried** |

**What the first stage showed about real code** (2026-11-09): M1 can't read JavaScript or JSX (`FND-81`), and misses classes, members, enums, namespaces and member calls in real TypeScript (`FND-82`). TypeScript's own checker resolves all of it within a file while reading only that file (`FND-83`); across files it needs the whole program (`FND-84`). Hence the second stage.

## 3. Second stage: MVP 2, real TypeScript

**Main goal** (decided by the user on 2026-11-09; `MVP_scope.md`, section 1.2): **a correct graph in the Viewer, from real TypeScript data.** **Priority: correctness comes before consistency with the earlier work; every part of the MVP is reconsidered** (section 3.3). The first stage's rules of least effort, the happy path and simplicity over precision no longer apply to MVP 2.

~~M1 rebuilt on TypeScript's program and checker over the whole examined source, changing contracts.~~ The means, as planned: M1 rebuilt on TypeScript's program and checker over the whole examined source, changing contracts; each suggested answer re-examined with correctness first. Plan: `41_typescript_program_plan.md` (`FND-85`, `FND-86`). ~~**State: `TSP-D1` decided; the other decisions pending; nothing built.**~~ **State (2026-11-09, evening): every decision taken; `ts-program` 0.1.0, the Runner's MVP 2 changes and the Viewer's model format 2 and page built and checked; `test-source-mvp2`'s graph matches the hand-written expected graph exactly (`FND-98`).** Not yet: `ts-config`, the human review, measurements on real code, the first stage's backend checks rewritten for MVP 2.

### 3.1 Decisions

| ID | Decision | Suggested answer (the plan's) | Status |
|---|---|---|---|
| `TSP-D1` | Inside the MVP, or after it | a second stage of the MVP, "MVP 2" | decided 2026-11-09: MVP 2, goal a correct graph, correctness first |
| `TSP-D2` | How M1 runs | once over the whole program, one output file per source file | decided 2026-11-09: overtaken, `ts-program` runs once over the program, per-file outputs (`TPG-12`) |
| `TSP-D3` | The exception to one file per invocation | a named class, program tools, declared in `--info` | decided 2026-11-09: as `TS-37`, program tools a named exception |
| `TSP-D4` | What the program contains | listed `.ts` files and TypeScript's library only | decided 2026-11-09: listed `.ts` files and TypeScript's library only (`TPG-20`) |
| `TSP-D5` | `tsconfig.json` | a `ts-config` tool, its options passed as data | decided 2026-11-09 as `TPG-D4` |
| `TSP-D6` | M2's fate | retired from the run; M1 gives links in M2's shape | decided 2026-11-09: not run; `ts-program` gives the links (`TPG-D2`, `TPG-06`) |
| `TSP-D7` | What counts as a node | classes, members, enums, namespaces, merged overloads; types still out | decided 2026-11-09: overtaken by the definition of a correct graph (`TSP-01`), types in |
| `TSP-D8` | Nesting | members inside their declaring symbol; nested scopes in M3 | decided 2026-11-09: nesting from `parent`; M3 not run; a frame for any entered container (`UI-37`) |
| `TSP-D9` | Member uses | ordinary references marked `member` | decided 2026-11-09: references marked `member` (`42`, 5.2) |
| `TSP-D10` | Built-ins | marked `built-in`, listed apart in Problems | decided 2026-11-09: as `TPG-D5` |
| `TSP-D11` | Refresh | rerun on any input change; TypeScript's incremental state in the store | decided 2026-11-09: rerun when any input file or config changed; only changed outputs written; no incremental state in the first version |
| `TSP-D12` | JavaScript and JSX | out of this stage | decided 2026-11-09: out of MVP 2 |
| `TPG-01` | M1 | remains as is, explicitly not run by the Runner for now | decided 2026-11-09 |
| `TPG-02` | A new tool running TypeScript | `ts-program`, extracting the data the graph needs, processed for further use (`42_tool_ts_program.md`) | decided 2026-11-09 |
| `TPG-03` | Contracts for it | keep in line; new keys allowed in JSON input and output | decided 2026-11-09 |
| `TPG-D1` | How M1 is omitted | a hardcoded list of tools to run in the Runner, checked against the folders; M1 not in it (`RUN-33`) | decided 2026-11-09 |
| `TPG-D2` | Links: `ts-program` or M2 | `ts-program` runs TypeScript in its invocation and transforms what it can into the Viewer's format, links included | decided 2026-11-09 |
| `TSP-01` | What a correct graph is | `41_typescript_program_plan.md`, section 1.1: what TypeScript knows, nothing more; nodes, edges, the forced cases, the Viewer, checks, limits | decided 2026-11-09 as the starting point |
| Test source | MVP 2's test source | the class-heavy TypeScript test (`FND-82`), unchanged, in `zaansouvi-mvp/test-source-mvp2/` | decided 2026-11-09 |
| `UI-47` | Top view: every file; unconnected files in a frame | each a free node "file name · type" or "· unknown", in a grid; frame "Not connected · N files" | decided 2026-11-09 |
| `UI-47a` | Which files the top view reports | every file: the Runner lists all files accurately, in MVP 2 (`RUN-34`) | decided 2026-11-09 |
| `UI-48` | Status icons on file and folder nodes; folders in the frame | hidden, link (inside/outside), read-only, unreadable; a column on the left inside the node; distinct colors, basic shapes; all shown; every folder in "Not connected" with file count or size | decided 2026-11-09 |
| `UI-48a` | The icons' colors and shapes | grey circle hidden; blue diamond link, orange diamond link outside; purple square read-only; red triangle unreadable | decided 2026-11-09 |
| `RUN-34a` | Ignore files (`.gitignore`) when listing | to define: apply them, or list the files and mark them ignored | decided 2026-11-09: not applied; every file listed; each run says ignore files were not applied |
| `RUN-34b` | Folders skipped as a whole | `node_modules` and `.git`, each reported with its file count | decided 2026-11-09: `node_modules` and `.git`, as folder nodes with file count and size |
| `UI-47b` | Where a file's type comes from | the extension for now; the file kinds of `40_tools_fileKind.md` later; or "unknown" until kinds exist | decided 2026-11-09: the extension, labeled as one ("· .ts"), "unknown" without one |
| `TPG-06` | Is `ts-program`'s output enough, or is more processing needed after it? | start with `ts-program` alone in the list; add a tool (links, scopes, other) only where the graph shows a need | closed 2026-11-09: **enough**, `ts-program` alone gives the graph; the one gap, frames, closed by `TSP-D8` (`FND-99`) |
| `TPG-D3` | Types in the graph | interfaces and type aliases as symbols; type uses as references of kind `type` | decided 2026-11-09, by the definition of a correct graph |
| `TPG-D4` | Where compiler options come from | `ts-config` reads each config as written; `ts-program` merges them with TypeScript's API; the root `tsconfig.json`; a package `extends` reported; a malformed config a no-go (`42`, section 3.1) | decided 2026-11-09 |
| `TPG-D8` | `@types` and package declarations in the program | measured cost of leaving them out (`TPG-20`): on Node code, 585 uses of imported packages and 1,464 uses reached through them unresolved; suggested: let `ts-program` read the type declarations (`.d.ts`) of the packages a source imports, declarations only, still one file type | open |
| `TS-37` | Program tools (`toolset.md`) | a named exception: every listed file of one file type in one invocation, declared in `--info` | decided 2026-11-09 |
| `TPG-D4a` | `ts-config` in the run list | `RUN-33` runs `ts-program` alone; `ts-config` must run first for options to exist: add it to the list, or run on TypeScript's defaults until then (same graph for `test-source-mvp2`, which has no `tsconfig.json`) | decided 2026-11-09: **start without `ts-config`**; `ts-program` alone, on TypeScript's defaults, noted in each run; `ts-config` added later |
| `TPG-D5` | Built-ins | `to: null`, `reason: "built-in"`, the library name | decided 2026-11-09 |
| `TPG-D6` | IDs of merged declarations | the first declaration's position; the others listed | decided 2026-11-09 |
| `TPG-D7` | `from`/`enclosing` duplicates | keep both for now | decided 2026-11-09: changed: `ts-program` writes `from` and `to` only |

**Since 2026-11-09, the new tool `ts-program` takes M1's place in the run** (`TPG-01` to `TPG-03`; `42_tool_ts_program.md`, `FND-87`): it answers `TSP-D2` (it runs once over the program, writing per-file outputs), `TSP-D6` (by `TPG-D2`) and `TSP-D9` (member uses, its section 5.2) in its own way; those three rows stand until its decisions are taken. The `TPG-D` rows are its own.

The suggested answers of `TSP-D2` to `TSP-D12` were written to change as little as possible; under correctness first, each is re-examined before it is taken (3.3).

When a decision is taken: mark it here (decided, with the date and any change to the suggestion), record it as [Decided] in the working file that owns it (`41_typescript_program_plan.md`, section 2, column "Changes"), and add a line to section 6.

### 3.2 Phases

| Phase | Work | Rough days | Status |
|---|---|---|---|
| 0 | the decisions (3.1) | 0.5 | done 2026-11-09: every decision of 3.1 taken |
| 1 | documents: working files, `mvp_docs/`, a new reference schema | 1 | partly: the MVP 2 schema (proposed, before building), `DATA-24`, `VIEW-15`, `RUN-33` to `RUN-35`, `UI-47`, `UI-48`, `toolset.md` 4.2; `04`, `05`, `55` and `06` not yet rewritten for MVP 2 |
| 2 | test sources and expected results, by hand, first | 1 | done 2026-11-09: `expected-mvp2/` (87 nodes, 117 edges, 8 links, 18 built-ins, 1 unresolved), by hand |
| 3 | the `ts-config` tool | 0.5 | deferred (`TPG-D4a`): MVP 2 starts without `ts-config` |
| 4 | the tool helper and the Runner: a once tool writing per-file outputs; refresh on any input | 1.5 | done 2026-11-09: the run list, the full listing with statuses and folders, list parameters, per-file outputs from a once tool, rerun on any change, the "no file to read" stop; the tool helper needed no change |
| 5 | ~~M1 on the program~~ build `ts-program` (`42_tool_ts_program.md`); M1 kept as is, not run | 2 | done 2026-11-09: `ts-program` 0.1.0 matches the expected graph exactly |
| 6 | M3 with nested scopes | 0.5 | not needed for now (`TPG-06`): M3 not run |
| 7 | the Viewer at any depth, shapes for new kinds, built-ins apart | 1 | done 2026-11-09, page only and model format 2: levels at any depth, shapes for the new kinds, built-ins apart, other keys in Details, the "Not connected" frame with folders and status icons; frames for containers other than scopes still open |
| 8 | measure on real code; findings | 1 | measured 2026-11-09 on ZaAnSouVi's own `app/` (`FND-99`); findings note after the human review |

### 3.3 Parts to reconsider

Every part, with correctness first (`MVP_scope.md`, section 1.2). For each: keep, change or replace, with the reason; "to reconsider" until then. A decision in a working file that stands in the way is reopened there, not overridden here.

| Part | Now | Question under correctness first | Status |
|---|---|---|---|
| **What "correct" means** | `TSP-01` (proposed) | what the graph must show, and how it is checked; whether types (interfaces, `implements`) belong in a correct graph | **decided as the starting point** (2026-11-09): `41_typescript_program_plan.md`, section 1.1; types in; refined as the build shows more |
| **The test sources and expected results** | three small files, functions only | a source exercising every supported construct, its expected graph written by hand; the current one kept or replaced | **test source decided** (2026-11-09): the class-heavy test of `FND-82`, as `zaansouvi-mvp/test-source-mvp2/`, unchanged; its expected graph to write by hand; whether the first stage's source is kept beside it, to reconsider |
| **Stable IDs** (`DATA-02`, `DATA-03`) | `file#name@line:column` | whether a position-based ID is correct for merged declarations, overloads, accessors and members; stable across edits | to reconsider |
| **Symbols and references** (`DATA-05`, M1) | hand-written resolution, functions and variables | everything from TypeScript's checker: kinds, nesting, member uses, built-ins | replaced in the run by `ts-program` (decided); its output designed in `42_tool_ts_program.md`, section 5; decisions `TPG-D3`, `TPG-D5`, `TPG-D6` pending |
| **Links across files** (`DATA-06`, M2) | M2 matches imports by name | resolved by the checker; whether M2 stays, and in what role | `ts-program` gives them (`TPG-D2`, decided); M2 not in the run list unless `TPG-06` finds a need |
| **Scopes** (`DATA-07`, M3) | file scope and top-level functions | nested scopes for every owner; whether scopes or TypeScript's own containment drive the levels | **M3 not run for now** (2026-11-09, `TPG-06`): TypeScript's own nesting drives the levels; kept or brought back as the graph shows |
| **What a tool may read** (`toolset.md`, section 4.2) | one file per invocation; one file type per tool | the whole program for a language tool; `tsconfig.json`; to reopen in `toolset.md` if kept in the way | **decided** 2026-11-09: program tools a named exception (`TS-37`); one file type kept; `tsconfig.json` read by `ts-config` (`TPG-D4`) |
| **The `--info` contract** (`DATA-08` to `DATA-10`, `DATA-23`) | per-file or once; nodes, relations, containment | program tools; per-file outputs from a once tool; attributes (`KIND-16`) | to reconsider |
| **The tool helper** | the shared contract of every tool | whatever the new contract needs | to reconsider |
| **The Runner** (`03_runner.md`) | lists `.ts` files; per-file refresh; inputs by data name | listing, invocation, refresh on any change, the cache and database, dry runs | a hardcoded list of tools to run (`RUN-33`) and every file listed accurately (`RUN-34`), decided; the rest to reconsider |
| **The Viewer's graph model** (`05_viewer.md`, `55_viewer_backend.md`) | lifting to the nearest visible container; owner rules; declarations not drawn | whether the lifting and owner rules give a correct graph at any depth | to reconsider |
| **The Viewer's page** (`50_viewer_ui.md`) | three levels, frames for scopes, the refinements of 2026-11-09 | levels at any depth; how members, kinds and built-ins read; arrow direction (`VW-40`) | the top view decided: every file, unconnected ones in a frame (`UI-47`); the rest to reconsider |
| **Checks** | exact match per tool; model; backend; page steps | checks of the graph itself against the hand-written expected graph | to reconsider |
| **The reference schema** (`DATA-20`) | as built on 2026-11-09 | rewritten from the new contracts | to reconsider |

**Done when** (`41_typescript_program_plan.md`, section 5): `TSP-01` to `TSP-05` hold; every first-stage check passes on the updated expected results; the documents say what was built; the human review (P3) can be done on a real codebase.

## 4. Open items

Carried over from the first stage; some may be overtaken by the second (noted).

| Item | What | Notes |
|---|---|---|
| P3 | the human review of the Viewer (`06_test_plan.md`; `DEL-06`) | suggested on the second stage's build, on a real codebase (`TSP-D1`) |
| `C1`, `B7` | a run without M3; a broken input through the page | `C1` overtaken as written: MVP 2 runs without M3 always (`FND-94`); what P4 needs instead is in `MVP_scope.md`, 10.1, which names M1 and M3, to reconsider. `B7` still to try through the page |
| Timings | full run, dry run, one invocation, the Viewer's load (`07_delivery.md`, item 5) | **measured** 2026-11-09 (`FND-99`) |
| Runner tests | `TEST-01` to `TEST-05`, `R1` to `R8` as scripts (`DEL-05`) | **written** 2026-11-09: `tests/runner/run-tests.mjs`, 28 checks, with `R9` to `R11` (`FND-99`) |
| `FND-75` | a source with no readable files: a clear message | **built** 2026-11-09 (`FND-98`): a tool with no file to read stops the run, saying why, from its `--info` |
| `FND-77` | built-ins shown as unresolved | **built** 2026-11-09: told apart by TypeScript's library, listed apart (`TPG-D5`, `FND-98`) |
| `FND-69`, item 2 | unread record keys counted as extra data | decided 2026-11-09: every other key shown in Details, so not extra (`VIEW-15`, `FND-97`) |
| `FND-60`, items 6, 7 | duplicate keys in M1's references; MVP cuts not listed in one place | item 6 answered: `ts-program` writes `from` and `to` only (`TPG-D7`); item 7 open |
| `FND-56` | keys known by name in one place | open |
| User for read-only | **once MVP 2 is working** (decided by the user on 2026-11-09), check the user details: whether the user who runs the Runner is the same as the Viewer's, since read-only and unreadable are judged for the Runner's user (`RUN-35`); the Viewer starts the Runner itself, but the Runner can also be run by hand | after MVP 2 works; `FND-91` |
| `MVP-5`, `MVP-8` | contracts kept; success criteria and a time target | answered in the findings note |
| Findings note | `07_delivery.md`, `DEL-07` | after the second stage |
| `check-server.mjs` | the backend's checks assumed the first stage's tools and data | **rewritten** 2026-11-09, 35 checks (`FND-99`) |
| Layout of crowded views | inside `shapes.ts`, the force layout put the `app.ts` stub among the nodes (better since frames, `TSP-D8`); on real code, one file's view of 110 nodes and 349 edges is unreadable (`FND-99`) | the layout strategy, `VW-39`, deferred, now with evidence; the readability of large graphs (`toolset.md`, section 9) is the main design problem MVP 2 found |
| Frames for containers | frames were drawn only for M3's scopes | **done** 2026-11-09: a frame for any entered container (`TSP-D8`, `UI-37`) |
| `B7` | a broken input through the page | **done** 2026-11-09: `tests/viewer/browse/b7.sh` |
| The Viewer's list of sources | the checks of 2026-11-09 added sources in temporary folders (the status source, two `B7` copies, a copy of `app/`); some no longer exist | remove them in the page, or leave: a missing folder only fails its run |
| Files inside their folders | in the top view, files are drawn loose and their folders sit in "Not connected", not enterable (`FND-104`) | open; asked the user 2026-11-09 |
| An edge under a node | in `bars.ts`, the edge from `report()` to `summary.ts` runs under the `total` import (`FND-104`) | open; part of the crowded-views layout question |
| A range per declaration | merged declarations keep the first one's `range` only, so Details shows one column for `total` and `label` (`FND-106`, `FND-110`) | open; asked the user: `ts-program` would add each declaration's range |
| `ro`/`rw` and default values | a marker and a property's or variable's default under its label; `readonly` and `declaredWith` now give the marker, the default needs a new key (`initializer`) | proposed 2026-11-09, not decided; the user's three questions (which kinds, label or Details, length) unanswered |
| Link and "other" shapes | their slant grows with the node's width, as the folder's point did (`FND-103`) | asked the user 2026-11-09 |

### 4.1 Questions for the next session (written 2026-11-09)

Asked during the session of 2026-11-09 and not answered yet. Each names what it decides and what I'd suggest; nothing is built until it is answered.

**To do first:** run every browser check once (`tests/viewer/browse/`): after the last page changes only the checks they touch were rerun (`frame-title`, `frame-notes`, `frame-notes-run`, `range-text`, `selection`, `frame-views`, `enter-marks`); `mvp2`, `members`, `builtins`, `zoom-controls`, `problems`, `problem-items`, `tools-pane`, `contains`, `activity-count`, `layout-repeat` and `b7.sh` were not.

1. **Files inside their folders** (`FND-104`). In the top view, files are drawn loose and their folders sit apart in "Not connected", so the folder structure is not visible. Should each folder be a frame holding its files (and subfolders), and should a folder be a level you can enter? *Suggested:* yes to both: folders as nested frames in the top view, enterable like files, edges between files drawn across them.
2. **A range per declaration** (`FND-106`, `FND-110`). Merged declarations keep only the first one's `range` (`total`: the first overload; `label`: the getter, not the setter), so Details shows one column where there should be three or two. Should `ts-program` record each declaration's range (for example `declarations` holding `location` and `range`, as `42_tool_ts_program.md` first said)? *Suggested:* yes; the expected graph and the check gain those ranges by hand.
3. **A variable's range** (`FND-107`). A variable's range starts at its name (`Anonymous = class …`), while a class's starts at `export` (`export abstract class Base …`), because `export const` belongs to the statement. Should a variable's range cover its whole statement, so the source box shows `export const Anonymous = …`? *Suggested:* yes for one-name statements; a statement declaring several names keeps each name's own.
4. **`ro`/`rw` markers and default values** (proposed 2026-11-09, not decided). `readonly` and `declaredWith` now give the marker; a default needs a new key, for example `initializer`, the source text, capped. (a) Which kinds get a marker: properties and variables only, or also accessors, enum members, imports and parameters? (b) Under the node's label, or only in Details? (c) How long may a default be on the label before it is cut? *Suggested:* properties and variables; the label shows `= "anon" · ro` only on a node drawn on its own, Details shows the full text; cut at 24 characters.
5. **Link and "other" shapes** (`FND-103`). Their slanted rectangles slant more the wider the node, as the folder's point did. The same fixed angle? *Suggested:* yes, the same per-node polygon as folders.
6. **Crowded views** (`FND-104`, `VW-39`). In `bars.ts` an edge runs under a node; on real code one file's view had 110 nodes and 349 edges. Which first: edges routed around nodes, a different layout for files, or filtering (hide types, built-ins, parameters)? *Suggested:* filtering first, since it also helps reading; routing later.
7. **`in` and `out`** on type parameters are not recorded, as type parameters are not symbols. Should type parameters become nodes? *Suggested:* not for MVP 2.

Still open from before, unchanged (section 4 above): the human review (P3), the findings note, the user check for read-only, package type declarations (`TPG-D8`), `FND-56`, `FND-60` item 7, `ts-config` (deferred).

## 5. Deferred until after the MVP

Not part of either stage; recorded so they aren't lost:
- **File kinds:** kind checkers and the kinds database, `40_tools_fileKind.md` (`FND-80`; decisions `KIND-90` to `KIND-103`).
- ~~**The Runner listing every file**, each tool reading only what its patterns match (`FND-79`).~~ Brought into MVP 2 on 2026-11-09 (`RUN-34`, `FND-90`).
- **JavaScript and JSX** (`FND-81`; `TSP-D12`).
- From `MVP_scope.md`, section 10.3: arrow direction (`VW-40`), navigation and search (`VW-41`), layout strategy (`VW-39`), nested and block scopes (partly in the second stage, `TSP-D8`), classes and JavaScript (partly in the second stage), and the rest listed there.

## 6. Change record

Newest first. One line per change: the date, what changed, and where it is recorded.

- **2026-11-09** **Questions for the next session** written (section 4.1); the session's screenshots copied beside its log (`ailog/26-11-09 140634 MVP review, Viewer UI refinements, …/`).
- **2026-11-09** **A new reference schema** for `ts-program` 0.2.0 and `/api/source`'s `end`, as built: `proposed_schema/26-11-09 235850 …`, giving only what changed from `201159`; `201159` kept as the 0.1.0 snapshot, with a pointer (`DATA-24`).
- **2026-11-09** **`ts-program` 0.2.0**: `declaredWith`, `defaultExport`, the `override` and `accessor` modifiers; the exact check compares each node's facts against a hand-written table; the frame's notes show `default` and `const`/`let`/`var`, with a band kept above the title (`FND-110`).
- **2026-11-09** **The frame's notes**: exported, the modifiers, the number of declarations and where a parameter property is declared, one per line in the frame's top left corner (`UI-37`, `FND-109`).
- **2026-11-09** **The range's text replaces the lines around a node in Details' source box**, numbered and wrapped; the `rangeText` row removed (`UI-52`, `FND-108`).
- **2026-11-09** **`rangeText` checks the server's answer** before cutting it; a server older than `end` gave every record on a line the same text (`FND-107`).
- **2026-11-09** **`rangeText` in Details**: the text a node's range covers, one column per range; `end` on `/api/source` (`UI-52`, `FND-106`).
- **2026-11-09** **The frame's title replaces "this scope"** in every frame: the entered node at the top of the frame, its kind and name underlined ("ƒ percent()"), every edge of it attached there; `UI-36` and `UI-37` reopened and changed (`FND-105`).
- **2026-11-09** **Subfolders in `test-source-mvp2`**: four files in `src/util/`, `src/report/`, `src/report/charts/` importing from `shapes.ts`, `app.ts` and each other; expected graph extended by hand, exact match; check counts updated (`FND-104`). Open: files are not drawn inside their folders.
- **2026-11-09** **The folder's point at a fixed right angle, whatever the node's size, and a folder row in the Legend** (`50_viewer_ui.md`, folders; `FND-103`).
- **2026-11-09** **A node's member list in rows** of about as many as there are rows (`UI-30`, `FND-102`).
- **2026-11-09** **Item boxes: lines at full width, a strip below for the corner's data name** (`FND-101`).
- **2026-11-09** **Built-ins: a line named like its box left out** when the box has other members ("Math · 3 members · 3 uses"; `UI-57`, `FND-100`).
- **2026-11-09** **Built-ins grouped by library type in Problems** (`UI-57`, `FND-100`): one box per type ("Array · 4 members · 4 uses"), one line per member with its places.
- **2026-11-09** **Steps 1, 2, 3 and 5 of the review** (`FND-99`): `TPG-06` closed (enough) and a frame for any entered container (`TSP-D8`); checks rewritten or written (the backend, 35; the Runner, 28; "go to definition", 117 of 117; `B7` through the page); measured on ZaAnSouVi's own `app/` (4.4 s a full run, 69% of uses resolved, a 1,000-line file's view unreadable); `undefined` and other intrinsics made built-ins; a dry run's error shown in Tools; `MVP_scope.md` sections 3 to 7 written for MVP 2, with proposed success criteria; `04`, `05`, `06`, `50`, `55` and the schema updated. Opened: `TPG-D8` (package type declarations). The human review continues.
- **2026-11-09** **MVP 2 built** (`FND-98`): `ts-program` 0.1.0 (`app/tools/ts-program/`), matching `expected-mvp2/` exactly; the Runner's run list (`RUN-33`), full listing with statuses and folders (`RUN-34`, `RUN-35`), list parameters and per-file outputs from a once tool, the "no file to read" stop; the Viewer's model format 2 and page (`UI-47`, `UI-48`, built-ins apart, other keys in Details, shapes for the new kinds). Settled while building: options from `tsc --init` with no config; built-in names from the library type declaring them (`Console.log`, `ReadonlyArray.reduce`); `as const` skipped. First-stage backend checks to rewrite.
- **2026-11-09** **Steps 1 to 3 before building** (`FND-97`): `FND-69` item 2 decided (other keys shown in Details, not extra; `VIEW-15`); the expected graph of `test-source-mvp2` written by hand (`expected-mvp2/`), with six refinements of the definition (R1 to R6, `41`, section 1.1); the MVP 2 schema proposed (`proposed_schema/26-11-09 201159 …`, `DATA-24`).
- **2026-11-09** **The pending decisions taken, all as suggested** (`FND-96`): `TPG-D5` built-ins; `TPG-D6` IDs of merged declarations; `TPG-D7` **`from` and `to` only** (changed suggestion); `UI-47b` the extension as type, labeled as one; `RUN-34a` **ignore files not applied** (changed); `RUN-34b` `node_modules` and `.git` as folder nodes; `TSP-D11` **no incremental state at first** (changed); `TSP-D12` JavaScript and JSX out; `TS-37` program tools a named exception, written into `toolset.md`, section 4.2, with a note in `data_topology.md`, section 6. Overtaken plan rows closed: `TSP-D2`, `D3`, `D4`, `D7`, `D9`, `D10`.
- **2026-11-09** **MVP 2 starts without `ts-config`** (`TPG-D4a`): `ts-program` runs alone on TypeScript's defaults, noted in each run's result; `ts-config` stays designed (`42`, section 3.1) and joins the run list later. `FND-95`.
- **2026-11-09** **`TPG-D4` decided** (suggestions accepted): compiler options from a `ts-config` tool reading each `tsconfig*.json` as written, merged by `ts-program` through TypeScript's own API with a virtual host; the root config applies; a package `extends` reported; a malformed config a no-go. Also answers `TSP-D5`. `ts-program`'s parameter `compiler_options` replaced by `configs`. `FND-95`.
- **2026-11-09** `04_tools.md` opens with a list of every known program and tool: implemented, designed, proposed and planned, each with its purpose, where it is described, and whether MVP 2 runs it.
- **2026-11-09** **MVP 2 runs `ts-program` alone** (decided by the user): M1, M2 and M3 not run; the graph from TypeScript's data alone is judged against the definition of a correct graph, and a tool or change is considered only where it falls short (`TPG-06` approach, `RUN-33`; `TSP-D6` decided, `TSP-D8` partly). Known beforehand: no frames appear, since only M3's scopes have them. `FND-94`.
- **2026-11-09** **What a correct graph is, decided as the starting point** (`TSP-01`, `41_typescript_program_plan.md`, section 1.1): proposed and accepted as suggested. Settles `TPG-D3` (types in). `ts-program`'s design gets the edge kinds and rules it adds (`42`, section 5.3a). `MVP_scope.md`, section 1.2, updated. `FND-93`.
- **2026-11-09** **MVP 2's test source decided:** the class-heavy TypeScript test written earlier that day (`FND-82`), copied unchanged from the session's scratchpad into `zaansouvi-mvp/test-source-mvp2/`, with a README. `FND-92`.
- **2026-11-09** **The user check placed after MVP 2 is working** (section 4): whether the Runner's user and the Viewer's are the same.
- **2026-11-09** **The status icons' colors and shapes accepted** as suggested (`UI-48a`).
- **2026-11-09** **File and folder statuses decided** (`RUN-35`, `UI-48`): status icons in a column on the left inside the node, distinct colors and basic shapes, all shown; every folder a node in the "Not connected" frame with its file count or size. A check noted for MVP 2: whether the Runner's user and the Viewer's are the same. `FND-91`.
- **2026-11-09** **Listing every file, accurately, brought into MVP 2** (`RUN-34`; `UI-47a` decided; `FND-90`). An earlier note that this could expose secrets corrected against `security.md`, section 2; the real concerns recorded there, section 7. Open: ignore files (`RUN-34a`), skipped folders (`RUN-34b`), the file type (`UI-47b`).
- **2026-11-09** **The top view decided** (`UI-47`): every file reported; the files connected to no graph in a frame, each a free node "file name · type" or "· unknown", in a grid. Two points it depends on left open (which files are reported; where the type comes from). `FND-89`.
- **2026-11-09** **`TPG-D1` and `TPG-D2` decided:** the Runner runs a hardcoded list of tools, checked against the folders, M1 not in it (`RUN-33`, `TPG-04`); `ts-program` runs TypeScript in its invocation and transforms what it can into the Viewer's format (`TPG-05`). Opened: `TPG-06`, whether its output is enough or needs more processing after it. `FND-88`.
- **2026-11-09** **M1 kept as is and not run; a new tool, `ts-program`, designed** to run TypeScript and extract the graph's data, in line with the contracts, new keys allowed (`TPG-01` to `TPG-03`, decided by the user). Design: `42_tool_ts_program.md`; seven decisions pending (`TPG-D1` to `TPG-D7`). `TS-37` opened in `toolset.md`. `FND-87`.
- **2026-11-09** **MVP 2's goal and priority decided** by the user: a correct graph in the Viewer from real TypeScript data; correctness before consistency with the earlier work; every part reconsidered (section 3.3). `TSP-D1` decided. Recorded in `MVP_scope.md`, section 1.2, `41_typescript_program_plan.md` and `99_findings.md`, `FND-86`.
- **2026-11-09** ~~A pane beside the chat lists the decisions and open items of this file, re-read when it changes (a Claude Code mod, `/mvp-questions`; outside the project, in the session's mods folder).~~ Replaced the same day by the user's own mod, `open-questions` (`~/.claude/local-mods/open-questions/`, loaded in every session through `CLAUDE_CODE_PLUGIN_DIRS` in the user settings; its "MVP 2" list reads this file); the first pane removed.
- **2026-11-09** This file written as the MVP's main working file; `98_first_implementation.md` marked superseded and frozen; `README.md` updated. The second stage planned (`41_typescript_program_plan.md`, `FND-85`); its decisions pending.
