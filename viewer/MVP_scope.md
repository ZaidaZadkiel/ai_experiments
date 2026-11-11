# ZaAnSouVi MVP Scope

What the minimum viable product (MVP) of ZaAnSouVi contains, and what it leaves out.

> **Note (2026-11-10).** This version takes in what the process of implementation found, in MVP 1 and MVP 2 (`mvp_docs/summary/`, `mvp_docs/99_findings.md`, `mvp_docs/mvp1/`). **Some original assumptions no longer stand**, for example the least-effort rule for MVP 2 (section 1.2), one file per invocation for a language tool (`TS-37`), and the three tools M1 to M3 as the MVP's analysis (section 2). They need to be reviewed when the feasibility document is written (`DOC-5`, `CLAUDE.md`).

Each item is marked:
- **[Decided]**: agreed in discussion.
- **[Proposed]**: inferred, to be confirmed or changed.
- **To define**: a point the analysis must still work out.

Related files: `toolset.md` (all tools and their common rules), `runner.md`, `viewer.md`, `data_topology.md`, `project_organization.md`, `security.md`.

## 1. Purpose

- **[Decided]** The MVP is **only a proof of concept**. It shows that this kind of work is actually implementable.
- **[Decided]** **Failing on edge cases is acceptable.** The MVP follows the **happy path**.
- **[Decided]** It is measured against **the simplest test on a basic examined source**.
- **[Decided]** **The MVP only has to show whether this can work at all.** Repeatability, consistency and specificity of details are what matter for the product (`toolset.md`, section 2), not for the MVP.
- **[Decided]** **For the MVP, repeatability is not a hard requirement, but nice to have. The decision for the product depends on the MVP's findings** (decided by the user on 2026-11-08). The MVP's refresh check skips a tool whose inputs haven't changed, which assumes the same input gives the same output (`mvp_docs/03_runner.md`, `RUN-20`); the MVP's tests check it, and what they find feeds the product decision (section 10.3).
- **[Decided]** **The MVP's rule is least effort, with acceptable failures.**
- **[Decided]** **If a library or a built-in feature solves a tool's requirement, use it.**
- **[Decided]** **Tools are meant to be easy to replace, so the concern is simplicity, not precision.** A tool that is simple and roughly right is better than one that is precise and costly.
- **[Proposed]** The same rule settles small open points for the MVP: when in doubt, pick the answer that needs the least work (section 8.1).
- **[Proposed]** The MVP is not the first version of the product. Its code may be thrown away; what must survive is the knowledge of what works, what doesn't and what it costs. That feeds `TS-15` (planning) and the feasibility part of `feasibility_and_execution_plan.md`.

### 1.1 What the MVP must prove

- **[Decided]** **The project as a whole must prove whether a tool-based source code visualizer can be implemented.** The MVP is the first evidence for that (`toolset.md`, section 1).
- **[Decided]** Among other things, the MVP must prove:
  - **P1. The Runner and the Viewer can work together to manage the app.**
  - **P2. The Runner works from a single command** and produces the data the Viewer needs.
  - **P3. The Viewer works**, as judged by a person: **the test for the Viewer is a human decision**.
  - **P4. Independent tools are a valuable solution.** Whether a tool can be modified while its input and output stay abstract. If it turns out that modifying a tool isn't possible without changing the abstract input and output, the idea of independent tools fails. **P4 is tested after the MVP** (section 10).
- **[Proposed]** "Among other things" leaves room for more; candidates are cross-file linking working on the test source, and the single database working (section 4).
- **[Proposed]** A "no" on any of P1 to P4 is a finding, not a failure of the MVP: it tells the feasibility document what doesn't work and why.

### 1.2 The second stage (MVP 2)

- **[Decided]** **The MVP has a second stage, MVP 2** (decided by the user on 2026-11-09; `mvp_docs/41_typescript_program_plan.md`, `TSP-D1`). The first stage's build is kept as its record (~~`mvp_docs/98_first_implementation.md`~~ `mvp_docs/mvp1/98_first_implementation.md`, moved into the frozen snapshot on 2026-11-10); the MVP's state from then on is in `mvp_docs/97_second_implementation.md`.
- **[Decided]** **MVP 2's main goal: a correct graph in the Viewer, from real TypeScript data** (decided by the user on 2026-11-09): the graph built from what TypeScript's own compiler knows about the examined source, not from hand-written approximations. It follows from what the first stage showed on real code (`mvp_docs/99_findings.md`, `FND-81` to `FND-84`).
- **[Decided]** **In MVP 2, correctness comes before consistency with the earlier work** (decided by the user on 2026-11-09). **Every part of the MVP is reconsidered** against that goal: its contracts, tools, Runner, Viewer, tests and expected results. A part is kept only where it serves a correct graph; earlier choices are not kept for consistency alone.
- **[Decided]** For MVP 2, this replaces the first stage's rules in section 1 where they conflict: "least effort, with acceptable failures", "the happy path", "the simplest test on a basic examined source", and "simplicity, not precision" give way to correctness within the constructs MVP 2 supports. They still describe the first stage.
- **[Proposed]** **A decision in another working file that stands in the way of a correct graph is reopened explicitly** in the file that owns it, as an open question with the reason, not overridden in `mvp_docs/` (`CLAUDE.md`: a working file wins over `mvp_docs/`). Candidates: a tool reads one file per invocation, and one file type for one tool (`toolset.md`, section 4.2).
- **[Decided]** **What "correct" means for MVP 2: `mvp_docs/41_typescript_program_plan.md`, section 1.1 (`TSP-01`), decided by the user on 2026-11-09 as the starting point,** to be refined as the build shows more. In short: the graph shows what TypeScript itself knows and nothing it doesn't; every declaration a node, once, in its lexical container; every use an edge to the declaration TypeScript resolves it to, statically, across files; every import a link to what it names; what can't be resolved listed with its reason, built-ins apart; checked against an expected graph written by hand, and against TypeScript's "go to definition". ~~**[Proposed]** What "correct" means for MVP 2 is stated in `mvp_docs/41_typescript_program_plan.md`, `TSP-01`: every declaration a node in its container; every use an edge from the function or member holding it to the declaration it means, across files; every import reaching the declaration it names; built-ins told apart. It is checked against expected results written by hand.~~
- **[Proposed]** It is tracked as a fifth claim beside P1 to P4: **P5. The Viewer shows a correct graph of real TypeScript.**
- **[Decided]** **MVP 2's scope expands to explore how to better understand the examined code** (decided by the user on 2026-11-10). With the tools settled well enough (one tool, `ts-program`, gives the data the graph needs; `mvp_docs/42_tool_ts_program.md`, `TPG-06`), **data representation is what MVP 2 showed insufficient: the graph alone is not enough to give a good-enough understanding of the examined code.** The next point is to work out **what examining a codebase actually requires**, which visually affects mostly how the data is represented. Tracked in `mvp_docs/97_second_implementation.md` (`M2Q-21`, `M2Q-22`). Where this touches a question deferred until after the MVP, such as navigation and search (`viewer.md`, `VW-41`) or layout strategy (`VW-39`), the part brought in is stated as its own question.

## 2. What is in the MVP

*This section describes the first stage, MVP 1. MVP 2 keeps M1, M2 and M3 as built and runs `ts-program` alone (section 1.2; `mvp_docs/97_second_implementation.md`).*

- **[Decided]** **The Runner.**
- **[Decided]** **The Viewer.**
- **[Decided]** **For the MVP, the tools are written in TypeScript**, like the Runner and the Viewer. In the product, tools may run on any stack (`runner.md`, section 1.0).
- **[Decided]** **Three tools:**

| # | Tool | What it does (decided) | Example |
|---|---|---|---|
| M1 | **File symbols** | Opens a file and attempts to tokenize it into symbols, then deduplicates them into references. (By the least-effort rule, an existing parser does the tokenizing; `MVP-7`.) | A function declaration and a call to that function become one symbol with two references. |
| M2 | **Cross-file links** | Lists the symbols and attempts to work out how they link across files, recording where each symbol is used. | A function declared in `a.ts` and called in `b.ts` is linked, with the call's location. |
| M3 | **Symbol scope** | Attempts to show the scope of related symbols. | A variable declared inside a function is shown as belonging to that function's scope, together with the symbols it is used with. |

- **[Proposed]** How the three tools fit together:
  - **M1** reads one file per invocation, as every file-reading tool does ([Decided], `toolset.md`, section 4.2); the Runner invokes it once per file. It knows nothing of other files. Its output is, per file, the symbols found and each one's references: declaration, call, read, write, with source locations.
  - **M2** reads no source files: its `--info` doesn't claim any. ~~It gets M1's results for all files as parameters the Runner builds from M1's outputs, which the Runner reads (`runner.md`, section 5). It matches references to declarations across files.~~ It gets only M1's symbol and reference records, as flat arrays the Runner builds from M1's outputs, never M1's files (`mvp_docs/03_runner.md`, `RUN-19`; `02_data_contracts.md`, `DATA-13`). It links each import to the declaration it imports, and each use of an imported name to that declaration, with the use's location (`04_tools.md`, `TOOL-20`, `TOOL-23`), as the M2 row above says.
  - **M3** also reads no source files. ~~It gets M1's and M2's results the same way, and records which scope each symbol is declared in and which symbols share or use that scope.~~ In `mvp_docs/` it gets only M1's symbol records, and records the lexical scope each symbol is declared in (`DATA-07`, `DATA-08`). ~~Whether it also shows the symbols used together, as the M3 row above says, is still open (`MVP-4`, `mvp_docs/99_findings.md`, `FND-18`).~~ "Together with the symbols it is used with" is shown by the Viewer, not output by M3: each scope names the symbol that owns it, and the Viewer lifts the existing reference and link edges up to the scope they start in (`MVP-4`, decided by the user on 2026-11-08).
- **[Proposed]** "Deduplicates into references" means: every occurrence of the same name in the same declaration's meaning becomes one symbol, and each occurrence is kept as a reference to it, with its kind (declaration, call, read, write) and location. Nothing is thrown away; only the grouping is new.
- **[Proposed]** M1 and M2 together cover a first slice of the symbols tool (`toolset.md`, section 6.5). M3 is the basis of the "variables in a module" view (`viewer.md`, section 4.2). None of the three replaces those definitions; they are a thin first cut.

## 3. The basic examined source

- **[Decided] For MVP 2** (2026-11-09, `mvp_docs/99_findings.md`, `FND-92`): the test source is `mvp_docs/zaansouvi-mvp/test-source-mvp2/`, two class-heavy TypeScript files, and its expected graph is written by hand in `mvp_docs/zaansouvi-mvp/expected-mvp2/` from the definition of a correct graph (`mvp_docs/41_typescript_program_plan.md`, section 1.1). Real code is measured too: ZaAnSouVi's own `app/` (`FND-99`). What follows describes the first stage.

- **[Decided]** The MVP is tested on the simplest useful case: a basic examined source.
- **[Proposed]** A small, hand-written TypeScript project made for the test, for example:
  - two or three files
  - a function declared in one file and called from another, through a plain import
  - a module-level variable that is read in one place and written in another
  - a function with a local variable and a nested block, so scopes can be seen
  - no frameworks, no build configuration beyond what's needed, no generated code
- **[Proposed]** The expected result is written down ~~by hand~~ before the MVP runs on it (M1's by hand; M2's, M3's and the Runner's cache generated by applying the tools' written rules to M1's output, and cross-checked against the hand-written tables in `mvp_docs/06_test_plan.md`; see `mvp_docs/zaansouvi-mvp/expected/README.md`): every symbol, every reference with its file and line, every cross-file link and every scope. The MVP passes when its output matches.
- **[Proposed]** Anything outside the basic source, such as re-exports, overloads, type-only symbols, dynamic access, decorators or mixed JavaScript, is an edge case. Failing on it is acceptable (section 1).

## 4. What the MVP keeps from the full design

- **[Decided] For MVP 2:** the same contracts, with the changes recorded in `mvp_docs/42_tool_ts_program.md` and the MVP 2 schema (`mvp_docs/02_data_contracts.md`, `DATA-24`): a program tool reading every listed `.ts` file in one invocation (`toolset.md`, section 4.2, `TS-37`), list parameters, per-file outputs from a once tool, new record keys; the Runner runs a fixed list of tools (`RUN-33`) and lists every file with its status (`RUN-34`, `RUN-35`). What follows describes the first stage.

The MVP is a proof of concept for the toolset's architecture as well as its analysis, so some contracts are worth keeping even in a thin form.

- **[Proposed]** **Kept, in a minimal form:**
  - each tool does one thing and is unaware of the other tools (`toolset.md`, section 4.2)
  - each tool states its parameters and outputs with `--info`, and the Runner works out the order of M1, M2 and M3 from that ([Decided] for the toolset, `DT-1`)
  - the Runner's run process: read the configuration, find the source, list the files, decide the order, call each tool with JSON parameters, read its log and output, update the database (`runner.md`, section 1.1)
  - parameters through `--json` or `--stdin`, and `last_run.json` (`toolset.md`, section 4.5)
  - each tool writes only to its own store; only the Runner writes the database (`toolset.md`, section 5.2)
  - every tool writes its own log, in the Runner's log format
  - **source locations** on every symbol and reference, so the Viewer can show file:line (`toolset.md`, section 3)
  - never running code from the examined source (`security.md`, section 1)
- **[Decided]** **Dry runs are part of the MVP's happy path.** A dry run validates the simple parts and shows **go / no-go** errors, which the rest of the system must read properly.
- **[Proposed]** What that means in the MVP:
  - before each real run, the Runner dry-runs the tool with the JSON it built (`runner.md`, section 1.1)
  - **go**: the tool read its parameters and found nothing wrong in the simple parts; the Runner goes on to the real run
  - **no-go**: an invocation error (missing or malformed parameters) or a run error found in the dry run (for example the file to read is missing); the Runner stops before the real run, starts no other tool, and records the error in its log
  - the dry run's output is on standard output only ([Decided], `toolset.md`, section 4.3); the Runner parses it, so the dry-run output format has to be parsable from the start
  - the Viewer shows the go / no-go result for each tool, with the error message, and can ask the Runner for a dry-run-only pass ([Decided] as a Runner parameter, `runner.md`, section 10)
- **[Decided]** **One database, for the MVP only.** The MVP reads only one codebase, so a single database holds both the configuration and the processing data.
- **[Decided]** **Its purpose is to verify that the database approach is feasible.** The real product keeps two independent databases: the configuration database and the codebase database (`toolset.md`, section 5.2). Nothing in the MVP's single database is a design decision for the product.
- **[Decided]** **Inside the one database, the configuration and the codebase data are kept apart**, so splitting them later is a move, not a redesign.
- **[Decided]** **Table names say what each table is for**, by a prefix: for example `config_<name>` for configuration such as user display data, and `project_<name>` for codebase data. The actual schema is decided at a later stage.
- **[Decided]** At the split, the `config_` tables move to the configuration database and the `project_` tables to the codebase database. A table that fits neither prefix is a sign that something is undecided.
- **[Proposed]** ~~The Runner and the Viewer's backend both use the one database, as they will share the configuration database in the product.~~ Only the Runner uses the database. The Viewer's backend reads the Runner's cache, through `--read-cache` (`mvp_docs/05_viewer.md`, `VIEW-03`; `01_architecture.md`, `ARCH-11`), following the decision that the Viewer prefers the Runner's cache (`runner.md`, section 10.2).
- **[Decided]** In the product, the Viewer reads the configuration database directly and gets codebase data through the Runner (`viewer.md`, section 3.1). **For the MVP this detail may be omitted**: with one database, the Viewer's backend may read it directly.
- **[Proposed]** What goes into it in the MVP (an MVP-only answer to `RN-12`): the configuration the Runner needs, the record of the three tools and their ordering (`config_` tables), the file list, and the record of which tool outputs exist and when they were made; also each run and each invocation's result and fingerprint, for the refresh check (`mvp_docs/03_runner.md`, `RUN-20`, `RUN-22`). The Runner's cache and lock are files beside it (`RUN-27`, `RUN-30`). M1–M3's work data stays in their own stores, and the Runner reads it from there to build the next tool's JSON (`runner.md`, section 5).
- **[Proposed]** **Kept only as far as the happy path needs:**
  - invocation errors and run errors (`toolset.md`, section 4.6): a clear message is enough, without every error kind
  - stable IDs: stable ~~within one run~~ on every run over an unchanged source (`mvp_docs/02_data_contracts.md`, `DATA-04`); the refresh check relies on it
  - the file list: the Runner reads the files and lists them ~~(whether that stays the Runner's job is `RN-13`)~~ (`RN-13` resolved: the Runner's job, for the product too, `runner.md`, section 4)

## 5. The Viewer in the MVP

- **[Decided] For MVP 2:** the levels follow TypeScript's own nesting, to any depth (file › namespace › class › member), with no scope tool (`TPG-06`, closed 2026-11-09); a frame for any entered container (`TSP-D8`); the top view shows every listed entry, the unconnected ones in a frame with their status icons (`UI-47`, `UI-48`); built-ins listed apart. What follows, section 5.1 included, describes the first stage.

- **[Decided]** **The graph has at least two levels.** Which levels they are is defined once the tools are decided on, that is, once M1–M3's outputs are settled (`--info`).
- **[Proposed]** Moving between levels follows the Viewer's rules (`viewer.md`, section 4.9).

### 5.1 How independent tools build the levels (MVP only)

This applies to the MVP only; the product's level hierarchy is `VW-19`.

- **[Proposed]** What the MVP shows: **different levels come from different tools**, no tool knows about levels, the Viewer or the other tools, and **the Viewer builds the levels only from `containedIn` in each tool's `--info` and the parent IDs in the data**, with no tool-specific knowledge. Shared stable IDs join the tools' outputs, through the Runner.

| Producer | Produces | Place in the levels | What it demonstrates |
|---|---|---|---|
| **Runner** (file list) | files, with IDs | top-level containers | the anchors every level hangs from; not a tool (~~`RN-13`, MVP-only~~ `RN-13` resolved for the product too) |
| **M1 File symbols** | per file: symbols (ID, name, kind, location, parent = file ID) and references (~~symbol ID, kind, location~~ from, to, kind, location; `FND-02`) | the bottom level; `containedIn: file` | nodes produced one file at a time, by a tool that knows nothing else |
| **M3 Symbol scope** | scopes (ID, kind, location, parent = file) and which scope each of M1's symbols belongs to (membership: `child`, `parent`; `DATA-07`) | a middle level between file and symbol; `containedIn: file`, contains M1's symbols | another tool inserting a level, where containment runs opposite to data flow (`data_topology.md`, section 7) |
| **M2 Cross-file links** | ~~links from a reference in one file to a declaration in another~~ links from an import, and from each use of an imported name, to the declaration in another file, by M1's IDs (`TOOL-20`, `TOOL-23`) | edges that cross containers | relations across levels |

- **[Proposed]** The levels the Viewer shows:
  - **Level 1, files**: nodes from the file list; edges between files aggregated from M2's links
  - **Level 2, inside a file**: M3's scopes, with M2's links leaving the file shown as stubs to the other files, and each scope's uses lifted to it, so a scope is shown with the symbols it is used with (`MVP-4`)
  - **Level 3, inside a scope** (optional): M1's symbols and their references
- **[Decided]** **The Viewer aggregates the file-to-file edges** from the symbol-level links: an edge between two children implies an edge between their parents. No tool produces file-level edges.
- **[Proposed]** The aggregation is generic: it uses only the containment and the links, never knowledge of M2, so it works for any tool's links.
- **[Decided]** **The same generic rule works at every level** (decided by the user on 2026-11-08, `MVP-4`): an edge whose ends are hidden inside a container is drawn between the nearest visible containers, once, with a count, and selecting it lists the edges it stands for, each with its file:line; an edge that starts at a node owning a scope (a scope's `owner`) starts from that scope. File edges are its first case; scope edges, the symbols a scope is used with, are the second.
- **[Proposed]** M3 keeps one level of scopes in the MVP (no scopes nested inside scopes). That is less effort and still shows a tool inserting a level.
- **[Proposed]** The stable ID rule (section 4) has to be fixed before the tools are built, since M2 and M3 both refer to M1's IDs.
- **[Proposed]** Two small checks make the demonstration convincing:
  - **leave M3 out of a run**: the Viewer falls back to two levels, file › symbol, with no change to M1, M2 or the Viewer. Levels come from whichever tools are present. This is also early evidence for P4.
  - **rename or move a symbol in the test source**: after a rerun, all three tools still agree on the IDs.
- **[Proposed]** In each level: nodes and edges, with declarations and uses drawn differently (`viewer.md`, section 4.3).
- **[Proposed]** A way to show a scope: the symbols of one scope grouped together, from M3's output.
- **[Proposed]** Selecting a node or an edge shows its file:line and the source line it comes from (`viewer.md`, section 4.4).
- **[Proposed]** A button that starts the Runner, a button for a dry-run-only pass, and a place that shows each tool's go / no-go result, its result and its log, so a failure can be seen (`viewer.md`, section 4.14).
- **[Proposed]** Zoom, pan and moving nodes by hand; automatic arranging only as simple as needed to make the basic source readable.

## 6. What is out of the MVP

- **[Decided] Out of MVP 2, besides what follows:** `ts-config` to start with (`TPG-D4a`); JavaScript and JSX (`TSP-D12`); file kinds (`mvp_docs/40_tools_fileKind.md`); `node_modules` and `@types` in the program (`TPG-20`, its cost measured, `FND-99`, and open again as `TPG-D8`).

- **[Proposed]** Left out entirely:
  - the git step, environment variables, modules, infrastructure, project overview facts and the Mermaid generator (`toolset.md`, section 6)
  - the product's full level hierarchy (`viewer.md`, section 4.9.1); the MVP has its own two or more levels (section 5)
  - the config manager, the status page and the run configurations view (`viewer.md`, sections 4.11, 4.12, 4.14), apart from the run button and result display in section 5
  - named Runner configurations, the configuration listing, adding or omitting tools (`runner.md`, sections 3 and 6)
  - ~~incremental runs: every run starts from scratch (`toolset.md`, section 5.3)~~ Not left out: the MVP refreshes only what changed (`mvp_docs/03_runner.md`, `RUN-17` to `RUN-22`, at the user's request; `FND-36`)
  - several codebases, separate configuration and codebase databases (one database in the MVP, see section 4), staging, the pending version and ~~the cache~~ the Viewer's own cache (`viewer.md`, section 5). The Runner's cache is in the MVP (`runner.md`, section 10.2; `mvp_docs/03_runner.md`, `RUN-27`)
  - changing ZaAnSouVi's global settings from the command line (`TS-34`)
  - **[Decided]** installing and removing tools (`RN-19`)
  - **[Proposed]** the MVP's three tools are simply present, and their entries in the record of tools are set up by the Runner when it starts, by calling each tool's `--info`
  - GPU rendering and large graphs (`viewer.md`, section 4.6)
  - cancelling a run, and a timeout for a tool that hangs (`mvp_docs/03_runner.md`, `RUN-11`; `FND-34`)
  - the single-root organization (`project_organization.md`), beyond a simple folder per tool
- **[Proposed]** Each of these is left out because the proof of concept doesn't need it to show that the analysis and the tool contracts work, not because it is less important.

## 7. Success criteria

- **[Proposed] For MVP 2** (2026-11-09), each with its state then (`mvp_docs/97_second_implementation.md`, `FND-98`, `FND-99`):
  1. **(P2)** one command runs the Runner, which runs `ts-program` alone and leaves the data the Viewer needs: **met**.
  2. **(P2, P5)** `ts-program`'s output matches the expected graph written by hand, and every edge agrees with TypeScript's "go to definition": **met** (~~87 nodes, 117 edges; 117 of 117~~ 120 nodes, 156 edges; 156 of 156, once the test source gained subfolders, `mvp_docs/99_findings.md`, `FND-104`).
  3. **(P1, P3, P5)** the Viewer starts the Runner, shows the graph at every depth with frames, and every element leads back to its file and line: **built and checked by script; the human review is in progress**.
  4. **(P1)** a broken input gives a clear no-go, shown in the Viewer, which keeps the last good graph (`B7`): **met**.
  5. **(P1)** a dry-run-only pass reports go and writes nothing (`TEST-02`, `TEST-03`); a source with no file to read stops, saying why (`R11`): **met**.
  6. **(P5)** on real code, the run times and the share of uses resolved are measured and their limits recorded: **met** (`app/`: 4.4 s a full run, 69% of uses resolved; limits: packages without type declarations, the readability of large views).
- **[Proposed]** P5, "the Viewer shows a correct graph of real TypeScript", is judged on criteria 2, 3 and 6; what follows describes the first stage.

- **[Proposed]** The MVP succeeds when, on the basic examined source (each criterion names the claim in section 1.1 it supports):
  1. **(P2)** one command runs the Runner, which calls M1 for every file, then M2, then M3, updates the MVP's single database, and leaves the data the Viewer needs ([Decided] that this is the Runner's test)
  2. **(P2)** the output matches the expected result written down by hand (section 3)
  3. **(P1, P3)** the Viewer starts the Runner, shows at least two levels of graph and lets the user move between them, shows the symbols, their references, the cross-file links and the scopes, and every element leads back to its file and line. Whether the Viewer passes is **a person's decision** ([Decided])
  4. **(P1)** a deliberately broken input, for example a missing file (a test by hand, B6; through the Runner it is a syntax error, B7; `mvp_docs/99_findings.md`, `FND-28`), makes the right tool's dry run report no-go with a clear message; the Runner reads it, stops before the real run, and the Viewer shows it
  5. **(P1)** a dry-run-only pass on the basic source reports go for every tool, and no tool writes anything (the Runner may write its log and the database, `toolset.md`, section 4.3)
  6. **(P1, P3)** a run without M3 still shows a graph, with one level fewer, and nothing else was changed (section 5.1)
- P4 is not an MVP success criterion; it is tested after the MVP (section 10).
- **[Proposed]** It also produces notes for the feasibility document: what was harder than expected, which libraries or approaches worked, rough run times, and what the single database showed about the database approach, including anything that will matter when it is split into the configuration and codebase databases.

## 8. Open questions

- `MVP-1` ~~**Basic examined source:** is the small hand-written project in section 3 the right test? Who writes it and its expected result?~~ Answered for the MVP: the test source is in `mvp_docs/test_plan/` (a runnable app) and `mvp_docs/zaansouvi-mvp/test-source/`, its expected result in `mvp_docs/zaansouvi-mvp/expected/`, written by the developer (`mvp_docs/07_delivery.md`, `DEL-04`; `FND-21`).
- `MVP-2` ~~**How M1 is called**~~: resolved. Once per file: a tool reads only one file per invocation (`toolset.md`, section 4.2).
- `MVP-3` ~~**Deduplication:** is the meaning in section 2 right: one symbol per declaration, every occurrence kept as a reference?~~ Answered for the MVP: yes, one symbol per declaration and every occurrence a reference; M1 does this and its tests check it (`mvp_docs/04_tools.md`, `TOOL-11` to `TOOL-14`; `FND-21`).
- `MVP-4` ~~**What "scope of related symbols" shows:** the lexical scope a symbol is declared in (file, function, block), the set of symbols used together in one scope, or both?~~ Resolved *(decided by the user on 2026-11-08: option C with C1. M3 records the lexical scope only, from M1's symbols alone: the file scope and one scope per top-level function, each scope naming its `owner` (the function symbol, or the file for the file scope). The symbols a scope is used with are shown by the Viewer, which lifts M1's references and M2's links up to the nearest visible container with a generic rule, the one it already uses for file edges. Weighed against B (M3 also reads references and outputs scope uses), A (lexical only, without the uses) and D (nested and block scopes, kept for after the MVP, section 10.3). Recorded in `mvp_docs/04_tools.md`, `TOOL-33`, and `05_viewer.md`, `VIEW-13`; `mvp_docs/99_findings.md`, `FND-55`.)*
- `MVP-5` **Contracts kept:** is the list in section 4 the right amount of the full design for a proof of concept, or should the MVP drop more (for example the database) to stay smaller? *(Since written, the MVP has grown: incremental runs, the Runner's cache, a run lock, a tool helper.)*
- `MVP-6` ~~**Viewer in the MVP**~~: resolved. The graph has at least two levels, defined once the tools are decided on (section 5).
- `MVP-7` ~~**Tokenizing versus parsing**~~: resolved. Use an existing library or built-in feature when it solves the requirement (section 1), so M1 uses an existing TypeScript parser rather than a hand-made tokenizer. Which one is a technology choice.
- `MVP-8` **Success criteria:** are the criteria in section 7 the right ones, and is a run time target needed?
- `MVP-9` ~~**What each tool hands on:** what a symbol, a reference, a cross-file link and a scope contain, and which of them M2 and M3 receive (section 5.1 sketches the fields). Starting answer: `mvp_docs/02_data_contracts.md`.~~ Answered for the MVP in `mvp_docs/02_data_contracts.md`, accepted for that folder (`mvp_docs/README.md`).
- `MVP-10` ~~**Each tool's `--info`:** the parameters (data name, shape, required) and outputs of M1, M2 and M3. Starting answer: `mvp_docs/02_data_contracts.md`.~~ Answered for the MVP in `mvp_docs/02_data_contracts.md`, accepted for that folder (`mvp_docs/README.md`).
- `MVP-11` ~~**Supported constructs:** which TypeScript constructs M1–M3 must handle; everything else is an acceptable failure. Starting answer: `mvp_docs/04_tools.md`.~~ Answered for the MVP in `mvp_docs/04_tools.md`, accepted for that folder (`mvp_docs/README.md`).
- `MVP-12` ~~**Stable ID rule:** the minimal rule that lets M2 and M3 refer to M1's symbols (section 5.1). Starting answer: `mvp_docs/02_data_contracts.md`.~~ Answered for the MVP in `mvp_docs/02_data_contracts.md`, accepted for that folder (`mvp_docs/README.md`).
- `MVP-13` ~~**Layout on disk:** where the single database, each tool's store, logs and `last_run.json`, and the Runner's log go. Starting answer: `mvp_docs/01_architecture.md`.~~ Answered for the MVP in `mvp_docs/01_architecture.md`, accepted for that folder (`mvp_docs/README.md`).
- `MVP-14` ~~**Test plan:** where the expected result lives, whether the comparison is automatic, which broken inputs are tried and the go / no-go each should give, and what the person judging the Viewer looks at. Starting answer: `mvp_docs/06_test_plan.md`.~~ Answered for the MVP in `mvp_docs/06_test_plan.md`, accepted for that folder (`mvp_docs/README.md`).
- `MVP-15` ~~**Traceability level, deliverables and time box:** how much traceability the MVP shows (for example file:line plus the source line), what it hands over, and how long it may take. Starting answer: `mvp_docs/07_delivery.md`.~~ Answered for the MVP in `mvp_docs/07_delivery.md`, accepted for that folder (`mvp_docs/README.md`).

### 8.1 MVP-only answers

These answer open product questions for the MVP only, by the least-effort rule (section 1). They decide nothing for the product. Each row cites the product question it answers; the question itself is defined in its own file. They are the first stage's answers; MVP 2's state is in `mvp_docs/97_second_implementation.md`.

| Answer for the MVP to | MVP-only answer | Status |
|---|---|---|
| Config files (`TS-29`) | No config files. The Runner takes the source path on the command line; ~~everything else is a default~~ it saves it in the database and reuses it, as it does the store paths (`RUN-29`); everything else is a default. | [Proposed] |
| File list (`RN-13`) | The Runner builds it. | ~~[Proposed]~~ [Decided] for the product too (`runner.md`, section 4) |
| Repeated tool runs (`RN-15`) | One dry run, then one real run, per invocation; or a skip when it is up to date (`RUN-17`). | [Proposed] |
| Database updated per tool (`RN-16`) | Accepted; no staging. | [Proposed] |
| Viewer-specific Runner parameters (`RN-17`) | Run, dry-run only, read cache (exactly the Runner's cache, `RUN-27`). | [Proposed] |
| Record of tools (`RN-19`) | The three tools are present; the Runner fills their entries on start by calling each `--info`. | [Proposed] |
| `last_run.json` shared between codebases (`TS-25`) | Doesn't matter with one codebase. | [Proposed] |
| Arguments without JSON (`TS-30`) | The Runner always sends JSON. | [Proposed] |
| One file per invocation at scale (`TS-31`) | Doesn't matter for two or three files; record the timings as a finding. Measured on 2026-11-08: about 0.5 s per M1 invocation, about 3.5 s for a full run of M1 on three files. | [Proposed] |
| Viewer data access (`VW-36`) | ~~The Viewer's backend reads the single database directly.~~ The Viewer's backend may read the single database directly (section 4), but in `mvp_docs/` it reads only the Runner's cache (`VIEW-03`), as the Viewer prefers the Runner's cache (`runner.md`, section 10.2). | [Decided] (section 4) that it may |
| Output modes | Only the Viewer output mode; `--human` is out. | [Proposed] |
| Tool list in the Viewer | Shown read-only: the three tools and whether each runs, from the Runner's cache. No enabling or disabling. | [Proposed] |

## 9. Deferred to the final technology section

For building the MVP, `mvp_docs/` already makes concrete choices for these, accepted for that folder only.


- the language and libraries the MVP is written in
- the format of each MVP tool's output and parameters
- the schema of the MVP's database, beyond the `config_` and `project_` table prefixes

## 10. Post-MVP

- **[Decided]** This section describes what happens **after the MVP is completed**: how P4 is tested, which other claims count as answered, and which new questions are checked next.
- **[Decided]** **It doesn't block the MVP and doesn't influence any other decision.** It depends entirely on what is found once the MVP is done, and is rewritten then.

Everything below is a starting point, to be replaced by what the MVP actually shows.

### 10.1 How P4 is tested

- **[Proposed]** Take the working MVP and modify one tool without touching anything else. Candidate changes, from small to large:
  1. change how M1 finds symbols internally, for example a different parser or approach, with the same outputs
  2. add a new detail to M1's output, stated in its `--info`, that no other tool uses yet
  3. replace M3 with a different implementation of the same `--info`
  4. add a fourth, small tool that takes existing outputs as parameters and produces something new
- **[Proposed]** For each change, record:
  - whether M2, M3, the Runner and the Viewer kept working without being changed
  - what had to change anywhere else, and why
  - how much effort the change took, compared with changing the same thing in a single program
- **[Proposed]** P4 holds if the changes stay inside the tool and its `--info`. Every change needed elsewhere is evidence against it, and the record says whether the cause was the contract (fixable) or the idea of independent tools itself.

### 10.2 Which claims count as answered

- **[Proposed]** After the MVP, go through P1 to P4 and any added claims, and mark each as **yes**, **no** or **partly**, with the evidence: the success criteria met, the human decision on the Viewer (P3), and the P4 record.
- **[Proposed]** Each answer feeds the feasibility part of `feasibility_and_execution_plan.md`. A "no" or "partly" also says which part of the design it puts in question.
- **[Proposed]** Claims that may turn out to be answered along the way: cross-file linking on the test source, the single database approach, and the dry-run go / no-go flow.

### 10.3 New questions to check

- **[Decided]** Questions to check after the MVP, to be kept, dropped or reordered once its findings are in:
  - **scale**: one process per file and large JSON parameters on a real codebase (`TS-31`, `TS-13`)
  - **the two databases**: splitting the MVP's single database into the configuration and codebase databases (section 4)
  - **tools on another stack**: one tool written outside TypeScript, held to the same contract (`TS-35`)
  - **incremental runs**: running only what changed (`toolset.md`, section 5.3) *(partly answered already: the MVP refreshes only what changed, `mvp_docs/03_runner.md`, `RUN-17` to `RUN-22`)*
  - **view levels**: the product's full level hierarchy, beyond the MVP's two or more levels (`viewer.md`, section 4.9)
  - **repeatability**: the same input giving the same output across runs, as the product requires (`toolset.md`, section 2) *(for the MVP nice to have, not a hard requirement; the product decision depends on what the MVP finds, section 1)*
  - **installation of new tools**: the Runner installing a tool, including from a file uploaded through the Viewer, and the record of tools and the ordering updating with it (`RN-19`)
  - **nested and block scopes** (decided by the user on 2026-11-08, option D of `MVP-4`): scopes for nested functions and for blocks, on several levels. It needs M1 to output blocks and to tell `var` from `let` and `const`, and its name resolution to follow blocks, so that M1 and M3 agree; and the Viewer's levels to go to any depth (`VW-19`). Kept for after the MVP because it changes M1 for M3's sake and the test source has a single block. With the lifting rule, a use inside a block lifts correctly only once references name their block as their source
  - **arrow direction** (noted by the user on 2026-11-09): arrows from a definition to where it is used may read better than the MVP's, from the using end (`viewer.md`, `VW-40`)
  - **file kinds** (deferred by the user on 2026-11-09): kind checkers, one tool per file type, giving each file a kind; the kinds database; the Runner choosing each tool's files by pattern and kind, and stopping early with a clear reason. The first step of the file inventory planned first after the MVP (`toolset.md`, section 6.2). Proposal and the decisions it needs: `mvp_docs/40_tools_fileKind.md`, section 8 (`KIND-90` to `KIND-103`)
  - **classes and JavaScript** (noted on 2026-11-09, from feeding M1 JavaScript, `mvp_docs/99_findings.md`, `FND-81`): classes and their members are the largest gap for any real codebase, TypeScript included (a class used in its own file shows as unresolved); plain JavaScript is within reach of the same parser, JSX needs its own tool. To weigh beside nested and block scopes and `TS-11`
  - **navigation and search** (noted by the user on 2026-11-09): navigation between nodes needs to be more explicit, with a way to search for what is within the project (`viewer.md`, `VW-41`)
- **[Decided]** Each question that is kept gets a short definition of what would answer it, like P1 to P4, before any work starts on it.
