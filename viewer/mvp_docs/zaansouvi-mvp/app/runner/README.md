# zaansouvi-run (the Runner)

The ZaAnSouVi MVP Runner, as specified in `mvp_docs/03_runner.md`. It lists every file under the source root with its status (`RUN-34`, `RUN-35`), runs the tools of its run list in the order their `--info` gives, dry-running and running each one that needs it, keeps the database and the Runner's cache, and reports in Viewer mode: one JSON event per line on standard output.

The run list holds `ts-program` alone (`RUN-33`, `src/tools.ts`); a tool folder not in it is reported as not listed. Otherwise it knows tools only through their `--info` and the files they write: there is no branch on a tool's name (`RUN-25`).

## Install and run

Needs Node 22.18 or later, which runs TypeScript directly, so there is no build step. It uses only Node built-ins at run time, including `node:sqlite`.

```
npm ci                             # in this folder: only for the type check (typescript, @types/node), exact from package-lock.json
./zaansouvi-run ../../test-source-mvp2  # a real run; the source root is saved
./zaansouvi-run                    # again, on the saved source root
./zaansouvi-run --dry-run-only     # dry-run every step; no tool writes anything
./zaansouvi-run --read-cache       # print the Runner's cache, run nothing
npm run typecheck
```

## What it reads and writes

| Path | What |
|---|---|
| `app/tools/<name>/<name>` | A tool: a folder with an executable launcher of the same name. Only the tools of the run list run; the others are reported as not listed (`RUN-05`, `RUN-33`) |
| `data/zaansouvi.sqlite` | The database: configuration tables and what the refresh check needs (`RUN-04`, `RUN-20`, `RUN-22`) |
| `data/tools/<tool>/` | Each tool's store, passed to it as `store_path` (`RUN-26`). The Runner reads `result.json`, the tool's log and its outputs there |
| `data/runner/cache.json` | The Runner's cache, what `--read-cache` prints (`RUN-27`) |
| `data/runner/logs/<timestamp>.log` | The Runner's log, in the shared format (`RUN-14`, `RUN-15`) |
| `data/runner/run.lock` | Held during a run (`RUN-30`) |

## Code

| File | What |
|---|---|
| `src/runner.ts` | Command line, lock, start-up, the run loop with the refresh check, the cache, events |
| `src/tools.ts` | Finding tools, `--info`, the order and Runner-provided data, output paths, the shape check, invoking a tool |
| `src/db.ts` | The database |
| `../shared/` | Shared with the Viewer backend: types for `--info`, events and the cache; the log format; file helpers |

## Exit codes

`0` the run finished; `1` a tool's no-go or failure stopped it; `2` an invocation or start-up error (`RUN-31`). A run that can't start prints one `run_refused` event with a diagnostic.

## Checks

From `zaansouvi-mvp/`: `node tests/runner/run-tests.mjs`, the Runner's tests for MVP 2 (`TEST-01` to `TEST-05`, `R1` to `R11`, `06_test_plan.md`), on a temporary copy, so the real `data/` is never touched; and `npm run typecheck` in this folder.
