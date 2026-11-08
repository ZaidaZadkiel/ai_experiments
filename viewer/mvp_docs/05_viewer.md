# 05. Viewer

The Viewer as built for the MVP: a local backend and one page in the browser.

## Backend

- **VIEW-01** A local HTTP server, reachable only from this machine (bound to `127.0.0.1`).
- **VIEW-02** Endpoints:

| Endpoint | Does |
|---|---|
| `GET /` | Serves the page |
| `POST /api/run` | Starts `zaansouvi-run <source-root>` and streams its events to the page |
| `POST /api/dry-run` | Starts `zaansouvi-run <source-root> --dry-run-only` and streams its events |
| `GET /api/data` | Calls `zaansouvi-run --read-cache` and returns the graph model built from it |
| `GET /api/tools` | Returns the record of tools, the ordering, each invocation's latest result and the dry-run diagnostics, all read from the Runner's cache (`--read-cache`) |
| `GET /api/source?file=&line=` | Returns that line of the examined file, and the two lines around it |
| `GET /api/log?path=` | Returns a log file as text, only from the data folder |

- **VIEW-03** The backend gets everything through the Runner's cache (`--read-cache`), the tool list included; it doesn't read the database (accepted by the user for the MVP on 2026-11-07; `RUN-27`). It writes nothing.
- **VIEW-04** The backend builds the graph model; the page only displays it (`viewer.md`, section 3.1).
- **VIEW-05** One run at a time: a second run request while one is running is refused. The Runner's lock (`RUN-30`) enforces this whoever starts the run; the Viewer shows its diagnostic.

## Building the levels, with no tool-specific code

- **VIEW-10** Nodes come from every output whose `represents` is `nodes`, plus the files from the file list. Each node's parent is its `parent` field.
- **VIEW-11** An output whose `represents` is `containment` re-parents the nodes it names: with M3, each symbol's parent becomes its scope instead of its file.
- **VIEW-12** Edges come from every output whose `represents` is `relations`. A reference becomes an edge from its `from` (the enclosing function, or the file) to the symbol it refers to, started from the scope that node owns (`VIEW-13`); a link becomes an edge from the import symbol to the declaration. A relation whose `to` is `null` is unresolved: it isn't drawn, and the Viewer shows how many there are, with their reasons (`VW-4`, `DATA-10`).
- **VIEW-13** **Edges are lifted to the nearest visible container, at every level** (decided by the user on 2026-11-08, `MVP-4`; generalizes the [Decided] file-edge aggregation in `MVP_scope.md`, section 5.1): an edge whose ends are hidden inside a container is drawn between the nearest visible containers, once, with a count, and selecting it lists the edges it stands for, each with its file:line; an edge that starts at a node owning a scope (a scope's `owner`) starts from that scope. At level 1 this joins files, once, with a count, as before; at level 2 it shows each scope with the symbols it is used with. For the test source: the scope `run` has edges to the imports `add` and `PRECISION` in its file, to `counter.add` and `math.PRECISION` through M2's use links, and one unresolved name (`console`). No tool produces file or scope edges.
- **VIEW-14** The code that does this reads only `represents`, `containedIn`, `parent`, `owner` (through its `fields` role) and IDs. It has no branch on a tool's name. If it needs one, that is a finding against P4. It doesn't match keys to data itself: it gets the records already grouped by data name from the Runner (`DATA-18`, `RUN-25`), and relies on the agreed key names (`DATA-19`).

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
