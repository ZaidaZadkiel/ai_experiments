# Where the MVP stands

> **Draft, 2026-11-10**, for the user to react to. The first of four summary documents for the MVP (see "How to read this folder" at the end). Nothing here decides anything: every statement points to where it is recorded.

ZaAnSouVi's MVP is a proof of concept: a **Runner** that runs independent **tools** over a TypeScript codebase, and a **Viewer** in the browser that shows the result as a graph you can enter level by level. Its job is to show whether a tool-based source code visualizer can be built at all (`MVP_scope.md`, section 1.1), not to be the first version of the product.

It has gone through two stages. Each one is described here on its own: what it attempted, what worked, what didn't, and what it leaves.

| | MVP 1, first implementation | MVP 2, real TypeScript |
|---|---|---|
| **Dates** | 2026-11-07 to 2026-11-08, refined 2026-11-09 | from 2026-11-09 |
| **Rule** | least effort, the happy path, simplicity over precision | **a correct graph**; correctness before consistency with earlier work |
| **Tools run** | M1 file symbols, M2 cross-file links, M3 symbol scope | `ts-program` alone |
| **Test source** | three small files, functions only | the class-heavy test (`test-source-mvp2/`), later with subfolders |
| **State** | **superseded** as the MVP's working state; kept as the record (`mvp1/`) | **current** (`97`) |

## MVP 1: the first implementation

**Attempted.** Build the whole chain once, end to end, on a tiny source: three tools, each a separate program knowing nothing of the others; a Runner that finds the tools and their order from each tool's `--info` alone; a single database; a Viewer with three levels.

**Before building** (2026-11-06), the requirements in this folder were inferred from the working files and reviewed. About 85% of what the build needed was in place; the rest were contract gaps that would have forced the developer to guess, such as no rule linking a data name to part of an output file, and relations without one shape (`99_findings.md`, `FND-01` to `FND-34`). Most were resolved before or during the build.

**What worked** (`mvp1/98_first_implementation.md`, sections 4 to 6):
- **The chain itself.** One command runs every tool and leaves the data the Viewer needs; every tool's output matched the expected result written by hand, exactly. A dry-run-only pass reports go and writes nothing. A broken input gives a clear no-go from the right tool.
- **The contracts between parts.** The Runner has no code for any tool; M3 was added later with no change to the Runner (`FND-57`). The Viewer names no tool. A plain shell script running the tools gave byte-identical outputs to the Runner's (`TEST-08`): the Runner can be replaced. This is the first evidence for P4, independent tools.
- **Refreshing only what changed**, brought into the MVP although its scope left it out (`FND-36`). The MVP showed that running every tool on every run is unnecessary: the same input gives the same output (`FND-52`, `FND-58`), so running a tool over and over goes against the intention. Examining a source doesn't need processing again and again; for most cases a single snapshot is enough, on the assumption that an examined source doesn't change too drastically in architecture or implementation. *This is a human judgement (the user's, 2026-11-10), not a measured result.*
- **The Viewer's own design** settled while building it: its own store, surviving bad data, a security model with a one-time token (`FND-61` to `FND-68`).

**What didn't work, and why:**
- **Hand-written analysis doesn't survive real code.** M1 can't read JavaScript or JSX (`FND-81`), and misses classes, members, enums, namespaces and member calls in real TypeScript (`FND-82`). M2's matching of imports by name inherits the same gaps. The least-effort rule produced a chain that works on the test source and gives a wrong graph on anything else.
- **A JavaScript project gave nothing and a misleading error.** The Runner listed no files, M1 never ran, and M2's error pointed away from the cause (`FND-75`; a generic stop was built in MVP 2).
- **The one-file-per-invocation rule is in the way.** A probe showed TypeScript's own checker works on a one-file program and keeps every rule: in `shapes.ts` it left 0 uses unresolved, where M1 left 22 (`FND-83`). Across files, though, the checker needs the whole program, and a whole-program M1 collided with several decided rules (`FND-84`).
- **Smaller problems found by the checks:** M3's output depended on input order (`FND-58`); the layout came out differently on every visit, and the force layout didn't suit frames (`FND-72`, `FND-73`).

**Left unfinished, and overtaken by MVP 2:** the human review of the Viewer (P3); a run without M3 (`C1`); a broken input shown through the page (`B7`, later done in MVP 2).

## MVP 2: real TypeScript

**Attempted.** Rebuild the analysis on what TypeScript's own compiler knows, so that the graph is correct, and reconsider every part of the MVP against that goal (`MVP_scope.md`, section 1.2; `97`, section 3). What "correct" means was written down first and decided as the starting point (`41_typescript_program_plan.md`, section 1.1, `TSP-01`). In short, the graph shows what TypeScript knows, and nothing it doesn't.

**Main decisions** (all in `97`, section 4):
- A new tool, **`ts-program`**, runs TypeScript's program and checker over all listed `.ts` files in one invocation and writes per-file outputs (`42_tool_ts_program.md`). M1 is kept as it is but not run; M2 and M3 aren't run either.
- **Program tools** are a named exception to "one file per invocation", recorded in the product design (`toolset.md`, `TS-37`).
- **Types belong in the graph** (`TPG-D3`). **Built-ins are told apart** from unresolved names, using TypeScript's own library (`TPG-D5`).
- The Runner **lists every file accurately**, with status icons for hidden, link, read-only and unreadable files (`RUN-34`, `RUN-35`, `UI-47`, `UI-48`). It runs a hardcoded list of tools (`RUN-33`).

**What worked** (`FND-98`, `FND-99`):
- **The graph is exact on the test source.** `ts-program` matches the hand-written expected graph, and every edge agrees with TypeScript's "go to definition": 117 of 117 at first, and 156 of 156 once subfolders were added, with imports through `../` and `../../` (`FND-104`). Where the tool and the hand-written graph first differed, TypeScript was right and corrected the expectation (`FND-98`).
- **One tool was enough** (`TPG-06`, closed): nothing needed further processing after `ts-program`. The only gap was frames, which are now drawn for any entered container.
- **The contracts held.** The tool helper needed no change for a tool writing many outputs from one run. Outputs are byte-identical when the file order is reversed, and the compiler read only the listed files and its own library.
- **It is fast enough on real code.** On ZaAnSouVi's own `app/` (17 files, about 6,000 lines), a full run takes 4.4 s, an unchanged run 1.2 s, and a run through the Viewer to its graph 8 s (`FND-99`).
- **The Viewer works at any depth**, with shapes for the new kinds, built-ins listed apart and a frame for any entered container. It was refined in use: frame titles and notes, the range's text in Details, member lists in rows (`FND-100` to `FND-110`).

**What didn't work, or reached a limit:**
- **Large views can't be read.** One file's view on real code had 110 nodes and 349 edges: fast, but unreadable. This is the main design problem MVP 2 found (`FND-99`; `VW-39`, layout strategy, deferred).
- **Packages without type declarations leave much of the graph unresolved.** Only 69% of uses were resolved on `app/`; most of the rest go through Node and package modules, whose type declarations are not in the program (`TPG-20`, reopened as `TPG-D8`).
- **The folder structure isn't visible.** In the top view, files are drawn loose and their folders sit apart (`FND-104`).
- **Merged declarations show only one range**, for example one column for an overloaded function (`FND-106`).
- **Running without `ts-config` is a known risk**: a source whose `tsconfig.json` changes how modules resolve may give a wrong graph (`FND-95`, `TPG-D4a`).
- **A Viewer left running hid a server change.** Every headless check passed while the user's open Viewer showed wrong text (`FND-107`). The page now checks the server's answer.

**Where it stands.** Phases 0, 2, 4, 5, 7 and 8 are done; `ts-config` (phase 3) is deferred and M3 (phase 6) isn't needed (`97`, section 5). The human review (P3) is in progress. Nineteen questions, `M2Q-1` to `M2Q-19`, are waiting for answers (`97`, section 6).

## The MVP's claims so far

| Claim (`MVP_scope.md`, 1.1) | MVP 1 | MVP 2 |
|---|---|---|
| P1. The Runner and the Viewer work together | yes, except `B7` and `C1` untried | yes (`B7` done) |
| P2. The Runner works from one command | yes | yes |
| P3. The Viewer works, as judged by a person | not reviewed | review in progress |
| P4. Independent tools are valuable | early evidence (`FND-57`, `TEST-08`) | the contracts held for a very different tool; the formal test comes after the MVP (`MVP_scope.md`, 10.1) |
| P5. A correct graph of real TypeScript (MVP 2 only) | no, the reason for MVP 2 | on the test source, yes; on real code, 69% resolved and large views unreadable |

## What can be done next

The near options, each linked to what it needs (everything open is in `20_mvp2.md`, section 10):
1. **Finish MVP 2.** Do the human review (P3), then write the findings note (`DEL-07`), which answers `MVP-5` and `MVP-8`.
2. **Answer the open questions** in `97`, section 6, starting with `M2Q-1` to `M2Q-7`: files inside their folders, a range per declaration, a variable's range, `ro`/`rw` markers and default values, link shapes, crowded views, and type parameters.
3. **Decide `TPG-D8`**: let `ts-program` read the packages' type declarations, so real Node code resolves.
4. **Take on readability of large graphs** (`VW-39`, deferred). This is where MVP 2 points the product's hardest open problem.
5. **Test P4 formally** (`MVP_scope.md`, 10.1), and the other post-MVP checks in 10.3.

## How to read this folder

| Document | What it holds |
|---|---|
| `00_where_we_are.md` | this story, both stages at a glance |
| `00_definitions_mvp1.md` | every MVP 1 ID in order, with its text as settled at the end of MVP 1, no history |
| `00_definitions_mvp2.md` | every ID in force in MVP 2, in order, with its current text; generated from the docs by `tools/make_definitions.py`, rerun after any change |
| `10_mvp1.md` | MVP 1 in full: what it attempted, built and checked; what worked and didn't; each of its decisions marked current or superseded; what it left open and what became of it |
| `20_mvp2.md` | MVP 2 in full: the same, plus its current decisions by topic, what was superseded within it, and everything open |

The detail stays in the files around this folder, which describe MVP 2 as it stands, with no history: `97_second_implementation.md` (current state, decisions, open questions), `96_mvp2_change_log.md` (the dated log), `99_findings.md` (MVP 2's findings), and the requirements `01` to `07`, `40` to `42`, `50` and `55`. MVP 1 and every doc as it stood before 2026-11-10, struck wording included, are frozen in `mvp1/`. The product design behind the MVP is summarized separately in `../../summary/`.

