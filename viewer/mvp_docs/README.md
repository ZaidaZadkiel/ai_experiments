# ZaAnSouVi MVP: build requirements

This folder holds everything needed to build the ZaAnSouVi MVP: a proof of concept with a Runner, a Viewer and tools, that shows whether a tool-based source code visualizer can work at all. The MVP is in its second stage, **MVP 2**: one tool, `ts-program`, runs TypeScript's own compiler, and the goal is a correct graph from real TypeScript data.

## Status of this folder

- Everything here is **accepted for building the MVP, and only within this folder.** It **changes no decision** in the working files (`toolset.md`, `runner.md`, `viewer.md`, `data_topology.md`, `project_organization.md`, `security.md`, `MVP_scope.md`). Where it conflicts with a **[Decided]** item in a working file, **the working file wins**, and this folder is corrected; a working-file decision that blocks a correct graph is reopened in that working file.
- **The docs describe MVP 2 as it stands, with no history and no struck wording.** A changed item is rewritten to its current text. The history is in `96_mvp2_change_log.md`, the findings, and the frozen snapshot `mvp1/`.
- **Where to start:** `summary/00_where_we_are.md` (both stages at a glance), then `97_second_implementation.md` (the current state, decisions and open questions).

## What the MVP must prove

From `MVP_scope.md`, section 1.1:
- **P1.** The Runner and the Viewer can work together to manage the app.
- **P2.** The Runner works from a single command and produces the data the Viewer needs.
- **P3.** The Viewer works, as judged by a person.
- **P4.** Independent tools are a valuable solution. Tested after the MVP (`MVP_scope.md`, section 10).
- **P5** (proposed, MVP 2). The Viewer shows a correct graph of real TypeScript (`MVP_scope.md`, section 7).

## Files

| File | Contents |
|---|---|
| `summary/` | The short reading path: `00_where_we_are.md`, `10_mvp1.md`, `20_mvp2.md`, and every ID with its settled text, `00_definitions_mvp1.md` and `00_definitions_mvp2.md` |
| `01_architecture.md` | Components, the flow of a run, layout on disk, the single database, technology choices |
| `02_data_contracts.md` | Building blocks (IDs, locations), the stable ID rule, each tool's `--info`, parameters and outputs, results, logs, `last_run.json`, the database tables |
| `03_runner.md` | Runner requirements |
| `04_tools.md` | Every known program and tool; the contract every tool follows; `ts-program`'s requirements; error handling |
| `05_viewer.md` | Viewer requirements: backend and UI, the graph model, levels, edge lifting |
| `06_test_plan.md` | The examined sources, their expected results, broken inputs, the human review of the Viewer, the checks |
| `07_delivery.md` | Traceability level, deliverables, time box, the findings note |
| `40_tools_fileKind.md` | **A proposal, deferred until after the MVP:** the kind checkers, one tool per file type, that give each file a kind; the file kinds database; how the Runner selects each tool's files by pattern and kind. Nothing in it is built or decided unless it cites a decision |
| `41_typescript_program_plan.md` | The plan for MVP 2: what a correct graph is (`TSP-01`), its decisions (`TSP-D1` to `TSP-D12`), phases, risks, when it is done |
| `42_tool_ts_program.md` | The design of `ts-program`: its input, how it runs, its output, its `--info`, its checks, its decisions (`TPG-`) |
| `50_viewer_ui.md` | What the Viewer page looks like and holds: layout, header, levels, visual language, drawer, status bar, states. Each item marked known or suggested |
| `51_viewer_inventory.md` | **A pending matter, not built:** the Inventory, a drawer tab for examining by hand the model the Graph renders; what is decided (`INV-1` to `INV-18`), what is open with suggestions not yet accepted (`INV-30` on), and what is owed before building |
| `55_viewer_backend.md` | The Viewer backend: start and stop, its store, sources, calling the Runner, the graph model and its lifting, checks, endpoints, live stream, security, activity log, tests. Each item marked known, accepted or suggested |
| `96_mvp2_change_log.md` | The dated change log, newest first |
| `97_second_implementation.md` | **The MVP's main working file:** where MVP 2 stands, its decisions, phases, parts to reconsider, open questions (`M2Q-`), what is deferred |
| `99_findings.md` | The findings of MVP 2, `FND-85` on |
| `mvp1/` | **Frozen snapshot:** what MVP 1 built (`98_first_implementation.md`), MVP 1's findings (`99_findings_mvp1.md`), and every doc in this folder as it stood on 2026-11-10 before the clean rewrite, struck wording included (`docs_2026-11-10/`) |
| `test_plan/` | MVP 1's basic examined source as a runnable app (`test_plan/README.md`) |
| `proposed_schema/` | The reference JSON schema (`DATA-20`), as dated snapshots: every step's inputs and outputs, every key name with its one meaning (`DATA-19`). For MVP 2: `26-11-09 201159 …`, giving what MVP 2 changes, and `26-11-09 235850 …`, giving what `ts-program` 0.2.0 and the source range endpoint change after it (`DATA-24`). Proposed for the next part of MVP 2, not built: `26-11-10 165255 …` (ranges per declaration, initializers, folders as containers, and the `attrs` correction). The graph model's format 3, for the Inventory: proposed in `26-11-10 213900 …` (the index, each view's visibility, paths and reachability, the dropped records, what the page works out today), built, with what the build settled in `26-11-11 011716 …`. The MVP 1 schema is `26-11-09 081006 …`. For reference only; nothing validates against it |
| `zaansouvi-mvp/` | The code, tests, test sources, expected results, data and session logs (`ailog/`) |
| `*.zip` | Backups, without `node_modules` (restore with `unzip`, then `npm ci`: `zaansouvi-mvp/README.md`): `mvp_2026-11-09_implementation_until_typescript.zip` (`zaansouvi-mvp/` before MVP 2); `mvp_2026-11-10_before_cleanup.zip` (the whole `viewer/` folder before the clean rewrite); `mvp_2026-11-10_data_before_clean.zip` (`zaansouvi-mvp/data/` before it was cleaned); `mvp_2026-11-10_after_cleanup.zip` (the whole `viewer/` folder after the cleanup, with this session's log); `mvp_2026-11-10_inventory_built.zip` (the whole `viewer/` folder after the Inventory was built, with that session's log) |

## IDs

Requirements are numbered per file, for example `RUN-03` or `VIEW-07`, so tests and findings can refer to them. Prefixes: `ARCH`, `DATA`, `RUN`, `TOOL`, `VIEW`, `KIND` (`40_tools_fileKind.md`), `TSP` (`41_typescript_program_plan.md`), `TPG` (`42_tool_ts_program.md`), `UI` (`50_viewer_ui.md`), `BE` (`55_viewer_backend.md`), `TEST`, `DEL`. Findings use `FND`. MVP 2's open questions use `M2Q` (`97_second_implementation.md`, section 6). IDs are stable: an ID is never reused, and one that no longer applies says so and what applies instead.
