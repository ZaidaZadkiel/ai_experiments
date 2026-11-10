# symbol-scope (M3)

> **Stale and frozen (2026-11-10).** Kept as built in MVP 1, **not run in MVP 2 and not maintained** (`TPG-01`, `RUN-33`). Kept for future tests, for example as a ready source of wrong data and wrong input (`mvp_docs/97_second_implementation.md`, `M2Q-14`). Don't change it; when a test needs it changed, copy it. What it does is described below as it stood at the end of MVP 1 (`mvp_docs/summary/00_definitions_mvp1.md`).

Groups each file's symbols into lexical scopes: the file scope and one scope per top-level function, each naming the node that owns it (`mvp_docs/04_tools.md`, `TOOL-30` to `TOOL-36`; `MVP-4`, option C with C1). It **reads no files** (`readsFiles: false`, so no `source_root`): it works only from the symbol records the Runner sends (`DATA-13`), and depends on nothing else from M1. It shows no uses: the Viewer lifts references and links up to the scope their source owns (`VIEW-13`). The tool contract comes from the tool helper (`app/tool-helper/`, `TOOL-45`).

## Install and run

Needs Node 22.18 or later; no build step.

```
npm install                      # in this folder: only for the type check
./symbol-scope --info
./symbol-scope --stdin < params.json
npm run typecheck
```

## Parameters

| Key | Required | Meaning |
|---|---|---|
| `symbols` | yes | Every `code.symbol` record, as one flat array. Each carries its file in `parent`; functions carry their `range`, the whole declaration |
| `store_path` | no | The folder that is this tool's store; else `./zaansouvi/tools/symbol-scope/` in the working folder, which also holds `last_run.json`. Doesn't affect the output |

## Output: `output/scopes.json`

The header (`tool`, `toolVersion`, `formatVersion`, `dataNames`: `{ "code.scope": "scopes", "code.membership": "membership" }`), then `counts` (`scopeCount`, `membershipCount`), `scopes` and `membership` (`DATA-07`).

| Scope | `id` | `owner` | `location` |
|---|---|---|---|
| The file scope | `<file ID>#scope@file` | the file ID | from 1:1 to the furthest end among the file's symbols (`TOOL-34`) |
| A top-level function | `<file ID>#scope@<line>:<column>`, at the declaration start (`3:1` for `export function round`) | the function symbol | the function's `range` |

Every scope also has `kind` (`file` or `function`), `name` (the file ID, or the function's name) and `parent` (the file ID). A membership is `{ "child": <symbol ID>, "parent": <scope ID> }`: each symbol belongs to the top-level function scope whose range holds its location, else to the file scope. A function's own name belongs to the scope outside it. Functions inside functions get no scope of their own; they and their parameters belong to the outer function's scope. A file with no symbols gets no scopes. The file scope can end short of the file's real end (trailing comments, blank lines), an accepted shortfall.

Order (`TOOL-35`): scopes by file ID, the file scope first, then function scopes by position; memberships by file ID, then the symbol's position, then its ID. The output never depends on the order of the input records (since 0.2.0), so a script that passes files in any order gets the same bytes as the Runner.

## Errors

| Exit | Codes |
|---|---|
| 1 (run error) | `E12`: no symbol records, two symbol records with the same `id`, or a function symbol without a `range` (`TOOL-09`, `TOOL-32`, `TOOL-36`) |
| 2 (invocation error, nothing written) | `E13`: `symbols` missing or not an array; a symbol record that isn't an object, lacks `id`, `kind`, `parent` or `location`, or has a `range` that isn't a Location; and the common `E1`, `E2`, `E3` |

The dry run prints only its log lines and the final go / no-go line; no preview.

## Tests

From `zaansouvi-mvp/`, after `node tests/m1/check.mjs`:
- `node tests/m3/check.mjs`: `TEST-06`, M3 on M1's records for `test-source/`, compared exactly with `expected/symbol-scope.json`, the dry run, repeatability, and the same output with the input reversed; `TEST-07`, M1 then M3 on `tests/m3/source/` (nested functions, a file with file-level symbols only).
- `bash tests/m3/broken.sh`: `B11` to `B15`, and a repeat from `last_run.json`.
