# 05. Viewer

The Viewer as built for the MVP: a local backend and one page in the browser.

## Backend

- **VIEW-01** A local HTTP server, reachable only from this machine (bound to `127.0.0.1`).
- **VIEW-02** Endpoints: *(the table below is superseded by `55_viewer_backend.md`, section 8, on 2026-11-08, which adds the sources, the live stream, the activity log and the security rules; kept as it stood)*

| Endpoint | Does |
|---|---|
| `GET /` | Serves the page |
| `POST /api/run` | Starts `zaansouvi-run <source-root>` and streams its events to the page |
| `POST /api/dry-run` | Starts `zaansouvi-run <source-root> --dry-run-only` and streams its events |
| `GET /api/data` | Calls `zaansouvi-run --read-cache` and returns the graph model built from it |
| `GET /api/tools` | Returns the record of tools, the ordering, each invocation's latest result and the dry-run diagnostics, all read from the Runner's cache (`--read-cache`) |
| `GET /api/source?file=&line=` | Returns that line of the examined file, and the two lines around it |
| `GET /api/log?path=` | Returns a log file as text, only from the data folder |

- **VIEW-03** The backend gets everything through the Runner's cache (`--read-cache`), the tool list included; it doesn't read the database (accepted by the user for the MVP on 2026-11-07; `RUN-27`). ~~It writes nothing.~~ It writes only to its own store (`VIEW-06`).
- **VIEW-04** The backend builds the graph model; the page only displays it (`viewer.md`, section 3.1).
- **VIEW-06** **The Viewer has its own store: `data/viewer/`, JSON files, written only by the Viewer backend** (accepted by the user for the MVP on 2026-11-08; `FND-61`). It is a minimal form of the [Decided] Viewer cache (`viewer.md`, sections 2 and 5), and a starting point: the form may change with what building the Viewer shows (`FND-61`). Nothing else reads it. It never goes into the Runner's database (`ARCH-10`, `ARCH-11`).
  - ~~**`data/viewer/last-good-graph.json`:** the graph model of the last successful real run, with that run's `runId` and `finished` time. The backend writes it, atomically, whenever it builds the graph from a cache whose `run.outcome` is `succeeded` and whose `runId` differs from the stored one.~~ Replaced on 2026-11-08 by one entry per examined source (`VIEW-08`): `data/viewer/sources/<source-key>/last-good-graph.json`, written the same way, atomically, from a cache whose run succeeded.
  - **What the page shows** (answers `FND-60`, item 5, and `FND-44`, item 3; refined by `VIEW-16`: a run must also pass the Viewer's checks, `VIEW-15`, to be stored): the cache's graph when its run succeeded; otherwise the stored last good graph, marked as not the latest, with the reason (the last run failed, or only a dry run since); with neither, "no real run yet", plus any dry-run diagnostics from the cache. A dry run never changes what is shown (`VIEW-31`).
  - **It can be deleted at any time** (`ARCH-09`): the next successful run rebuilds it. Until then, after a failed run, the page has no good graph to show and says so.
  - **Not in it yet:** node positions (`VIEW-22`), preferences, a pending version (`viewer.md`, section 5). If they are added, the store may move to its own SQLite file in the same folder, never the Runner's.
- **VIEW-07** **Starting and stopping, for the MVP** (decided by the user for the MVP on 2026-11-08; answers `FND-60`, item 1, for the MVP; `FND-62`). The backend is started by hand from a shell, `zaansouvi-view [--port <n>]`, from any working folder (it finds everything from its own location). It prints the URL to open, with its token, on standard output; it doesn't open the browser itself. It stays running until stopped by hand (Ctrl + C, or ending the process); no Stop button, no idle stop. Starting from the file manager or a desktop shortcut, and opening the browser automatically, stay wishes for later (`FND-62`). A port already in use is a start-up error with a message naming the port and `--port`.
- **VIEW-08** **Switching the examined source without a restart** (decided by the user on 2026-11-08; `viewer.md`, section 3.4; `FND-63`).
  - The page lists the sources the Viewer has cached and lets the user enter a new source root. Picking one shows its cached graph at once, marked with the time of the run it came from; **Run** runs the Runner on that source root (passed as an argument, `ARCH-03`).
  - **One cache entry per source**, keyed by the source root's absolute real path: `data/viewer/sources/<source-key>/last-good-graph.json` (`<source-key>` a short hash of that path), listed in `data/viewer/sources.json` with the source root and the run it came from. Kept for any number of switches; nothing is dropped automatically.
  - **The Runner's cache holds only the last run's source.** The backend uses it only when its `run.sourceRoot` is the source shown; otherwise it shows the Viewer's entry for that source. `/api/source` reads only files of the source shown, from that entry's file list, under its source root.
  - **An entry the Viewer can't use fails cleanly**: each entry records the graph model's `formatVersion` and the Viewer's version; an entry with another format version, or one that can't be read, isn't shown. The page says why and offers a run for that source, which replaces the entry.
  - **The Runner in the MVP keeps one data folder for every source** (no separate stores per codebase, `toolset.md`, section 5.4, is post-MVP). Switching sources makes M1 run for the new files and M2 and M3 run again; outputs of the other source's files stay in the stores but are ignored (`RUN-18`). That costs a full run on every switch followed by a run, which is acceptable for the MVP; the Viewer's entries make switching back free until the next run.
- **VIEW-09** **Clearing the Runner's and the tools' data by hand** (decided by the user on 2026-11-08; `FND-63`): deleting, or moving aside, `data/zaansouvi.sqlite`, `data/runner/` and `data/tools/` while no run holds the lock. `data/viewer/` is left alone, so every source's cached graph survives. The backend copes with the Runner's data missing at any moment: no Runner cache means it shows the Viewer's entries only. Clearing the Viewer's own cache is a separate act: deleting `data/viewer/`, or one source's folder in it.
- **VIEW-18** **Accepted for the backend** (accepted by the user for the MVP on 2026-11-08; `FND-68`): run events and activity entries reach the page by server-sent events (`FND-60`, item 2); the security minimum of `55_viewer_backend.md`, section 9: a token set as a session cookie, `Host` and `Origin` checks, reads limited to the source's listed files and to `data/`, nothing loaded from the internet (`FND-60`, item 3); the graph rules of `50_viewer_ui.md`, `UI-34` and `UI-36`, and the visual key of `UI-41` (`FND-60`, item 4); the page's TypeScript compiled with `tsc`, no bundler, Cytoscape served from the local install. The backend in full: `55_viewer_backend.md`.
- **VIEW-05** One run at a time: a second run request while one is running is refused. The Runner's lock (`RUN-30`) enforces this whoever starts the run; the Viewer shows its diagnostic.

## Building the levels, with no tool-specific code

- **VIEW-10** Nodes come from every output whose `represents` is `nodes`, plus the files from the file list. Each node's parent is its `parent` field.
- **VIEW-11** An output whose `represents` is `containment` re-parents the nodes it names: with M3, each symbol's parent becomes its scope instead of its file.
- **VIEW-12** Edges come from every output whose `represents` is `relations`. A reference becomes an edge from its `from` (the enclosing function, or the file) to the symbol it refers to, started from the scope that node owns (`VIEW-13`); a link becomes an edge from the import symbol to the declaration. A relation whose `to` is `null` is unresolved: it isn't drawn, and the Viewer shows how many there are, with their reasons (`VW-4`, `DATA-10`).
- **VIEW-13** **Edges are lifted to the nearest visible container, at every level** (decided by the user on 2026-11-08, `MVP-4`; generalizes the [Decided] file-edge aggregation in `MVP_scope.md`, section 5.1): an edge whose ends are hidden inside a container is drawn between the nearest visible containers, once, with a count, and selecting it lists the edges it stands for, each with its file:line; an edge that starts at a node owning a scope (a scope's `owner`) starts from that scope. At level 1 this joins files, once, with a count, as before; at level 2 it shows each scope with the symbols it is used with. For the test source: the scope `run` has edges to the imports `add` and `PRECISION` in its file, to `counter.add` and `math.PRECISION` through M2's use links, and one unresolved name (`console`). No tool produces file or scope edges.
- **VIEW-15** **The Viewer checks every run's output before using or storing it** (decided by the user on 2026-11-08; `viewer.md`, section 6; `FND-64`). The checks are generic, from the field roles only, like `VIEW-14`, run on the server while the graph model is built (`VIEW-04`):
  - **Invalid** (the record is skipped, listed and counted): a node whose `parent` isn't a known node or file; two records with the same ID; a containment record whose child or container isn't known; a relation whose `from` isn't a known node, or whose `to` is neither a known node nor `null`; a scope whose `owner` isn't a known node; a record lacking a field its role needs, or with a malformed Location.
  - **Extra** (listed, not an error): a data name whose `represents` the Viewer doesn't know (not shown); ~~keys in a record beyond the roles in `fields` (ignored);~~ node or edge kinds with no specific style (drawn with a generic one). *(Changed for MVP 2 on 2026-11-09, `FND-69`, item 2, `FND-97`: a record's keys beyond the roles in `fields` are **shown in Details**, every one, as "key: value", so the Viewer uses them and they are no longer extra data, as `viewer.md`, section 6, defines it: data received but not used. A value it can't show as text (an object or list) is shown as compact JSON.)*
  - **A graph that can't be built at all** (the Runner's cache unreadable, or the build failing for any reason) is caught for that source alone; the server keeps running (`VIEW-16`).
- **VIEW-16** **What is shown and stored after the checks** (decided by the user on 2026-11-08; `FND-64`). Per examined source:
  - **Nothing invalid:** the graph is shown and stored as that source's last good graph (`VIEW-08`). Extra data doesn't prevent storing; it is listed in the panel.
  - **Some records invalid:** the new run's graph is shown without them, marked "partly invalid", with the list of skipped records (data name, tool, record ID, problem) and of extra data. It is **not stored**: the source's last good graph stays, and the page can switch to it, marked with its run time. A view never mixes the two runs (`viewer.md`, section 6). Accepting a partly invalid run as the new good one is the pending version of `viewer.md`, section 5: out of the MVP.
  - **Nothing could be built:** the last good graph is shown, marked as not the latest, with the reason; with none, the page says "no good data for this source" and gives the reason.
  - **After a restart or reload,** the same Runner cache is checked again with the same result; nothing about a bad run is remembered except what is in the Runner's cache.
  - **Each entry in `data/viewer/` records its own source root**, so a damaged or missing `sources.json` is rebuilt by reading the entries.
  - **Data that passes the checks but is wrong** can't be caught generically; it is fixed by a new run after the tool is fixed, or by clearing that source's entry by hand (`VIEW-09`).
- **VIEW-17** **The backend keeps an activity log for the session, every entry tagged `minimal`, `normal` or `verbose`** (decided by the user for the MVP on 2026-11-08; MVP only, for debugging and tracking; `FND-66`). It logs its own actions and results and the user's actions it receives, including the page's navigation and selections, which the page reports to it. It sends the page the whole session when the page loads and each new entry as it happens. It appends every entry to a single file, `data/viewer/activity.log`, created if missing; only one backend uses it, so it may be deleted and recreated at any time without breaking anything; the activity line can clear it (`UI-71`, `UI-72`; decided by the user for the MVP on 2026-11-08). The page shows them in the activity line, with a toggle per level (`50_viewer_ui.md`, `UI-62` to `UI-69`). Which entry gets which level is suggested in `UI-62`.
- **VIEW-14** The code that does this reads only `represents`, `containedIn`, `parent`, `owner` (through its `fields` role) and IDs. It has no branch on a tool's name. If it needs one, that is a finding against P4. It doesn't match keys to data itself: it gets the records already grouped by data name from the Runner (`DATA-18`, `RUN-25`), and relies on the agreed key names (`DATA-19`).

## MVP 2: the graph model, format 2

- **VIEW-50** **[Decided] for MVP 2** (`FND-98`, `FND-99`; the MVP 2 schema, section 10): every listed entry is a node at the top level, with its status and, for a file, its type (`UI-47`, `UI-48`); a node's container may be another symbol, so levels go to any depth; built-ins are listed under each view's `builtins`, apart from `unresolved`; a record's other keys are kept as `attrs` and shown in Details (`VIEW-15`); source lines are served only for files a tool read as text (`security.md`, section 7). A stored graph of format 1 is unusable and rebuilt by the next run.

## Levels on the page

| Level | Shows | Edges |
|---|---|---|
| 1. Files | every examined file | aggregated file-to-file edges, labeled with the count |
| 2. Inside a file | the file's scopes (with M3) or its symbols (without M3) | links leaving the file shown as stubs to the other file |
| 3. Inside a scope | the scope's symbols | references and links |

- **VIEW-20** Double-click a node to go one level down into it; a breadcrumb at the top goes back up. The mouse wheel only zooms the current level (`viewer.md`, section 4.9; Ctrl + wheel is out of the MVP).
- **VIEW-21** Without M3, the levels are files › symbols: two levels. With M3, three.
- **VIEW-22** Layout: an automatic layout per level; nodes can be dragged. Positions are not saved in the MVP.
- **VIEW-23** Visual language, kept minimal: one shape per node kind (file, scope, function, variable, parameter, import); declarations solid, references dashed; links in a separate color.

## Details and tools

- **VIEW-30** Selecting a node or edge shows, in a side panel: its kind, name, file:line, and the source line with the lines around it (from `/api/source`).
- **VIEW-31** A tool panel lists the three tools in the stored order, read-only, each marked as enabled (all are, in the MVP), with its latest result and a link to its log. After a dry-run-only pass, it also shows each invocation's go / no-go and error from the dry-run part of the Runner's cache (`RUN-27`); the graph doesn't change. Each tool's diagnostics are listed there too, never in the graph: from each invocation's result in the cache after a real run, and from the dry-run part after a dry-run-only pass (`DATA-14`, `RUN-27`).
- **VIEW-32** Two buttons: **Run** and **Dry run**. While running, the panel shows each `tool_skipped`, `tool_dry_run` and `tool_run` event as it arrives (a skipped tool in grey, marked up to date), with go / no-go and errors. A no-go or failure is shown in red, with the message and the location if there is one.
- **VIEW-33** After a run finishes, the page reloads the graph from `/api/data`. Nothing refreshes on its own otherwise. The Viewer never starts a run on its own: the run button (`/api/run`) is the user's way to reload the graph, and is a manual run that replaces the Runner's cache, like a command-line run (`RUN-27`; decided by the user on 2026-11-07).

## Rendering safety

- **VIEW-40** Every name, path and source line is shown as text, never as HTML (`security.md`, section 8).
