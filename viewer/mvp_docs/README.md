# ZaAnSouVi MVP: build requirements

This folder holds everything needed to build the ZaAnSouVi MVP: a proof of concept with a Runner, a Viewer and three tools, that shows whether a tool-based source code visualizer can work at all.

## Status of this folder

- Everything here is **accepted for building the MVP, and only within this folder.** It is a starting point inferred from the working files, written so a developer (working with AI) can start building.
- It **changes no decision** in the working files (`toolset.md`, `runner.md`, `viewer.md`, `data_topology.md`, `project_organization.md`, `security.md`, `MVP_scope.md`).
- Where it conflicts with a **[Decided]** item in a working file, **the working file wins**, and this folder is corrected.
- It gives starting answers to `MVP-9` to `MVP-15` (`MVP_scope.md`, section 8). The MVP-only answers in `MVP_scope.md` section 8.1, still [Proposed] there, are treated as accepted here.
- The guiding rule is the MVP's: **least effort, acceptable failures, use a library or built-in when one does the job, simplicity over precision** (`MVP_scope.md`, section 1).

## What the MVP must prove

From `MVP_scope.md`, section 1.1:
- **P1.** The Runner and the Viewer can work together to manage the app.
- **P2.** The Runner works from a single command and produces the data the Viewer needs.
- **P3.** The Viewer works, as judged by a person.
- **P4.** Independent tools are a valuable solution. Tested after the MVP (`MVP_scope.md`, section 10).

## Files

| File | Contents |
|---|---|
| `01_architecture.md` | Components, the flow of a run, layout on disk, the single database, technology choices for the MVP |
| `02_data_contracts.md` | Building blocks (IDs, locations), the stable ID rule, each tool's `--info`, parameters and outputs, results, logs, `last_run.json`, the database tables |
| `03_runner.md` | Runner requirements |
| `04_tools.md` | Requirements for M1 (file symbols), M2 (cross-file links) and M3 (symbol scope), supported constructs, error handling |
| `05_viewer.md` | Viewer backend and UI requirements, levels, edge aggregation |
| `06_test_plan.md` | The basic examined source, its expected result, broken inputs, the human review of the Viewer, the extra checks |
| `07_delivery.md` | Traceability level, deliverables, time box, the findings note |
| `99_findings.md` | Review of this folder before building: gaps, conflicts with the working files, values inferred from the test source, what the test plan is missing |
| `test_plan/` | The basic examined source as a runnable app (`test_plan/README.md`) |
| `proposed_schema/` | The reference JSON schema, built alongside the MVP (`DATA-20`): every step's inputs and outputs, every key name with its one meaning (`DATA-19`), and the parameters and keys the programs know by name. The current file is the newest (2026-11-08, `011800`); the earlier one is kept, marked superseded. For reference only; nothing validates against it |

## Requirement IDs

Requirements are numbered per file, for example `RUN-03` or `VIEW-07`, so tests and the findings note can refer to them. Prefixes: `ARCH`, `DATA`, `RUN`, `TOOL`, `VIEW`, `TEST`, `DEL`. Findings use `FND`.

## Build order

A suggested order, each step usable on its own:
1. the test source and its expected result (`06_test_plan.md`), written first, by hand
2. the shared building blocks and the log format (`02_data_contracts.md`)
3. M1, runnable by hand with `--json` (`04_tools.md`)
4. the Runner with M1 only: file list, dry run, real run, database (`03_runner.md`)
5. M2 and M3
6. the Viewer: backend first, then the two-level graph (`05_viewer.md`)
7. the broken-input tests, the extra checks, the human review, the findings note (`06_test_plan.md`, `07_delivery.md`)
