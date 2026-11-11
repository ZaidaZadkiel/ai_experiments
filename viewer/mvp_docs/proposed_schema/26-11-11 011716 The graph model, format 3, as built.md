# The graph model, format 3, as built

**Status:** built on 2026-11-10 (`mvp_docs/99_findings.md`, `FND-115`; `mvp_docs/55_viewer_backend.md`, `BE-110` to `BE-115`). This file **keeps the section numbers** of `26-11-10 213900 Proposed JSON schema for the graph model, format 3, the Inventory's data.md` and **gives only what the build settled or changed**; every shape and key name there was built as proposed, and is read there.

## 10.0 The index

- **`fileOf`** holds every listed file, `README.md` included, as its own file: "for a file, itself" applies to every listed file, not only to the files a tool read (the expected model first gave only the `.ts` files theirs; the check found it).
- **`children`** are in source order: by the start of each member's `location`, line then column, then by ID; a node with no location (a listed entry) by ID.
- **`entries`** are ordered folders first, then files, each by the last part of its path, compared by code point (`README.md` before `src` would sort the other way; folders first keeps `src` first).
- **`relationsFrom`** and **`relationsTo`** list relation IDs sorted by ID; a relation whose `to` is `null` (a built-in, an unresolved use) is only in `relationsFrom`.

## 10.1 Each view's visibility

- **`render`** gives `"title"` to the entered node of every view but the top view, whether or not an edge reaches it, as the page draws the title for every frame (`UI-36`); the top view has no title.
- **A member** is a member of a node shown in an entered view whose members all have no members of their own; the top view has none (`memberOf` and `memberRows` are empty there).

## 10.3 The records the Viewer drops

- **`record`** is the record as read. A node removed later, because its container is unknown or its containers form a cycle, has its record as read too, kept from when it was read; a scope whose owner is unknown or shared, its record likewise.

## 10.4 What the page works out today

- **`memberRows`** keep the order the Graph drew before format 3, by ID, so the Graph doesn't change (`Color`: `Green`, `Red`); `index.children` is in source order (`Red`, `Green`) for the Inventory.
- **`inside`** is in the order of the view's nodes, by ID.
- **`display.icons`** are the names `hidden`, `linkInside`, `linkOutside`, `readOnly`, `unreadable`, in that fixed order; absent when a node has none.

## What is still open

- **The size of a model:** measured on ZaAnSouVi's own `app/` (3,369 nodes, 14,590 relations, 393 views): 14.4 MB against about 9.2 MB in format 2, `relationEdge` 2.1 MB and the index 1.9 MB of it, built in 1.1 s. The fallback for `relationEdge` (dropping it, the page reading `edges[].members`) is kept unused.
- **Which of a node's keys the Graph draws** is known by name in the page for the Inventory's "unused" marks (`DRAWN_KEYS`, `FND-117`), not stated in the model.
