# 99. Findings

A review of whether this folder is enough to build the MVP, checked against the working files in the parent folder. Written on 2026-11-06, before any MVP code exists. Each finding has an ID (`FND-nn`) so it can be referred to when it is fixed. When one is fixed, strike it through and say where the fix is recorded.

**Verdict:** not yet. About 85% is there. Build-order steps 1 to 4 (`README.md`) can start as written: test source, contracts, M1, the Runner with M1 only. Past that point, the developer would have to make up answers to several contract questions, and some of those answers would settle the P4 evidence (`VIEW-14`) by accident.

## 1. Gaps to close before coding

- **FND-01 No rule links a data name to a part of an output file.** M1's file holds `symbols`, `references` and `diagnostics`, but its `--info` describes `code.symbol` and `code.reference`. M3's `scopes.json` holds `scopes` and `membership`. `project_outputs` assumes one data name per file. Without a rule (for example, each `--info` output names its JSON key), the Runner and the Viewer can only find records with tool-specific code, which `VIEW-14` forbids. Related: the parameter shape `"array of M1 outputs"` names a tool, against "a tool knows data only by name" (`toolset.md`, section 4.2), and isn't a shape the Runner can check or build from generically.
- **FND-02 Relations don't share one shape.** Links have `from` and `to`; references have only `symbol`, with no source. Membership uses `symbol` and `scope`. `VIEW-12` makes the Viewer work out "the scope a reference sits in" by comparing ranges, which is tool knowledge in the Viewer. Level 3 then has almost no real edges: there is no "run calls add". Suggested fix: M1 adds an `enclosing` field (the enclosing function's symbol ID, or the file ID) to every reference; every relation uses `from` and `to`; every node uses `id` and `parent`; every containment record uses `child` and `parent`. Also missing: what happens to references with `symbol: null` (drop or show), and to references of kind `declaration` (no edge, presumably).
- **FND-03 M2 conflicts with a [Decided] row.** `MVP_scope.md`, section 2, says a cross-file link carries the call's location ("A function declared in `a.ts` and called in `b.ts` is linked, with the call's location"). `04_tools.md` only links import to declaration, at the import's location. M2 already receives every reference, so it can also emit a link from each use of an imported name (kind `call` or `read`) to the declaration. This changes the expected Links table and the file-edge counts (FND-27).
- **FND-04 The dry-run-only pass can't feed M2 and M3.** It writes nothing, so on a fresh data folder M1's outputs don't exist. `DATA-17` doesn't require the dry run to print the would-be output in a form the Runner can parse, and `RN-11` is open. Inferred answer: in the MVP, each tool's dry run works from the saved stores. On a fresh data folder M2's dry run is then no-go for a missing input, which `toolset.md`, section 4.3 [Decided], lists as a status-check warning ("a missing output from an earlier tool"). TEST-02 must run after a real run (FND-24).
- **FND-05 TEST-02 contradicts the Runner's start-up steps.** `RUN-04` and `RUN-05` create the database and rewrite `config_tools` on every start, and `RUN-06` writes `project_files`. TEST-02 requires the database to be unchanged after a dry-run-only pass, and SQLite changes the file even when rewriting the same rows. Needed: a dry-run-only pass doesn't create the database, doesn't rewrite the record of tools, and doesn't write `project_files`; or TEST-02 compares rows, not file hashes.
- **FND-06 Stale outputs.** After C1 (M3 moved out), the old `scopes.json` stays on disk, and `--read-cache` returns "every output", so the Viewer still shows three levels. Deleted source files leave ghost M1 outputs the same way. `ARCH-05` ("every run starts from scratch") never says what is cleared. Inferred answer to `RN-7` for the MVP: an omitted tool's data counts as missing, so `--read-cache` returns only outputs of tools in the current record, and of files in the current file list.
- **FND-07 Tools don't know where to write.** `data/tools/<tool>/` is neither a parameter nor a stated convention relative to the launcher. This also blocks the by-hand tests B1 to B6, and replays from `last_run.json`.
- **FND-08 No way to start the Viewer.** No command, port or source-root input is defined, so `/api/run` and `/api/source` have no source root on a fresh start (`project_source` is empty). `runner.md`, section 10, and `viewer.md`, section 3.4, propose that the one-command run ends by starting the Viewer, and that the server can start on its own; neither is taken up here.

## 2. Smaller gaps

- **FND-09 `range` is ambiguous.** "Of the whole declaration; for a function, its full body." The parser shows the bodies start at 3:46, 5:45 and 4:22, after the parameters. If `range` meant only the body, `value` (3:23) would land in the file scope, against the expected table. It must mean the whole declaration, from `export` or `function` to the closing brace. That range also contains the function's own name, so the self-exclusion rule in `TOOL-31` is required.
- **FND-10 Call versus read.** `TOOL-14` should say only a bare-name callee is a `call`. In `Math.round(...)` and `console.log(...)` the callee is a property access, so `Math` and `console` are reads, as the expected table already has them.
- **FND-11 The file scope has no location.** M3 reads no files, so it can't know where a file ends (7:1, 9:1 and 13:1 for the test files). Either the file scope has no location, or the Runner passes file lengths.
- **FND-12 Scope IDs start where?** `DATA-03` says "at the start of the function". The parser gives the declaration start (3:1, including `export`), not the `function` keyword (3:8). Pick one; the inferred IDs below use the declaration start.
- **FND-13 Dry-run no-go on an invocation error.** Does the tool print a no-go JSON line, or only write to standard error and exit 2 (`toolset.md`, section 4.5: invocation errors go to the caller on standard error)? The Runner must handle a missing last line with exit 2.
- **FND-14 Tool options incomplete.** `TOOL-02` mentions command-line parameter arguments but defines none. `--help`, `--version` and the common options (source root, output root and so on), [Decided] in `toolset.md`, section 4.1, are missing without being marked as an MVP cut. If there are no per-parameter arguments, `TS-30` can't arise in the MVP; say so.
- **FND-15 Syntax errors (`TOOL-10`).** Checked: `parseDiagnostics` is not in TypeScript 5.6.3's public `typescript.d.ts`. `ts.createSourceFile` alone doesn't expose syntax errors through the public API; use `program.getSyntacticDiagnostics(sourceFile)`. B7 depends on this.
- **FND-16 Viewer server security.** Missing from `05_viewer.md`, all [Proposed] in `security.md`: the startup token and origin check (section 7); `/api/source` limited to files in `project_files` (section 7: reads only inside the examined project); Cytoscape bundled locally rather than loaded from the internet (section 8).
- **FND-17 Ctrl + wheel** is [Decided] in `viewer.md`, section 4.9, but cut in `VIEW-20`. Mark it explicitly as an MVP scope cut (`MVP_scope.md`, section 5, proposes following section 4.9).
- **FND-18 M3 departs from `MVP_scope.md`.** It takes only M1's outputs, where section 2 proposes M1 and M2. It also drops "together with the symbols it is used with" from the [Decided] M3 example. Related to `MVP-4`.
- **FND-19 Live progress.** The mechanism for streaming run events from `/api/run` to the page is not named.

## 3. Findings outside this folder

- **FND-20** `security.md`, section 7, says "a damaged `last_run.json` makes the tool fall back to defaults and say so in its log". That contradicts the [Decided] E3 rule in `toolset.md`, sections 4.5 and 4.6: no fallback, invocation error, nothing logged.
- **FND-21** `MVP-1`, `MVP-3` and `MVP-4` are still open in `MVP_scope.md`, although this folder effectively answers them (section 6 below).

## 4. What holds up

- The test source and its expected result are correct. Every line and column was checked with the TypeScript parser, including the example `src/math.ts#round@3:17`, and the property names `round` (math.ts 5:15) and `log` (main.ts 8:13) are correctly left out.
- The error model matches `toolset.md`, sections 4.4 to 4.6: shape problems are invocation errors (E13, exit 2, nothing written), value problems are run errors (E12), and `last_run.json` follows the [Decided] rules.
- The order derived from `--info`, the log format, the layout on disk, the time box and the technology choices are sound.
- The test app in `test_plan/test-source/` type-checks in strict mode and prints `precision 2 1.23` (Node 22.23.1, TypeScript 5.6.3). Its three files match `06_test_plan.md` character for character.

## 5. Values inferred from the test source

Taken from the TypeScript parser on `test_plan/test-source/`. Usable for `expected/` once FND-09 and FND-12 are confirmed.

**Symbol IDs** (`DATA-02`; each is `<file>#<name>@<line>:<column>`):

| File | Symbols |
|---|---|
| `src/math.ts` | `PRECISION@1:14`, `round@3:17`, `value@3:23`, `factor@4:9` |
| `src/counter.ts` | `round@1:10` (import), `total@3:5`, `add@5:17`, `amount@5:21` |
| `src/main.ts` | `add@1:10` (import), `PRECISION@2:10` (import), `run@4:10`, `first@5:9`, `label@7:11` |

**Function ranges:** `round` 3:1–6:2, `add` 5:1–8:2, `run` 4:1–10:2.

**Scope IDs** (`DATA-03`): `src/math.ts#scope@3:1`, `src/counter.ts#scope@5:1`, `src/main.ts#scope@4:1`, and `#scope@file` for each file.

**Reference positions** (all identifiers the parser sees, declarations included):
- `src/math.ts`: `PRECISION@1:14`, `round@3:17`, `value@3:23`, `factor@4:9`, `PRECISION@4:24`, `Math@5:10`, `value@5:21`, `factor@5:29`, `factor@5:39`; and `round@5:15`, a property name, to leave out
- `src/counter.ts`: `round@1:10`, `total@3:5`, `add@5:17`, `amount@5:21`, `total@6:3`, `total@6:11`, `amount@6:19`, `round@7:10`, `total@7:16`
- `src/main.ts`: `add@1:10`, `PRECISION@2:10`, `run@4:10`, `first@5:9`, `add@5:17`, `first@6:7`, `label@7:11`, `PRECISION@7:34`, `console@8:5`, `label@8:17`, `first@8:24`, `run@12:1`; and `log@8:13`, a property name, to leave out

**Declaration references.** `TEST-01` compares all references, but the reference table in `06_test_plan.md` leaves declarations out. There are 13, one at each symbol ID.

**File hashes** for `project_files` (SHA-256, LF line endings; a CRLF checkout changes them):

| File | SHA-256 |
|---|---|
| `src/counter.ts` | `9e4bb3799e5b0aa0d5acee58945d5f1ae64f88bdd85cccdc936a735fc5d2ed93` |
| `src/main.ts` | `3772c01070989943ac3658813da8f84734e5508e6add37a1558c2ffd87c212f8` |
| `src/math.ts` | `655e180f13e3261229972b563332fcccef73d0fd24fecc0012db3d465c5b8e28` |

**Order of invocations.** By `ARCH-04` with ties broken by name: file-symbols, cross-file-links, symbol-scope. The order of M1's files is not stated; sorted by file ID it is counter, main, math. A full run is then 5 dry runs and 5 real runs: 10 tool events between `run_started` and `run_finished`.

**C2 after the rename:** `src/math.ts#roundTo@3:17` and `src/counter.ts#roundTo@1:10`. The columns don't change, since the name is the last word before the parentheses or brace.

## 6. Open questions that bear on testing

| Question | What can be inferred for the MVP | Still missing |
|---|---|---|
| `MVP-1` Test source | Settled in practice: the source exists and runs. The developer writes it (`DEL-04`) | Who signs off the expected result |
| `MVP-3` Deduplication | Encoded by the test: one symbol per declaration, every occurrence a reference, joined across files only by M2 | Nothing |
| `MVP-4` Scope | Encoded by the test: lexical scope, one level | No expected result for "the symbols it is used with" (FND-18) |
| `MVP-8` Criteria, time target | No run-time target; timings are recorded only (`07_delivery.md`, findings note item 5) | The criteria-to-tests table (FND-28), and a way to measure (FND-30) |
| `RN-11` Dry-run chaining | Dry runs work from the saved stores; fresh state gives M2 no-go (FND-04) | A test for the fresh-state dry run |
| `RN-3`, `RN-16` No staging | Accepted for the MVP: earlier outputs stay when a later step fails | B7's expected end state, which depends on the file order (FND-25) |
| `RN-7` Data from omitted tools | Counts as missing (FND-06) | The `--read-cache` rule |
| `RN-10` Cancel | The MVP has no cancel button: out of scope | Say so in the test plan |
| `TS-30` Arguments without JSON | Can't arise without per-parameter arguments (FND-14) | A test: an unknown option gives E1 |
| `TS-25` Shared `last_run.json` | Harmless: the Runner always sends JSON, so B1 to B6 don't affect later runs | Nothing |
| `TS-31` Scale | Record one M1 invocation, a full run and a dry run | The method (FND-30) |
| `TS-12` Paths across platforms | Tested on Linux only, with `/` in file IDs | Note Windows as untested |
| `VW-4` Unresolved edges | Least effort: hide them and show a count | A human-review question for B9 |
| `VW-2`, `SEC-3` Malformed output, limits | Out of the MVP | Say so in the test plan |

## 7. What the test plan is missing

- **FND-22 `expected/` in a form a script can compare**, with full IDs, scope ranges, the membership table and the declaration references. Section 5 has the values.
- **FND-23 Inputs for the broken-input tests.** No JSON for B1 to B6, no fixture for B8, no exact edit for B7 or B9, and no rule that tests work on a copy of `test-source` (B7, B9 and C2 change it).
- **FND-24 TEST-02 order.** It must run after TEST-01 (FND-04), and a separate test covers a dry-run-only pass on a fresh data folder: M1 go three times, M2 no-go for a missing input, the Runner stops.
- **FND-25 Expected end states for B7, B9, C1 and C2:** the data folder, the database rows and the Runner events. For B7, the file order matters: a file named `src/broken.ts` sorts first, so M1 fails before writing anything; a name sorting last leaves three M1 outputs behind.
- **FND-26 Untested error paths** from `03_runner.md` and `04_tools.md`: unknown database version; a tool's `--info` failing; a tool crashing without writing a result; M3 E12 (`TOOL-32`); M2 E12 for two M1 outputs of the same file; an unknown option (E1, see `TS-30`).
- **FND-27 File-edge counts.** "Sensible counts" should be exact. As specified, each of the three file edges counts 1. If M2 gains use-site links (FND-03), counter → math becomes 2 (import and call), and the others change too.
- **FND-28 Criteria-to-tests table:**

| Success criterion (`MVP_scope.md`, section 7) | Test |
|---|---|
| 1. One command runs everything | TEST-01 |
| 2. Output matches the expected result | TEST-01 |
| 3. The Viewer works | Human review |
| 4. A broken input gives no-go, shown in the Viewer | B7 (the criterion says "a missing file", but B6 is by hand only) |
| 5. A dry-run-only pass says go and writes nothing | TEST-02, after a real run |
| 6. A run without M3 shows one level fewer | C1 |

- **FND-29 Repeatability (`DATA-04`).** Run twice on the unchanged source and diff the outputs, ignoring times.
- **FND-30 Timings.** How many repeats, warm or cold start, and which numbers: one M1 invocation, a full run, a dry run, the Viewer's load time.
- **FND-31 Checks on the Runner and the Viewer:** the content of `--read-cache` (`RUN-13`); `/api/source` returning the right lines and refusing paths outside the source; `/api/log` refusing paths outside the data folder; a second run request refused (`VIEW-05`); text rendering (`VIEW-40`), checkable for free on main.ts line 6, `if (first > 0)`.
- **FND-32 The human review:** who reviews, what counts as a pass for P3 (is "partly" enough?), where the answers are kept, and a question for how B9's unresolved import appears.
- **FND-33 How to run the tests:** the Node version (22.23.1 used so far), a clean state before tests (delete `data/`), and how B1 to B6 find the tool's store (FND-07).
- **FND-34 Out of scope, not stated:** cancel (`RN-10`), malformed output in the Viewer (`VW-2`), limits (`SEC-3`), Windows paths (`TS-12`). The test plan should say these aren't tested.

## 8. Decisions needed from the user

These block parts of the expected result and can't be inferred:
1. M2 use-site links (FND-03), which changes the Links table and the edge counts.
2. The `--read-cache` rule for omitted tools and deleted files (FND-06, `RN-7`).
3. The order of M1's files (FND-25).
4. The pass rule for the human review (FND-32).
