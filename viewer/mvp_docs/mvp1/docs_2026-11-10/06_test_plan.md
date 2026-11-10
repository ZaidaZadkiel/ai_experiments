# 06. Test plan

Answers `MVP-14` for the MVP. The expected result is written by hand **before** the tools exist.

## The basic examined source

Three files under `test-source/src/`. Line numbers matter: the expected result refers to them.

`src/math.ts`
```ts
export const PRECISION = 2;

export function round(value: number): number {
  const factor = 10 ** PRECISION;
  return Math.round(value * factor) / factor;
}
```

`src/counter.ts`
```ts
import { round } from "./math";

let total = 0;

export function add(amount: number): number {
  total = total + amount;
  return round(total);
}
```

`src/main.ts`
```ts
import { add } from "./counter";
import { PRECISION } from "./math";

function run(): void {
  const first = add(1.234);
  if (first > 0) {
    const label = "precision " + PRECISION;
    console.log(label, first);
  }
}

run();
```

What it covers: calls across files (`add`, `round`), a variable read across files (`PRECISION`), a module variable that is written and read (`total`), parameters, local variables, a nested block, unresolved globals (`Math`, `console`), and a property name that matches a symbol (`Math.round` versus `round`).

## Expected result

Kept in `expected/` as a readable table; the comparison with the tools' output is done by a small script that checks names, kinds, lines and links (`TEST-01`).

### Symbols (M1)

| File | Name | Kind | Line | Exported | Scope (M3) |
|---|---|---|---|---|---|
| math.ts | PRECISION | variable | 1 | yes | file |
| math.ts | round | function | 3 | yes | file |
| math.ts | value | parameter | 3 | no | round |
| math.ts | factor | variable | 4 | no | round |
| counter.ts | round | import | 1 | no | file |
| counter.ts | total | variable | 3 | no | file |
| counter.ts | add | function | 5 | yes | file |
| counter.ts | amount | parameter | 5 | no | add |
| main.ts | add | import | 1 | no | file |
| main.ts | PRECISION | import | 2 | no | file |
| main.ts | run | function | 4 | no | file |
| main.ts | first | variable | 5 | no | run |
| main.ts | label | variable | 7 | no | run |

### References other than declarations (M1)

| File | Line | Name | Kind | Refers to |
|---|---|---|---|---|
| math.ts | 4 | PRECISION | read | math.ts PRECISION |
| math.ts | 5 | Math | read | none |
| math.ts | 5 | value | read | math.ts value |
| math.ts | 5 | factor | read | math.ts factor (twice) |
| counter.ts | 6 | total | write | counter.ts total |
| counter.ts | 6 | total | read | counter.ts total |
| counter.ts | 6 | amount | read | counter.ts amount |
| counter.ts | 7 | round | call | counter.ts round (the import) |
| counter.ts | 7 | total | read | counter.ts total |
| main.ts | 5 | add | call | main.ts add (the import) |
| main.ts | 6 | first | read | main.ts first |
| main.ts | 7 | PRECISION | read | main.ts PRECISION (the import) |
| main.ts | 8 | console | read | none |
| main.ts | 8 | label | read | main.ts label |
| main.ts | 8 | first | read | main.ts first |
| main.ts | 12 | run | call | main.ts run |

`round` in `Math.round` (math.ts, line 5) and `log` in `console.log` (main.ts, line 8) must **not** appear.

### Links (M2)

| From | To | Kind | At |
|---|---|---|---|
| counter.ts `round` (import symbol) | math.ts `round` (line 3) | import | counter.ts 1:10 |
| counter.ts `add` (function) | math.ts `round` (line 3) | call | counter.ts 7:10 |
| main.ts `add` (import symbol) | counter.ts `add` (line 5) | import | main.ts 1:10 |
| main.ts `PRECISION` (import symbol) | math.ts `PRECISION` (line 1) | import | main.ts 2:10 |
| main.ts `run` (function) | counter.ts `add` (line 5) | call | main.ts 5:17 |
| main.ts `run` (function) | math.ts `PRECISION` (line 1) | read | main.ts 7:34 |

Six links, in this order: three imports and three uses (`TOOL-20`, `TOOL-23`, option A, accepted by the user for the MVP on 2026-11-08). No unresolved imports.

### Scopes (M3)

| File | Scopes |
|---|---|
| math.ts | file; `round` (lines 3–6) |
| counter.ts | file; `add` (lines 5–8) |
| main.ts | file; `run` (lines 4–10); the `if` block belongs to `run` |

Each function scope's `owner` is its function symbol (`src/main.ts#run@4:10` for `run`), and each file scope's is its file (`TOOL-33`).

In the Viewer, at level 2 inside main.ts, the scope `run` is shown with the symbols it is used with (`VIEW-13`): edges to `add` and `PRECISION` (the imports, in the file scope), to `counter.ts` and `math.ts` through the use links, and one unresolved name, `console`. The file scope's own code, the call `run()` on line 12, gives an edge from the file scope to `run`.

### File edges (Viewer)

counter.ts → math.ts (2); main.ts → counter.ts (2); main.ts → math.ts (2). Each counts an import and a use (2026-11-08, `FND-27`).

## Automatic checks

All tests run on Node 22.23.1, and each test that needs a clean state starts by deleting `data/` (accepted by the user for the MVP on 2026-11-07).

- **TEST-01** Starting from an empty data folder (delete `data/`), so every tool runs, a script runs `zaansouvi-run test-source`, then compares the outputs with `expected/`: symbols by file, name, kind and line; references by file, line, name, kind and target; links; scopes and membership. It prints every difference.
- **TEST-02** Run after TEST-01, so the stores hold a real run's outputs (`RUN-16`). `zaansouvi-run test-source --dry-run-only` reports `go` for every step, each marked `up-to-date` and with no `staleInputs`, and leaves every tool's store (`data/tools/`) and each tool's `last_run.json` unchanged (compare file hashes before and after). In the database, `project_outputs` and the real-run rows of `project_tool_runs` are unchanged (compare rows). The Runner's log, `project_runs` and its other rows may change (`RUN-23`).
- **TEST-03** On a fresh data folder (delete `data/tools/`), `zaansouvi-run test-source --dry-run-only` reports `go` for M1 on each of the three files, then `no-go` for cross-file-links with `E12` naming `code.symbol` (`TOOL-09`). The Runner stops: symbol-scope is never invoked, and no tool writes anything (`data/tools/` holds no output, result or log).
- **TEST-04** Refresh check (`RUN-17` to `RUN-22`), each step after TEST-01, on a copy of `test-source`:
  - **Nothing changed:** a second run prints `tool_skipped` for all five invocations, starts no tool, and leaves every output file untouched (same hash and modification time).
  - **One file edited:** add an empty first line to `main.ts`, which moves every location in it. M1 runs for `main.ts` only (`counter.ts` and `math.ts` skipped); cross-file-links and symbol-scope run with reason `inputs-changed`.
  - **Damaged output:** replace `links.json` with `{}`. cross-file-links runs with reason `missing`; M1 and symbol-scope are skipped, since their inputs didn't change.
  - **Dry run after an edit:** remove that empty line again, then run `--dry-run-only`. Every invocation is dry-run and says go. M1 for `main.ts` has reason `inputs-changed`, M1 for the other two files is `up-to-date`; cross-file-links and symbol-scope are dry-run with reason `upstream-refresh` and `staleInputs: ["src/main.ts"]`; no tool output is written.

### M3 checks (~~proposed on 2026-11-08, not yet accepted~~ accepted by the user for the MVP on 2026-11-08, built in `tests/m3/`)

Run by hand, like M1's and M2's (`tests/m1/`, `tests/m2/`), with a temporary `store_path`, so `data/` is not touched; M3's `last_run.json` is backed up and restored. They need M1's outputs on the test source.

- **TEST-06** `tests/m3/check.mjs`: builds M3's input from M1's outputs as the Runner does (`symbols` only, file ID order, `RUN-19`), runs the dry run then the real run, and compares `output/scopes.json` with `expected/symbol-scope.json` exactly, except `about`: header, `counts` (6 scopes, 13 memberships), scope IDs, `owner`, locations (the file scopes ending at 8:2, 10:2 and 6:2, `TOOL-34`), order (`TOOL-35`) and memberships. It also checks that the dry run says go and writes nothing, that `result.json` says succeeded with no diagnostics, and that a second run with the same input gives the same bytes (`DATA-22`).
- **TEST-07** **Nested functions and a file with file-level symbols only.** Two extra source files in `tests/m3/source/`, run through M1 first, so M3 gets real records, then through M3 together (file ID order). Values from M1 0.5.0's real output:

  `src/nested.ts`:
  ```ts
  export function outer(a: number): number {
    function inner(b: number): number {
      return b * 2;
    }
    return inner(a);
  }

  export function second(): number {
    return outer(1);
  }
  ```
  `src/only-vars.ts`:
  ```ts
  export const LIMIT = 10;
  let count = 0;

  // trailing comment
  ```
  Expected: 4 scopes and 7 memberships.

  | Scope | Location | Members |
  |---|---|---|
  | `src/nested.ts#scope@file` | 1:1 to 10:2 | `outer@1:17`, `second@8:17` |
  | `src/nested.ts#scope@1:1` (owner `outer`) | 1:1 to 6:2 | `a@1:23`, `inner@2:12`, `b@2:18` |
  | `src/nested.ts#scope@8:1` (owner `second`) | 8:1 to 10:2 | none |
  | `src/only-vars.ts#scope@file` | 1:1 to 2:14 | `LIMIT@1:14`, `count@2:5` |

  It checks that `inner` gets no scope and that its parameter `b` belongs to `outer`'s scope (`TOOL-30`, one level only); that a function's own name belongs to the scope outside it (`TOOL-31`); that a function scope with no members is still output; and that the file scope of `only-vars.ts` ends at its last declaration (2:14), short of the trailing comment on line 4 (`TOOL-34`, accepted shortfall). A file with no symbols can't be tested through M3: its symbols never reach M3, so it simply has no scopes (`TOOL-34`).

### Viewer checks (built on 2026-11-08, `FND-69`; `55_viewer_backend.md`, section 12)

- **TEST-09** `tests/viewer/check-model.mjs`: the graph model built from `expected/runner-cache.json` matches `expected/graph-views.json` view by view (nodes, stubs, the "this" node, edges with their counts and kinds, unresolved counts); two builds give the same bytes; six damaged caches give the expected invalid or extra items (`BE-91`, `BE-92`).
- **TEST-10** `tests/viewer/check-server.mjs`: the backend on a temporary copy of the MVP: the token, `Host` and `Origin` checks, the 64 KiB limit, sources, the graph and its storing, reads limited to listed files and to `data/` (a symbolic link out included), the activity log (deleted while running, unknown events, Clear), a run and a refused second run, and bad data across restarts (partly invalid, failed, an entry in another format, a damaged `sources.json`, cleared Runner data). 32 checks (`BE-92` to `BE-94`).
- **The page** stays a human review (P3, `BE-95`), against the preview (`FND-67`).

### Replacing the Runner (accepted by the user for the MVP on 2026-11-08, `FND-58`)

- **TEST-08** `tests/hand-run/hand-run.sh`: runs the Runner on `test-source/`, then runs M1, M2 and M3 by hand in a temporary folder, using only the tool contract (JSON on standard input through `jq`, exit codes, output files), with the files in reverse file ID order on purpose and whole M1 output files passed to M3, extra keys and all. Every tool output must be byte-identical to the Runner's (`toolset.md`, section 2: the Runner can be replaced by a user's own scripts; unknown keys are ignored; a tool's output never depends on the order of its input records). `tests/m3/check.mjs` also checks the last rule for M3 alone, with its input reversed.

## Broken inputs

Each one is run and must give the stated result. "By hand" means invoking the tool directly.

| # | Input | How | Expected |
|---|---|---|---|
| B1 | M1 with both `--json` and `--stdin` | by hand | invocation error `E1`, exit 2, nothing written, `last_run.json` unchanged |
| B2 | M1 with `--json` pointing to a missing file | by hand | `E2`, exit 2, nothing written |
| B3 | M1 with JSON missing `file_id` | by hand | `E13`, exit 2, nothing written |
| B4 | M1 with no parameters, after deleting `last_run.json` | by hand | `E3`, exit 2, nothing written |
| B5 | M1 with no parameters, `last_run.json` present | by hand | repeats the last run exactly, same output |
| B6 | M1 on a file path that doesn't exist | by hand, valid JSON | run error `E6`, exit 1, `result.json` failed, `last_run.json` updated, earlier output kept |
| B7 | `src/broken.ts` added, holding `export function (` (a syntax error on line 1) | Runner | M1's dry run is no-go (`E12`) for that file, the Runner stops, the Viewer shows it in red |
| B8 | M2 with two symbol records with the same `id` | by hand | run error `E12`, exit 1, logged (`TOOL-22`; `tests/m2/broken.sh`) |
| B9 | `import { thing } from "./missing";` appended to `src/main.ts` as line 13 | Runner | not an error: M2 outputs a link with `to: null`, the run succeeds |
| B10 | source root that doesn't exist | Runner | Runner exit 2, nothing written |
| B11 | M3 with `symbols: []` | by hand | dry run no-go and real run fail with `E12` naming `code.symbol`, exit 1 (`TOOL-09`, `TOOL-36`; `tests/m3/broken.sh`) |
| B12 | M3 with two symbol records with the same `id` | by hand | run error `E12`, exit 1, logged, earlier output kept (`TOOL-36`) |
| B13 | M3 with a function symbol without `range` | by hand | run error `E12`, exit 1, logged, naming the symbol (`TOOL-32`) |
| B14 | M3 with `symbols` missing, or not an array | by hand | invocation error `E13`, exit 2, nothing written, `last_run.json` unchanged (`TOOL-36`) |
| B15 | M3 with a symbol record that isn't an object, or lacks `id`, `kind`, `parent` or `location`, or has a `range` that isn't a Location | by hand | `E13`, exit 2, nothing written (`TOOL-36`) |

## Extra checks

- **C1. Without M3.** Move M3 out of `app/tools/`, restart, run. The Viewer shows files › symbols, two levels, with no change to M1, M2, the Runner or the Viewer (`MVP_scope.md`, section 5.1).
- **C2. Rename.** Rename `round` to `roundTo` in math.ts and counter.ts, run again. All three tools use the new IDs, the link is still there, and nothing refers to the old ID.

### Expected end states (`FND-25`)

Each starts from the state TEST-01 leaves, on a copy of `test-source`. Files run in file ID order (`RUN-28`). "Cache" is what `--read-cache` prints (`RUN-27`). (accepted by the user for the MVP on 2026-11-07)

- **B7.** `src/broken.ts` sorts first, so M1's first invocation is `src/broken.ts`, reason `never-run`, and its dry run is no-go (`E12`, line 1). Events: `run_started`, `files_listed` (4), `tool_dry_run` (`src/broken.ts`, `no-go`), `run_finished` (`failed`, exit code 1). Exit code 1. No tool output changes; the other files are never reached. The cache is replaced, marked failed, with the four-file list and that one invocation's no-go, and no tool data. `project_tool_runs` holds the no-go for `src/broken.ts`. The Viewer keeps showing its last good graph and shows the error in red.
- **B9.** M1 runs for `src/main.ts` only (`inputs-changed`); `src/counter.ts` and `src/math.ts` are skipped. cross-file-links and symbol-scope run (`inputs-changed`). Exit code 0. `links.json` holds a seventh link, from `src/main.ts#thing@13:10`, with `to: null` and reason `no such file`; `thing` is never used, so it has no use-site link. The cache holds it under `code.link`; the six resolved links are unchanged. The Viewer doesn't draw it, and shows one unresolved import.
- **C1.** After moving `app/tools/symbol-scope/` out: the record of tools has two tools. All four invocations are skipped as up to date: `tool_skipped` four times, no symbol-scope event. Exit code 0. The cache holds `code.symbol`, `code.reference` and `code.link`, and no `code.scope` or `code.membership`, so the Viewer shows two levels.
- **C2.** After renaming `round` to `roundTo` in `src/math.ts` and `src/counter.ts`: M1 runs for those two files (`inputs-changed`), `src/main.ts` is skipped; cross-file-links and symbol-scope run. Exit code 0. The new IDs are `src/math.ts#roundTo@3:17` and `src/counter.ts#roundTo@1:10`; the links are `src/counter.ts#roundTo@1:10->src/math.ts#roundTo@3:17` and `src/counter.ts#ref@7:10->src/math.ts#roundTo@3:17`; nothing in the cache contains `#round@`.

## Runner checks

(accepted by the user for the MVP on 2026-11-07)

- **TEST-05** After TEST-01, `zaansouvi-run --read-cache`: one `cache` event; `run.outcome` is `succeeded`; `files` lists the three file IDs in order; `tools` lists the three tools in order; `invocations` has five entries; the records under `data` match what TEST-01 compared with `expected/`. The whole cache matches `expected/runner-cache.json`, the events of TEST-01 match `expected/run-events.jsonl`, and TEST-04's "nothing changed" run matches `expected/run-events-second.jsonl`, under the rules in `expected/README.md` (proposed, 2026-11-07). On a fresh data folder, the event's `cache` is `null`, exit code 0.
- **Stand-in tools.** Small programs under `tests/fixtures/tools/`, one per behavior, each answering `--info` like a real tool: `stub-go` (says go, writes a valid output), `stub-no-go`, `stub-crash` (exits without writing `result.json`) and `stub-garbage` (prints invalid JSON on its dry run). The Runner tests run on a temporary copy of `zaansouvi-mvp/` whose `app/tools/` holds the stand-ins they need, so they don't depend on M2 and M3.

| # | Situation | Expected |
|---|---|---|
| R1 | database with an unknown `config_version` | stops before anything, exit 2, diagnostic |
| R2 | a tool whose `--info` fails or isn't JSON | stops before the run, names the tool, exit 2 |
| R3 | `stub-crash` | treated as a failed real run; exit code and standard error in the Runner log; exit 1 |
| R4 | `stub-garbage` | treated as no-go with the tool's error; exit 1 |
| R5 | a second run while one holds `data/runner/run.lock` | diagnostic naming the running run, exit 2, nothing written |
| R6 | a stale lock (its process gone) | the run takes it over, notes it in the log, runs normally |
| R7 | no source root on the command line and none saved | diagnostic saying the source root is missing and how to give it, exit 2 |
| R8 | an empty folder in `app/tools/` | skipped with a log line; the run is unaffected |

## MVP 2's checks

From 2026-11-09 (`FND-98`, `FND-99`), from `zaansouvi-mvp/`; all passing then:

| Check | What |
|---|---|
| `node tests/ts-program/check.mjs` | `ts-program` against the hand-written `expected-mvp2/`: nodes, edges, links, built-ins, unresolved, exact |
| `node tests/ts-program/check-definitions.mjs` | every edge's target against TypeScript's "go to definition" (~~117 of 117~~ 156 of 156 since the subfolders, `FND-104`; a namespace import and a union's second target accepted as known differences, each still checked) |
| `node tests/runner/run-tests.mjs` | `TEST-01` to `TEST-05` and `R1` to `R8`, adapted to MVP 2, and `R9` to `R11` (a listed tool missing, tool folders not listed, no file to read): 28 checks on a copy |
| `node tests/viewer/check-server.mjs` | the backend on `test-source-mvp2`: security, reads, the activity log, runs, bad data across restarts: 35 checks |
| `node tests/viewer/check-model.mjs` | the first stage's model check, still passing on its saved cache |
| `tests/viewer/browse/mvp2.json` | the page on `test-source-mvp2` and on a source with every status |
| `tests/viewer/browse/b7.sh` | `B7` through the page: a syntax error gives a no-go with its reason; the last good graph stays shown |

`C1` (a run without M3) is overtaken: MVP 2 never runs M3.

## Human review of the Viewer (P3)

The person deciding whether the Viewer passes goes through these and answers yes, no or partly, with a note:
1. Can you start a run and a dry run from the page, and see each tool's go / no-go and result?
2. Does level 1 show the three files and the three file edges, each counting 2?
3. Can you go into `main.ts`, see the `run` scope, and go into it to see `first` and `label`?
4. Do the links leaving a file lead you to the right symbol in the other file?
5. Does selecting any node or edge show the right file:line and source line?
6. When B7 is run, is the error clear enough to know what to fix?
7. Overall: would this be worth building further? Why or why not?

The answers go into the findings note (`07_delivery.md`).
