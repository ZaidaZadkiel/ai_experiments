# zaansouvi-mvp

The ZaAnSouVi MVP's code, laid out as in `mvp_docs/01_architecture.md`. This is test code, meant to be overwritten. The MVP is in its second stage, MVP 2: `ts-program` runs TypeScript's own compiler, and the Runner runs it alone (`RUN-33`). The current state is in `mvp_docs/97_second_implementation.md`.

## MVP 2

| Part | Folder | What |
|---|---|---|
| `ts-program` 0.2.0 | `app/tools/ts-program/` | The only tool in the run: TypeScript's program and checker over every listed `.ts` file, one output per source file (`TOOL-50` to `TOOL-52`, `42_tool_ts_program.md`). See its README |
| Runner `zaansouvi-run` 0.1.0 | `app/runner/` | Lists every file with its status, runs the tools of its run list, keeps the database and its cache (`03_runner.md`). See its README |
| Viewer `zaansouvi-view` 0.1.0 | `app/viewer/` | The local backend and the page: the graph at any depth, from the Runner's output only (`05_viewer.md`, `50_viewer_ui.md`, `55_viewer_backend.md`). See its README |
| Tool helper | `app/tool-helper/` | The contract every tool shares, with no tool-specific code (`TOOL-45`). See its README |
| Shared library | `app/shared/` | For the Runner and the Viewer backend, never for tools: types for `--info`, events and the cache; the log format; file helpers |
| Test source | `test-source-mvp2/` | The class-heavy TypeScript test, with subfolders (`06_test_plan.md`). See its README |
| Expected graph | `expected-mvp2/` | Written by hand first: every node, edge, link, built-in and unresolved use (`write_expected.py`) |

## Checks

**All of them, in one command:** `bash tests/run-all.sh` (one line per check, every output kept in a temporary folder; `--no-browser` for the scripted checks only). Or one by one, from this folder; each prints what it checks and exits 1 on any failure:

```
node tests/ts-program/check.mjs              # ts-program against expected-mvp2/, exactly
node tests/ts-program/check-definitions.mjs  # every edge against TypeScript's "go to definition"
node tests/runner/run-tests.mjs              # the Runner: TEST-01 to TEST-05, R1 to R11, on a temporary copy
node tests/viewer/check-server.mjs           # the Viewer backend, on a temporary copy
node tests/viewer/check-model.mjs            # the graph model, on MVP 1's frozen cache in expected/
bash tests/viewer/browse/browse.sh <steps.json>   # the page in headless Firefox (tests/viewer/browse/README.md)
bash tests/viewer/browse/b7.sh               # a broken input through the page
```

The browser checks use the real `data/`: stop your own Viewer before running them; `run-all.sh` refuses to start them while one runs. Run alone, a steps file needs the sources it uses to have a graph (`tests/viewer/browse/README.md`).

## Layout

```
app/                programs: the Runner, the Viewer, the tool helper, the shared library, the tools
data/               each tool's store, the Runner's database, cache and logs, the Viewer's store; can be deleted at any time (ARCH-09)
test-source-mvp2/   MVP 2's examined source
expected-mvp2/      its expected graph, written by hand
tests/              check scripts
ailog/              the session logs
```

## Install, also after restoring a backup

Needs Node 22.18 or later (tested on 22.23.1), which runs the TypeScript directly; only the Viewer's page is compiled. Backups leave out `node_modules`; every program pins exact versions in its `package-lock.json`, so `npm ci` installs exactly what was tested:

```
(cd app/tools/ts-program && npm ci)               # TypeScript 5.6.3: needed to run ts-program and its checks
(cd app/viewer && npm ci && npm run build)        # Cytoscape 3.34.4; builds the page into ui/dist/
(cd app/runner && npm ci)                         # only for the Runner's type check (npm run typecheck)
bash tests/run-all.sh                             # then every check
```

`app/tool-helper/` and `app/shared/` have no dependencies. The frozen M1 to M3 need `npm ci` in their own folders only to be used. The browser checks also need Firefox and Python 3.

Restore a backup zip with `unzip`, which keeps the launchers executable (`app/runner/zaansouvi-run`, `app/viewer/zaansouvi-view`, `app/tools/*/<tool>`, the scripts in `tests/`); a tool that drops file modes, Python's `zipfile` among them, leaves them unrunnable, and `chmod +x` restores them. `data/` may be absent: the first run creates it.

## Stale and frozen: MVP 1

**Kept for future tests, not maintained, not run in MVP 2** (decided by the user on 2026-11-10). They can serve as a ready source of wrong data and wrong input, for example records that differ from `ts-program`'s for the same source, when testing how the Runner, the Viewer or a tool handles them (`M2Q-14`). Don't change them; when a test needs one changed, copy it.

| Part | Folder |
|---|---|
| M1 `file-symbols` 0.5.0, M2 `cross-file-links` 0.2.0, M3 `symbol-scope` 0.2.0 | `app/tools/file-symbols/`, `cross-file-links/`, `symbol-scope/` (the Runner reports them as not in its run list) |
| MVP 1's test source, expected results, and the data folder kept from before its first real run | `test-source/`, `expected/`, `data.before-real-run/` |
| MVP 1's checks | `tests/m1/`, `tests/m2/`, `tests/m3/`, `tests/hand-run/`, `tests/viewer/check-server-stage1.mjs`, and the by-hand Runner scripts in `tests/runner/` (`compare-expected.mjs`, `snapshot.mjs`, `check-dry-run.mjs`, `check-real-run.mjs`) |

What MVP 1 built and how it was checked: `mvp_docs/mvp1/98_first_implementation.md`. The code as it stood at the end of MVP 1: `mvp_docs/mvp_2026-11-09_implementation_until_typescript.zip`.
