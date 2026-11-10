# Proposed JSON schema for `ts-program` 0.2.0 and the source range endpoint, as built

> A later file proposes the next part of MVP 2, before building, and corrects `extra` to `attrs`: `26-11-10 165255 Proposed JSON schema for the next part of MVP 2, ranges, initializers, folders and attrs.md`.

**Status:** as built and checked on 2026-11-09. `tests/ts-program/check.mjs` compares every key below against a table written by hand (`expected-mvp2/write_expected.py`), and `tests/viewer/check-server.mjs` checks the endpoint. The changes come from `FND-104` to `FND-110` in `mvp_docs/99_findings.md`, recorded in `mvp_docs/97_second_implementation.md`, section 6.

This file **keeps the section numbers** of `26-11-09 201159 Proposed JSON schema for MVP 2, ts-program, the full file listing and the Viewer.md` (MVP 2 as built, `ts-program` 0.1.0). It **describes only what changes** from that file. A section not given here is unchanged and is read there.

Every key keeps one meaning wherever it appears (`DATA-19`). New keys are marked *new*.

## Contents of this file

- 4.5 `ts-program` 0.2.0: `output/<FileKey>.json`
- 5. `--info`
- 10. The Viewer's graph model: unchanged
- 12. New key names
- 17. The Viewer's API: `/api/source` with `end`
- What is not in the data, and what is still open

## 4.5 `ts-program` 0.2.0: `output/<FileKey>.json`

`toolVersion` is `"0.2.0"`. `formatVersion` stays `1`: the new keys are optional, and a reader of 0.1.0's output reads 0.2.0's unchanged. The output file, `code.reference` and `code.link` are unchanged. A `code.symbol` record gains two keys, and `modifiers` gains two values:

```jsonc
{
  "id": <SymbolID>, "name": "Circle", "kind": <SymbolKind>, "parent": "src/shapes.ts",
  "location": <Location>,                       // the name
  "range": <Location>,                          // the whole declaration; for merged declarations, the first one's only
  "exported?": true,                            // the export keyword, on the declaration or on its statement
  "defaultExport?": true,                       // new  what the file's "default" export names (FND-110)
  "declaredWith?": "const",                     // new  a variable: "const" | "let" | "var" | "using" | "await using" (FND-110)
  "modifiers?": [ "abstract" ],                 // as written, in source order; never "export" or "default"
  "declaredIn?": "constructor",
  "declarations?": [ <Location>, ... ],         // as built: each declaration's NAME, not its range (corrected, FND-110)
  "import?": { ... }
}
```

- **`defaultExport`** is set on the declaration that the file's `default` export resolves to, through an alias. Both `export default class Circle {}` and `export default Circle` mark `Circle`. It is set only when that declaration is in the same file: a default re-exported from another file marks nothing here.
- **`declaredWith`** is set on every `variable`. It comes from the variable's declaration list, so a destructured name gets its statement's keyword: `x` and `y` in `const { x = 0, y = 0 } = by` are both `"const"`. A `catch (err)` variable has no declaration list, so it has no `declaredWith`. Parameters never have one.
- **`modifiers`** has these values:
  - from 0.1.0: `static`, `abstract`, `readonly`, `private`, `protected`, `public`, `async`, `declare`, `const` (on a `const enum` only);
  - *new* in 0.2.0: `override` and `accessor`, which 0.1.0 dropped.

  `in` and `out`, on type parameters, are not recorded: type parameters are not symbols.

As written by 0.2.0 for `test-source-mvp2/src/shapes.ts`:

```json
{"id": "src/shapes.ts#Circle@27:14", "name": "Circle", "kind": "class", "parent": "src/shapes.ts",
 "location": {"file": "src/shapes.ts", "start": {"line": 27, "column": 14}, "end": {"line": 27, "column": 20}},
 "range": {"file": "src/shapes.ts", "start": {"line": 27, "column": 1}, "end": {"line": 32, "column": 2}},
 "exported": true, "defaultExport": true}

{"id": "src/shapes.ts#created@8:5", "name": "created", "kind": "variable", "parent": "src/shapes.ts",
 "location": {"file": "src/shapes.ts", "start": {"line": 8, "column": 5}, "end": {"line": 8, "column": 12}},
 "range": {"file": "src/shapes.ts", "start": {"line": 8, "column": 5}, "end": {"line": 8, "column": 16}},
 "declaredWith": "let"}

{"id": "src/shapes.ts#label@22:7", "name": "label", "kind": "accessor", "parent": "src/shapes.ts#Base@12:23",
 "location": {"file": "src/shapes.ts", "start": {"line": 22, "column": 7}, "end": {"line": 22, "column": 12}},
 "range": {"file": "src/shapes.ts", "start": {"line": 22, "column": 3}, "end": {"line": 22, "column": 73}},
 "declarations": [{"file": "src/shapes.ts", "start": {"line": 22, "column": 7}, "end": {"line": 22, "column": 12}},
                  {"file": "src/shapes.ts", "start": {"line": 23, "column": 7}, "end": {"line": 23, "column": 12}}]}
```

The `label` record shows the limit noted above: its `range` is the getter's (line 22), and the setter (line 23) is in `declarations` by its name only.

## 5. `--info`

The only change is `toolVersion`: `"0.2.0"`. The outputs, their `formatVersion` (1), their `fields` and the parameters are unchanged.

## 10. The Viewer's graph model: unchanged

The new keys reach the page as `attrs` without any change to the model (format 2): the backend keeps every key it doesn't use as `attrs`. Details lists them, and the frame's notes read them (`UI-37`, `FND-109`, `FND-110`). Format 2 stays.

## 12. New key names

| Key | One meaning |
|---|---|
| `declaredWith` | how a variable is declared: `const`, `let`, `var`, `using`, `await using` |
| `defaultExport` | the declaration a file's `default` export names |
| `end` | the last line asked of `/api/source`, a range's end line |
| `cut` | in `/api/source`'s answer: the range had more lines than were given |

## 17. The Viewer's API: `/api/source` with `end`

| Request | Body or query | Answer |
|---|---|---|
| `GET /api/source` | `?source=<SourceKey>&file=<FileID>&line=<n>` | unchanged: the line and two around it |
| `GET /api/source` | *new* `?source=<SourceKey>&file=<FileID>&line=<n>&end=<m>` | `{ "file": <FileID>, "firstLine": <n>, "lines": [ "<text>", ... ], "cut": false }`: the lines `n` to `m`, at most 200; `cut` is `true` when the range has more. `404` when `m` is below `n`, and in every case where the line-only form gives `404` |

The checks are the same as for the line-only form: a listed file that a tool read, resolved inside the source root (`BE-72`, `security.md`, section 7). The page asks for a node's `range` this way and shows that text in Details, numbered and wrapped (`UI-52`, `FND-108`). It checks that the answer starts at `n` and has the range's number of lines; a server older than `end` answers differently, and the page then shows a message instead of wrong text (`FND-107`).

## What is not in the data, and what is still open

- **A range per declaration:** merged declarations keep one `range`, the first one's. For one column per declaration in Details (`FND-106`), `ts-program` would add each declaration's range.
- **A default value or initializer:** not recorded. A property's or variable's initializer text would need a new key, for example `initializer`, capped in length. Proposed, not decided.
- **`ro`/`rw` markers:** `readonly` and `declaredWith` now give what a marker would need for properties and variables. Showing one is proposed, not decided.
- **Files drawn inside their folders:** a Viewer question, not a schema one. The folder entries are already in the file list (section 4.4) with their IDs, which name the folder each file is in (`FND-104`).
