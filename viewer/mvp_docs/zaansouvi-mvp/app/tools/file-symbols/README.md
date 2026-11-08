# file-symbols (M1)

Reads **one** TypeScript file and lists its symbols and every reference to them (`04_tools.md`, M1). It depends on Node built-ins, the `typescript` package (used only as a parser) and, from version 0.4.0, the tool helper in `app/tool-helper/`, which carries the contract every tool shares (`TOOL-45`). It imports nothing from the Runner, the Viewer or another tool. Its options, parameters, log, `result.json` and dry run behave exactly as before the helper: `--info` and `--help` are byte-identical, and every test passes unchanged.

This is a first, generous version of the contract. It is meant to be overwritten once the open findings in `mvp_docs/99_findings.md` are settled.

## Install and run

Needs Node 22.18 or later, which runs TypeScript directly (type stripping), so there is no build step.

```
npm install                      # in this folder: typescript, @types/node
./file-symbols --help
./file-symbols --info            # the tool's self-description (DATA-08)
echo '{"source_root":"../../../test-source","file_id":"src/math.ts"}' | ./file-symbols --stdin
npm run typecheck                # tsc, no output files
```

`file-symbols` is the launcher (the `tool_name.bin` of `toolset.md`, section 4.5). It passes its arguments through to `node src/file-symbols.ts`.

## Parameters

Read in this order (`TOOL-02`): command-line parameter options, then `--json <path>` or `--stdin` (both together is E1), then `last_run.json`. If there is no JSON input, the command-line options are applied on top of `last_run.json` (the MVP answer to `TS-30`). With nothing at all, the tool fails with E3.

| Key | Option | Required | Meaning |
|---|---|---|---|
| `file_id` | `--file-id` | yes | Path relative to the source root, `/` separators, for example `src/math.ts` |
| `file_path` | `--file-path` | no | Path of the file to read, absolute or relative to `source_root`; it must lie inside `source_root`, at `file_id` (E12 otherwise). If absent, `source_root` + `file_id` is read |
| `source_root` | `--source-root` | yes | Root of the examined source. Declaring it marks a tool that reads files; every file path is resolved against it (`DATA-09`, from version 0.4.0) |
| `store_path` | `--store-path` | no | The folder that is this tool's store. Doesn't affect the output. If the input lacks it, the store is this program folder (`TOOL-43`) |

Any other key is an extra value and is ignored (`TOOL-08`).

`--info` marks each parameter with `affectsOutput`. `file_id`, `file_path` and `source_root` affect the output and follow the order above exactly. `store_path` doesn't, so it is optional: when the input lacks it, the store is this program folder. `last_run.json` is used only as a complete input, never to fill in a missing `store_path`. `result.json` and the log say whether the input gave it or the default applied (`nonOutputParameterSources`). The output is the same in every case.

## What it writes

The store is `store_path`, or this program folder when there is none (see above). The Runner always passes `data/tools/file-symbols` (`RUN-26`).

| File | When | Content |
|---|---|---|
| `output/<file-key>.json` | real run succeeded | `tool`, `toolVersion`, `formatVersion`, `file`, `sourceSha256`, `dataNames`, `counts`, `symbols`, `references`. No times, so two runs over the same file give identical output |
| `result.json` | every real run past the shape check | `status` (`succeeded` or `failed`), times, `parameterSource`, `effectiveParameters`, `read` (`sourcePath`, `sourceBytes`, `sourceSha256`), `outputPaths`, `outputChange`, `counts`, `error`, `logPath` |
| `logs/<timestamp>_<file-key>.log` | every real run past the shape check | `<ISO time>\t<level>\t<event>\t<JSON>` lines and `# [type] text` comments (DATA-16) |
| `last_run.json`, next to the launcher | every real run past the shape check | The flat parameters, plus `_last_run` (`toolVersion`, outcome, times, error, `resultPath`). It can be passed back as is with `--json` |

`<file-key>` is the file ID with `/` replaced by `__`, so `src/math.ts` gives `src__math.ts.json` (`ARCH-07`). Files are written to a temporary name and renamed, so they are never half-written. A failed run writes no output and keeps the earlier one.

On a real run, standard output gets one JSON summary line (`status`, `file_id`, `outputPath`, `outputChange`, `counts`, `logPath`). The Runner should still read `result.json`.

## Records

Following `02_data_contracts.md`, with these additions:
- **References** carry `enclosing`: the symbol ID of the enclosing function, or the file ID. They also carry `from` (= `enclosing`) and `to` (= `symbol`), so every relation has the same shape (FND-02).
- **`range`** of a function is the whole declaration, from `export` or `function` to the closing brace (FND-09).
- **Diagnostics** (the `I1` and `I2` notes) go in `result.json` and on the dry run's go line, not in the output file (`DATA-14`, from version 0.5.0; output format 3).
- **`import`** is `{ moduleSpecifier, importedName }` (`02_data_contracts.md`), and may carry `typeOnly: true`.
- **`dataNames`** in the output, and `jsonKey` and `fields` in `--info`, say which JSON key holds which data name, and which fields hold the ID, parent, from and to (`idField`, `parentField`, `fromField`, `toField` and the like; FND-01).

## Key names

Every key has one meaning across the Runner, the tools and the Viewer, and different meanings get different names (`DATA-19`). Version 0.2.0 renamed the keys that had two meanings (`FND-40`): for example `toolVersion` and `formatVersion` instead of `version`, `import.moduleSpecifier` and `import.importedName`, `effectiveParameters` and `outputPaths` in `result.json`, `errorKind` on the no-go line, `...Path` for every path, and `symbolCount` and the like in `counts`. The full list is in `mvp_docs/proposed_schema/26-11-08 011800 Proposed JSON schema for every step, current parameters of input and output.md`, section 12.

## Dry run

`--dry-run` does the same work, writes nothing, and prints JSON lines:
- `{"type":"log",...}` and `{"type":"comment",...}`: the log
- `{"type":"preview","outputPath":...,"outputChange":"create|update|unchanged","content":{...}}`: the would-be output, so a Runner can chain dry runs (FND-04)
- last line: `{"dryRun":"go",...}`, or `{"dryRun":"no-go","errorKind":"run|invocation","error":{...}}`

On an invocation error, a dry run prints the no-go line too, with exit code 2 (FND-13).

## Errors and exit codes

| Exit | Codes | Written |
|---|---|---|
| 0 | none | output, result, log, `last_run.json` |
| 1 (run error) | E6 file missing or unreadable; E12 bad or incongruent value, or syntax errors (with the location of the first); E8 unexpected | result (`failed`), log, `last_run.json`; earlier output kept |
| 2 (invocation error) | E1 malformed invocation; E2 unusable JSON input; E3 nothing to repeat; E13 missing or malformed parameter | nothing; message and a JSON line on standard error |

Syntax errors come from `ts.transpileModule` with `reportDiagnostics`, a public API (FND-15).

## Rules it follows

- **Symbols:** function declarations, `const`/`let`/`var` names (destructured names too), parameters of any function, named, default and namespace imports. Function names belong to the scope they're declared in.
- **References:** every identifier that is a declaration name, a call target, a read or an assignment target. Property names after a dot, member names, labels, and anything inside a type are not references (`TOOL-12`).
- **Kinds:** `declaration`; `write` for the left side of an assignment, and for `++`/`--`; `call` only for a bare-name callee (FND-10); `read` otherwise.
- **Resolution:** by name, nearest enclosing function first, then the file. Inside one scope it picks the last declaration before the reference, or the first one (for hoisting). Block scoping is ignored (`TOOL-13`). Names with no declaration in the file get `symbol: null`.
- **Unsupported constructs** never crash the tool. Each one is recorded in `result.json`'s `diagnostics` with severity `info`: `I1` when skipped, `I2` when handled on a best-effort basis.

## Tests

From `zaansouvi-mvp/`:
- `node tests/m1/check.mjs`: TEST-01 for M1 alone. Runs each test file (dry run, then real run) and compares with `expected/file-symbols.json`. It also checks the preview, the declaration references, the function ranges and repeatability.
- `bash tests/m1/broken.sh`: B1 to B7 from `06_test_plan.md`, plus extras (unknown option, invocation error in a dry run, incongruent paths, command-line override, `--log`). It uses a temporary store and restores `last_run.json`.
