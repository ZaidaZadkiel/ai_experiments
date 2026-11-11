# 97. MVP 2: state, decisions and open questions

**The MVP's main working file.** It holds where MVP 2 stands, its decisions, its phases, the parts still to reconsider, and its open questions (`M2Q-`). The plan is `41_typescript_program_plan.md`, the tool's design `42_tool_ts_program.md`, the findings `99_findings.md`, the dated change log `96_mvp2_change_log.md`. MVP 1 and the docs as they stood before 2026-11-10 are frozen in `mvp1/`; the readable summaries are in `summary/`.

## 1. How this file is kept

- When something is decided, built or checked: update this file (sections 3 to 6), state it as current text in the file that owns it, record a finding in `99_findings.md` where there is one, and add a line at the top of `96_mvp2_change_log.md`.
- The docs hold no history and no struck wording: a changed item is rewritten to its current text. The history is in the change log, the findings and `mvp1/`.
- An open question gets the next free `M2Q-` number in section 6 and keeps it. When answered, it moves to section 7 with its answer and where it is recorded. Its entry there reads "`M2Q-n` **Title**: decided.", and the decisions table has a Status column, the forms the open-questions tool reads as resolved.
- A [Decided] item in a working file that stands in the way of a correct graph is reopened in that working file, never overridden here (`MVP_scope.md`, section 1.2).

## 2. Goal

**A correct graph in the Viewer, from real TypeScript data** (`MVP_scope.md`, section 1.2; `TSP-D1`). **Correctness comes before consistency with earlier work**: every part of the MVP is reconsidered against that goal, and kept only where it serves a correct graph. What "correct" means is `TSP-01` (`41_typescript_program_plan.md`, section 1.1): the graph shows what TypeScript itself knows, and nothing it doesn't.

**The scope expands to how the examined code is best understood** (decided by the user, 2026-11-10; `MVP_scope.md`, section 1.2). The tools are settled well enough (`TPG-06`). What MVP 2 showed insufficient is the data's representation: **the graph alone is not enough for a good-enough understanding** of the examined code. The next point is what examining a codebase actually requires (`M2Q-22`), which visually affects mostly how the data is represented; a tree of folders, files and symbols is the first candidate (`M2Q-21`).

## 3. Where MVP 2 stands

The code is in `zaansouvi-mvp/`.

| Part | Version | State |
|---|---|---|
| `ts-program` | 0.2.0 | built; the only tool the Runner runs (`RUN-33`); writes `code.symbol`, `code.reference`, `code.link` per source file, with `declaredWith`, `defaultExport`, the `override` and `accessor` modifiers (`FND-98`, `FND-110`) |
| Runner `zaansouvi-run` | 0.1.0 | built: the run list, every file listed with its status, per-file outputs from a program tool, a rerun when any input changes, a clear stop when no file matches a tool |
| Viewer `zaansouvi-view` | 0.1.0, model format 3 | built: model format 3 (`BE-110` to `BE-115`, `FND-115`); the page's model layer (`VIEW-51`, `FND-116`); **the Inventory** (`UI-87`, `51_viewer_inventory.md`: read-only `FND-117`, keyboard `FND-119`, hiding and [Show in graph] `FND-120` to `FND-122`, refinements `FND-123`); the breadcrumb (`UI-82`); the drawer's handle (`UI-88`, `FND-118`); levels at any depth, a frame for any entered container titled by the entered node, kind frames inside it (`UI-83`), [Edges] (`UI-85`), middle-button panning (`UI-84`), hover boxes (`UI-86`), the "Not connected" frame with files, folders and status icons, built-ins apart, other keys in Details, the range's text in Details. **The human review (P3) is in progress** |
| Tool helper, shared library | | built; unchanged for `ts-program` |
| M1, M2, M3 | 0.5.0, 0.2.0, 0.2.0 | kept as built, **not run** (`TPG-01`); **stale and frozen**, with MVP 1's checks, `test-source/` and `expected/` (`zaansouvi-mvp/README.md`) |

**Checks**, all passing when last run (`06_test_plan.md`, "MVP 2's checks"):
- `tests/ts-program/check.mjs`: `ts-program` against the hand-written `expected-mvp2/`, exact: 120 nodes, 156 edges, 20 links, 25 built-ins, 1 unresolved; 60 node facts against a hand-written table.
- `tests/ts-program/check-definitions.mjs`: every edge against TypeScript's "go to definition", 156 of 156.
- Determinism with the file list reversed; the read log (only the listed `.ts` files and TypeScript's library).
- `tests/runner/run-tests.mjs`: 28 checks. `tests/viewer/check-server.mjs`: 73 checks, format 3 included.
- `tests/viewer/browse/`: the page in headless Firefox, `b7.sh` included; for MVP 2's additions of 2026-11-10, `kind-frames`, `middle-pan`, `edges-switch`, `hover-tips`, `crumbs`, `drawer`, `inventory`, `inventory-hiding`. `tests/run-all.sh` runs every check, 34; all passing on the session's last run, on a copy of the MVP (the user's Viewer was running).

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

| ID | Decides | Decision | Where | Status |
|---|---|---|---|---|
| `TSP-D1` | Inside the MVP, or after it | a second stage of the MVP, MVP 2; goal a correct graph, correctness first | `MVP_scope.md` 1.2 | decided |
| `TSP-01` | What a correct graph is | what TypeScript knows, nothing more: nodes, edges, the forced cases, the Viewer, checks, limits | `41`, 1.1 | decided |
| `TPG-01` | M1 | kept as is, not run | `42`, 1 | decided |
| MVP 1's code | M1, M2, M3, MVP 1's checks, `test-source/`, `expected/` | stale and frozen: not maintained, kept for future tests, for example as a source of wrong data and wrong input (`M2Q-14`) | `zaansouvi-mvp/README.md` | decided |
| `TPG-02` | A tool running TypeScript | `ts-program`, extracting the data the graph needs | `42` | decided |
| `TPG-03` | Its contracts | in line with the existing ones; new keys allowed in JSON input and output | `42`, 1 | decided |
| `TPG-D1` | How M1 is left out | a hardcoded run list in the Runner, checked against the folders; `ts-program` alone | `RUN-33` | decided |
| `TPG-D2`, `TSP-D6` | Links | `ts-program` gives them; M2 not run | `42`, 5.3 | decided |
| `TPG-06` | Is `ts-program`'s output enough? | yes; frames for any entered container close the one gap | `42`, `TSP-D8` | decided |
| `TSP-D2`, `TSP-D3`, `TS-37` | How a whole-program tool runs | once over the program, one output file per source file; program tools a named exception to one file per invocation, declared in `--info` | `toolset.md` 4.2; `42`, 4 | decided |
| `TSP-D4` | What the program holds | the listed `.ts` files and TypeScript's library only | `42`, `TPG-20` | decided |
| `TSP-D5`, `TPG-D4` | Compiler options | from a `ts-config` tool reading each config as written, merged by TypeScript's API; the root `tsconfig.json`; a package `extends` reported; a malformed config a no-go | `42`, 3.1 | decided |
| `TPG-D4a` | `ts-config` in the run list | not yet: `ts-program` runs on TypeScript's defaults, noted in each run's result | `42`, 3.1 | decided |
| `TSP-D7`, `TPG-D3` | What a node is | every declaration TypeScript binds, types included; type uses are edges of kind `type` | `41`, 1.1 | decided |
| `TSP-D8` | Nesting | from `parent`, the declaring symbol; M3 not run; a frame for any entered container | `41`; `UI-37` | decided |
| `TSP-D9` | Member uses | ordinary references marked `member` | `42`, 5.2 | decided |
| `TSP-D10`, `TPG-D5` | Built-ins | `to: null`, `reason: "built-in"`, the library type's name; listed apart | `42`, 5.2 | decided |
| `TPG-D6` | IDs of merged declarations | the first declaration's position; the others listed | `42`, 5.1 | decided |
| `TPG-D7` | References' keys | `from` and `to` only | `42`, 5.2 | decided |
| `TSP-D11` | Refresh | rerun when any input file or config changes; only changed outputs written; no incremental state | `03_runner.md` | decided |
| `TSP-D12` | JavaScript and JSX | out of MVP 2 | `41` | decided |
| `RUN-34`, `UI-47a` | Which files are listed | every file, accurately | `03_runner.md` | decided |
| `RUN-34a` | Ignore files | not applied; every file listed; each run says ignore files were not applied | `03_runner.md` | decided |
| `RUN-34b` | Folders skipped as a whole | `node_modules` and `.git`, shown as folder nodes with file count and size | `03_runner.md` | decided |
| `UI-47` | The top view | every file a node; files and folders connected to no graph in a "Not connected" frame, in a grid | `50_viewer_ui.md` | decided |
| `UI-47b` | A file's type | its extension, labeled as one ("· .ts"); "unknown" without one | `50_viewer_ui.md` | decided |
| `UI-48`, `UI-48a`, `RUN-35` | Status icons | hidden (grey circle), link inside (blue diamond) and outside (orange diamond), read-only (purple square), unreadable (red triangle); in a column on the left inside the node; all shown | `50_viewer_ui.md` | decided |
| `VIEW-15` | Keys beyond a record's field roles | shown in Details, so not extra data | `05_viewer.md` | decided |
| `M2Q-21` | The Inventory | a drawer tab examining the model by hand, in lockstep with the Graph and the breadcrumb; every point decided; not built yet | `51_viewer_inventory.md` | decided |
| `M2Q-1` | Files inside their folders | not drawn as folder frames in the Graph, for now; the folder structure examined in the Inventory first; a view of its own for files and folders to be considered after trying it | `50_viewer_ui.md`, `UI-47` | decided |
| `M2Q-26` | Kind frames | a frame for every kind with two or more nodes in an entered view, any kind, future ones included; not selectable, dragged with its nodes; drawing only; a switch at the top of the zoom controls, on by default; built (`FND-111`), settled after trying it | `50_viewer_ui.md`, `UI-83` | decided |
| `M2Q-24` | The breadcrumb | navigation relative to the current view: the views above, and the views one level inside in a dropdown; folders as plain text, as folders are not views (`M2Q-1`); the button reads "(N scopes) ▾"; built (`FND-116`) | `50_viewer_ui.md`, `UI-82` | decided |
| `M2Q-23` | Where a node's file and a container's children are worked out | in the backend, once per model: a file index stored in the model (format 3); the page only reads it; built (`FND-115`) | `55_viewer_backend.md`, `BE-110` | decided |
| Test source | MVP 2's test source | the class-heavy test, `test-source-mvp2/`, with subfolders | `06_test_plan.md` | decided |

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

**Start here next session** (left open at the end of 2026-11-10):
1. Answer `M2Q-27`, which of a node's keys the Graph draws, stated by the model (the Inventory's "unused" marks rely on a list in the page, `DRAWN_KEYS`).
2. Answer `M2Q-28`, the model's size (14.4 MB on `app/`): keep `relationEdge` or drop it.
3. Answer `M2Q-29`, widening the Inventory's search, perhaps into a view of its own (`INV-35`); and files and folders in a view of their own (`M2Q-1`).
4. The open-questions tool: read "Not in force" items (`UI-64`, `UI-67`, `UI-80`, `UI-81`) as superseded?
5. The breadcrumb: one word for its button and its tooltip, "(N scopes)" and "N views one level inside" (`UI-82`).
6. A sixth claim beside P1 to P5: the Viewer gives a good-enough understanding of the examined code (`MVP_scope.md`, section 1.2)?
7. Mark `UI-51` (five tabs) and `UI-12` (the drawer) [Decided]? Both are built but still marked [Suggested].
8. The user's observations from using the Viewer (`FND-124`): the first input to `M2Q-22`, what examining a codebase requires.
9. The user's review of the Inventory (`51_viewer_inventory.md`, section 4; `M2Q-8`), and `INV-42` (d) to (g).
10. **Review the page's code around hiding and redrawing** (asked by the user), to see whether the hiding bugs point to a structure that can be improved, and to check for code reuse and duplication. The bugs of 2026-11-10 to start from: the snapshot filtered hidden nodes but not hidden kinds (`FND-120`); the content area not refreshed after a change of what is hidden (`FND-120`); a kept layout leaving nodes unmeasured, so the stubs vanished (`FND-121`); and two guards against Cytoscape reporting a selection late, one for [Show in graph] (`stayInTab`, `FND-121`) and one for a redraw (`restoredIds`, `FND-122`), which may be one mechanism. Places to look in `app/viewer/ui/src/main.ts`: `snapshot`, `isHidden`, `hiddenChanged` and `drawGraph`'s two paths (laid out, kept); `syncSelection` and the select handler; the many full redraws (`render`) and what each refreshes (the Graph, the breadcrumb, the Inventory, the content area); helpers repeated across sections (the measuring of nodes in `placeStubs` and the kept path; the lookups of a view's edge or a row). The checks that passed while these bugs were live looked at state (positions, the selection), not at what the person sees: the review's changes are checked by what is drawn and which tab is open.

**The Graph's changes of 2026-11-10 are settled** (judged by the user after trying them): kind frames (`UI-83`), middle-button panning (`UI-84`), [Edges] (`UI-85`), hover boxes (`UI-86`). Next: the Inventory, decided and not built. Step 1, the contract, is written (`BE-111` to `BE-115`, `VIEW-51`, the format 3 schema snapshot); step 2, the expected results by hand, is written (`expected-mvp2/expected-model3.json`); step 3, the backend's model format 3, is built (`FND-115`); step 4, the page's model layer and the breadcrumb, is built (`FND-116`); step 5, the Inventory tab, is built: read-only (`FND-117`), keyboard (`FND-119`), hiding and [Show in graph] (`FND-120`); next, the user's review (`51_viewer_inventory.md`, section 4).

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

- `M2Q-2` **A range per declaration** (`FND-106`, `FND-110`). Merged declarations keep only the first one's `range` (`total`: the first overload; `label`: the getter, not the setter), so Details shows one column where there should be three or two. Should `ts-program` record each declaration's range, for example `declarations` holding `location` and `range`? *Suggested:* yes; the expected graph and the check gain those ranges by hand.
- `M2Q-3` **A variable's range** (`FND-107`). A variable's range starts at its name (`Anonymous = class …`), a class's at `export` (`export abstract class Base …`), because `export const` belongs to the statement. Should a variable's range cover its whole statement? *Suggested:* yes for one-name statements; a statement declaring several names keeps each name's own.
- `M2Q-4` **`ro`/`rw` markers and default values.** `readonly` and `declaredWith` give the marker; a default needs a new key, for example `initializer`, the source text, capped. (a) Which kinds get a marker: properties and variables only, or also accessors, enum members, imports and parameters? (b) Under the node's label, or only in Details? (c) How long may a default be on the label before it is cut? *Suggested:* properties and variables; the label shows `= "anon" · ro` only on a node drawn on its own, Details the full text; cut at 24 characters.
- `M2Q-5` **Link and "other" shapes** (`FND-103`). Their slanted rectangles slant more the wider the node. The same fixed angle as folders? *Suggested:* yes, the same per-node polygon.
- `M2Q-6` **Crowded views** (`FND-104`, `VW-39`). In `bars.ts` an edge runs under a node; on real code one file's view had 110 nodes and 349 edges. Which first: edges routed around nodes, a different layout for files, or filtering (hide types, built-ins, parameters)? *Suggested:* filtering first, since it also helps reading; routing later. **Filtering is decided** as the Inventory's per-kind toggles (`51_viewer_inventory.md`, `INV-33`); routing and a different layout stay open.
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
- `M2Q-20` **Mismatches found during the cleanup** (2026-11-10), none changed yet: (a) `BE-91` names `expected/graph-model.json`, the check uses `expected/graph-views.json`; (b) `BE-60` doesn't list three checks the code does: containment cycles, a child containing itself, two scopes with the same owner; (c) wording still MVP 1's: `UI-45` (the enter mark is on any node with a view of its own, not only files and scopes), `UI-44` and `BE-53` (scopes, "this scope"), the examples in `UI-34` and `UI-58`; (d) in the deferred proposal `40_tools_fileKind.md`, `KIND-103` contradicts `UI-47` (every file is a node), and its "Today" column describes MVP 1; (e) `toolset.md`, line 97, cites `TS-36` for the one-file-type rule (judged fair, kept). *Suggested:* (a) to (c) fixed in the docs to follow the code; (d) left until the proposal is taken up after the MVP; (e) left.
- `M2Q-22` **What examining a codebase requires** (`MVP_scope.md`, section 1.2). The graph alone is not enough. **Its first input:** the user's observations from using the Viewer, 2026-11-10 (`99_findings.md`, `FND-124`): manipulating the graph helps understanding; data flow, files against declaration structure, colors and shapes, hiding, kinds grouped as a level of zoom. What must a person examining a codebase be able to see and ask, and which representations answer each need: the graph, a tree (`M2Q-21`), lists, the source itself, filters and search (`VW-41`)? *Suggested:* write the needs down first, as questions a person asks of a codebase (what is here, where is it declared, what uses it, what does it depend on, what is exported), each judged against `test-source-mvp2` and a real codebase, then choose the representation for each; the human review (`M2Q-8`) judges the result.
- `M2Q-27` **The keys the Graph draws, stated by the model** (raised 2026-11-10; `51_viewer_inventory.md`, section 4, known limits). The Inventory marks a node's keys "unused" by a list of key names in the page (`DRAWN_KEYS`, `FND-117`), which bends `INV-8` (the page derives nothing). Should the model state, with each node's `display` (`BE-114`), which of its keys the Graph draws? *Suggested:* yes, a `drawnKeys` list per node, or one list per data name; close to `M2Q-11`, keys known by name in one place.
- `M2Q-28` **The model's size** (raised 2026-11-10; `proposed_schema/26-11-11 011716 …`, what is still open). Format 3 is 14.4 MB on ZaAnSouVi's own `app/`, against about 9.2 MB in format 2; `relationEdge` is 2.1 MB of it. Keep it, or drop it and let the page read each edge's members, inverting the lists? *Suggested:* keep it until loading is judged slow in the review; then measure loading first.
- `M2Q-29` **A search of its own, and a view for files and folders** (raised 2026-11-10). The Inventory's search is kept minimal, nodes by name and ID, to be widened once tried, perhaps as a view of its own (`INV-35`); folders are not drawn as frames, and the user suspects files and folders may need a view of their own, as symbols relate little to files (`M2Q-1`). What should either look like? *Suggested:* take both up with `M2Q-22`, after the review, from what the user missed while examining.
- `M2Q-25` **Is Details adequate for examining?** (raised by the user, 2026-11-10). The drawer's tabs mix uses: **Details** describes what is selected in the Graph; **Tools** and the invalid and extra data in **Problems** are about running the tools; the unresolved relations and built-ins in **Problems** are about the code; **Legend** is reference; the **Inventory** examines the model. The Inventory shows a selected row's data in its own content area, since it doesn't change Details (`51_viewer_inventory.md`, `INV-3`). Should examining get a display of its own, apart from the run and the reference? *Suggested:* group the display by use, worked out with `M2Q-22`: (1) **examining the view**: Details stays tied to the Graph's selection, beside the Graph; (2) **examining what exists**: the Inventory, with its own content area (decided, `INV-3`); the unresolved relations and built-ins, which are about the code, move there from Problems; (3) **the run**: Tools, with the invalid and extra data, which are about the tools' output; (4) **reference**: the Legend, opened from the Graph. Nothing is moved until `M2Q-22` says what examining needs.

Also open, under their own IDs:
- `TPG-D8` **Package type declarations in the program:** open, asked as `M2Q-10`.
- `MVP-5` **Contracts kept** (`MVP_scope.md`): answered in the findings note.
- `MVP-8` **Success criteria and a time target** (`MVP_scope.md`): answered in the findings note.

## 7. Answered questions

- `M2Q-21` **The Inventory: examining by hand the model the Graph renders**: decided. (raised by the user, 2026-11-10; answered 2026-11-10, every point decided by the user). **Answer:** a drawer tab between Tools and Problems, with a tree of the model (a root row holding Files, Views and Model), a content area for the selected row, its own search, and [Show in graph]; the model keeps its own visibility current, and the Graph, the breadcrumb and the Inventory move in lockstep through the page's model layer. Recorded in `51_viewer_inventory.md`, `INV-1` to `INV-40`. **Not built yet:** what the docs and checks owe first is its section 4 (format 3 of the model, the page's model layer, the page items, the schema snapshot, the checks).
- `M2Q-1` **Files inside their folders**: decided. (`FND-104`; answered 2026-11-10 by the user, for now). **Answer:** the Graph doesn't draw folders as frames for now; the top view stays as `UI-47` has it. The folder structure is examined in the Inventory first (`M2Q-21`), and the question is taken up again once the Inventory has been tried. The user suspects files and folders may need **a view of their own** altogether, since there is little relation between symbols and files. The data side stands: the model's file index gives each entry's folder (`M2Q-23`, `BE-110`). Recorded in `50_viewer_ui.md`, `UI-47`.
- `M2Q-26` **Kind frames: the nodes of the same kind grouped together in the Graph**: decided. (raised and answered 2026-11-10 by the user; settled after trying it, 2026-11-10). **Answer:** inside an entered view's frame, every kind with two or more nodes gets a frame holding all of them; a single node of its kind stays loose; a view of one kind only gets none. Generic: any kind the model gives gets its own frame, future kinds included; known kinds in a fixed order, the rest after them alphabetically; labeled with the kind in the plural. The frames and loose nodes on a grid; inside a frame, square rows as `FND-102`. Not selectable; dragging a frame moves its nodes, each node still draggable. Drawing only, the model and the visibility unchanged; entered views only; a switch at the top of the zoom controls, on by default, for the page only; listed in the Legend. Recorded in `50_viewer_ui.md`, `UI-83`.
- `M2Q-24` **The breadcrumb as navigation relative to the current view**: decided. (raised and answered 2026-11-10; the suggestion accepted by the user). **Answer:** the views directly above the current one, and the views one level inside it in a dropdown on the last item, scrolling past 20; folders as plain text, since folders are not views (`M2Q-1`); read from the model and moved in lockstep with the Graph and the Inventory (`M2Q-21`). Recorded in `50_viewer_ui.md`, `UI-82`.
- `M2Q-23` **A file index in the model**: decided. (raised and answered 2026-11-10; option B accepted by the user). The page walked up the containers with a linear search on every draw (`fileOf`, `node`, `childrenOf` in `ui/src/main.ts`), and the Inventory needs the same structure. **Answer:** the backend builds a file index once per model, in `buildModel`, and stores it with the model; the page only reads it, and the Inventory's tree of folders, files and symbols reads it as it is. Recorded in `55_viewer_backend.md`, `BE-110`; model format 3.

## 8. Deferred until after the MVP

- File kinds: the kind checkers and the kinds database (`40_tools_fileKind.md`, `FND-80`).
- `ts-config` (`TPG-D4a`).
- JavaScript and JSX (`FND-81`, `TSP-D12`).
- From `MVP_scope.md`, section 10.3: arrow direction (`VW-40`), navigation and search (`VW-41`), layout strategy (`VW-39`), nested and block scopes, P4's test (section 10.1), and the rest listed there.
