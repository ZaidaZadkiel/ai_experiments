# Proposed JSON schema for the next part of MVP 2: ranges, initializers, folders and `attrs`

**Status:** proposed on 2026-11-10, **before building; nothing in it is built or decided**, except the correction in section 10, which records what is already built. Each proposed change follows the suggested answer of an open question in `mvp_docs/97_second_implementation.md`, section 6, and is named after it. If a question is answered differently, its part here changes or is dropped before anything is built.

This file **keeps the section numbers** of `26-11-09 235850 Proposed JSON schema for ts-program 0.2.0 and the source range endpoint, as built.md` (and through it of `26-11-09 201159 …`). It **describes only what changes** from that file. A section not given here is unchanged and is read there.

Every key keeps one meaning wherever it appears (`DATA-19`). New keys are marked *new*, changed ones *changed*.

## Contents of this file

- 4.5 `ts-program` 0.3.0: `output/<FileKey>.json` (`M2Q-2`, `M2Q-3`, `M2Q-4`)
- 5. `--info`
- 10. The Viewer's graph model: a correction, and folders as containers (`M2Q-1`)
- 12. New and changed key names
- What is not in the data, and what is still open (`M2Q-7`, `M2Q-10`)

## 4.5 `ts-program` 0.3.0: `output/<FileKey>.json`

`toolVersion` becomes `"0.3.0"`. `code.reference` and `code.link` are unchanged. A `code.symbol` record changes as follows:

```jsonc
{
  "id": <SymbolID>, "name": "label", "kind": <SymbolKind>, "parent": <SymbolID or FileID>,
  "location": <Location>,                       // the name
  "range": <Location>,                          // changed (M2Q-3): for a variable alone in its statement, the whole statement
  "declarations?": [                            // changed (M2Q-2): each declaration's name AND range
    { "location": <Location>, "range": <Location> }, ...
  ],
  "initializer?": "\"anon\"",                   // new (M2Q-4): a property's or variable's initializer, as written
  "initializerCut?": true,                      // new (M2Q-4): the initializer was longer than the cap
  ...                                           // every other key as in 0.2.0
}
```

- **`declarations`** (*changed*, `M2Q-2`, `FND-106`, `FND-110`). For a symbol with several declarations (overloads, a getter and setter, merged namespaces), each entry gives one declaration: `location` is its name, `range` the whole declaration. The first entry is the ID's declaration (`TPG-D6`), and its `range` equals the record's `range`. In 0.2.0 each entry was a bare `<Location>`, the name only, so the shape changes: **the output's `formatVersion` becomes `2`** (section 5). The page then shows one source column per declaration in Details (`UI-52`).
- **`range` of a variable** (*changed*, `M2Q-3`, `FND-107`). When a variable statement declares one name, the variable's `range` covers the whole statement, `export` and the keyword included (`export const Anonymous = class …`), as a class's range covers `export abstract class Base …`. When a statement declares several names (`const a = 1, b = 2`), each name keeps its own declarator's range. Parameters and destructured names keep their own ranges.
- **`initializer`** (*new*, `M2Q-4`). Set on a `property` or a `variable` that has an initializer: its source text as written, after the `=`, with no change to whitespace inside it, cut to at most 200 characters. `initializerCut` is `true` when it was cut. Not set on parameters (their defaults), enum members, accessors or imports. The page shows it in Details, and on the node's label only for a node drawn on its own, cut there at 24 characters (`M2Q-4`'s suggestion; the cut on the label is the page's, not the data's).

As 0.3.0 would write it for `test-source-mvp2/src/shapes.ts` (positions as in 0.2.0; the setter's `range` read from the source, line 23):

```json
{"id": "src/shapes.ts#label@22:7", "name": "label", "kind": "accessor", "parent": "src/shapes.ts#Base@12:23",
 "location": {"file": "src/shapes.ts", "start": {"line": 22, "column": 7}, "end": {"line": 22, "column": 12}},
 "range": {"file": "src/shapes.ts", "start": {"line": 22, "column": 3}, "end": {"line": 22, "column": 73}},
 "declarations": [
   {"location": {"file": "src/shapes.ts", "start": {"line": 22, "column": 7}, "end": {"line": 22, "column": 12}},
    "range": {"file": "src/shapes.ts", "start": {"line": 22, "column": 3}, "end": {"line": 22, "column": 73}}},
   {"location": {"file": "src/shapes.ts", "start": {"line": 23, "column": 7}, "end": {"line": 23, "column": 12}},
    "range": {"file": "src/shapes.ts", "start": {"line": 23, "column": 3}, "end": {"line": 23, "column": 50}}}]}
```

The expected graph (`expected-mvp2/`) gains the new ranges and initializers by hand, and `tests/ts-program/check.mjs` compares them, with one wrong value planted to prove the comparison bites.

## 5. `--info`

`toolVersion` becomes `"0.3.0"`. The output of `code.symbol` gets `formatVersion` `2`, because the shape of `declarations` changes (section 4.5); `code.reference` and `code.link` keep `formatVersion` `1`. The parameters and `fields` are unchanged.

## 10. The Viewer's graph model

**Correction, as built.** `26-11-09 201159 …`, section 10, says a record's other keys are kept as `extra`. The backend keeps them as **`attrs`**, `{ key: value }`, on the node or relation (`VIEW-50`, `app/viewer/server/src/model.ts`), and Details lists them. `attrs` is the key; `extra` is not used.

**Folders as containers** (*proposed*, `M2Q-1`, `FND-104`). Today every listed entry is a node at the top level, and folders sit apart in the "Not connected" frame. Proposed:
- a listed entry's `container` is the folder it is in, and a folder's `container` is its parent folder; the entries directly under the source root have `container` `null`;
- a folder is a node with a view of its own: the top view shows the source root's direct entries, each folder drawn as a frame holding its files and subfolders, and entering a folder shows its view;
- edges between files are lifted through the folders like any other container (`VIEW-13`): an edge between files in two folders is drawn between the folders where both are closed;
- the "Not connected" frame holds, inside each folder, only the entries connected to no graph;
- **the model's `formatVersion` becomes `3`**, since containment changes for every listed entry; an entry of format 2 in the Viewer's store is refused and rebuilt (`VIEW-08`).

## 12. New and changed key names

| Key | One meaning |
|---|---|
| `declarations` *(changed)* | each declaration of a symbol with several: its name's `location` and its `range` |
| `initializer` *(new)* | a property's or variable's initializer, as written, at most 200 characters |
| `initializerCut` *(new)* | `initializer` was cut: the source text is longer |
| `attrs` | in the Viewer's model: a record's keys beyond its field roles, shown in Details (as built; replaces `extra` in `201159`, section 10) |

## What is not in the data, and what is still open

- **Type parameters** (`M2Q-7`): not symbols, so `in` and `out` stay unrecorded. Suggested: no change in MVP 2.
- **Package type declarations** (`M2Q-10`, `TPG-D8`): if `ts-program` reads the `.d.ts` files of the packages a source imports, a use resolved into them needs a shape. Suggested, like built-ins (`TPG-D5`): `to: null`, `reason: "package"`, the package's name in *new* `package`, and the declared name in `name` (`"Router.get"`), listed apart in Problems; no nodes for package declarations. To design with `M2Q-10`.
- **`ro`/`rw` markers** (`M2Q-4`): no new key: `readonly` (in `modifiers`) and `declaredWith` already give them; showing them is the page's.
- **File statuses in the database** (`M2Q-17`): no change suggested; the statuses stay in the cache's file list (section 4.4 of `201159`).
