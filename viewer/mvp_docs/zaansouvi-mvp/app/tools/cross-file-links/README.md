# cross-file-links (M2)

Links each import to the declaration it imports, and each use of an imported name to that declaration (`mvp_docs/04_tools.md`, `TOOL-20` to `TOOL-23`). It **reads no files** (`readsFiles: false`, so no `source_root`): it works only from the symbol and reference records the Runner sends (`DATA-13`), and depends on nothing else from M1. The tool contract comes from the tool helper (`app/tool-helper/`, `TOOL-45`).

## Install and run

Needs Node 22.18 or later; no build step.

```
npm install                      # in this folder: only for the type check
./cross-file-links --info
./cross-file-links --stdin < params.json
npm run typecheck
```

## Parameters

| Key | Required | Meaning |
|---|---|---|
| `symbols` | yes | Every `code.symbol` record, as one flat array. Each carries its file in `parent` |
| `references` | yes | Every `code.reference` record, as one flat array, to find uses of imported names |
| `store_path` | no | The folder that is this tool's store; else `./zaansouvi/tools/cross-file-links/` in the working folder, which also holds `last_run.json`. Doesn't affect the output |

## Output: `output/links.json`

Only the header and the links (`DATA-06`): `tool`, `toolVersion`, `formatVersion`, `dataNames` (`{ "code.link": "links" }`), `links`. Links are ordered by position: file ID, line, column.

| Link | `id` | `from` | `to` | `kind` |
|---|---|---|---|---|
| An import, resolved | `<import symbol>-><declaration>` | the import symbol | the declaration | `import` |
| An import, unresolved | `<import symbol>->` | the import symbol | `null`, with a `reason` | `import` |
| A use of an imported name | `<reference id>-><declaration>` | the enclosing function, or the file | the declaration | `call`, `read` or `write` |

Every link also has `moduleSpecifier` (as written) and `location`. Reasons: `external` (a package), `no such file` (no symbol of that file in the input), `not exported`, `unsupported` (a default or namespace import). Type-only imports are linked like any other. A specifier written with an extension (`./math.js`) gives `no such file`, an acceptable failure.

## Errors

| Exit | Codes |
|---|---|
| 1 (run error) | `E12`: no symbol records, or two symbol records with the same `id` (`TOOL-09`, `TOOL-22`) |
| 2 (invocation error, nothing written) | `E13`: `symbols` or `references` missing or not an array; a malformed symbol or reference record; and the common `E1`, `E2`, `E3` |

The dry run prints only its log lines and the final go / no-go line; no preview.

## Tests

From `zaansouvi-mvp/`, after `node tests/m1/check.mjs`:
- `node tests/m2/check.mjs`: M2 on M1's records for `test-source/`, compared exactly with `expected/cross-file-links.json`; the dry run; repeatability.
- `bash tests/m2/broken.sh`: B8, the input errors, B9 and the other unresolved cases, type-only imports, a repeat from `last_run.json`.
