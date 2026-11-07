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
| `GET /api/tools` | Returns the record of tools, the ordering and each tool's latest result, read from the database |
| `GET /api/source?file=&line=` | Returns that line of the examined file, and the two lines around it |
| `GET /api/log?path=` | Returns a log file as text, only from the data folder |

- **VIEW-03** The backend gets tool data through the Runner (`--read-cache`), and reads the database directly only for the tool list (allowed in the MVP, `MVP_scope.md`, section 4). It writes nothing.
- **VIEW-04** The backend builds the graph model; the page only displays it (`viewer.md`, section 3.1).
- **VIEW-05** One run at a time: a second run request while one is running is refused.

## Building the levels, with no tool-specific code

- **VIEW-10** Nodes come from every output whose `represents` is `nodes`, plus the files from the file list. Each node's parent is its `parent` field.
- **VIEW-11** An output whose `represents` is `containment` re-parents the nodes it names: with M3, each symbol's parent becomes its scope instead of its file.
- **VIEW-12** Edges come from every output whose `represents` is `relations`. A reference becomes an edge from the scope or file it sits in to the symbol it refers to; a link becomes an edge from the import symbol to the declaration.
- **VIEW-13** **File-to-file edges are aggregated by the Viewer** (`MVP_scope.md`, section 5.1): if an edge joins nodes in two different files, the two files are joined, once, with a count. No tool produces file edges.
- **VIEW-14** The code that does this reads only `represents`, `containedIn`, `parent` and IDs. It has no branch on a tool's name. If it needs one, that is a finding against P4.

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
- **VIEW-31** A tool panel lists the three tools in the stored order, read-only, each marked as enabled (all are, in the MVP), with its latest result and a link to its log.
- **VIEW-32** Two buttons: **Run** and **Dry run**. While running, the panel shows each `tool_dry_run` and `tool_run` event as it arrives, with go / no-go and errors. A no-go or failure is shown in red, with the message and the location if there is one.
- **VIEW-33** After a run finishes, the page reloads the graph from `/api/data`. Nothing refreshes on its own otherwise.

## Rendering safety

- **VIEW-40** Every name, path and source line is shown as text, never as HTML (`security.md`, section 8).
