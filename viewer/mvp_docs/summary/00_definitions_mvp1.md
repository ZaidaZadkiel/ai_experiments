# Definitions: MVP 1

Every ID of MVP 1, the first implementation (2026-11-07 to 2026-11-09), as settled at the end of MVP 1, in order of ID, with its settled text only: no history, no struck wording, no "was" and "is". Each entry gives the ID, its status and the file that owns it; the owner file holds the reasons and the history. Written 2026-11-10 from the files as they stood then. Summaries: `00_where_we_are.md`, `10_mvp1.md`.

MVP 2 changed some of these; their current text is in `00_definitions_mvp2.md`. Status words: the item's own marker (*Known*, *Suggested*, *Decided*, *Proposed*), or *Accepted*, since everything in `mvp_docs/` is accepted for building the MVP; for findings, their outcome.

**Prefixes:** [`ARCH`](#arch), [`BE`](#be), [`DATA`](#data), [`DEL`](#del), [`FND`](#fnd), [`RUN`](#run), [`TEST`](#test), [`TOOL`](#tool), [`UI`](#ui), [`VIEW`](#view).

## ARCH

Architecture, from `01_architecture.md`.

- **ARCH-01** · *Accepted* · `01_architecture.md`
  The Runner and the Viewer are one unit, in one repository, built together.
- **ARCH-02** · *Accepted* · `01_architecture.md`
  Each tool is a separate program with its own entry point. It imports nothing from the Runner, the Viewer or another tool. It may import a small tool helper module (parameters, logs, `last_run.json`) that knows nothing about any specific tool.
- **ARCH-03** · *Accepted* · `01_architecture.md`
  Tools are started as separate processes, with arguments passed as an array, never through a shell command string (`security.md`, section 7).
- **ARCH-04** · *Accepted* · `01_architecture.md`
  The order is M1 (once per file), then M2, then M3. It comes from the ordering in the database, derived from `--info` (`02_data_contracts.md`). M2 and M3 don't depend on each other; ties break by tool name.
- **ARCH-05** · *Accepted* · `01_architecture.md`
  A run refreshes only the outputs that need it (`RUN-17` to `RUN-22`). With nothing saved, every tool runs and every output is produced; with nothing changed, no tool runs. This follows `toolset.md`, section 5.3 [Decided], and departs from `MVP_scope.md`, section 6, which leaves incremental runs out of the MVP (`FND-36`).
- **ARCH-06** · *Accepted* · `01_architecture.md`
  `last_run.json` sits in each tool's store, `data/tools/<tool>/last_run.json` for the Runner's runs; program folders are never written (`toolset.md`, section 4.5).
- **ARCH-07** · *Accepted* · `01_architecture.md`
  `<file-key>` is the file ID with `/` replaced by `__`, so `src/math.ts` becomes `src__math.ts.json`.
- **ARCH-08** · *Accepted* · `01_architecture.md`
  The examined source is never written to. Nothing goes outside `zaansouvi-mvp/` except the system temp, which the MVP doesn't need.
- **ARCH-09** · *Accepted* · `01_architecture.md`
  The data folder can be deleted at any time; the next run rebuilds it, except the database's `config_` tables, which the Runner recreates on start (`03_runner.md`). With `last_run.json` in the stores (`ARCH-06`), the data folder holds all of the Runner's state: deleting it, or moving it aside, is a full reset. Tools run by hand with no store keep theirs in `./zaansouvi/tools/` of the folder they were started from. Clearing only the Runner's and the tools' data (the database, `runner/`, `tools/`) leaves the Viewer's cache in `data/viewer/` (`VIEW-09`).
- **ARCH-10** · *Accepted* · `01_architecture.md`
  One SQLite file holds both configuration and codebase data (`MVP_scope.md`, section 4). Tables start with `config_` or `project_`. The tables are listed in `02_data_contracts.md`.
- **ARCH-11** · *Accepted* · `01_architecture.md`
  The Runner writes all tables. In the MVP the Viewer backend reads none of them: it reads only the Runner's cache, through `--read-cache` (`RUN-27`), and writes only its own store, `data/viewer/` (no config manager; `VIEW-06`).

## BE

Viewer backend, from `55_viewer_backend.md`.

- **BE-01** · *Known* · `55_viewer_backend.md`
  a local HTTP server on Node's built-in `http` module, bound to `127.0.0.1` (`VIEW-01`, `01_architecture.md`, technology table). It runs as TypeScript directly, like the Runner and the tools (Node's type stripping), and imports only Node built-ins and `app/shared/`; nothing from the Runner's or a tool's code (`ARCH-02` in spirit).
- **BE-02** · *Known* · `55_viewer_backend.md`
  it gets all codebase data from the Runner's output, through `zaansouvi-run --read-cache`, never from the database or the tool stores (`VIEW-03`, `ARCH-11`; `viewer.md`, section 3.1: the Viewer uses only the Runner's output).
- **BE-03** · *Known* · `55_viewer_backend.md`
  it builds the graph model; the page only displays it (`VIEW-04`). It writes only its own store, `data/viewer/` (`VIEW-06`).
- **BE-04** · *Known* · `55_viewer_backend.md`
  it has no tool-specific code; it reads only `represents`, `containedIn`, `contains`, the `fields` roles and IDs (`VIEW-14`). A branch on a tool's name is a finding against P4.
- **BE-05** · *Known* · `55_viewer_backend.md`
  it checks every run's output before using or storing it, and survives bad data (`VIEW-15`, `VIEW-16`; `viewer.md`, section 6).
- **BE-10** · *Known* · `55_viewer_backend.md`
  started by hand from a shell, `zaansouvi-view [--port <n>]`, from any working folder; prints the URL with its token; doesn't open the browser; runs until stopped by hand (`VIEW-07`).
- **BE-11** · *Suggested* · `55_viewer_backend.md`
  the launcher is `app/viewer/zaansouvi-view`, a shell script like the Runner's `app/runner/zaansouvi-run`: it finds its own folder and starts `node --disable-warning=ExperimentalWarning <dir>/server/src/server.ts "$@"`, arguments passed through unchanged. Options: `--port <n>` (default `4310`), `--help`, `--version`. Anything else is a start-up error.
- **BE-12** · *Suggested* · `55_viewer_backend.md`
  start-up, in order:
  1. find the MVP root from the launcher's location (`<root>/app/viewer/..`), so the working folder doesn't matter;
  2. create `data/viewer/` and `data/viewer/sources/` if missing;
  3. read `data/viewer/sources.json`; if it is missing or can't be read, rebuild it from the entries (`BE-32`);
  4. make the token (`BE-60`);
  5. listen on `127.0.0.1:<port>`;
  6. append `viewer_started` to the activity log (`BE-80`) and print the message of `UI-02`.
- **BE-13** · *Known* · `55_viewer_backend.md`
  a port already in use is a start-up error naming the port and `--port` (`VIEW-07`). **[Suggested]** exit codes: `0` after a normal stop, `2` for any start-up error (bad option, port in use, data folder not writable), with one line on standard error.
- **BE-14** · *Suggested* · `55_viewer_backend.md`
  stopping. On Ctrl + C (`SIGINT`) or `SIGTERM`, the server stops accepting requests, closes the live streams, appends `viewer_stopped` (`minimal`) and exits `0`. A Runner run started by it gets the same Ctrl + C from the terminal and stops too; the lock it leaves is taken over by the next run (`RUN-30`, R6). Cancelling a run is out of the MVP (`FND-34`).
- **BE-20** · *Known* · `55_viewer_backend.md`
  JSON files, written only by the backend; nothing else reads them; a starting point that may change (`VIEW-06`, `FND-61`).
- **BE-21** · *Suggested* · `55_viewer_backend.md`
  every file is written atomically, to a temporary file in the same folder then renamed, as the tools do (`TOOL-05`). `activity.log` is the exception: appended one line at a time (`BE-81`).
- **BE-22** · *Known* · `55_viewer_backend.md`
  the folder survives clearing the Runner's and the tools' data, and can itself be deleted at any time; the next successful run rebuilds what is needed (`VIEW-09`, `ARCH-09`).
- **BE-30** · *Known* · `55_viewer_backend.md`
  the backend loads any number of examined sources without a restart; one cache entry per source, keyed by the source root's absolute real path (`VIEW-08`; `viewer.md`, section 3.4).
- **BE-31** · *Suggested* · `55_viewer_backend.md`
  `sources.json`:

  ```jsonc
  { "formatVersion": 1,
    "sources": [ { "sourceKey": "3f9a1c0e2b7d4a65", "sourceRoot": "/home/zaida/viewer/mvp_docs/zaansouvi-mvp/test-source",
                   "name": "test-source", "runId": "<id>", "finished": <Time> } ] }   // runId and finished: the entry's run, or absent
  ```

  `sourceKey`: the first 16 hex digits of the SHA-256 of the real path. `name`: the folder's name, for the picker. Sources are listed in the order they were added.
- **BE-32** · *Known* · `55_viewer_backend.md`
  each entry records its own source root, so `sources.json` can be rebuilt from the entries (`VIEW-16`). **[Suggested]** a source added but never run successfully has no entry folder; it survives only in `sources.json`, and is lost if that file is rebuilt. Acceptable for the MVP.
- **BE-33** · *Suggested* · `55_viewer_backend.md`
  adding a source (`POST /api/sources`) accepts a path only if it is absolute, exists, is a folder, and is not inside the MVP folder's `data/` or `app/`; it is resolved to its real path first, so the same folder added twice gives the same key and isn't listed twice. Adding doesn't run anything.
- **BE-34** · *Suggested* · `55_viewer_backend.md`
  the backend keeps a **current source** for the session (the last one switched to), only to choose what the page opens with; every API call that concerns a source names it with `source=<sourceKey>`, so two tabs can show different sources.
- **BE-40** · *Known* · `55_viewer_backend.md`
  the Runner is started as a separate process with an argument array, never a shell string (`ARCH-03`). **[Suggested]** the launcher `app/runner/zaansouvi-run`, with:
  - a real run: `[<sourceRoot>]`;
  - a dry run: `[<sourceRoot>, "--dry-run-only"]`;
  - reading the cache: `["--read-cache"]`.

  The source root is always passed explicitly; the backend never relies on the Runner's saved one (`RUN-29`).
- **BE-41** · *Known* · `55_viewer_backend.md`
  one run at a time (`VIEW-05`). **[Suggested]** the backend refuses a second run or dry run itself, with `409` and a `run_refused` entry, while one it started is going; a run started from the command line is caught by the Runner's lock, which ends the Runner with exit code `2` and a diagnostic, reported the same way.
- **BE-42** · *Suggested* · `55_viewer_backend.md`
  while a run goes, the backend reads the Runner's standard output line by line; each line is one Runner event (`03_runner.md`, events table), forwarded to the live stream (`BE-70`) and logged at `verbose` (`runner_event`). A line that isn't JSON is logged at `minimal` as a backend warning and otherwise ignored. Standard error is kept and logged if the exit code isn't `0`.
- **BE-43** · *Suggested* · `55_viewer_backend.md`
  when the Runner exits, the backend logs `run_result` or `dry_run_result` (`minimal`), then, for a real run, reads the cache (`--read-cache`), builds and checks the graph model for that source (`BE-50`, `BE-60` series), stores it if it passes (`BE-56`), logs `output_checked`, and announces `graph_updated` on the stream. A dry run changes no graph (`VIEW-31`); its result is kept in memory for the Tools tab and comes back from the Runner's cache (its `dryRun` part, `RUN-27`).
- **BE-44** · *Known* · `55_viewer_backend.md`
  the Runner's cache holds only the last run's source; the backend uses it only when its `run.sourceRoot` is the source asked for (`VIEW-08`). **[Suggested]** it reads the cache on each request that needs it, not once at start-up, since a command-line run may have replaced it; reading is cheap (a few hundred kilobytes for the test source).
- **BE-50** · *Suggested* · `55_viewer_backend.md`
  The model, format 1:

  ```jsonc
  {
    "formatVersion": 1,                         // the model's own format; an entry with another one is refused (VIEW-08)
    "viewerVersion": "0.1.0",
    "sourceKey": "3f9a1c0e2b7d4a65", "sourceRoot": "<Path>",
    "run": { "runId": "<id>", "finished": <Time>, "outcome": "succeeded" },   // from the Runner's cache
    "files": [ "src/counter.ts", "src/main.ts", "src/math.ts" ],              // the cache's file list, in order
    "nodes": [                                   // every node the Viewer knows, files included
      { "id": "src/main.ts", "kind": "file", "dataName": "files.file", "label": "main.ts", "container": null },
      { "id": "src/main.ts#scope@4:1", "kind": "function", "dataName": "code.scope", "tool": "symbol-scope",
        "label": "run", "container": "src/main.ts", "owner": "src/main.ts#run@4:10", "location": <Location> },
      { "id": "src/main.ts#first@5:9", "kind": "variable", "dataName": "code.symbol", "tool": "file-symbols",
        "label": "first", "container": "src/main.ts#scope@4:1", "location": <Location> }
    ],
    "relations": [                               // every relation kept, for details and for unresolved counts
      { "id": "src/main.ts#ref@5:17", "from": "src/main.ts#run@4:10", "to": "src/main.ts#add@1:10", "kind": "call",
        "dataName": "code.reference", "tool": "file-symbols", "location": <Location> },
      { "id": "src/main.ts#ref@8:5", "from": "src/main.ts#run@4:10", "to": null, "kind": "read",
        "dataName": "code.reference", "tool": "file-symbols", "location": <Location>, "label": "console" }
    ],
    "levels": {                                  // one view per node the user can enter, plus the top
      "": { "nodes": [ "src/counter.ts", "src/main.ts", "src/math.ts" ], "stubs": [], "thisNode": null,
            "edges": [ { "id": "src/main.ts->src/math.ts", "from": "src/main.ts", "to": "src/math.ts",
                         "kind": "mixed", "count": 2, "members": [ "<relation id>", "<relation id>" ] } ],
            "unresolved": [ "src/main.ts#ref@8:5", "src/math.ts#ref@5:10" ] },
      "src/main.ts": { ... }, "src/main.ts#scope@4:1": { ... }
    },
    "checks": {                                  // VIEW-15
      "invalid": [ { "dataName": "code.membership", "tool": "symbol-scope", "recordId": "<id or index>", "problem": "the child isn't a known node" } ],
      "extra":   [ { "dataName": "code.metric", "tool": "<tool>", "what": "represents", "detail": "metrics: not known, not shown" } ]
    }
  }
  ```

  The model carries no build time, so the same cache gives the same bytes (as the tools' outputs, `DATA-22`). Node and edge styles are not in it: the page picks them from `dataName` plus `kind` (`UI-41`). `container` is a key name (the node a node is shown inside), kept apart from the records' `parent` because containment can change it (`VIEW-11`); registered in the reference schema with the other keys of this section (`thisNode`, `members`, `recordId`, `what`).
- **BE-51** · *Suggested* · `55_viewer_backend.md`
  **Nodes.** Files come from the cache's file list (`kind` `file`, label the file name, `container` `null`). Every group with `represents: "nodes"` gives nodes: `id`, `kind`, `label` and `location` through its `fields` roles, `container` from the `parent` role, `owner` from the `owner` role if declared. Every group with `represents: "containment"` then re-sets the container of the nodes it names (`VIEW-11`): with M3, each symbol's container becomes its scope.
- **BE-52** · *Suggested* · `55_viewer_backend.md`
  **Relations.** Every group with `represents: "relations"` gives relations, through `fields` (`from`, `to`, `kind`, `location`, and `reason` if present). References of kind `declaration` are dropped (accepted rule, `UI-34`). A relation's `label`, used for unresolved ones, is the record's `name` if it has one.
- **BE-53** · *Suggested* · `55_viewer_backend.md`
  **Lifting, for the view of an entered node `C`** (the top view has `C` = none; accepted rules, `VIEW-13`, `UI-34`, `UI-36`). For each relation whose `to` isn't `null`:
  1. **Owners first:** an end that is a scope's owner is replaced by that scope, at either end (the start rule of `VIEW-13` and its mirror, `UI-34`). A file owns its file scope, so code at file level starts and ends at the file scope.
  2. **Each end is placed:** inside `C`, at its ancestor that is a direct child of `C`; equal to `C`, at the **this node** of `C` (`UI-36`, drawn as "<name>, this scope"); outside `C`, at its ancestor that is a direct child of the lowest common ancestor of the end and `C`, drawn as a **stub**. (At level 2 inside `main.ts` this gives the stubs `counter.ts` and `math.ts`; at level 3 inside the scope `run`, an end in `main.ts`'s file scope gives the stub "main.ts, file scope".)
  3. **An edge whose two ends land on the same node isn't drawn** at this level; it shows one level down (`UI-34`). Neither is an edge between two stubs.
  4. **Edges with the same two ends are merged:** one edge, `count` its members, `kind` theirs if they all share one, else `mixed`, `members` the relation IDs (`VIEW-13`).

  A relation whose `to` is `null` is listed in `unresolved` of every view where its `from` end lands on a shown node, a stub excepted (`VIEW-12`).
- **BE-54** · *Suggested* · `55_viewer_backend.md`
  **Which views are built:** the top view, and one view per node that has a node inside it (files and scopes, with M3). The model holds them all, so moving between levels needs no request. For the test source: 1 top view, 3 file views, 6 scope views.
- **BE-55** · *Suggested* · `55_viewer_backend.md`
  **The test source's views must come out as `50_viewer_ui.md`, section 4.1, says**, edge for edge and count for count. That table becomes the expected result of `BE-91`.
- **BE-56** · *Suggested* · `55_viewer_backend.md`
  **What is stored and shown** (`VIEW-16`): a model with nothing in `checks.invalid` is written as the source's `last-good-graph.json` and replaces the previous one; one with invalid records is returned to the page, marked partly invalid, but never stored; if no model can be built, the page gets the stored one, if any, with the reason. Extra data never stops storing.
- **BE-57** · *Suggested* · `55_viewer_backend.md`
  **Choosing the model for a request** (`GET /api/graph?source=<key>`), in order:
  1. the Runner's cache is for this source and its `run.runId` differs from the stored entry's: build from the cache, check, store if valid (`BE-56`), and return it, with `status` `latest` (or `partly-invalid`, or `failed` when the run's `outcome` isn't `succeeded`, in which case the stored entry is returned with `status` `last-good`);
  2. otherwise the stored entry, `status` `latest` when the cache's run is the same, else `stored`;
  3. otherwise `status` `no-good-data` (a run exists but nothing usable), `no-run` (never run) or `unusable` (an entry with another `formatVersion`, or unreadable), with the reason.

  The page can also ask for the stored entry explicitly (`&which=last-good`), for the switch in `UI-70`.
- **BE-60** · *Known* · `55_viewer_backend.md`
  the checks of `VIEW-15`, generic, run while the model is built. **[Suggested]** In the order they apply:
  - a record lacking a field its role needs, or with a malformed Location: invalid, skipped;
  - two nodes with the same `id`, across all data names: invalid; the second is skipped;
  - a node whose container isn't a known node or file: invalid, skipped (its own members then fail the same check);
  - a containment record whose child or container isn't known: invalid, skipped;
  - a relation whose `from` isn't known, or whose `to` is neither known nor `null`: invalid, skipped;
  - a scope whose owner isn't known: invalid, kept as a node, but no edge starts or ends at it through its owner;
  - **extra**: a group whose `represents` isn't `nodes`, `relations` or `containment` (not shown); keys beyond the roles (ignored, listed once per data name, not per record; `name` and `reason` count as read, `BE-52`); a `kind` the page has no style for is not extra, since it is drawn generically. *(As built, the test source always shows 3 extra items: `code.symbol` `exported`, `import`, `range`; `code.reference` `enclosing`, `symbol`; `code.link` `moduleSpecifier`. To decide whether record keys should count as extra, `FND-69`.)*
- **BE-61** · *Suggested* · `55_viewer_backend.md`
  any error while building, the backend's own included, is caught for that source; the request gets `status` `no-good-data` or `last-good` with the error's message as the reason, and a `minimal` `warn` entry is logged. The server keeps running (`VIEW-15`, `BE-05`).
- **BE-63** · *Suggested* · `55_viewer_backend.md`
  request bodies are JSON, at most 64 KiB; anything else is `400`. Unknown paths are `404`. Errors return `{ "error": "<message>" }`.
- **BE-70** · *Accepted* · `55_viewer_backend.md`
  **Server-sent events** on `GET /api/events` (`FND-60`, item 2). **[Suggested]** each message has an event name and one JSON object:
  - `activity`: one activity entry, as logged (`BE-80`); on connecting, the stream first sends every entry of the session, so a reload shows the whole session (`UI-69`);
  - `runner`: one Runner event, as printed, while a run started by this backend goes;
  - `run_state`: `{ "running": true \| false, "kind": "run" \| "dry-run", "source": "<key>" }`, so every tab can disable its buttons (`UI-23`);
  - `graph_updated`: `{ "source": "<key>" }` after a model was built from a new run, so the page reloads it;
  - a comment line every 15 seconds, to keep the connection open.

  Any number of tabs may be connected; each gets every message.
- **BE-71** · *Accepted* · `55_viewer_backend.md`
  **The security minimum** (`FND-60`, item 3; `security.md`, sections 7 and 8). **[Suggested]** details:
  - **token:** 32 random bytes from Node's `crypto`, written as hex, made at each start and printed in the URL (`UI-02`). `GET /?token=<token>` with the right token sets a cookie (`HttpOnly`, `SameSite=Strict`, path `/`, no expiry: it dies with the browser session) and redirects to `/`, so the token leaves the address bar. Every other request must carry the cookie; without it, or with an old one, the answer is `403` with the text of `UI-03`. Tokens are compared in constant time;
  - **`Host`:** must be `127.0.0.1:<port>` or `localhost:<port>`, else `403`, so a web page that rebinds a name to `127.0.0.1` gets nothing;
  - **`Origin`:** on every `POST`, must be the server's own origin, else `403`; no CORS headers are ever sent;
  - **headers on every answer:** `Content-Security-Policy: default-src 'self'` (no inline script, no outside source), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store` on API answers;
  - **nothing from the internet:** Cytoscape and the page's files are served from the local install (`security.md`, section 8).
- **BE-72** · *Accepted* · `55_viewer_backend.md`
  **Reads only where allowed.** **[Suggested]** `/api/source` accepts only a file ID present in that source's file list (from its model), joins it to the source root, resolves the real path, and refuses (`404`) anything whose real path isn't under the source root's real path; it reads only the lines asked for. `/api/log` resolves the real path and serves it only if it is under the real path of `data/` and ends in `.log`. Both answer `404` rather than say why, so they reveal nothing about other files.
- **BE-73** · *Known* · `55_viewer_backend.md`
  everything the page shows is text, never HTML (`VIEW-40`); the backend sends data, never markup built from data.
- **BE-80** · *Known* · `55_viewer_backend.md`
  one file, `data/viewer/activity.log`, appended, in the shared log format: `<time> TAB <level> TAB <event> TAB <JSON details>`, every entry's details holding `verbosity`, `actor` and `text`, plus its facts; comments start with `#` (`VIEW-17`, `UI-71`; `DATA-16`; reference schema, section 15).
- **BE-81** · *Known* · `55_viewer_backend.md`
  only one backend uses the file, so it may be deleted and recreated at any time (`UI-71`). **[Suggested]** the file is opened, appended to and closed for each entry, so a deleted file just comes back. The session's entries are also kept in memory, for the stream (`BE-70`).
- **BE-82** · *Known* · `55_viewer_backend.md`
  the backend logs its own actions and results and the user's actions it receives (`VIEW-17`); suggested levels in `UI-62`. **[Suggested]** the page reports only an event name and a node ID (`POST /api/activity`); the backend writes the sentence (for example "You entered main.ts", from the node's label), so every entry's text comes from the backend, and a report with an unknown event name is refused (`400`). Event names: `viewer_started`, `viewer_stopped`, `source_added`, `source_opened`, `cached_graph_loaded`, `run_requested`, `dry_run_requested`, `run_refused`, `runner_event`, `run_result`, `dry_run_result`, `output_checked`, `output_partly_invalid`, `entry_unusable`, `graph_switched`, `level_entered`, `level_left`, `node_selected`, `log_opened`, `log_cleared`, `backend_warning`, `backend_error`.
- **BE-83** · *Known* · `55_viewer_backend.md`
  Clear deletes the file and empties the session's entries; the next entry, `log_cleared`, starts the file again (`UI-72`). **[Suggested]** the stream then sends a `cleared` message, so every open tab empties its activity line.
- **BE-90** · *Accepted* · `55_viewer_backend.md`
  **Compiled with `tsc`, no bundler** (option (a), `FND-68`). **[Suggested]**
  - the page's TypeScript lives in `app/viewer/ui/src/`, compiled by `tsc` into ES modules in `app/viewer/ui/dist/`, with `index.html` and `style.css` beside them, served under `/ui/`; `npm run build` in `app/viewer/` does it, and the server refuses to start if `dist/` is missing, saying to run the build;
  - Cytoscape is a dependency of `app/viewer/package.json`, its version pinned when it is installed; the server serves its prebuilt browser file from `node_modules` as `/lib/cytoscape.js`, which the page loads before its own modules;
  - the server's own TypeScript (`app/viewer/server/src/`) runs directly with Node's type stripping, like the Runner, with no build;
  - one `tsc` type check covers both (`npm run typecheck`).
- **BE-91** · *Suggested* · `55_viewer_backend.md`
  **Graph model check:** a script builds the model from `expected/runner-cache.json` and compares it with an expected model, `expected/graph-model.json`, generated from the tables in `50_viewer_ui.md`, section 4.1 (`BE-55`); then builds it twice and compares the bytes (no build time in it).
- **BE-92** · *Suggested* · `55_viewer_backend.md`
  **Checks on damaged caches** (`FND-64`): copies of the cache with a missing container, an edge to an unknown node, a duplicate ID, an unknown `represents` and an extra key; each gives the expected `invalid` or `extra` items, isn't stored, keeps the last good entry, and gives the same answer after a restart. A damaged `sources.json` is rebuilt; an entry with `formatVersion` 0 gives `unusable`.
- **BE-93** · *Suggested* · `55_viewer_backend.md`
  **Endpoints and security** (`FND-31`): no cookie gives `403`; a wrong `Host` or `Origin` gives `403`; `/api/source` with `../`, an absolute path, a file not in the list, or a symbolic link leading out of the source gives `404`; `/api/log` outside `data/` gives `404`; a second run while one goes gives `409`; a body over 64 KiB gives `400`.
- **BE-94** · *Suggested* · `55_viewer_backend.md`
  **Activity log:** a session's entries come back in order on a new stream; deleting `activity.log` while the server runs breaks nothing and the next entry recreates it; Clear empties it; a page report with an unknown event is refused.
- **BE-95** · *Suggested* · `55_viewer_backend.md`
  **The page** stays a human review (P3), against the preview (`FND-67`).
- **BE-100** · *Known* · `55_viewer_backend.md`
  **The page's static files** sit in `app/viewer/ui/static/` (`index.html`, `style.css`); `tsc` writes only `ui/dist/main.js`. Both are served under `/ui/`, `dist/` first (refines `BE-90`). Cytoscape is **3.34.4**, pinned in `app/viewer/package.json`; the server serves `node_modules/cytoscape/dist/cytoscape.min.js` as `/lib/cytoscape.js`, and the page imports only Cytoscape's types.
- **BE-101** · *Known* · `55_viewer_backend.md`
  **The security policy is strict:** `Content-Security-Policy: default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`, with no inline style or script. Checked: Cytoscape draws under it (headless Firefox).
- **BE-102** · *Known* · `55_viewer_backend.md`
  **A body over 64 KiB is read to its end and dropped**, then answered `400`, so the client gets the answer rather than a reset connection (refines `BE-63`).
- **BE-103** · *Known* · `55_viewer_backend.md`
  **The server's TypeScript must be erasable syntax only** (no parameter properties, enums or namespaces): Node's type stripping refuses the rest, and TypeScript 5.6's type check doesn't catch it (`erasableSyntaxOnly` came in 5.8).
- **BE-104** · *Known* · `55_viewer_backend.md`
  **A scope's members are listed in its label**, not drawn as nodes nested inside it: drawn nested, Cytoscape's automatic layout (`cose`) blew the file scope up and overlapped the scopes. A view's node shows its children in its label when they are all leaves (refines `UI-30`).
- **BE-105** · *Known* · `55_viewer_backend.md`
  **The activity log names what the user acted on:** a node by its label, a scope as "scope <name>" or "the file scope of <file>", an edge as "the edge <from> → <to>" (`BE-82`). Invalid records and extra data each get a `verbose` entry, with the item under the key `item`.
- **BE-106** · *Known* · `55_viewer_backend.md`
  **A test hook:** `window.zaansouvi` exposes `enter`, `select`, `tab` and `state`, so a script can drive the page as a double-click, a click or a tab would.
- **BE-107** · *Known* · `55_viewer_backend.md`
  **Layout per level:** Cytoscape's `cose` for two nodes or more, `grid` for one; the view is fitted after each change (the item left open in `FND-60`'s list of what can be decided while building).
- **BE-108** · *Known* · `55_viewer_backend.md`
  **Checks built:** `tests/viewer/check-model.mjs` (`BE-91` and the model part of `BE-92`: the views against `expected/graph-views.json`, byte-identical builds, six damaged caches) and `tests/viewer/check-server.mjs` (`BE-92` to `BE-94` on a temporary copy of the MVP: 32 checks).
- **BE-109** · *Known* · `55_viewer_backend.md`
  **Scopes and files are recognized by their roles, not their data names:** a node with an `owner` is a scope (the file scope when its owner is its container), a node with no container is a file (`VIEW-14`). Data names still pick styles, as `UI-41` accepts.

## DATA

Data contracts, from `02_data_contracts.md`.

- **DATA-01** · *Accepted* · `02_data_contracts.md`
  Every symbol, reference, link and scope carries a Location, so the Viewer can always show file:line and the source line.
- **DATA-02** · *Accepted* · `02_data_contracts.md`
  Symbol ID: `<file ID>#<name>@<line>:<column>`, where line and column are those of the declaring name. Example: `src/math.ts#round@3:17`.
- **DATA-03** · *Accepted* · `02_data_contracts.md`
  Scope ID: `<file ID>#scope@<line>:<column>` for a function scope, at the start of the function's declaration, the start of its `range` (`TOOL-34`; example `src/math.ts#scope@3:1`, including `export`); `<file ID>#scope@file` for the file scope.
- **DATA-04** · *Accepted* · `02_data_contracts.md`
  IDs are the same on every run over an unchanged source. Renaming or moving a declaration changes its ID; all tools must then agree on the new one (`06_test_plan.md`, check C2). Stability across edits is a product concern, not an MVP one.
- **DATA-05** · *Accepted* · `02_data_contracts.md`
  M1 writes `output/<file-key>.json`: `{ "file": FileID, "symbols": Symbol[], "references": Reference[] }`, with the header of `DATA-22`. Its diagnostics go in `result.json` (`DATA-14`).
- **DATA-06** · *Accepted* · `02_data_contracts.md`
  M2 writes `output/links.json` holding only its header and the links: `{ "tool", "toolVersion", "formatVersion", "dataNames": { "code.link": "links" }, "links": Link[] }`. No `counts`, no `inputs`, no `diagnostics`. Links are ordered by the import's position: file ID, then line, then column. An import it can't resolve is a link with `to: null` and a `reason`, not an error.
- **DATA-07** · *Accepted* · `02_data_contracts.md`
  M3 writes `output/scopes.json`: `{ "counts": { "scopeCount", "membershipCount" }, "scopes": Scope[], "membership": Membership[] }`, with the header of `DATA-22`. It keeps `counts`, unlike M2 (`DATA-06`). No `inputs`. Ordered as in `TOOL-35`. Any diagnostics go in `result.json` (`DATA-14`).
- **DATA-08** · *Accepted* · `02_data_contracts.md`
  `--info` prints one JSON object to standard output and exits 0. It reads nothing. The examples below follow M1's actual `--info`, shortened; the Runner reads `parameters` (with `dataName`, `required` and `affectsOutput`), `outputs` (with `formatVersion`, `represents`, `outputFilePattern`, `jsonKey` and `fields`), `readsFiles` and `invocation`.
- **DATA-09** · *Accepted* · `02_data_contracts.md`
  **`source_root` marks a tool that reads files** (`toolset.md`, section 4.2). Such a tool states `readsFiles` and declares `source_root` as required; every file path it uses is resolved against it, and a path outside it is a run error (`E12`). A tool that reads no files states `"readsFiles": false` and doesn't take `source_root` (M2, M3). For M1: `file_path`, optional, is the path of the file to read, absolute or relative to `source_root`; it must lie inside `source_root`, at `file_id`. If absent, M1 reads `source_root` joined with `file_id`. The Runner sends `source_root` only to tools that declare it.
- **DATA-10** · *Accepted* · `02_data_contracts.md`
  `represents` is how the Runner and the Viewer know what an output is, with no tool-specific code: `nodes` become graph nodes inside `containedIn`; `relations` become edges, except a relation whose `to` is `null`, which is unresolved and counted, not drawn (`VW-4`); `containment` re-parents the nodes it names (`05_viewer.md`). These three are the only kinds (diagnostics aren't an output, `DATA-14`). This is the MVP's answer to `RN-12`.
- **DATA-11** · *Accepted* · `02_data_contracts.md`
  The Runner derives the order from `dataName`: a tool whose parameters need `code.symbol` runs after the tool that outputs it. Data no tool outputs, such as `files.file.*`, `project.source_root` and `zaansouvi.store_path`, is provided by the Runner from saved configuration or defaults (`RUN-29`).
- **DATA-12** · *Accepted* · `02_data_contracts.md`
  M1, once per file: `{ "source_root": "<absolute path>", "file_id": "src/math.ts", "file_path": "<absolute path>", "store_path": "<zaansouvi-mvp>/data/tools/file-symbols" }`.
- **DATA-13** · *Accepted* · `02_data_contracts.md`
  M2 and M3, once: `{ "symbols": [ <every code.symbol record> ], "store_path": "<zaansouvi-mvp>/data/tools/<tool>" }` (no `source_root`: they read no files, `DATA-09`); M2 also `"references": [ <every code.reference record> ]` (`TOOL-23`). `symbols` is one flat array of symbol records, not M1's output files: a tool gets only the records of the data it asks for, and nothing else of another tool's output (`RUN-19`). Each record carries `parent`, its file.
- **DATA-14** · *Accepted* · `02_data_contracts.md`
  `result.json` in the tool's data folder: `{ "tool", "toolVersion", "status": "succeeded" | "failed", "started", "finished", "error"?: Diagnostic, "outputPaths": [paths], "diagnostics": Diagnostic[], "logPath" }`. `diagnostics` holds the tool's notes on how the run went, for example M1's `I1` and `I2` on constructs outside the supported set; empty when there are none. Times in ISO 8601, UTC.
- **DATA-15** · *Accepted* · `02_data_contracts.md`
  `last_run.json` in the tool's store holds exactly the parameters of the last real run that got past the parameter check (`toolset.md`, section 4.5), plus `_last_run` (tool, version, outcome, times, error, result path). It is used only as a complete input, when the invocation gives no other (`TOOL-02`). It doesn't record `store_path`: with no JSON input, the tool reads `last_run.json` from the store given with `--store-path`, else from its default store, and that store is the one it writes to.
- **DATA-16** · *Accepted* · `02_data_contracts.md`
  Log format, shared by the Runner and the tools: one entry per line, `<ISO time>\t<level>\t<event>\t<JSON details>`. Comment lines start with `#`, and `# [type] text` gives the comment a type, for example `# [step] reading src/math.ts`. A reader can drop every `#` line and lose no fact.
- **DATA-17** · *Accepted* · `02_data_contracts.md`
  Dry-run output on standard output: JSON lines. The last line is `{ "dryRun": "go", "diagnostics": Diagnostic[] }` or `{ "dryRun": "no-go", "error": Diagnostic }`; the go line carries the same diagnostics a real run would put in `result.json` (`DATA-14`).
- **DATA-18** · *Accepted* · `02_data_contracts.md`
  **The Runner matches JSON keys to their data, according to each tool's `--info`.** From `--info` it knows which parameter key takes which data name, which key of an output file holds which data name (`jsonKey`), and which field of a record plays each role (`fields`: ID, parent, from, to, kind, location). It uses this when it checks outputs and builds each tool's input (`RUN-18`, `RUN-19`), and when it hands data to the Viewer (`RUN-13`, `RUN-25`). Neither the tools nor the Viewer read another tool's `--info` to find data.
- **DATA-19** · *Accepted* · `02_data_contracts.md`
  **One meaning per key name.** The Runner, the tools and the Viewer agree on one specific meaning, with one shape, for each JSON key name, at any depth and in everything they exchange: outputs, `--info`, parameters, `last_run.json`, `result.json`, dry-run lines, log details and Runner events. A key name used in two places means the same thing in both. When two meanings clash, they get different key names. A new key reuses an existing name only if it has exactly that name's meaning. Clashes found so far, and the names M1 now uses: `FND-40`.
- **DATA-20** · *Accepted* · `02_data_contracts.md`
  **A JSON schema is built alongside the MVP, for reference.** It lists every key name with its one meaning and shape, and the structure of every file and line in `DATA-19`. It is for people and log readers: nothing validates against it at run time (the Runner's own check is `RUN-18`). Whenever code adds or changes a key, the schema changes with it. It is `proposed_schema/26-11-09 081006 Proposed JSON schema for every step, the Runner and the Viewer, as built.md`.
- **DATA-21** · *Accepted* · `02_data_contracts.md`
  **Every tool takes an optional `store_path`** (data name `zaansouvi.store_path`), the folder that is its store. It doesn't affect the output. If the input lacks it, the tool uses `./zaansouvi/tools/<tool>/` in the folder it was started from; `last_run.json` is never used to fill it in, only as a complete input (`toolset.md`, section 4.5, `TOOL-43`). Each parameter in `--info` carries `affectsOutput`: `true` for M1's `file_id`, `file_path` and `source_root`; `false` for `store_path`.
- **DATA-22** · *Accepted* · `02_data_contracts.md`
  **Every output file starts with the same header**: `tool`, `toolVersion`, `formatVersion` and `dataNames` (data name to the JSON key holding its records). A tool run once per file adds `file` and `sourceSha256`. A tool run once adds nothing about its inputs: where its input came from is the Runner's to record, in its cache and fingerprint. The output file carries no times, so the same input gives the same bytes. The Runner's shape check relies on it (`RUN-18`). As in the reference schema, section 2.
- **DATA-23** · *Accepted* · `02_data_contracts.md`
  **`readsFiles` needs patterns for one file type** (`toolset.md`, section 4.2, [Decided]; `FND-79`): a tool that reads files states `readsFiles` with `filePatterns`, non-empty, naming the one file type it reads (M1: `["*.ts"]`). `readsFiles` with no or empty `filePatterns` is an inconsistent `--info`, and the Runner refuses the tool. *(As built, an absent list still means every listed file, `readsFile` in `app/runner/src/tools.ts`.)* A tool needing several kinds of file, or a composite file, is a design error and unsupported: each kind gets its own tool, and a tool reading no files combines their outputs. The rule that diagnostics are not data, which held this ID before, has the ID `DATA-25` in MVP 2's docs.

## DEL

Delivery, from `07_delivery.md`.

- **DEL-01** · *Accepted* · `07_delivery.md`
  Every node and edge shows its file:line and the source line with the lines around it.
- **DEL-02** · *Accepted* · `07_delivery.md`
  Out of the MVP: clickable links to a repository host or an editor, longer code quotes, and commit-pinned links.
- **DEL-03** · *Accepted* · `07_delivery.md`
  The code: Runner, Viewer, shared library, tool helper, M1, M2, M3, in one repository, with a short readme on how to install and run it.
- **DEL-04** · *Accepted* · `07_delivery.md`
  The test source and the expected result (`06_test_plan.md`).
- **DEL-05** · *Accepted* · `07_delivery.md`
  The test script for TEST-01 to TEST-04, and a record of B1–B10 and C1–C2 with their actual results.
- **DEL-06** · *Accepted* · `07_delivery.md`
  The human review answers (`06_test_plan.md`).
- **DEL-07** · *Accepted* · `07_delivery.md`
  The findings note (below).
- **DEL-08** · *Accepted* · `07_delivery.md`
  About **two weeks** of one developer working with AI. If the end of the time box is reached, stop and write the findings note with what exists: what didn't get done is itself a finding.
- **DEL-09** · *Accepted* · `07_delivery.md`
  Rough split: test source and expected result, half a day; contracts and tool helper, one day; M1, two days; Runner, two days; M2 and M3, one day; Viewer, three days; tests, review and findings, one and a half days.
- **DEL-10** · *Accepted* · `07_delivery.md`
  The reference JSON schema, built alongside the code and current with it (`DATA-20`).

## FND

Findings, from `99_findings.md`.

- **FND-01** · *Resolved* · `99_findings.md`
  Linking a data name to a part of an output file. Settled by `DATA-18` to `DATA-20`.
- **FND-02** · *Resolved* · `99_findings.md`
  One shape for relations: every record carries `from` and `to`. The remaining items are in `FND-60`.
- **FND-03** · *Resolved* · `99_findings.md`
  Use-site links: M2 also links each use of an imported name to its declaration (option A, `TOOL-23`).
- **FND-04** · *Resolved* · `99_findings.md`
  A dry-run-only pass feeding M2 and M3. Settled by `RUN-16` and `TOOL-09`.
- **FND-05** · *Resolved* · `99_findings.md`
  `TEST-02` and the Runner's start-up writes: `TEST-02` compares the tool stores and the real-run rows, not the database file.
- **FND-06** · *Resolved* · `99_findings.md`
  Stale outputs left by omitted tools or deleted files. Settled by `RUN-13` and `RUN-27`.
- **FND-07** · *Resolved* · `99_findings.md`
  Where a tool writes: the parameter `store_path` (`DATA-21`, `TOOL-43`).
- **FND-08** · *Partly answered* · `99_findings.md`
  Starting the Viewer. Answered for the MVP by `FND-60` item 1 and `FND-63`.
- **FND-09** · *Resolved* · `99_findings.md`
  A symbol's `range` covers its whole declaration.
- **FND-10** · *No status given* · `99_findings.md`
  Call versus read: only a bare-name callee is a call.
- **FND-11** · *Resolved* · `99_findings.md`
  The file scope's location (`TOOL-34`).
- **FND-12** · *Resolved* · `99_findings.md`
  Scope IDs start at the declaration's start (`DATA-03`).
- **FND-13** · *Open* · `99_findings.md`
  A dry-run no-go on an invocation error: a JSON line on standard output, or standard error only.
- **FND-14** · *Open* · `99_findings.md`
  Tool options not complete: `--help`, `--version` and the common options.
- **FND-15** · *Checked fact* · `99_findings.md`
  Syntax errors are found through the compiler's syntactic diagnostics (`program.getSyntacticDiagnostics`).
- **FND-16** · *Accepted* · `99_findings.md`
  The Viewer server's security: token, origin checks, Cytoscape served locally. Accepted through `FND-60` item 3 and `FND-68`.
- **FND-17** · *Open* · `99_findings.md`
  Ctrl + wheel, [Decided] in `viewer.md`, cut from the MVP without saying so. Carried as `FND-60` item 7.
- **FND-18** · *Resolved* · `99_findings.md`
  M3's scope against `MVP_scope.md`. Settled by `FND-55`.
- **FND-19** · *Answered* · `99_findings.md`
  The live-progress mechanism: server-sent events (`FND-68`).
- **FND-20** · *Resolved* · `99_findings.md`
  A damaged `last_run.json` is `E3`, with no fallback, in `security.md` as in `toolset.md`.
- **FND-21** · *Resolved* · `99_findings.md`
  `MVP-1`, `MVP-3` and `MVP-4` answered in `MVP_scope.md`.
- **FND-22** · *Partly answered* · `99_findings.md`
  `expected/` in a form a script can compare.
- **FND-23** · *Partly answered* · `99_findings.md`
  The inputs for the broken-input tests.
- **FND-24** · *Resolved* · `99_findings.md`
  The ordering in `TEST-02`.
- **FND-25** · *Resolved* · `99_findings.md`
  The expected end states for `B7`, `B9`, `C1` and `C2` (`06_test_plan.md`).
- **FND-26** · *Resolved* · `99_findings.md`
  The Runner's error paths are tested by `R1` to `R8`.
- **FND-27** · *Resolved* · `99_findings.md`
  File-edge counts are exact: each counts 2.
- **FND-28** · *No status given* · `99_findings.md`
  A table mapping each success criterion to its tests.
- **FND-29** · *Shown* · `99_findings.md`
  Repeatability, by running twice and comparing: shown in `FND-52` and `FND-57`.
- **FND-30** · *Measured* · `99_findings.md`
  What timings to take and how: measured in `FND-99`.
- **FND-31** · *Partly answered* · `99_findings.md`
  The checks on the Runner and the Viewer.
- **FND-32** · *Open* · `99_findings.md`
  The human review (P3): who reviews, and what counts as a pass.
- **FND-33** · *Resolved* · `99_findings.md`
  How to run the tests: the Node version and a clean state.
- **FND-34** · *Partly answered* · `99_findings.md`
  Stating what is out of scope.
- **FND-35** · *Feasibility* · `99_findings.md`
  M2 written in plain C is feasible; not part of the MVP.
- **FND-36** · *Resolved* · `99_findings.md`
  The MVP refreshes only what changed (`RUN-17` to `RUN-22`).
- **FND-37** · *Resolved* · `99_findings.md`
  "Nothing changed writes nothing" applies to the tools; the Runner still writes its log and its row.
- **FND-38** · *Recommendation* · `99_findings.md`
  Tools keep writing their own stores; the Runner owns the run.
- **FND-39** · *Decided* · `99_findings.md`
  What a tool reads is a design rule, not enforced. Enforcement is `SEC-6`.
- **FND-40** · *Fixed* · `99_findings.md`
  One meaning per key name: the clashing keys renamed in M1 0.2.0.
- **FND-41** · *Resolved* · `99_findings.md`
  The 19 gaps from the Runner review, accepted as suggested.
- **FND-42** · *Resolved* · `99_findings.md`
  An unresolved import is a link with `to: null` and a `reason`. Diagnostics: see `FND-53`.
- **FND-43** · *For review* · `99_findings.md`
  The choices made while building the Runner.
- **FND-44** · *Record* · `99_findings.md`
  The first dry-run-only pass compared with `expected/`: four gaps found.
- **FND-45** · *Record* · `99_findings.md`
  A real run with M1 only: everything from M1 matches `expected/`.
- **FND-46** · *Settled* · `99_findings.md`
  What M2 needs before it is written; built in `FND-48`.
- **FND-47** · *Decided* · `99_findings.md`
  `source_root` marks a tool that reads files.
- **FND-48** · *Built* · `99_findings.md`
  M2 and the tool helper built; M1 on the helper, 673 lines from 1,155, with the same behavior.
- **FND-49** · *Decided* · `99_findings.md`
  M2's parameter is `symbols`.
- **FND-50** · *Record* · `99_findings.md`
  A reference schema; the current one is in `FND-74`.
- **FND-51** · *Record* · `99_findings.md`
  A dry-run-only pass with M1 and M2: 23 of 23 rule checks pass.
- **FND-52** · *Record* · `99_findings.md`
  A real run and a second run with M1 and M2: 18 of 18 checks pass; the second run skips everything.
- **FND-53** · *Accepted* · `99_findings.md`
  Diagnostics go in `result.json`, never in output files (option C).
- **FND-54** · *Done* · `99_findings.md`
  `MVP_scope.md` in line with the decisions; repeatability nice to have for the MVP.
- **FND-55** · *Decided* · `99_findings.md`
  `MVP-4`: option C with C1. M3 records lexical scopes, each naming its owner; the Viewer lifts edges to the nearest visible container.
- **FND-56** · *Open* · `99_findings.md`
  The keys the programs know by name are not listed in one place.
- **FND-57** · *Built* · `99_findings.md`
  M3 built; a full run matches `expected/`, with no change to the Runner.
- **FND-58** · *Decided, fixed* · `99_findings.md`
  The Runner is replaceable by the user's scripts; a tool's output never depends on input order (M3 fixed); `TEST-08`.
- **FND-59** · *Decided, built* · `99_findings.md`
  The default store is in the working folder; `last_run.json` is in the store; `E14`.
- **FND-60** · *Partly answered* · `99_findings.md`
  What the Viewer needs before building: items 1 to 5 answered; items 6, 7 and 8 open.
- **FND-61** · *Accepted* · `99_findings.md`
  The Viewer's own store: JSON files under `data/viewer/`, as a starting point.
- **FND-62** · *Partly decided* · `99_findings.md`
  Starting the Viewer from a shell, a file manager or a shortcut; the browser kept. Open: how the server stops without a terminal.
- **FND-63** · *Decided* · `99_findings.md`
  The MVP backend is started by hand and switches sources without a restart.
- **FND-64** · *Decided* · `99_findings.md`
  The Viewer checks every run's output and survives bad data; the Runner checks shape only.
- **FND-65** · *Done* · `99_findings.md`
  `50_viewer_ui.md` written; the mirror rule for edge ends suggested.
- **FND-66** · *Decided* · `99_findings.md`
  The activity line, its log levels, one appended log file, and Clear. Some details are suggested, not accepted.
- **FND-67** · *Built* · `99_findings.md`
  The static preview of the page.
- **FND-68** · *Accepted* · `99_findings.md`
  The Viewer backend specified (`55_viewer_backend.md`); four blocking decisions accepted.
- **FND-69** · *Built* · `99_findings.md`
  The Viewer built and checked, with six findings from the build.
- **FND-70** · *Record* · `99_findings.md`
  `98_first_implementation.md` written; scope and file labels made generic.
- **FND-71** · *Decided, built* · `99_findings.md`
  Observations from using the Viewer: the edges of a selected node highlighted, no edge labels, several items selected, no breadcrumb dropdown, arrows as they are.
- **FND-72** · *Built* · `99_findings.md`
  A predictable layout. Layout is a subject for after the MVP (`VW-39`).
- **FND-73** · *Built* · `99_findings.md`
  A frame for the scope being viewed, which improves readability. Minor and open: an edge's count can sit on the frame's title.
- **FND-74** · *Record* · `99_findings.md`
  The reference schema as built, the Viewer included.
- **FND-75** · *Open for the MVP* · `99_findings.md`
  A JavaScript project lists no files and gives a misleading error. After the MVP, the file inventory comes first.
- **FND-76** · *Decided, built* · `99_findings.md`
  Text (100%) and Fit buttons, for readable text.
- **FND-77** · *Built* · `99_findings.md`
  Unresolved relations grouped in Problems; built-ins discussed.
- **FND-78** · *Built* · `99_findings.md`
  Tools shown as item boxes.
- **FND-79** · *Decided* · `99_findings.md`
  The Runner lists every file; each tool gets the files its patterns match; one file type per tool.
- **FND-80** · *Deferred* · `99_findings.md`
  File kinds (`40_tools_fileKind.md`), until after the MVP.
- **FND-81** · *Record* · `99_findings.md`
  M1 on JavaScript and JSX: `.js` refused; JSX fails to parse; in plain JavaScript, classes unseen and `require` not an import. Within M1's specification.
- **FND-82** · *Record* · `99_findings.md`
  M1 on class-heavy TypeScript: classes, members, enums and namespaces not symbols, overloads as three functions, member access never a reference, 25 references unresolved. Within M1's specification.
- **FND-83** · *Feasibility* · `99_findings.md`
  TypeScript's binder and checker on a one-file program: feasible and within every rule. In `shapes.ts`, 0 uses unresolved; built-ins told apart with no list of globals.
- **FND-84** · *Considered* · `99_findings.md`
  A whole-program M1 behind a cache: it collides with one file per invocation, the per-file refresh, the dry run's input-only rule and "one thing well".

## RUN

Runner, from `03_runner.md`.

- **RUN-01** · *Accepted* · `03_runner.md`
  One command with only the source root runs the whole process (P2). There are no config files (`MVP_scope.md`, section 8.1).
- **RUN-02** · *Accepted* · `03_runner.md`
  Output is always the Viewer mode: JSON lines on standard output (`--human` is out of the MVP).
- **RUN-03** · *Accepted* · `03_runner.md`
  A missing or unreadable source root stops the Runner with exit code 2 and a diagnostic saying what is missing or wrong. It writes nothing. The source root comes from the command line, else from the saved configuration (`RUN-29`).
- **RUN-04** · *Accepted* · `03_runner.md`
  Open or create the database. Check `config_version`; if it is unknown, stop with a clear message. The first structure version is `1`; a new database is created with it. The same holds in a `--dry-run-only` pass (`RUN-23`).
- **RUN-05** · *Accepted* · `03_runner.md`
  Find the tools in `app/tools/`, call each one's `--info`, and fill `config_tools`. A tool is a folder holding an executable launcher with the folder's name; any other folder is skipped, with a log line. A tool's `--info` must say whether it reads files: `readsFiles` with a required `source_root`, or `readsFiles: false` with no `source_root` and not run once per file; otherwise the Runner refuses to start (`DATA-09`). Derive the order from the `dataName`s and write `config_ordering` (`02_data_contracts.md`, DATA-11). Installation and removal are out of the MVP; the tools are simply there. The same holds in a `--dry-run-only` pass (`RUN-23`).
- **RUN-06** · *Accepted* · `03_runner.md`
  List every `*.ts` file under the source root (skipping `node_modules`), hash it, and write `project_files`. The Runner does this itself (`RN-13`). The same holds in a `--dry-run-only` pass (`RUN-23`).
- **RUN-07** · *Accepted* · `03_runner.md`
  For each tool in the ordering (M1 once per file), check whether its output needs refreshing, and build its JSON from the checked outputs of the earlier tools, in memory (`RUN-17` to `RUN-22`; `02_data_contracts.md`, DATA-12, DATA-13). A tool whose output is up to date is skipped; the others go on to `RUN-08`.
- **RUN-08** · *Accepted* · `03_runner.md`
  Dry-run the tool with `--dry-run --stdin`, passing the JSON. Parse the last line (DATA-17):
  - **go**: continue
  - **no-go** with exit code 2: an invocation error, so a Runner bug. Log it as such and stop
  - **no-go** with exit code 1: a problem in the data. Log it as the tool's error and stop
- **RUN-09** · *Accepted* · `03_runner.md`
  Run the tool for real with `--stdin` and the same JSON. Then read its `result.json` in the store it passed, the log named by `result.json`'s `logPath`, and its output.
- **RUN-10** · *Accepted* · `03_runner.md`
  If the result is `failed`, stop. Otherwise write `project_outputs` and `project_tool_runs`, and go on.
- **RUN-11** · *Accepted* · `03_runner.md`
  M1 is invoked once per file, dry run then real run each time. For two or three files that is a handful of processes; record the time it takes as a finding (`TS-31`). There is no timeout: a tool that hangs blocks the run until it is stopped by hand. This is a scope cut, together with cancel (`FND-34`).
- **RUN-12** · *Accepted* · `03_runner.md`
  At the end, write `project_runs` and print `run_finished` with the outcome.
- **RUN-13** · *Accepted* · `03_runner.md`
  `--read-cache` prints one `cache` event holding **exactly the Runner's cache** (`RUN-27`), with the records grouped by data name (`RUN-25`). It reads nothing else: not the tool stores, not the database. It starts no tool and writes nothing. With no cache yet, the event is empty.
- **RUN-14** · *Accepted* · `03_runner.md`
  Every run writes `data/runner/logs/<timestamp>.log` in the shared format (DATA-16), a `--dry-run-only` pass too, with the pass marked as a dry run in its first entry (`RUN-23`).
- **RUN-15** · *Accepted* · `03_runner.md`
  For every tool invocation, the log records the time, the exact command line, the JSON sent, the dry-run result and the real result. A user can repeat any step by hand from it.
- **RUN-16** · *Accepted* · `03_runner.md`
  **Each tool's dry run works from the saved stores** (the MVP's answer to `RN-11`). The Runner builds a tool's JSON from what is saved: the earlier tools' outputs in their stores. Nothing passes from one dry run to the next through what it prints.
  - In a real run, each tool's dry run comes after the earlier tools' real runs, so it sees their fresh outputs.
  - In a `--dry-run-only` pass, it sees the outputs left by the last real run, so the pass previews each step against that run.
  - If the stores hold no output for a parameter, the Runner still sends the parameter, empty, so the tool's parameter check passes and the tool itself reports no-go (`TOOL-09`). As with any no-go, the Runner stops (`RUN-08`). On a fresh data folder, a `--dry-run-only` pass therefore reports go for M1 on every file, then no-go for M2, and stops. This is the status-check warning "a missing output from an earlier tool" (`toolset.md`, section 4.3).
  - The Runner takes saved outputs only for files in the current file list. If a file in the list has no saved output, or its hash differs from the one in `project_files`, the Runner sends what it has and lists those file IDs as `staleInputs` in the tool's `tool_dry_run` event. The tool's go / no-go stands.
- **RUN-17** · *Accepted* · `03_runner.md`
  **Check before running.** For each invocation in the ordering (each tool, and M1 once per file), the Runner decides whether a refresh is needed (`RUN-20`). If it is, the tool is dry-run and run as in `RUN-08` to `RUN-10`. If not, the tool is skipped: the Runner prints `tool_skipped`, starts no process, and leaves the output as it is. A `--dry-run-only` pass is the exception: it is a status check, so it dry-runs every invocation, and marks those a real run would skip as `up-to-date` in their `tool_dry_run` event.
- **RUN-18** · *Accepted* · `03_runner.md`
  **Shape check of the available outputs.** The Runner reads the saved outputs of every earlier tool in the ordering and checks their shape against each tool's `--info`:
  - the output file exists and parses as JSON
  - for every output the tool declares, the file holds an array under the output's `jsonKey` (`FND-01`), and the `formatVersion` recorded in the file matches the output's `formatVersion` in `--info`
  - every record has the fields `--info` maps for its kind (`represents`): an ID and a parent for nodes; a from and a to for relations (`to` may be `null`: an unresolved relation); a contained and a container field for containment; and a Location (`DATA-01`).
  - for a per-file tool, only the outputs of files in the current file list count; outputs of files no longer in the list are ignored (part of `FND-06`)

  An output that fails any of these counts as missing. The check is only of shape: it doesn't judge whether the content is right.
- **RUN-19** · *Accepted* · `03_runner.md`
  **Building the inputs.** For each parameter of the next tool, the Runner finds the earlier tool whose `--info` outputs the parameter's `dataName` (`DATA-11`) and builds the value from that tool's checked outputs: **only the records of that data name**, found under the output's `jsonKey` (`DATA-18`), never the rest of the output file. From a per-file tool, one flat array: files in file ID order (`RUN-28`), each file's records in their order. From a tool run once, its records. Values with a data name no tool outputs are provided by the Runner (`RUN-29`). In a real run, the earlier tools have just been refreshed or found up to date, so their outputs are all there; if one still fails the shape check, see the errors table. In a `--dry-run-only` pass, a missing output gives an empty parameter and the tool's no-go (`RUN-16`, `TOOL-09`).
- **RUN-20** · *Accepted* · `03_runner.md`
  **When a refresh is needed.** The Runner computes the invocation's **input fingerprint**: the SHA-256 of the tool's name, its `toolVersion` from `--info`, the JSON built in `RUN-19` with its keys sorted, and, for each parameter with a `files.file.*` data name, the current hash of that file from the file list. A refresh is needed, with the first matching reason, when:
  - `missing`: the tool's own saved output is absent, or fails the shape check in `RUN-18`
  - `never-run`: `project_tool_runs` has no successful run of this invocation
  - `last-failed`: its last real run failed
  - `inputs-changed`: the fingerprint differs from the one recorded for its last successful run (this covers a changed source file, a changed earlier output, and a new tool version)
  - in a `--dry-run-only` pass only, `upstream-refresh`: an earlier tool it takes input from would be refreshed. The saved outputs it would get are about to change, so it can't be judged up to date; its dry run uses the saved outputs and reports `staleInputs` (`RUN-16`)

  Otherwise the output is **up to date**. Skipping assumes tools are repeatable: the same input gives the same output (`DATA-04`, checked by `TEST-04`). For the MVP, repeatability is nice to have, not a hard requirement; the product decision depends on what the MVP finds (`MVP_scope.md`, section 1).
- **RUN-21** · *Accepted* · `03_runner.md`
  **How a change spreads.** Since a tool's fingerprint covers the earlier outputs it receives, a change spreads exactly as far as outputs actually change. Editing one file reruns M1 for that file only. M2 and M3 rerun only if that M1 output changed. An M1 rerun that gives a byte-identical output leaves M2 and M3 skipped. This is the MVP's answer to "how a change spreads" (`toolset.md`, section 5.3, to define).
- **RUN-22** · *Accepted* · `03_runner.md`
  **Recording.** A real run records the fingerprint in `project_tool_runs` and `project_outputs`. A skipped invocation is recorded in `project_tool_runs` as `skipped`, with the reason `up-to-date`. When nothing changed, no tool runs and no tool output is written; the Runner still writes its log and the `project_runs` row (`RUN-12`, `RUN-14`; see `FND-37`). A `--dry-run-only` pass makes the same decisions and reports them in its `tool_dry_run` events. It records no fingerprint, no `skipped` row and no output (`RUN-23`).
- **RUN-23** · *Accepted* · `03_runner.md`
  **A `--dry-run-only` pass may read anything it needs, and the Runner may write whatever is useful.** The no-write rule of a dry run binds the tools only (`toolset.md`, section 4.3).
  - It may read the database, every tool's store, the examined source and each tool's `--info`.
  - It starts like a real run: it creates the database if missing, fills `config_tools` and `config_ordering` (`RUN-04`, `RUN-05`), writes `project_files` (`RUN-06`), and writes its log (`RUN-14`) and a `project_runs` row marked as a dry run.
  - It writes nothing that records a real run: no `project_outputs` row, and no fingerprint, success or `skipped` row in `project_tool_runs`. So the next real run's refresh check (`RUN-20`) is unaffected. It may record the dry-run results in `project_tool_runs`, marked as dry runs.
  - Its report goes to standard output, as Viewer-mode events.
  - Each tool's dry run in the pass writes nothing (`TOOL-06`, `TOOL-40`).
- **RUN-24** · *Accepted* · `03_runner.md`
  **The Runner checks a tool only through its input and its output:** the JSON it builds, the dry-run lines and exit code, `result.json` and the output's shape (`RUN-18`). It doesn't watch or limit what a tool reads or writes. A tool that reads more than its one file, or the database, is a design error in that tool, not a Runner error (`toolset.md`, section 4.2).
- **RUN-25** · *Accepted* · `03_runner.md`
  **Matching keys to data is the Runner's job** (`DATA-18`). It finds every record only through the tools' `--info` (`jsonKey`, `fields`, parameter data names), never with tool-specific code. In the `cache` event (`RUN-13`) it hands the Viewer the records already grouped by data name, each group with the `--info` details the Viewer needs (`represents`, `containedIn`, `contains`, `fields`), so the Viewer never matches keys itself.
- **RUN-26** · *Accepted* · `03_runner.md`
  **The Runner always sends `store_path`**: from the saved configuration, else the default `<zaansouvi-mvp>/data/tools/<tool>`, the layout in `01_architecture.md` (`DATA-12`, `DATA-13`, `RUN-29`). It never relies on a tool's default or on `last_run.json` for the store, and reads each tool's result and outputs only from that folder.
- **RUN-27** · *Accepted* · `03_runner.md`
  **The Runner's cache** (`runner.md`, section 10.2).
  - The MVP has one implicit run configuration (`RUN-01`), so one cache: `data/runner/cache.json`.
  - **Each real run replaces it**, written to a temporary name and renamed at the end, failed runs included.
  - **What goes where.** The database keeps only what the refresh check needs: file hashes, fingerprints, the last result of each invocation, and the runs (`RUN-20`, `RUN-22`). The cache holds what the Viewer reads. The Viewer reads only the cache, through `--read-cache` (`VIEW-03`).
  - **Its shape** is one JSON object with `run`, `files`, `tools`, `invocations`, `data` and `dryRun`, described in the reference schema, section 13. Each tool output is stored once under `data`; an invocation's input points to it instead of copying it.
  - It holds the run's input, result and intermediate data: run ID, outcome and times; the file list; the record of tools and the order used; for each invocation, the JSON sent, the dry-run result, the tool's `result.json`, and `skipped` with its reason; and the data each tool produced, grouped by data name with its `--info` details. Outputs of tools skipped as up to date are read from their stores (`RUN-18`) and included, so the cache always describes the whole current state.
  - It holds only tools in the current record and files in the current file list, so after check C1 or a deleted file the old data is gone from what the Viewer sees (`FND-06`).
  - Per-file results come from the cache too: M1 keeps one `result.json` per store, but the cache keeps each invocation's result.
  - **A `--dry-run-only` pass leaves alone the part of the cache the Viewer draws from** (`runner.md`, section 10.2). It replaces only a separate dry-run part: for each invocation, `go` or `no-go`, the refresh reason or `up-to-date`, the error, the diagnostics from the tool's go line (`DATA-17`) and `staleInputs`. After a real run, each invocation's diagnostics are in its `result` in the cache. The Viewer may show that part, but never in the graph. A real run replaces the whole cache, dry-run part included, which drops it.
  - Tools never read it; they work only from their inputs and manage their own cache if they need one.
- **RUN-28** · *Accepted* · `03_runner.md`
  **One fixed order: sorted by file ID.** The Runner handles files in order of their file ID, by plain string comparison (character codes, case-sensitive: JavaScript's default sort). M1 is invoked in that order, and every array the Runner builds by file follows it: the file list, the `symbols` and `references` parameters of M2 and M3, and the Runner's cache. The order affects no tool output, since M1 reads one file per run. It makes the stop point after a failure, the events, the fingerprint (`RUN-20`) and the cache the same on every run. For the test source: `src/counter.ts`, `src/main.ts`, `src/math.ts`.
- **RUN-29** · *Accepted* · `03_runner.md`
  **Data the Runner provides** (`runner.md`, section 4). The Runner provides every value tools require that no tool produces. It reads the value from the saved configuration (the `config_` tables); if it isn't there, it creates it from a default; if the value isn't valid, it fails before any tool starts.
  - `files.file.id`, `files.file.path`: from the file list it builds (`RUN-06`, `RUN-28`). The order of the tools is derived the same way, from `--info` (`RUN-05`).
  - `zaansouvi.store_path`: default `<zaansouvi-mvp>/data/tools/<tool>` (`RUN-26`).
  - `project.source_root`: **user-defined, with no default.** It comes from the command line; the Runner saves it in `config_settings` and reads it back when a run gives none, for example from the Viewer's run button. If it is missing, the Runner prints a diagnostic saying what is missing and how to give it, and exits 2 (`RUN-03`). This is internal to the Runner and the Viewer; it goes only to tools that read files, those that declare `source_root` (`DATA-09`), and every file path they receive depends on it.
  - A required parameter whose data name is neither output by a tool nor in this list stops the Runner before any tool starts, with a diagnostic naming the tool and the parameter, exit 2. An optional parameter that doesn't affect the output is not sent (`TOOL-43`).
- **RUN-30** · *Accepted* · `03_runner.md`
  **One run at a time** (`runner.md`, section 4).
  - When a run starts, the Runner creates `data/runner/run.lock` with an exclusive create, holding its process ID and start time. It removes the lock when the run ends, whatever the outcome.
  - If the lock already exists and its process is alive, the new run prints a diagnostic naming the running run and exits 2, writing nothing. If its process is gone, the lock is stale: the Runner takes it over and notes it in its log.
  - A `--dry-run-only` pass takes the lock too; `--read-cache` doesn't (the cache is replaced in one step, `RUN-27`).
  - Tools take no lock; they are assumed to run only from the Runner. A tool run by hand is the user's action. If it changed an output, the problem shows up only when that output is read as wrong input: the Runner's shape check (`RUN-18`) or the reading tool's own checks (`E12`) detect it and write an error and a diagnostic.
- **RUN-31** · *Accepted* · `03_runner.md`
  **The Runner's exit codes**: `0` when the run finished, including when every invocation was skipped; `1` when a tool's no-go or failure stopped it; `2` for an invocation or start-up error: a bad or missing source root, missing user data, the lock held by another run, an unknown database version, a provided value that isn't valid, or a required parameter nobody provides. `run_finished` carries the exit code.
- **RUN-32** · *Accepted* · `03_runner.md`
  **The Runner starts every tool in its data folder** (`<zaansouvi-mvp>/data`), never in the folder it was itself started from, so a Runner started from inside the examined source never runs a tool there (`E14`; `runner.md`, section 4). Checked: a run started from `test-source/src` succeeds and writes nothing into the source.

## TEST

Test plan, from `06_test_plan.md`.

- **TEST-01** · *Accepted* · `06_test_plan.md`
  Starting from an empty data folder (delete `data/`), so every tool runs, a script runs `zaansouvi-run test-source`, then compares the outputs with `expected/`: symbols by file, name, kind and line; references by file, line, name, kind and target; links; scopes and membership. It prints every difference.
- **TEST-02** · *Accepted* · `06_test_plan.md`
  Run after TEST-01, so the stores hold a real run's outputs (`RUN-16`). `zaansouvi-run test-source --dry-run-only` reports `go` for every step, each marked `up-to-date` and with no `staleInputs`, and leaves every tool's store (`data/tools/`) and each tool's `last_run.json` unchanged (compare file hashes before and after). In the database, `project_outputs` and the real-run rows of `project_tool_runs` are unchanged (compare rows). The Runner's log, `project_runs` and its other rows may change (`RUN-23`).
- **TEST-03** · *Accepted* · `06_test_plan.md`
  On a fresh data folder (delete `data/tools/`), `zaansouvi-run test-source --dry-run-only` reports `go` for M1 on each of the three files, then `no-go` for cross-file-links with `E12` naming `code.symbol` (`TOOL-09`). The Runner stops: symbol-scope is never invoked, and no tool writes anything (`data/tools/` holds no output, result or log).
- **TEST-04** · *Accepted* · `06_test_plan.md`
  Refresh check (`RUN-17` to `RUN-22`), each step after TEST-01, on a copy of `test-source`:
  - **Nothing changed:** a second run prints `tool_skipped` for all five invocations, starts no tool, and leaves every output file untouched (same hash and modification time).
  - **One file edited:** add an empty first line to `main.ts`, which moves every location in it. M1 runs for `main.ts` only (`counter.ts` and `math.ts` skipped); cross-file-links and symbol-scope run with reason `inputs-changed`.
  - **Damaged output:** replace `links.json` with `{}`. cross-file-links runs with reason `missing`; M1 and symbol-scope are skipped, since their inputs didn't change.
  - **Dry run after an edit:** remove that empty line again, then run `--dry-run-only`. Every invocation is dry-run and says go. M1 for `main.ts` has reason `inputs-changed`, M1 for the other two files is `up-to-date`; cross-file-links and symbol-scope are dry-run with reason `upstream-refresh` and `staleInputs: ["src/main.ts"]`; no tool output is written.
- **TEST-05** · *Accepted* · `06_test_plan.md`
  After TEST-01, `zaansouvi-run --read-cache`: one `cache` event; `run.outcome` is `succeeded`; `files` lists the three file IDs in order; `tools` lists the three tools in order; `invocations` has five entries; the records under `data` match what TEST-01 compared with `expected/`. The whole cache matches `expected/runner-cache.json`, the events of TEST-01 match `expected/run-events.jsonl`, and TEST-04's "nothing changed" run matches `expected/run-events-second.jsonl`, under the rules in `expected/README.md` (proposed). On a fresh data folder, the event's `cache` is `null`, exit code 0.
- **TEST-06** · *Accepted* · `06_test_plan.md`
  `tests/m3/check.mjs`: builds M3's input from M1's outputs as the Runner does (`symbols` only, file ID order, `RUN-19`), runs the dry run then the real run, and compares `output/scopes.json` with `expected/symbol-scope.json` exactly, except `about`: header, `counts` (6 scopes, 13 memberships), scope IDs, `owner`, locations (the file scopes ending at 8:2, 10:2 and 6:2, `TOOL-34`), order (`TOOL-35`) and memberships. It also checks that the dry run says go and writes nothing, that `result.json` says succeeded with no diagnostics, and that a second run with the same input gives the same bytes (`DATA-22`).
- **TEST-07** · *Accepted* · `06_test_plan.md`
  **Nested functions and a file with file-level symbols only.** Two extra source files in `tests/m3/source/`, run through M1 first, so M3 gets real records, then through M3 together (file ID order). Values from M1 0.5.0's real output:

  `src/nested.ts`:
  ```ts
  export function outer(a: number): number {
    function inner(b: number): number {
      return b * 2;
    }
    return inner(a);
  }

  export function second(): number {
    return outer(1);
  }
  ```
  `src/only-vars.ts`:
  ```ts
  export const LIMIT = 10;
  let count = 0;

  // trailing comment
  ```
  Expected: 4 scopes and 7 memberships.

  | Scope | Location | Members |
  |---|---|---|
  | `src/nested.ts#scope@file` | 1:1 to 10:2 | `outer@1:17`, `second@8:17` |
  | `src/nested.ts#scope@1:1` (owner `outer`) | 1:1 to 6:2 | `a@1:23`, `inner@2:12`, `b@2:18` |
  | `src/nested.ts#scope@8:1` (owner `second`) | 8:1 to 10:2 | none |
  | `src/only-vars.ts#scope@file` | 1:1 to 2:14 | `LIMIT@1:14`, `count@2:5` |

  It checks that `inner` gets no scope and that its parameter `b` belongs to `outer`'s scope (`TOOL-30`, one level only); that a function's own name belongs to the scope outside it (`TOOL-31`); that a function scope with no members is still output; and that the file scope of `only-vars.ts` ends at its last declaration (2:14), short of the trailing comment on line 4 (`TOOL-34`, accepted shortfall). A file with no symbols can't be tested through M3: its symbols never reach M3, so it simply has no scopes (`TOOL-34`).
- **TEST-08** · *Accepted* · `06_test_plan.md`
  `tests/hand-run/hand-run.sh`: runs the Runner on `test-source/`, then runs M1, M2 and M3 by hand in a temporary folder, using only the tool contract (JSON on standard input through `jq`, exit codes, output files), with the files in reverse file ID order on purpose and whole M1 output files passed to M3, extra keys and all. Every tool output must be byte-identical to the Runner's (`toolset.md`, section 2: the Runner can be replaced by a user's own scripts; unknown keys are ignored; a tool's output never depends on the order of its input records). `tests/m3/check.mjs` also checks the last rule for M3 alone, with its input reversed.
- **TEST-09** · *Accepted* · `06_test_plan.md`
  `tests/viewer/check-model.mjs`: the graph model built from `expected/runner-cache.json` matches `expected/graph-views.json` view by view (nodes, stubs, the "this" node, edges with their counts and kinds, unresolved counts); two builds give the same bytes; six damaged caches give the expected invalid or extra items (`BE-91`, `BE-92`).
- **TEST-10** · *Accepted* · `06_test_plan.md`
  `tests/viewer/check-server.mjs`: the backend on a temporary copy of the MVP: the token, `Host` and `Origin` checks, the 64 KiB limit, sources, the graph and its storing, reads limited to listed files and to `data/` (a symbolic link out included), the activity log (deleted while running, unknown events, Clear), a run and a refused second run, and bad data across restarts (partly invalid, failed, an entry in another format, a damaged `sources.json`, cleared Runner data). 32 checks (`BE-92` to `BE-94`).

## TOOL

Tools, from `04_tools.md`.

- **TOOL-01** · *Accepted* · `04_tools.md`
  Options: `--info`, `--dry-run`, `--json <path>`, `--stdin`, `--log <path>`.
- **TOOL-02** · *Accepted* · `04_tools.md`
  Parameters are read in the decided order (`toolset.md`, section 4.5): command-line arguments, then `--json` or `--stdin` (both together is an invocation error), then `last_run.json`. With none of these, the tool fails with an invocation error and writes nothing.
- **TOOL-03** · *Accepted* · `04_tools.md`
  Parameter check: only **shape** problems are invocation errors (exit 2, nothing written): a required parameter missing, a value of the wrong type, JSON that doesn't parse. **Value** problems are run errors (exit 1, logged).
- **TOOL-04** · *Accepted* · `04_tools.md`
  Once the parameters pass the check, the tool writes `last_run.json`, then does its work, writing its log as it goes.
- **TOOL-05** · *Accepted* · `04_tools.md`
  On success it writes its output and `result.json` with `succeeded`. On a run error it writes `result.json` with `failed` and the error, writes no output, and leaves the earlier output as it was. Output is written to a temporary name and renamed at the end, so it is never half-written.
- **TOOL-06** · *Accepted* · `04_tools.md`
  A dry run does the same work and prints its findings and a final `go` / `no-go` line to standard output (DATA-17). It reads what a real run reads (`TOOL-40`), but writes nothing at all: no output, no result, no log, no `last_run.json`, no internal state and no temporary file (`toolset.md`, section 4.3).
- **TOOL-07** · *Accepted* · `04_tools.md`
  `--log <path>` also copies the log to that file. The log in the tool's data folder is always written.
- **TOOL-08** · *Accepted* · `04_tools.md`
  Extra values in the JSON are ignored.
- **TOOL-09** · *Accepted* · `04_tools.md`
  **A dry run works only from the input it is given, and says no-go when there is none.** It reads its input exactly as a real run would: M1 reads the source file; M2 and M3 read the earlier outputs in their JSON, which the Runner takes from the saved stores (`RUN-16`). A required input that is present but empty, for example `symbols: []`, is a run error: no-go with `E12` ("lacks what the tool needs"), exit 1, and a message naming the missing data name, for example `code.symbol`. The tool never previews from nothing. A missing source file is `E6`, as in a real run. The same rule holds in a real run, which fails with the same error.
- **TOOL-10** · *Accepted* · `04_tools.md`
  Parse the file with the TypeScript compiler's parser (`ts.createSourceFile`), without type checking. If the parser reports syntax errors, fail with `E12`.
- **TOOL-11** · *Accepted* · `04_tools.md`
  Symbols, in the supported constructs below: function declarations, `const` / `let` / `var` declarations, function parameters, and named imports. Mark `exported` when declared with `export`.
- **TOOL-12** · *Accepted* · `04_tools.md`
  References: every identifier that is a declaration name, a call target, a read or an assignment target. **Property names after a dot are not references**: in `Math.round(...)`, `Math` is a reference and `round` is not.
- **TOOL-13** · *Accepted* · `04_tools.md`
  Resolve each reference to a symbol **in the same file** by name: the nearest declaration in the enclosing functions, then the file. If none, `symbol` is `null`. No cross-file work: that is M2's job.
- **TOOL-14** · *Accepted* · `04_tools.md`
  Kinds: `declaration` for the declaring name; `write` for the left side of `=`, `+=` and the like; `call` for the callee of a call; `read` otherwise.
- **TOOL-20** · *Accepted* · `04_tools.md`
  M2 works from the symbol records alone (`DATA-13`). For every symbol of kind `import`, resolve `import.moduleSpecifier` relative to the importing file, the symbol's `parent`: try `<moduleSpecifier>.ts`, then `<moduleSpecifier>/index.ts`. Among the symbols whose `parent` is that file, find an exported one named `import.importedName`. `no such file` means no symbol of that file is in the input: M2 gets no file list, so a file that declares nothing looks missing, an acceptable failure. If found, output a link; if not, output a link with `to: null` and the `reason`: `no such file` or `not exported`.
- **TOOL-21** · *Accepted* · `04_tools.md`
  Module specifiers that don't start with `.` (packages) give a link with `to: null` and reason `external`.
- **TOOL-22** · *Accepted* · `04_tools.md`
  M2 checks only its own input. Run errors (`E12`): `symbols` empty (`TOOL-09`), or two symbol records with the same `id`. Whether M1's records are right is M1's responsibility (`TOOL-41`); M2 doesn't check M1's references; it reads them only to find uses of imported names (`TOOL-23`).
- **TOOL-23** · *Accepted* · `04_tools.md`
  **Use-site links** (as `MVP_scope.md`, section 2 [Decided], describes). M2 also reads M1's references (`references`, data name `code.reference`; still only M1's records, never its files). For every reference that isn't a declaration and whose `to` is an import symbol M2 resolved, it outputs a link: `id` `<reference id>-><declaration>`, `from` the reference's `from` (the enclosing function, or the file at file level), `to` the declaration, `kind` the reference's kind (`call`, `read` or `write`), `location` the reference's, and the import's `moduleSpecifier`. A use of an unresolved import gives no extra link: the import's own link already says it is unresolved. Import links and use-site links are ordered together by position (file ID, line, column).
- **TOOL-24** · *Accepted* · `04_tools.md`
  **M2's remaining rules**:
  - default and namespace imports (`importedName` `"default"` or `"*"`) give a link with `to: null` and reason `unsupported`;
  - type-only imports (`typeOnly: true`) are linked like any other import;
  - a specifier written with an extension (`"./math.js"`) resolves to `no such file`: an acceptable failure (`MVP-11`);
  - invocation errors (`E13`, nothing written): `symbols` or `references` missing or not an array; a symbol record that isn't an object or lacks `id`, `kind`, `parent` or `location` (and `import` with `moduleSpecifier` and `importedName` on an import); a reference record that isn't an object or lacks `id`, `kind`, `from`, `to` (a string or `null`) or `location`;
  - the dry run prints only its log lines and the final go / no-go line (`DATA-17`), no preview line.
- **TOOL-30** · *Accepted* · `04_tools.md`
  For each file, create the file scope and one scope per **top-level** function (from symbols of kind `function` whose `range` is not inside another function's `range`). Functions inside functions don't get their own scope.
- **TOOL-31** · *Accepted* · `04_tools.md`
  Assign every symbol to the function scope whose `range` contains the symbol's `location`; otherwise to the file scope. A function's own name belongs to the scope it is declared in, not its own.
- **TOOL-32** · *Accepted* · `04_tools.md`
  A function symbol without a `range` is a run error (`E12`): the value lacks what M3 needs.
- **TOOL-33** · *Accepted* · `04_tools.md`
  **Each scope names its `owner`** (`MVP-4`, option C with C1): the function symbol whose declaration it is, for a function scope; the file ID, for the file scope. These are the IDs M1's references use as `from` (`FND-02`), so the Viewer can start a use from its scope (`VIEW-13`). M3 still reads only symbols; it shows no uses itself.
- **TOOL-34** · *Accepted* · `04_tools.md`
  **Where scopes are placed.** A function scope's ID and location start at the function's declaration start, the start of its `range` (`3:1` for `export function round`, not the `function` keyword at `3:8`); its location is that `range`. The file scope's location runs from line 1, column 1 to the furthest end among the file's symbols (the end of their `range`, or of their `location` when a symbol has no `range`). It can fall short of the file's real end (trailing comments, blank lines); that is acceptable for the MVP, and it keeps M3 reading only M1's symbols (no file lengths from the Runner). A file with no symbols gets no scopes at all: an acceptable failure (`MVP-11`).
- **TOOL-35** · *Accepted* · `04_tools.md`
  **Order.** Scopes by file ID; within a file, the file scope first, then function scopes by position (line, then column). Memberships by file ID, then the symbol's position (line, then column), then its ID, whatever the order of the input (by the rule that a tool's output never depends on the order of its input records, `toolset.md`, section 2).
- **TOOL-36** · *Accepted* · `04_tools.md`
  **Errors.** Run errors (`E12`): `symbols` empty (`TOOL-09`), two symbol records with the same `id`, or a function symbol without a `range` (`TOOL-32`). Invocation errors (`E13`, nothing written): `symbols` missing or not an array; a symbol record that isn't an object or lacks `id`, `kind`, `parent` or `location`, or has a `range` that is present but isn't a Location (a malformed record, as distinct from a function with no `range` at all, `TOOL-32`). As in M2 (`TOOL-22`), M3 checks only its own input; whether M1's records are right is M1's responsibility (`TOOL-41`).
- **TOOL-40** · *Accepted* · `04_tools.md`
  **What a tool reads:** its JSON, its `last_run.json`, its own store and internal state, and, for M1, the one file it is given. A tool that needs more than one file, or the database, is a design error in that tool (`toolset.md`, section 4.2). It writes only to its own store, and nothing in a dry run (`TOOL-06`). None of this is checked by the Runner (`RUN-24`).
- **TOOL-41** · *Accepted* · `04_tools.md`
  **Each tool is responsible for producing correct output** (`toolset.md`, section 4.2). It checks its parameters, and its result where it needs to, and fails with a run error rather than write something wrong. The Runner's refresh check (`RUN-17` to `RUN-22`) decides whether to run a tool; it doesn't make the tool's output correct.
- **TOOL-42** · *Accepted* · `04_tools.md`
  **Agreed key names** (`DATA-19`). Every key a tool writes, in its output, `--info`, `result.json`, `last_run.json` and dry-run lines, has the one meaning agreed for that name, as listed in the reference schema (`DATA-20`). A tool that needs a new meaning uses a new name. It reads the records in its input by those agreed names; it doesn't read another tool's `--info` (`DATA-18`).
- **TOOL-43** · *Accepted* · `04_tools.md`
  **Parameters that affect the output, and those that don't** (`toolset.md`, section 4.5).
  - Each parameter in `--info` carries `affectsOutput`. Those with `true` follow `TOOL-02` exactly.
  - Those with `false`, such as `store_path` (`DATA-21`), are optional. If one is missing, the tool uses its default, or works it out from the input by its own means, without affecting the Runner; if it can do neither, it fails early. For `store_path`, the default is `./zaansouvi/tools/<tool>/` in the working folder.
  - `last_run.json` is only ever a complete input (`TOOL-02`), never a source for one missing parameter.
  - The tool records, for each one, whether the input gave it or its default applied (`nonOutputParameterSources`: `input` or `default`) in its log and `result.json`.
  - The output never depends on these parameters.
- **TOOL-44** · *Accepted* · `04_tools.md`
  A tool returns its diagnostics with its work, and the tool helper writes them into `result.json` and onto the dry run's go line (`DATA-14`, `DATA-17`); they never go in an output file or `--info`. M1 does this from version 0.5.0.
- **TOOL-45** · *Accepted* · `04_tools.md`
  **M1, M2 and M3 implement `TOOL-01` to `TOOL-08`, `TOOL-43` and `DATA-14` to `DATA-17` through the tool helper** in `app/tool-helper/` (`ARCH-02`). The helper knows nothing about any specific tool; each tool supplies only its `--info`, its parameter checks and its work.

## UI

Viewer page, from `50_viewer_ui.md`.

- **UI-01** · *Known* · `50_viewer_ui.md`
  the backend is started by hand from a shell, `zaansouvi-view [--port <n>]`, and prints the URL to open, with its token, on standard output; it doesn't open the browser itself, and runs until stopped by hand (`VIEW-07`).
- **UI-02** · *Suggested* · `50_viewer_ui.md`
  the printed message, one line per fact, plain text:

  ```
  ZaAnSouVi Viewer 0.1.0
  Open in your browser: http://127.0.0.1:4310/?token=<token>
  Stop with Ctrl + C.
  ```

  A port already in use prints `Port 4310 is in use. Start with --port <n> to use another.` and exits (`VIEW-07`).
- **UI-03** · *Suggested* · `50_viewer_ui.md`
  opening the page without the token, or with a wrong one, shows only a short text: "This page needs the link printed by zaansouvi-view." Nothing else is served (`FND-60`, item 3).
- **UI-10** · *Known* · `50_viewer_ui.md`
  the page has a **header** linking to the pages, a **graph area**, a **details drawer** and a **status bar**, and shows where the user is in the levels, for example as a breadcrumb (`viewer.md`, sections 4.8 and 4.10).
- **UI-11** · *Suggested* · `50_viewer_ui.md`
  The arrangement, for a desktop browser window:

  ```
  +----------------------------------------------------------------------------------+
  | ZaAnSouVi  [Viewer]  Config  Status  Runs  | Source: [test-source v] [Run] [Dry run] |
  +----------------------------------------------------------------------------------+
  | test-source > main.ts > run                                 | Details|Tools|Problems|Legend |
  | +----------------------------------------------------------+ |                     |
  | |                                                          | |  (drawer, about     |
  | |                       graph area                         | |   360 px wide)      |
  | |                                                          | |                     |
  | +----------------------------------------------------------+ |                     |
  +----------------------------------------------------------------------------------+
  | 14:02:31  Dry run finished: 5 of 5 go, 0 errors                          [^ 12]  |
  +----------------------------------------------------------------------------------+
  | /home/.../test-source | run 2026-11-09 01:36, latest | 0 invalid | 2 unresolved   |
  +----------------------------------------------------------------------------------+
  ```

  The line above the status bar is the activity line (`UI-65`), collapsed to the latest entry; `[^]` expands it; the count "shown / logged" stands at the start of its controls (`UI-73`).
- **UI-12** · *Suggested* · `50_viewer_ui.md`
  the drawer sits on the right and can be collapsed to a narrow strip; the graph area takes the rest. The breadcrumb sits above the graph, inside the graph column.
- **UI-13** · *Suggested* · `50_viewer_ui.md`
  one page only. The header shows **Viewer** as the current page; Config, Status and Runs are shown greyed out with the note "not in the MVP" on hover, so the header already has the shape `viewer.md`, section 4.10, describes. The MVP has no config manager (`ARCH-11`).
- **UI-14** · *Suggested* · `50_viewer_ui.md`
  a light and a dark theme following the system setting; nothing to configure.
- **UI-15** · *Decided* · `50_viewer_ui.md`
  **Display controls in the bottom right corner** (a guideline; recorded in `viewer.md`, section 4.8): buttons that change how the content is shown align to the bottom right of what they act on, as a column with the part that changes most (a count, a readout) kept in the corner and the controls that affect the visualization above it, so that what needs the most attention, and the controls that change what is visible, each stay in the same place in most cases, or as a row ordered with the items that change most first (`{count} [action 1] [action 2] [change display]`). Exception: a layout whose buttons are better placed otherwise for their function, such as run configurations. Followed by the zoom controls (`UI-46`), the This view / All toggle in Problems (`UI-57`) and the activity line (`UI-73`).
- **UI-20** · *Known* · `50_viewer_ui.md`
  the user picks the examined source: the page lists the sources the Viewer has cached and takes a new source root; picking one shows its cached graph at once, marked with its run's time (`VIEW-08`).
- **UI-21** · *Suggested* · `50_viewer_ui.md`
  a drop-down **Source** with each cached source by its folder name, the full path on hover, and its last run's time; its last item, **Add a source...**, opens a small form with one text field (the absolute path of the source root) and **Add**. A new source has no graph until it is run; the graph area then says so and points to **Run**.
- **UI-22** · *Known* · `50_viewer_ui.md`
  two buttons, **Run** and **Dry run** (`VIEW-32`). Run starts a real run on the source shown; it is the user's way to reload the graph (`VIEW-33`).
- **UI-23** · *Known* · `50_viewer_ui.md`
  one run at a time; a second request is refused, with the Runner's message (`VIEW-05`). **[Suggested]** both buttons are disabled while a run is in progress, with "A run is in progress" on hover; switching sources is disabled too.
- **UI-30** · *Known* · `50_viewer_ui.md`
  three levels with M3, two without (`VIEW-21`). *(As built: a scope's members are listed in its label rather than drawn nested inside it, `BE-104`.)*

  | Level | Shows | Edges |
  |---|---|---|
  | 1. Files | every examined file | edges between files, one per pair and direction, labeled with the count |
  | 2. Inside a file | the file's scopes (with M3) or its symbols (without M3) | edges between them; edges leaving the file go to stubs for the other files |
  | 3. Inside a scope | the scope's symbols | references and links |
- **UI-31** · *Known* · `50_viewer_ui.md`
  double-click a node to go one level down into it; the breadcrumb goes back up; the mouse wheel only zooms the current level; nodes can be dragged; positions are not saved (`VIEW-20`, `VIEW-22`). Ctrl + wheel is out of the MVP (`FND-17`). *(As built: the wheel zooms around the pointer, between 0.2× and 3×; its sensitivity is 0.7, `wheelSensitivity` in `ui/src/main.ts`.)*
- **UI-32** · *Known* · `50_viewer_ui.md`
  an automatic layout per level (`VIEW-22`). **[Suggested]** a **Fit** button in a corner of the graph area brings every node back into view. *(As built: **the layout is predictable**: the same view of the same data comes out the same every time it is entered, and after a reload. Before the force layout (`cose`) runs, each node gets its own starting place: the view's own nodes on an inner circle, stubs on an outer one, each in the model's order. A change to the code can still rearrange a whole view; positions are not saved, `UI-31`.)*
- **UI-33** · *Known* · `50_viewer_ui.md`
  edges are lifted to the nearest visible container, drawn once with a count; selecting one lists the edges it stands for, each with its file:line; an edge that starts at a node owning a scope starts from that scope (`VIEW-13`).
- **UI-34** · *Accepted* · `50_viewer_ui.md`
  rules for what is drawn (`FND-60`, item 4); the preview still labels them as assumptions; the backend applies them as `55_viewer_backend.md`, `BE-53`, words them:
  - references of kind `declaration` are not drawn as edges: containment already shows where a symbol is declared;
  - an edge whose two ends lift to the same visible node is not drawn at that level; it shows one level down;
  - an end outside the entered node lifts to its file, drawn as a small **stub** node at the edge of the graph area;
  - an edge that *ends* at a node owning a scope ends at that scope, the mirror of the start rule in `VIEW-13`. Without it, the call `run()` on line 12 of `main.ts` joins the file scope to itself and isn't drawn, while `06_test_plan.md`, "Scopes", expects "an edge from the file scope to `run`". To confirm, with `VIEW-13`.
- **UI-35** · *Known* · `50_viewer_ui.md`
  unresolved relations (`to: null`) are not drawn; the page shows how many there are, with their reasons (`VIEW-12`). *(As built: the line under the graph groups them by name, the most mentioned first, with a count where a name repeats, and names at most eight, then "and N more names. See Problems.")*
- **UI-36** · *Accepted* · `50_viewer_ui.md`
  the entered node of level 2 or 3 is not drawn as a node; its name is in the breadcrumb, and edges from it to its own members (level 3) start from a small node labeled "this scope", drawn inside the scope's frame, which carries the scope's name (`UI-37`).
- **UI-37** · *Decided* · `50_viewer_ui.md`
  **A frame shows the scope being viewed**: when the entered node is a scope (a node with an `owner`, `BE-109`), the view draws a box labeled with the scope's name ("main.ts · file scope", "ƒ run"), and **everything the view lists as its own nodes is drawn inside it**, together with the "this scope" node (`UI-36`). Stubs, which stand for things elsewhere, stay outside, so the frame's edge shows where "here" ends. Entering a file (level 2) or the top level shows no frame. A symbol that owns a scope, such as `run()` in "main.ts · file scope" (its edges go to its scope, `VIEW-13`), is visibly inside the scope that declares it. Page only: the model, its JSON and the tools' outputs are unchanged. **Judged by the user, after trying it, to improve readability.**
  - **Layout inside a frame** (refines `UI-32`): the frame's contents go on a compact grid, "this scope" first, then in the model's order; the stubs go on an ellipse just outside the frame, each on the side of the nodes inside it is connected to, kept apart by a minimum angle. The same data gives the same picture.
  - *(As built: `elementsFor`, `placeStubs` and `drawGraph` in `ui/src/main.ts`; the style `node.frame`. Clicking the frame selects the scope and shows its details. Known: an edge's count label can sit on the frame's title. Not built: a dotted "owns" line from a symbol such as `run()` to its scope's stub, offered as an option and not chosen.)*
- **UI-38** · *Decided* · `50_viewer_ui.md`
  **The edges of a selected node are highlighted**: selecting a node draws every edge connected to it in a pale selection color, and unselecting it returns them to their own color. An edge that is itself selected keeps the full selection color, so the two are told apart. With several nodes selected, the edges of each are highlighted. Page only. *(As built: `syncSelection` and the style `edge.touch` in `ui/src/main.ts`; the pale color is `--sel-soft` in `ui/static/style.css`, a light amber in the light scheme and a dim amber in the dark one.)*
- **UI-39** · *Decided* · `50_viewer_ui.md`
  **Arrows keep their direction for the MVP**, `from → to`, the using end first. Whether arrows should point from the definition to where it is used may be improved after the MVP (`VW-40`).
- **UI-40** · *Known* · `50_viewer_ui.md`
  the same kind looks the same everywhere; a reference to an object looks different from the object; color is never the only signal; each view has a legend (`viewer.md`, section 4.3). The MVP keeps it minimal: one shape per node kind; declarations solid, references dashed; links in a separate color (`VIEW-23`).
- **UI-41** · *Accepted* · `50_viewer_ui.md`
  the visual key is the data name plus the kind (`FND-60`, item 4), so a scope of kind `function` and a symbol of kind `function` look different:

  | Node | Shape | Label |
  |---|---|---|
  | file (`files.file`) | rectangle with a folded corner | file name; the folder in the drawer |
  | file scope (`code.scope`, `file`) | large rounded rectangle, thin dashed border | "file scope" |
  | function scope (`code.scope`, `function`) | large rounded rectangle, solid border | "ƒ " + name |
  | function (`code.symbol`, `function`) | ellipse | name + "()" |
  | variable (`code.symbol`, `variable`) | rectangle | name |
  | parameter (`code.symbol`, `parameter`) | small rectangle, italic label | name |
  | import (`code.symbol`, `import`) | rectangle with a dashed border, an arrow mark, and the color of the file it imports from | name, "from ./math" in small type |
  | stub (another file, `UI-34`) | small file shape at the side, faded | file name |
  | unknown kind (`VIEW-15`, extra data) | grey circle | name, and the kind in the drawer |

  | Edge | Line | Notes |
  |---|---|---|
  | call | solid, arrow | |
  | read | dotted, arrow | |
  | write | solid, heavy, arrow | |
  | import (link) | dashed, link color, arrow | `VIEW-23`: links in a separate color |
  | use of an import (link) | dotted or solid by kind, in the link color | |
  | aggregated | as its members if all one kind, else solid grey; width grows with the count; the count in a small badge | `UI-33` |
- **UI-42** · *Suggested* · `50_viewer_ui.md`
  each file gets an identity color from its ID, the same in every level and every run (`viewer.md`, section 4.3, [Proposed]); its scopes, symbols and stubs carry it as a border or a side stripe, so the file a node belongs to is visible at a glance.
- **UI-43** · *Known* · `50_viewer_ui.md`
  every name, path and source line is shown as text, never as HTML (`VIEW-40`).
- **UI-44** · *Decided* · `50_viewer_ui.md`
  **A color key in the graph's top-left corner, under the breadcrumb**: a small, non-clickable label listing what the identity colors (`UI-42`) stand for, one row per file: a swatch of the color on the left, the file's name next to it, in a small font. Colors mean files only; a symbol has no color of its own and is drawn in its file's color.
  - **Which files:** **every** file whose color is drawn in the current view, never cut short, in the cache's file order: the files of the nodes and stubs drawn in their file's color, and for an import drawn as a node, the file it imports from. Scopes are drawn in ink, not in their file's color, so a view showing only its own file's scopes (level 2) lists only the stubs' files.
  - **Layout:** the rows fill a column top to bottom and **wrap into further columns** when they reach about half the graph's height. The key takes no clicks (`pointer-events: none`), so it never gets in the way of selecting or dragging nodes, even when it covers them; its background is slightly see-through.
  - **The number of colors stays eight, cycled through** by a hash of the file ID: two files can share a color; the key then shows both with the same swatch.
  - *(As built: `drawKey` and `fitKey` in `ui/src/main.ts`, `.key` in `ui/static/style.css`. The "Running…" chip sits in the top right to make room.)*
- **UI-45** · *Decided* · `50_viewer_ui.md`
  **A mark on every node that can be entered**: a small triangle pointing down, in the ink color, in the node's bottom right corner, on every node a double-click goes into: a node with a view of its own (`UI-31`) that isn't the one being viewed. Files (stubs included) and scopes get it; symbols, the "this scope" node (`UI-36`) and the frame (`UI-37`) don't. Color is not the only signal (`UI-40`): the mark is a shape. *(As built: the class `enterable` and the style `node.enterable` in `ui/src/main.ts`, an SVG image drawn unclipped so it shows on every shape. Checked in headless Firefox at levels 1 to 3, `tests/viewer/browse/enter-marks.json`.)*
- **UI-46** · *Decided* · `50_viewer_ui.md`
  **Zoom controls for readable text**: a column in the bottom right corner of the graph area, from the bottom up: **the current zoom** as a percentage, **Fit** (`UI-32`), and **Text**, which zooms to 100%, where text is drawn at its own font size (13px for a node's label), keeping the centre of the graph area in place. The readout follows every change of zoom: the wheel, Fit, Text, entering a view. Each view still starts fitted to the graph (`UI-32`), so its text size still depends on the graph's size; starting at a readable zoom was offered and not chosen (`FND-76`). *(As built: `.zoombox` in `ui/static/index.html` and `ui/static/style.css`; `zoomReadout` and the `zoomtext` button in `ui/src/main.ts`. Checked in headless Firefox, `tests/viewer/browse/zoom-controls.json`.)*
- **UI-50** · *Known* · `50_viewer_ui.md`
  the drawer's content depends on the selection; with nothing selected, a summary of the view and its legend; with a selection, its details (`viewer.md`, section 4.8, [Proposed]; `VIEW-30`).
- **UI-51** · *Suggested* · `50_viewer_ui.md`
  four tabs: **Details**, **Tools**, **Problems**, **Legend**. A run in progress switches to **Tools**; a partly invalid run puts a count on **Problems**.
- **UI-52** · *Known* · `50_viewer_ui.md`
  **Details** of a node or edge: its kind, name, file:line, and the source line with the lines around it (`VIEW-30`). **[Suggested]** also its ID (copyable), its data name and the tool that produced it; for a scope, its owner; for an aggregated edge, the list of the edges it stands for, each with kind, file:line and its source line; with nothing selected, the level's counts (nodes, edges, unresolved) and the legend. **[Decided]** a node's **Contains** is a list in the form of Problems' items (`UI-57`): headed "Contains · N"; one item per name and data name, "name · data name · kind" (the name as the graph draws it), its places listed under it ("path/file line:column", start only), with "N declarations" when a name is declared more than once; items sorted by name, ignoring case; placed after the node's source lines. *(As built: `containsList` in `ui/src/main.ts`, using the item list it shares with Problems, `groupedItems` (`UI-57`); checked in headless Firefox, `tests/viewer/browse/contains.json`.)*
- **UI-53** · *Known* · `50_viewer_ui.md`
  **Tools** lists the three tools in the stored order, read-only, (each box drawn as `UI-58` says) with its latest result and a link to its log; after a dry run, each invocation's go / no-go and error; each tool's diagnostics, never in the graph (`VIEW-31`). While a run is in progress, each `tool_skipped`, `tool_dry_run` and `tool_run` event appears as it arrives: skipped in grey, marked up to date; a no-go or failure in red, with the message and the location if there is one (`VIEW-32`).
- **UI-54** · *Known* · `50_viewer_ui.md`
  **Problems** lists the run's invalid data and extra data, each with where it came from (data name, tool, record), not only counted (`viewer.md`, section 6; `VIEW-15`, `VIEW-16`). **[Suggested]** also the unresolved relations, grouped by data name, with their reasons where there is one (`UI-35`); each row selectable, showing the record in **Details**. **[Decided]** every row starts with the item's name, then its type (the data name), then the rest: an invalid record as "record ID · data name · tool", then the problem; extra data as "what is extra · data name · tool · detail"; an unresolved relation as "name · data name · file line:column · reason", for example "console · code.reference · src/main.ts 8:5 · no reason recorded". *(As built: `problemsPane` in `ui/src/main.ts`.)*
- **UI-55** · *Suggested* · `50_viewer_ui.md`
  a log link opens the log as plain text in a new browser tab (`/api/log`).
- **UI-56** · *Decided* · `50_viewer_ui.md`
  **Several selected items all show in Details**: a click selects one item, shift- or ctrl-click adds one, a click on the background clears the selection. With more than one selected, Details lists them **grouped by node**, each group headed by the node's label as drawn, holding the node's own details if it is selected and the details of each selected edge that points to it (its `to` end); groups keep the order they were selected in. Each group has a bar on its left in the identity color of the file its node is located in (`UI-42`), or of the node itself when it is a file, and in the selection color when neither applies. One item selected shows as before (`UI-52`). The activity log records one `node_selected` entry per item selected, with no new key. *(As built: `syncSelection`, `details`, `nodeDetails` and `edgeDetails` in `ui/src/main.ts`; `.selgroup` in `ui/static/style.css`; the bar's color from `groupColor`. A redraw of the same view, after a run or a change of color scheme, keeps what is still there selected.)*
- **UI-57** · *Decided* · `50_viewer_ui.md`
  **Problems groups what repeats, and lists unresolved relations for this view or all**:
  - **Unresolved relations:** one item per name and data name, "name · data name · N mentions", with the mentions listed under it as "path/file line:column" (start only), sorted by file, then line. A reason shared by every mention is shown once on the item, otherwise on each mention. Items are sorted by name, ignoring case. Mentions are not clickable. A relation with no name of its own is named by its source node's label (an unresolved import by its import symbol), else by its ID; generic, on the page (`relName`).
  - **The item's layout** (shared with Details' Contains, `UI-52`): the name on the left of the first line; what the list says of it ("1 mention", "function") on the right of the same line; a note shared by every place ("no reason recorded") on the second line, on one line only, cut short with "(...)" when it is wider than the item and shown in full as a tooltip on hover; the places under it; the data name (`code.reference`) faint, in the bottom right corner of the box. "(...)" is Firefox's; browsers that don't support a custom cut-off mark show "…".
  - **Invalid and extra data in the same box**, not grouped by name, since nothing repeats there: **extra data** as what is extra (`keys`) on the left, the tool on the right, the detail on the second line, the data name in the corner; **an invalid record** as its ID on the left, the tool on the right, "problem. Skipped." on the second line, the data name in the corner, in the error colors; **a problem met by several records** as one box: the problem on the left, "N records" on the right, each "record ID · tool" under it, the data names in the corner. For both, the second line **wraps** instead of being cut short, since it is the item's content, not a side note. A box with nothing under it keeps a line free for the data name.
  - **This view / All:** a toggle in a column at the bottom right of the pane, like the zoom controls (`UI-46`), staying in view as the pane scrolls. **This view**, the default, lists the unresolved relations of the view being shown (the same ones as the line under the graph, `UI-35`); **All** lists those of the whole run. The choice holds in every view until changed. Invalid and extra data are the run's, whatever the toggle.
  - **Invalid data:** a problem met by several records is one item, "problem · N records", the records listed under it ("record ID · data name · tool"); a problem met once stays one row (`UI-54`). Extra data is unchanged.
  - *(As built: `problemsPane` and `state.probScope` in `ui/src/main.ts`; the items built by `groupedItems`, shared with Details' Contains (`UI-52`), which groups, sorts and lays out both lists, each caller giving only the text after the data name and an optional note per place; every box, in every list of Problems and in Contains, drawn by `itemBox`; `.probscope` and `ul.sub` in `ui/static/style.css`. Checked in headless Firefox on `test-source` and on a copy of the Runner's code, 137 unresolved relations in 60 items, `tests/viewer/browse/problems.json`.)*
- **UI-58** · *Decided* · `50_viewer_ui.md`
  **Tools lists each tool as an item box, like Problems** (refines `UI-53`, whose content is kept). One box per tool, in the run order, in three lists: the live events of the run in progress or just ended, the last real run of this source, and the last dry run.
  - **First line:** the tool's name, its version faint beside it; on the right, a count where there is one ("2 of 3 files", "3 of 3"), the **log** link, and the pill last, rightmost.
  - **Second line**, wrapped: the order and the counts ("#1 in order · 3 invocations: 1 ran, 2 up to date"); where the run stopped, "the run stopped here", and for a per-file tool "later files not run" (during a run, only when files were left; afterwards "later files, if any, not run", since the file count isn't known then).
  - **Under it:** only failed and no-go invocations, "file · code: message" ("(whole run)" for a tool run once), with the log link when the box has several.
  - **No corner:** tools have no data name in the backend's answer; the corner stays empty.
  - **Pills:** `succeeded`, `up to date` (every invocation up to date), `failed` (error colors), `not run` (faded box), `waiting` and `running` (during a run), `go` and `no-go` (dry run).
  - **Not run:** a tool with no invocation in a run that failed was not reached; its box says where the run stopped ("not reached: the run stopped at file-symbols"). The Runner sends no event for such a tool (`tool_skipped` means up to date only), so the page works this out from the tool list, generically. A dry run stops at its first no-go the same way (`invoke` in `app/runner/src/runner.ts`, both modes). During a run, `waiting` becomes `not run` when the run ends failed.
  - No **enabled** pill: every tool is enabled in the MVP.
  - *(As built: `toolsPane` and `itemBox` in `ui/src/main.ts`, `itemBox` extended with a version, a link, a pill, places holding links and an optional corner; the run's kind from `run_state`. Checked in headless Firefox with a real run and a dry run of `test-source`, and with made-up answers for a failed run, a run in progress and a no-go dry run, `tests/viewer/browse/tools-pane.json`.)*
- **UI-60** · *Known* · `50_viewer_ui.md`
  it shows the state at a glance: the codebase, whether what is shown is the last saved run or something else, whether a run is in progress, the number of warnings; selecting an item opens its details in the drawer (`viewer.md`, section 4.8, [Proposed]).
- **UI-61** · *Suggested* · `50_viewer_ui.md`
  The items, left to right: the source root; the run shown, with its time and "latest" or why not ("last run failed", "partly invalid run shown", "only a dry run since"); a run in progress, with how many invocations are done; the counts of invalid records, extra data and unresolved relations. Each count opens the **Problems** tab.
- **UI-62** · *Decided* · `50_viewer_ui.md`
  **Every entry has a level: `minimal`, `normal` or `verbose`** (`VIEW-17`). The backend tags each entry when it logs it. Suggested assignment, each entry still marked "you" or "app" (not only by color, `UI-40`):
  - **`minimal`**, what a session must show: the Viewer started (its version); a run or dry run finished, with its outcome and its number of errors; a run's output partly invalid, or unusable (`VIEW-16`); a cached entry that couldn't be used (`VIEW-08`); a request refused because a run is in progress (`VIEW-05`); any error of the backend itself.
  - **`normal`**, the ordinary course of a session: you opened, added or switched a source (with its path); you started a run or a dry run; a run or dry run started, on its source root; the checks of a run's output (nothing invalid, or the counts of invalid records and extra data, `VIEW-15`); a cached graph loaded for a source (with its run's time); you switched between the latest run and the last good graph (`UI-70`); you opened a log.
  - **`verbose`**, for debugging: you entered or left a level, and which node; you selected a node or edge; each Runner event as it arrives (`tool_skipped`, `tool_dry_run`, `tool_run`, with tool, file and reason); each request the page made to the backend and its answer (endpoint, status, time taken); each invalid record and each piece of extra data, one entry per item; the graph built (node and edge counts per level).
  - **Not logged at all:** zooming and dragging, which happen continuously.
  - Each level includes only its own entries; showing several levels interleaves them in time order.
- **UI-63** · *Decided* · `50_viewer_ui.md`
  **The activity line has a toggle to show or hide each level**. **[Suggested]** three small toggle buttons at the line's right end, **Minimal**, **Normal** and **Verbose**, each on or off, next to the expand button; by default Minimal and Normal are on and Verbose is off. The collapsed line shows the latest entry among the levels shown; the expand button counts the entries shown. Each entry shows its level as a short tag (`min`, `norm`, `verb`) before its text. The toggles change only what is shown, never what is logged; the choice is remembered by the page for that browser (a convenience, not Viewer data).
- **UI-64** · *Suggested* · `50_viewer_ui.md`
  Not in force; see `UI-71` (one file, appended).
- **UI-65** · *Decided* · `50_viewer_ui.md`
  **An activity line at the bottom of the page lists every command and action the user or the app has carried out in the session** (`FND-66`). **MVP only, for debugging and tracking** what happened during a session; it is not part of the product's page (`viewer.md`, section 4.8). Collapsed, it is one line showing only the latest entry; expanded, it floats over the page and scrolls through everything done since the session began. Examples given by the user: *user opened folder "x" for examination*; *dry run resulted in 0 errors*; *user executed manual run*.
- **UI-66** · *Suggested* · `50_viewer_ui.md`
  Placement and behavior:
  - one full-width line directly above the status bar (`UI-11`), always visible, with the entry's time (local, `HH:MM:SS`) and its text; a button at its right end, labeled with the number of entries, expands it;
  - expanded, it opens upward as a floating panel over the graph and the drawer, without moving them, about a third of the window high, newest entry at the bottom, scrolled to the end; it scrolls back to the session's first entry. Clicking the button again, pressing Escape, or clicking outside collapses it;
  - a new entry while it is collapsed replaces the line; while expanded, it is appended, and the panel stays where the user scrolled unless it was at the end;
  - entries are plain text, never HTML (`VIEW-40`), and can be selected and copied.
- **UI-67** · *Suggested* · `50_viewer_ui.md`
  Not in force; see `UI-62` (entries by level, including navigation and selection at the verbose level).
- **UI-68** · *Suggested* · `50_viewer_ui.md`
  an entry with more detail behind it (a run's result, the problems found) can be clicked to open that detail in the drawer (**Tools** or **Problems**). The activity line is a summary for people; the full record of a run stays in the Runner's and the tools' logs.
- **UI-69** · *Suggested* · `50_viewer_ui.md`
  **the session** is the backend's: from `zaansouvi-view` starting until it stops. (The file, `UI-71`, keeps every session until it is cleared; the activity line shows the current session, from memory.) The backend keeps the entries in memory and sends them to the page, so reloading the page, or opening a second tab, shows the whole session. They are not saved: a new backend starts an empty session, beginning with "Viewer started". (Saving them in the Viewer's store, `VIEW-06`, could come later.) Runs started outside the Viewer, from the command line, don't appear, since the Viewer doesn't see them happen; a later load of their result does.
- **UI-70** · *Known* · `50_viewer_ui.md`
  a view never mixes data from two runs (`viewer.md`, section 6); the banners switch the whole view between the two.
- **UI-71** · *Decided* · `50_viewer_ui.md`
  **The backend writes the activity log to a single file, appending to it if it exists** (`VIEW-17`): `data/viewer/activity.log`. Every entry, every level, goes in; the level toggles (`UI-63`) never change what is written. **The format is the shared log format** (`DATA-16`; `DATA-19`): one entry per line, `<ISO time> TAB <level> TAB <event> TAB <JSON details>`, where `level` is the severity (`info`, `warn`, `error`) and the details always hold `verbosity` (`minimal`, `normal`, `verbose`), `actor` (`user`, `app`) and `text` (the sentence the activity line shows), plus the facts as their own keys (`runId`, `sourceRoot`, `nodeId`, `counts`, or a Runner event nested whole under `runnerEvent`). Comment lines start with `#`; dropping them loses no fact. The keys are registered in the reference schema, sections 12 and 15. Each backend start writes a `minimal` `viewer_started` entry, which marks where a session begins, after a `# [session]` comment for people. The Viewer's event names differ from the Runner's (`run_result`, not `run_finished`), so the two programs' events are never confused.
  - **Only one backend uses it**: no locking and no sharing between backends are needed, and the file may be deleted and recreated at any time without breaking anything. **[Suggested]** the backend opens the file, appends one entry and closes it again for every entry, so a file deleted while it runs is simply created again by the next entry.
- **UI-72** · *Decided* · `50_viewer_ui.md`
  **The activity line has a function to clear the log**. **[Suggested]** a **Clear** button next to the level toggles, asking first ("Clear the activity log? This can't be undone."). Clearing deletes `data/viewer/activity.log` and empties the entries the backend holds for the session, so the activity line is empty too; the next entry, "you cleared the log" (`normal`), starts the file again. It touches nothing else: not the Runner's or the tools' logs, not the cached graphs (`VIEW-09`).
- **UI-73** · *Decided* · `50_viewer_ui.md`
  **The activity line counts its entries as "shown / logged"**: the entries shown at the levels selected (`UI-63`), over all the entries the session holds (`UI-69`), at the start of the controls: `2 / 5 [Minimal] [Normal] [Verbose] [Clear] [^]`. It follows every new entry, every level toggled and Clear. *(As built: `actCount` in `ui/src/main.ts`, `#actcount` in `ui/static/index.html`. Checked in headless Firefox, `tests/viewer/browse/activity-count.json`.)*
- **UI-80** · *Suggested* · `50_viewer_ui.md`
  a single HTML file with no script: the graph is hand-placed SVG built from the tables in section 4.1; levels, selection examples and the states in section 8 are switched with radio buttons and CSS only. Every element of sections 2 to 8 appears at least once. Assumptions (`UI-34`, `UI-41`) are labeled on the page.
- **UI-81** · *Decided* · `50_viewer_ui.md`
  **a local file only**, `zaansouvi-mvp/app/viewer/ui/preview.html`, opened in a browser from disk; not published (`FND-67`).

## VIEW

Viewer, from `05_viewer.md`.

- **VIEW-01** · *Accepted* · `05_viewer.md`
  A local HTTP server, reachable only from this machine (bound to `127.0.0.1`).
- **VIEW-02** · *Accepted* · `05_viewer.md`
  Endpoints: specified in `55_viewer_backend.md`, section 8.
- **VIEW-03** · *Accepted* · `05_viewer.md`
  The backend gets everything through the Runner's cache (`--read-cache`), the tool list included; it doesn't read the database (`RUN-27`). It writes only to its own store (`VIEW-06`).
- **VIEW-04** · *Accepted* · `05_viewer.md`
  The backend builds the graph model; the page only displays it (`viewer.md`, section 3.1).
- **VIEW-05** · *Accepted* · `05_viewer.md`
  One run at a time: a second run request while one is running is refused. The Runner's lock (`RUN-30`) enforces this whoever starts the run; the Viewer shows its diagnostic.
- **VIEW-06** · *Accepted* · `05_viewer.md`
  **The Viewer has its own store: `data/viewer/`, JSON files, written only by the Viewer backend.** It is a minimal form of the [Decided] Viewer cache (`viewer.md`, sections 2 and 5), and a starting point: the form may change with what building the Viewer shows (`FND-61`). Nothing else reads it. It never goes into the Runner's database (`ARCH-10`, `ARCH-11`).
  - **`data/viewer/sources/<source-key>/last-good-graph.json`**, one entry per examined source (`VIEW-08`): the graph model of the last successful real run, with that run's `runId` and `finished` time. The backend writes it, atomically, whenever it builds the graph from a cache whose `run.outcome` is `succeeded` and whose `runId` differs from the stored one.
  - **What the page shows** (a run must also pass the Viewer's checks, `VIEW-15`, to be stored, `VIEW-16`): the cache's graph when its run succeeded; otherwise the stored last good graph, marked as not the latest, with the reason (the last run failed, or only a dry run since); with neither, "no real run yet", plus any dry-run diagnostics from the cache. A dry run never changes what is shown (`VIEW-31`).
  - **It can be deleted at any time** (`ARCH-09`): the next successful run rebuilds it. Until then, after a failed run, the page has no good graph to show and says so.
  - **Not in it yet:** node positions (`VIEW-22`), preferences, a pending version (`viewer.md`, section 5). If they are added, the store may move to its own SQLite file in the same folder, never the Runner's.
- **VIEW-07** · *Accepted* · `05_viewer.md`
  **Starting and stopping, for the MVP.** The backend is started by hand from a shell, `zaansouvi-view [--port <n>]`, from any working folder (it finds everything from its own location). It prints the URL to open, with its token, on standard output; it doesn't open the browser itself. It stays running until stopped by hand (Ctrl + C, or ending the process); no Stop button, no idle stop. Starting from the file manager or a desktop shortcut, and opening the browser automatically, stay wishes for later (`FND-62`). A port already in use is a start-up error with a message naming the port and `--port`.
- **VIEW-08** · *Accepted* · `05_viewer.md`
  **Switching the examined source without a restart** (`viewer.md`, section 3.4).
  - The page lists the sources the Viewer has cached and lets the user enter a new source root. Picking one shows its cached graph at once, marked with the time of the run it came from; **Run** runs the Runner on that source root (passed as an argument, `ARCH-03`).
  - **One cache entry per source**, keyed by the source root's absolute real path: `data/viewer/sources/<source-key>/last-good-graph.json` (`<source-key>` a short hash of that path), listed in `data/viewer/sources.json` with the source root and the run it came from. Kept for any number of switches; nothing is dropped automatically.
  - **The Runner's cache holds only the last run's source.** The backend uses it only when its `run.sourceRoot` is the source shown; otherwise it shows the Viewer's entry for that source. `/api/source` reads only files of the source shown, from that entry's file list, under its source root.
  - **An entry the Viewer can't use fails cleanly**: each entry records the graph model's `formatVersion` and the Viewer's version; an entry with another format version, or one that can't be read, isn't shown. The page says why and offers a run for that source, which replaces the entry.
  - **The Runner in the MVP keeps one data folder for every source** (no separate stores per codebase, `toolset.md`, section 5.4, is post-MVP). Switching sources makes M1 run for the new files and M2 and M3 run again; outputs of the other source's files stay in the stores but are ignored (`RUN-18`). That costs a full run on every switch followed by a run, which is acceptable for the MVP; the Viewer's entries make switching back free until the next run.
- **VIEW-09** · *Accepted* · `05_viewer.md`
  **Clearing the Runner's and the tools' data by hand**: deleting, or moving aside, `data/zaansouvi.sqlite`, `data/runner/` and `data/tools/` while no run holds the lock. `data/viewer/` is left alone, so every source's cached graph survives. The backend copes with the Runner's data missing at any moment: no Runner cache means it shows the Viewer's entries only. Clearing the Viewer's own cache is a separate act: deleting `data/viewer/`, or one source's folder in it.
- **VIEW-10** · *Accepted* · `05_viewer.md`
  Nodes come from every output whose `represents` is `nodes`, plus the files from the file list. Each node's parent is its `parent` field.
- **VIEW-11** · *Accepted* · `05_viewer.md`
  An output whose `represents` is `containment` re-parents the nodes it names: with M3, each symbol's parent becomes its scope instead of its file.
- **VIEW-12** · *Accepted* · `05_viewer.md`
  Edges come from every output whose `represents` is `relations`. A reference becomes an edge from its `from` (the enclosing function, or the file) to the symbol it refers to, started from the scope that node owns (`VIEW-13`); a link becomes an edge from the import symbol to the declaration. A relation whose `to` is `null` is unresolved: it isn't drawn, and the Viewer shows how many there are, with their reasons (`VW-4`, `DATA-10`).
- **VIEW-13** · *Accepted* · `05_viewer.md`
  **Edges are lifted to the nearest visible container, at every level** (`MVP-4`; generalizes the [Decided] file-edge aggregation in `MVP_scope.md`, section 5.1): an edge whose ends are hidden inside a container is drawn between the nearest visible containers, once, with a count, and selecting it lists the edges it stands for, each with its file:line; an edge that starts at a node owning a scope (a scope's `owner`) starts from that scope. At level 1 this joins files, once, with a count; at level 2 it shows each scope with the symbols it is used with. For the test source: the scope `run` has edges to the imports `add` and `PRECISION` in its file, to `counter.add` and `math.PRECISION` through M2's use links, and one unresolved name (`console`). No tool produces file or scope edges.
- **VIEW-14** · *Accepted* · `05_viewer.md`
  The code that does this reads only `represents`, `containedIn`, `parent`, `owner` (through its `fields` role) and IDs. It has no branch on a tool's name. If it needs one, that is a finding against P4. It doesn't match keys to data itself: it gets the records already grouped by data name from the Runner (`DATA-18`, `RUN-25`), and relies on the agreed key names (`DATA-19`).
- **VIEW-15** · *Accepted* · `05_viewer.md`
  **The Viewer checks every run's output before using or storing it** (`viewer.md`, section 6). The checks are generic, from the field roles only, like `VIEW-14`, run on the server while the graph model is built (`VIEW-04`):
  - **Invalid** (the record is skipped, listed and counted): a node whose `parent` isn't a known node or file; two records with the same ID; a containment record whose child or container isn't known; a relation whose `from` isn't a known node, or whose `to` is neither a known node nor `null`; a scope whose `owner` isn't a known node; a record lacking a field its role needs, or with a malformed Location.
  - **Extra** (listed, not an error): a data name whose `represents` the Viewer doesn't know (not shown); keys in a record beyond the roles in `fields` (ignored); node or edge kinds with no specific style (drawn with a generic one).
  - **A graph that can't be built at all** (the Runner's cache unreadable, or the build failing for any reason) is caught for that source alone; the server keeps running (`VIEW-16`).
- **VIEW-16** · *Accepted* · `05_viewer.md`
  **What is shown and stored after the checks.** Per examined source:
  - **Nothing invalid:** the graph is shown and stored as that source's last good graph (`VIEW-08`). Extra data doesn't prevent storing; it is listed in the panel.
  - **Some records invalid:** the new run's graph is shown without them, marked "partly invalid", with the list of skipped records (data name, tool, record ID, problem) and of extra data. It is **not stored**: the source's last good graph stays, and the page can switch to it, marked with its run time. A view never mixes the two runs (`viewer.md`, section 6). Accepting a partly invalid run as the new good one is the pending version of `viewer.md`, section 5: out of the MVP.
  - **Nothing could be built:** the last good graph is shown, marked as not the latest, with the reason; with none, the page says "no good data for this source" and gives the reason.
  - **After a restart or reload,** the same Runner cache is checked again with the same result; nothing about a bad run is remembered except what is in the Runner's cache.
  - **Each entry in `data/viewer/` records its own source root**, so a damaged or missing `sources.json` is rebuilt by reading the entries.
  - **Data that passes the checks but is wrong** can't be caught generically; it is fixed by a new run after the tool is fixed, or by clearing that source's entry by hand (`VIEW-09`).
- **VIEW-17** · *Accepted* · `05_viewer.md`
  **The backend keeps an activity log for the session, every entry tagged `minimal`, `normal` or `verbose`** (MVP only, for debugging and tracking). It logs its own actions and results and the user's actions it receives, including the page's navigation and selections, which the page reports to it. It sends the page the whole session when the page loads and each new entry as it happens. It appends every entry to a single file, `data/viewer/activity.log`, created if missing; only one backend uses it, so it may be deleted and recreated at any time without breaking anything; the activity line can clear it (`UI-71`, `UI-72`). The page shows them in the activity line, with a toggle per level (`50_viewer_ui.md`, `UI-62` to `UI-69`). Which entry gets which level is suggested in `UI-62`.
- **VIEW-18** · *Accepted* · `05_viewer.md`
  **Accepted for the backend**: run events and activity entries reach the page by server-sent events; the security minimum of `55_viewer_backend.md`, section 9: a token set as a session cookie, `Host` and `Origin` checks, reads limited to the source's listed files and to `data/`, nothing loaded from the internet; the graph rules of `50_viewer_ui.md`, `UI-34` and `UI-36`, and the visual key of `UI-41`; the page's TypeScript compiled with `tsc`, no bundler, Cytoscape served from the local install. The backend in full: `55_viewer_backend.md`.
- **VIEW-20** · *Accepted* · `05_viewer.md`
  Double-click a node to go one level down into it; a breadcrumb at the top goes back up. The mouse wheel only zooms the current level (`viewer.md`, section 4.9; Ctrl + wheel is out of the MVP).
- **VIEW-21** · *Accepted* · `05_viewer.md`
  Without M3, the levels are files › symbols: two levels. With M3, three.
- **VIEW-22** · *Accepted* · `05_viewer.md`
  Layout: an automatic layout per level; nodes can be dragged. Positions are not saved in the MVP.
- **VIEW-23** · *Accepted* · `05_viewer.md`
  Visual language, kept minimal: one shape per node kind (file, scope, function, variable, parameter, import); declarations solid, references dashed; links in a separate color.
- **VIEW-30** · *Accepted* · `05_viewer.md`
  Selecting a node or edge shows, in a side panel: its kind, name, file:line, and the source line with the lines around it (from `/api/source`).
- **VIEW-31** · *Accepted* · `05_viewer.md`
  A tool panel lists the three tools in the stored order, read-only, each marked as enabled (all are, in the MVP), with its latest result and a link to its log. After a dry-run-only pass, it also shows each invocation's go / no-go and error from the dry-run part of the Runner's cache (`RUN-27`); the graph doesn't change. Each tool's diagnostics are listed there too, never in the graph: from each invocation's result in the cache after a real run, and from the dry-run part after a dry-run-only pass (`DATA-14`, `RUN-27`).
- **VIEW-32** · *Accepted* · `05_viewer.md`
  Two buttons: **Run** and **Dry run**. While running, the panel shows each `tool_skipped`, `tool_dry_run` and `tool_run` event as it arrives (a skipped tool in grey, marked up to date), with go / no-go and errors. A no-go or failure is shown in red, with the message and the location if there is one.
- **VIEW-33** · *Accepted* · `05_viewer.md`
  After a run finishes, the page reloads the graph from `/api/data`. Nothing refreshes on its own otherwise. The Viewer never starts a run on its own: the run button (`/api/run`) is the user's way to reload the graph, and is a manual run that replaces the Runner's cache, like a command-line run (`RUN-27`).
- **VIEW-40** · *Accepted* · `05_viewer.md`
  Every name, path and source line is shown as text, never as HTML (`security.md`, section 8).
