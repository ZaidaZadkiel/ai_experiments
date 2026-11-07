# zaansouvi-mvp

The ZaAnSouVi MVP, laid out as in `mvp_docs/01_architecture.md`. This is test code, meant to be overwritten.

## Status

| Part | Folder | Status |
|---|---|---|
| M1 file-symbols | `app/tools/file-symbols/` | **Done, standalone.** Passes `tests/m1/check.mjs` and `tests/m1/broken.sh`. See its README |
| M2 cross-file-links | `app/tools/cross-file-links/` | Not started |
| M3 symbol-scope | `app/tools/symbol-scope/` | Not started |
| Runner | `app/runner/` | Not started |
| Viewer | `app/viewer/server/`, `app/viewer/ui/` | Not started |
| Shared library, tool helper | `app/shared/`, `app/tool-helper/` | Not started. M1 doesn't use the tool helper; it is self-contained on purpose |

## Layout

```
app/          programs (Runner, Viewer, tools)
data/         each tool's store and the Runner's logs; can be deleted at any time (ARCH-09)
test-source/  the basic examined source, a copy of mvp_docs/test_plan/test-source/src
expected/     the expected results, written by hand
tests/        test scripts
```

## Running M1 by hand

```
cd app/tools/file-symbols && npm install && cd ../../..
node tests/m1/check.mjs
bash tests/m1/broken.sh
```

Needs Node 22.18 or later (tested on 22.23.1).

## Choices made here that the documents leave open

M1 takes these answers to the findings in `mvp_docs/99_findings.md`. They are starting points, not decisions:

| Finding | Choice in M1 |
|---|---|
| FND-01 data name to JSON key | `dataNames` in the output; `jsonKey` and `fields` in `--info` |
| FND-02 uniform relations | References carry `enclosing`, plus `from`/`to` |
| FND-04 dry-run chaining | The dry run prints the would-be output on a `preview` line |
| FND-07 where tools write | `output_root` parameter, default `data/tools` |
| FND-09 `range` | The whole declaration, from `export` or `function` |
| FND-10 call or read | Only a bare-name callee is a call |
| FND-13 no-go on invocation errors | Printed on standard output too, with exit code 2 |
| FND-14 options | `--help`, `--version`, and one option per parameter |
| FND-15 syntax errors | `ts.transpileModule` with `reportDiagnostics` |
| FND-29 repeatability | No times in the output file; checked by `check.mjs` |
