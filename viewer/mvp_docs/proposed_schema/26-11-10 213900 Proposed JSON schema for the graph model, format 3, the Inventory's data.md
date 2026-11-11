# Proposed JSON schema for the graph model, format 3: the Inventory's data

**Status:** proposed on 2026-11-10, **before building; nothing in it is built.** What the model must state is decided (`mvp_docs/55_viewer_backend.md`, `BE-110` to `BE-115`; `mvp_docs/05_viewer.md`, `VIEW-51`; `mvp_docs/51_viewer_inventory.md`). **The shapes and key names here are proposed**, to be confirmed or changed before the backend is built.

This file **keeps the section numbers** of `26-11-09 201159 Proposed JSON schema for MVP 2, ts-program, the full file listing and the Viewer.md`, section 10 (the Viewer's graph model, format 2), with the correction of `26-11-10 165255 …`, section 10 (`attrs`, not `extra`). It **describes only what changes**: the model's other keys, and every other step's data, are unchanged and read there. **The folders as containers proposed in `165255`, section 10, are not taken up for now** (`M2Q-1`): every listed entry stays a node at the top level of the Graph, and a folder's entries are stated in the index only (10.0).

Every key keeps one meaning wherever it appears (`DATA-19`). New keys are marked *new*.

## Contents of this file

- 10. The Viewer's graph model, format 3
  - 10.0 The index (`BE-110`)
  - 10.1 Each view's visibility (`BE-111`)
  - 10.2 Each view's path, views inside and reachability (`BE-112`)
  - 10.3 The records the Viewer drops (`BE-113`)
  - 10.4 What the page works out today (`BE-114`)
  - 10.5 An example: the view of `Circle` in `test-source-mvp2`
- 12. New key names
- What is still open

## 10. The Viewer's graph model, format 3

`formatVersion` becomes `3` (`BE-115`). `nodes`, `relations`, `levels`, `files`, `run` and `checks` keep their format 2 meaning; each gains the keys below. A stored entry of format 2 is unusable until its source is run again (`BE-57`).

```jsonc
{
  "formatVersion": 3,
  "viewerVersion": "...", "sourceKey": "...", "sourceRoot": "...", "run": { ... }, "files": [ ... ],
  "nodes": [ <Node>, ... ],            // each with display (10.4)
  "relations": [ <Relation>, ... ],    // unchanged
  "index": { ... },                    // new (10.0)
  "levels": { "<ViewID>": <View> },    // each view with the keys of 10.1, 10.2, 10.4
  "checks": { "invalid": [ ... ], "extra": [ ... ] },   // unchanged: still names what was dropped
  "dropped": [ <Dropped>, ... ]        // new (10.3)
}
```

A `<ViewID>` is the ID of the view's entered node; `""` is the top view, as in format 2.

### 10.0 The index (`BE-110`)

```jsonc
"index": {
  "fileOf":        { "<NodeID>": "<FileID>" },            // new: a symbol's file; a file's is itself; none for a folder or another entry
  "children":      { "<NodeID>": [ "<NodeID>", ... ] },   // new: a container's members, in source order (the Graph's containment)
  "entries":       { "": [ "<EntryID>", ... ],            // new: the source root's entries, by path
                     "<FolderID>": [ "<EntryID>", ... ] }, //      a folder's entries: folders first, then files, by name (INV-34)
  "folderOf":      { "<EntryID>": "<FolderID>" },         // new: a listed entry's folder; none at the source root
  "ancestors":     { "<NodeID>": [ "<NodeID>", ... ] },   // new: its containers, from the top down; [] for a listed entry (BE-112)
  "relationsFrom": { "<NodeID>": [ "<RelationID>", ... ] }, // new: the relations starting at it
  "relationsTo":   { "<NodeID>": [ "<RelationID>", ... ] }  // new: the relations ending at it; none for to: null
}
```

- A node with no members, no relations, no file or no folder has no key in the map concerned; a lookup that finds nothing means "none".
- A folder skipped as a whole (`RUN-34b`) is an entry of its parent's `entries`, with no `entries` of its own.
- `children` and `entries` are two different trees: `children` is containment in the Graph (a file's symbols, a class's members); `entries` is the folder structure, which the Graph doesn't draw for now (`M2Q-1`) and the Inventory's Files section shows (`INV-5`).

### 10.1 Each view's visibility (`BE-111`)

In each `<View>`:

```jsonc
"render": {                                   // new: how each item is sent to render in this view
  "<NodeID>": "node" | "member" | "stub" | "title"
},
"memberOf":     { "<NodeID>": "<NodeID>" },   // new: a member written into which node's label (FND-69)
"relationEdge": { "<RelationID>": "<EdgeID>" } // new: the edge each relation is drawn as part of, in this view
```

- `node`: drawn as a node of the view; `member`: written into another node's label, `memberOf` naming it; `stub`: drawn outside the frame (`BE-53`); `title`: the frame's title, the entered node itself (`UI-36`).
- A node not in `render` is *not in this view*; a relation not in `relationEdge` is not drawn in this view (inside one end, `UI-34`, or unresolved or built-in, listed in `unresolved` and `builtins` as in format 2).
- *Hidden by a choice* is not stated here: the hidden set is the page's (`VIEW-51`, `INV-33`).
- `edges` keep `members`, the relations an edge stands for; `relationEdge` is the same fact read from the relation's side, stated so the page looks it up instead of inverting the lists.

### 10.2 Each view's path, views inside and reachability (`BE-112`)

In each `<View>`:

```jsonc
"path":      [ "", "<ViewID>", ... ],   // new: the views above this one, from the top view down; [] for the top view
"inside":    [ "<ViewID>", ... ],       // new: the views one level inside: its own nodes (render "node") that have a view, in the order of the view's nodes
"reachable": true                       // new: reachable from the top view with nothing hidden
```

- A view is reachable when its node is drawn as a node (`render` `"node"`) in a reachable view; the top view is reachable.
- The page's model layer takes out of reach the views of hidden nodes and of their contents (`INV-33`), from `ancestors`.

### 10.3 The records the Viewer drops (`BE-113`)

```jsonc
"dropped": [
  {
    "dataName": "code.symbol", "tool": "ts-program",
    "why": "invalid" | "unknown group",   // new
    "problem": "it lacks its ID (\"id\")", // as in checks.invalid; for an unknown group, its represents
    "record": { ... }                     // new: the record as read, unchanged
  }
]
```

- Never drawn; `checks` still names each one. The Inventory's Model section shows them as unused (`INV-7`, `INV-30`).
- `dropped` is empty when nothing was dropped.

### 10.4 What the page works out today (`BE-114`)

On each node:

```jsonc
"display": {                        // new
  "name":  "area()",                // as drawn on its node (displayName)
  "title": "ƒ area()",              // as a frame's title (titleOf, UI-36)
  "notes": [ "exported", "abstract" ], // the frame's notes (frameNotes, UI-37); [] when none
  "icons": [ "hidden", "readOnly" ],   // a listed entry's status icons, in their fixed order (UI-48); absent when none
  "label": "shapes.ts · .ts"        // a listed entry's label (entryLabel, UI-47b); absent for a symbol
}
```

In each `<View>`:

```jsonc
"unconnected": [ "<EntryID>", ... ],             // new: in the top view, the entries in the "Not connected" frame (UI-47); absent elsewhere
"memberRows":  { "<NodeID>": [ "<NodeID>", ... ] }, // new: the nodes whose members are written into their label, and those members, in the order drawn today (by ID, FND-102)
"builtinGroups": [                               // new: the view's built-ins, grouped by library type (FND-100)
  { "type": "Math", "members": [ { "name": "PI", "relations": [ "<RelationID>", ... ] } ] }
]
```

- `icons` names are the status keys of the file list (`hidden`, `readOnly`, `unreadable`), and `linkInside`, `linkOutside` for a link's two cases.
- `memberRows` keeps the order the Graph draws today, by ID (`Color`: `Green`, `Red`), so the Graph doesn't change; `index.children` is in source order (`Red`, `Green`), as the Inventory lists members (`INV-34`).
- How a member row reads ("↘ name" for an import, `name()` for a function) stays the page's: `memberRows` gives the nodes, `display.name` their text.

### 10.5 An example: the view of `Circle` in `test-source-mvp2`

The keys of format 3 only; IDs as in the model of the run of 2026-11-10.

```jsonc
"levels": {
  "src/shapes.ts#Circle@27:14": {
    // nodes, stubs, thisNode, edges, unresolved, builtins: as in format 2
    "render": {
      "src/shapes.ts#Circle@27:14": "title",
      "src/shapes.ts#area@30:3": "node", "src/shapes.ts#constructor@29:3": "node",
      "src/shapes.ts#name@28:12": "node", "src/shapes.ts#radius@29:23": "node", "src/shapes.ts#unit@31:10": "node",
      "src/shapes.ts#color@29:39": "member",
      "src/app.ts": "stub", "src/report/charts/bars.ts": "stub", "src/shapes.ts#Base@12:23": "stub",
      "src/shapes.ts#Color@4:13": "stub", "src/shapes.ts#UNIT@7:14": "stub", "src/shapes.ts#registry@56:14": "stub"
    },
    "memberOf": { "src/shapes.ts#color@29:39": "src/shapes.ts#constructor@29:3" },
    "relationEdge": {
      "src/app.ts#ref@20:17": "src/app.ts->src/shapes.ts#Circle@27:14",
      "src/app.ts#ref@22:31": "src/app.ts->src/shapes.ts#Circle@27:14",
      "src/app.ts#ref@25:62.1": "src/app.ts->src/shapes.ts#area@30:3",
      "src/app.ts#ref@22:38": "src/app.ts->src/shapes.ts#unit@31:10"
      // ...
    },
    "path": [ "", "src/shapes.ts" ],
    "inside": [ "src/shapes.ts#constructor@29:3" ],
    "reachable": true,
    "memberRows": { "src/shapes.ts#constructor@29:3": [ "src/shapes.ts#color@29:39" ] },
    "builtinGroups": [
      { "type": "Math", "members": [ { "name": "PI", "relations": [ "src/shapes.ts#ref@30:32" ] } ] }
    ]
  }
}
```

and on the node `Circle`:

```jsonc
"display": { "name": "Circle", "title": "class Circle", "notes": [ "exported", "default" ] }
```

The `Math` use at `ref@30:27` (the receiver of `Math.PI`) is left out of the group, as the page does today (`FND-100`): a type with other members drops its own line.

## 12. New key names

| Key | One meaning |
|---|---|
| `ancestors` | a node's containers, from the top down |
| `builtinGroups` | a view's built-in uses, grouped by library type |
| `children` | a container's members in the Graph, in source order |
| `display` | how the page shows a node: name, title, notes, icons, label |
| `dropped` | the records the Viewer did not take into the model, as read |
| `entries` | a folder's listed entries, by path |
| `fileOf` | the file a node is declared in |
| `folderOf` | the folder a listed entry is in |
| `icons` | a listed entry's status icons, by status name |
| `index` | the model's lookups, built once per model |
| `inside` | the views one level inside a view |
| `memberOf` | the node whose label a member is written into |
| `memberRows` | the nodes whose members are written into their label |
| `notes` | a node's short facts, as a frame's notes give them |
| `path` | the views above a view, from the top view down |
| `reachable` | a view the Graph can lead to from the top view |
| `record` | a dropped record as read |
| `relationEdge` | the edge a relation is drawn as part of, in a view |
| `relationsFrom`, `relationsTo` | the relations starting, ending at a node |
| `render` | how an item is sent to render in a view |
| `unconnected` | the top view's entries in the "Not connected" frame |
| `why` | why a record was dropped |

`label` keeps its meaning ("what is written for it"); on `display` it is a listed entry's label as drawn.

## What is still open

- **The size of a model** (`BE-115`): `render` and `relationEdge` repeat per view. On `test-source-mvp2`, 32 views; on `FND-99`'s `app/`, 12,533 relations, each in `relationEdge` of every view where it is drawn. To be measured when built; if too large, `relationEdge` can be dropped and the page read `edges[].members`, at the cost of inverting the lists.
- **`display.name` and `display.title` for a scope** (`code.scope`, MVP 1): kept as today ("main.ts · file scope", "ƒ run"), though no scope tool runs in MVP 2.
- **The key names** throughout: proposed, to be confirmed before building.
