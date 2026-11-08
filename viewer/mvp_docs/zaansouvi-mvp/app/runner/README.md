# zaansouvi-run (the Runner)

The ZaAnSouVi MVP Runner, as specified in `mvp_docs/03_runner.md`. It lists the files, works out the order of the tools from their `--info`, dry-runs and runs each tool that needs it, keeps the database and the Runner's cache, and reports in Viewer mode: one JSON event per line on standard output.

It knows tools only through their `--info` and the files they write: there is no branch on a tool's name (`RUN-25`).

## Install and run

Needs Node 22.18 or later, which runs TypeScript directly, so there is no build step. It uses only Node built-ins at run time, including `node:sqlite`.

```
npm install                        # in this folder: only for the type check (typescript, @types/node)
./zaansouvi-run ../../test-source  # a real run; the source root is saved
./zaansouvi-run                    # again, on the saved source root
./zaansouvi-run --dry-run-only     # dry-run every step; no tool writes anything
./zaansouvi-run --read-cache       # print the Runner's cache, run nothing
npm run typecheck
```

## What it reads and writes

| Path | What |
|---|---|
| `app/tools/<name>/<name>` | A tool: a folder with an executable launcher of the same name. Other folders are skipped, with a log line (`RUN-05`) |
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

## Status

Built and smoke-tested by hand on a copy of the MVP, with M1 and stand-in tools: a full run, a second run with everything skipped, an edited file, a broken file, a dry-run-only pass after a real run and on a fresh data folder, `--read-cache`, the lock (held and stale), a missing or bad source root, an unknown option, an unknown database version, a tool run once after M1, a crash without `result.json`, and a dry run that prints garbage. Not yet compared with `expected/`, and the test plan's automatic Runner tests (`TEST-01` to `TEST-05`, R1 to R8) aren't written yet.
