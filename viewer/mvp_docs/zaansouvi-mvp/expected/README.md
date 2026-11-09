# Expected results

What the MVP is tested against, for the basic examined source in `test-source/`.

| File | What | Status |
|---|---|---|
| `file-symbols.json` | M1's symbols, function ranges and references, written by hand from `mvp_docs/06_test_plan.md` | Checked by `tests/m1/check.mjs` |
| `cross-file-links.json` | M2's output file for the test source: only the header and the 6 links (3 imports, 3 uses, `TOOL-23`), none unresolved (`DATA-06`) | Proposed, generated |
| `symbol-scope.json` | M3's output file for the test source | Proposed, generated |
| `run-events.jsonl` | The Runner's events for a full run on an empty data folder (13 lines) | Proposed, generated |
| `run-events-second.jsonl` | The events of a second run with nothing changed: every invocation skipped (8 lines) | Proposed, generated |
| `runner-cache.json` | What `--read-cache` prints after the full run: the Runner's cache (`RUN-27`, schema section 13) | Proposed, generated |
| `generate.mjs` | Writes the five proposed files | |

## How the proposed files were made

`generate.mjs` takes M1's data from its real output files (`data/tools/file-symbols/output/`, `file-symbols` 0.3.0, which pass `check.mjs`), and derives M2's and M3's results by their written rules: `TOOL-20`, `TOOL-21` and `TOOL-23` for M2, `TOOL-30` and `TOOL-31` for M3. Before writing, it checks the result against the hand-written tables in `06_test_plan.md`: the six links in order (three imports, three uses), no unresolved import, the three function scopes with their lines, and 13 memberships. It stops if any of them differ.

To regenerate, from `zaansouvi-mvp/`: `node tests/m1/check.mjs`, then `node expected/generate.mjs .`

## Assumptions

Each stands until the open point is decided; then fix `generate.mjs` and regenerate.

| Open point | Assumed | What changes otherwise |
|---|---|---|
| ~~`FND-11`: where a file scope ends~~ | ~~A file scope has no `location` (against `DATA-01`, which wants a Location on every scope)~~ Decided on 2026-11-08 (`TOOL-34`): from 1:1 to the furthest end among the file's symbols (`8:2`, `10:2`, `6:2`) | ~~One field per file scope~~ |
| ~~`FND-12`: where a scope ID starts~~ | ~~At the declaration start: `src/math.ts#scope@3:1`, including `export`~~ Decided on 2026-11-08 (`TOOL-34`), as assumed | ~~Three scope IDs~~ |
| ~~M3's counts~~, and M2's and M3's `result.json` | As in `DATA-22`, `DATA-14` and the schema; M3 keeps `counts` (decided on 2026-11-08, `DATA-07`) | Only fields compared for shape |
| M2's and M3's `--info` (in the cache) | As in `DATA-08` | The `tools` part of the cache |

## How to compare

- **Placeholders** in `<angle brackets>` stand for values that change from run to run: `<runId>`, `<time>`, `<sourceRoot>`, `<mvpRoot>`, `<path>`, `<toolLogPath>`, `<runnerLogPath>`. The actual value only needs the right shape: a non-empty string, an ISO time, an absolute path. `<sourceRoot>` and `<mvpRoot>` are replaced by the real folders before comparing.
- **`about`** is not compared.
- **Extra keys are allowed.** Every key in the expected file must be present with the same value; the actual file may have more, which readers ignore (`TOOL-08`). Object key order doesn't matter.
- **Arrays keep their order** where the order is fixed: files, invocations, events, and records within an output (M1 sorts by position). `links`, `scopes` and `membership` are compared as sets until M2 and M3 fix an order.
- **Checked for shape only:** `durationMs` and fingerprints.
- **Events:** compared line by line, in order. `run-events.jsonl` follows a run on an empty data folder (`TEST-01`); `run-events-second.jsonl` follows an immediate second run (`TEST-04`, "nothing changed").

## Unresolved imports and diagnostics

Found while writing these, and resolved (`FND-42`): an unresolved import is a link with `to: null` and a `reason`, so it sits in `code.link` like the others; diagnostics were first a common data name, then moved to each run's `result.json` (option C, 2026-11-08, `DATA-14`), so the cache holds them in each invocation's `result`, not under `data`. For the test source there are none of either.
