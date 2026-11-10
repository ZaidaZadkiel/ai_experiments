# 55. Viewer backend

The MVP Viewer's backend in detail: how it starts, what it keeps on disk, how it calls the Runner, its endpoints, the live stream, security, the graph model it builds, its checks, the activity log, how the page's code reaches the browser, and how it is tested. Written on 2026-11-08 at the user's request, with everything known and the rest inferred, so the backend can be built.

Each item is marked:
- **[Known]** follows from a decision or an accepted MVP requirement, with its source.
- **[Accepted]** a suggestion the user accepted on 2026-11-08 ("accept all", `FND-68`).
- **[Suggested]** inferred and filled in here so the build doesn't have to invent it; not yet accepted.

`05_viewer.md` holds the Viewer's requirements, `50_viewer_ui.md` the page. Where they and this file differ, `05_viewer.md` and the working files win, and this file is corrected. Requirement IDs here use the prefix `BE`.

**Built on 2026-11-08** (`FND-69`): `zaansouvi-mvp/app/viewer/`, as this file says, with the changes listed in section 15. Its checks pass: `tests/viewer/check-model.mjs` and `tests/viewer/check-server.mjs` (32 of 32).

## 1. Place and principles

- **BE-01** **[Known]** a local HTTP server on Node's built-in `http` module, bound to `127.0.0.1` (`VIEW-01`, `01_architecture.md`, technology table). It runs as TypeScript directly, like the Runner and the tools (Node's type stripping), and imports only Node built-ins and `app/shared/`; nothing from the Runner's or a tool's code (`ARCH-02` in spirit).
- **BE-02** **[Known]** it gets all codebase data from the Runner's output, through `zaansouvi-run --read-cache`, never from the database or the tool stores (`VIEW-03`, `ARCH-11`; `viewer.md`, section 3.1: the Viewer uses only the Runner's output).
- **BE-03** **[Known]** it builds the graph model; the page only displays it (`VIEW-04`). It writes only its own store, `data/viewer/` (`VIEW-06`).
- **BE-04** **[Known]** it has no tool-specific code; it reads only `represents`, `containedIn`, `contains`, the `fields` roles and IDs (`VIEW-14`). A branch on a tool's name is a finding against P4.
- **BE-05** **[Known]** it checks every run's output before using or storing it, and survives bad data (`VIEW-15`, `VIEW-16`; `viewer.md`, section 6).

## 2. Starting and stopping

- **BE-10** **[Known]** started by hand from a shell, `zaansouvi-view [--port <n>]`, from any working folder; prints the URL with its token; doesn't open the browser; runs until stopped by hand (`VIEW-07`).
- **BE-11** **[Suggested]** the launcher is `app/viewer/zaansouvi-view`, a shell script like the Runner's `app/runner/zaansouvi-run`: it finds its own folder and starts `node --disable-warning=ExperimentalWarning <dir>/server/src/server.ts "$@"`, arguments passed through unchanged. Options: `--port <n>` (default `4310`), `--help`, `--version`. Anything else is a start-up error.
- **BE-12** **[Suggested]** start-up, in order:
  1. find the MVP root from the launcher's location (`<root>/app/viewer/..`), so the working folder doesn't matter;
  2. create `data/viewer/` and `data/viewer/sources/` if missing;
  3. read `data/viewer/sources.json`; if it is missing or can't be read, rebuild it from the entries (`BE-32`);
  4. make the token (`BE-60`);
  5. listen on `127.0.0.1:<port>`;
  6. append `viewer_started` to the activity log (`BE-80`) and print the message of `UI-02`.
- **BE-13** **[Known]** a port already in use is a start-up error naming the port and `--port` (`VIEW-07`). **[Suggested]** exit codes: `0` after a normal stop, `2` for any start-up error (bad option, port in use, data folder not writable), with one line on standard error.
- **BE-14** **[Suggested]** stopping. On Ctrl + C (`SIGINT`) or `SIGTERM`, the server stops accepting requests, closes the live streams, appends `viewer_stopped` (`minimal`) and exits `0`. A Runner run started by it gets the same Ctrl + C from the terminal and stops too; the lock it leaves is taken over by the next run (`RUN-30`, R6). Cancelling a run is out of the MVP (`FND-34`).

## 3. Its own store: `data/viewer/`

- **BE-20** **[Known]** JSON files, written only by the backend; nothing else reads them; a starting point that may change (`VIEW-06`, `FND-61`).

```
data/viewer/
  sources.json                     the sources cached (BE-31)
  sources/<source-key>/
    last-good-graph.json           that source's last good graph model (BE-50)
  activity.log                     the activity log, appended (BE-80)
```

- **BE-21** **[Suggested]** every file is written atomically, to a temporary file in the same folder then renamed, as the tools do (`TOOL-05`). `activity.log` is the exception: appended one line at a time (`BE-81`).
- **BE-22** **[Known]** the folder survives clearing the Runner's and the tools' data, and can itself be deleted at any time; the next successful run rebuilds what is needed (`VIEW-09`, `ARCH-09`).

## 4. Sources

- **BE-30** **[Known]** the backend loads any number of examined sources without a restart; one cache entry per source, keyed by the source root's absolute real path (`VIEW-08`; `viewer.md`, section 3.4).
- **BE-31** **[Suggested]** `sources.json`:

  ```jsonc
  { "formatVersion": 1,
    "sources": [ { "sourceKey": "3f9a1c0e2b7d4a65", "sourceRoot": "/home/zaida/viewer/mvp_docs/zaansouvi-mvp/test-source",
                   "name": "test-source", "runId": "<id>", "finished": <Time> } ] }   // runId and finished: the entry's run, or absent
  ```

  `sourceKey`: the first 16 hex digits of the SHA-256 of the real path. `name`: the folder's name, for the picker. Sources are listed in the order they were added.
- **BE-32** **[Known]** each entry records its own source root, so `sources.json` can be rebuilt from the entries (`VIEW-16`). **[Suggested]** a source added but never run successfully has no entry folder; it survives only in `sources.json`, and is lost if that file is rebuilt. Acceptable for the MVP.
- **BE-33** **[Suggested]** adding a source (`POST /api/sources`) accepts a path only if it is absolute, exists, is a folder, and is not inside the MVP folder's `data/` or `app/`; it is resolved to its real path first, so the same folder added twice gives the same key and isn't listed twice. Adding doesn't run anything.
- **BE-34** **[Suggested]** the backend keeps a **current source** for the session (the last one switched to), only to choose what the page opens with; every API call that concerns a source names it with `source=<sourceKey>`, so two tabs can show different sources.

## 5. Calling the Runner

- **BE-40** **[Known]** the Runner is started as a separate process with an argument array, never a shell string (`ARCH-03`). **[Suggested]** the launcher `app/runner/zaansouvi-run`, with:
  - a real run: `[<sourceRoot>]`;
  - a dry run: `[<sourceRoot>, "--dry-run-only"]`;
  - reading the cache: `["--read-cache"]`.

  The source root is always passed explicitly; the backend never relies on the Runner's saved one (`RUN-29`).
- **BE-41** **[Known]** one run at a time (`VIEW-05`). **[Suggested]** the backend refuses a second run or dry run itself, with `409` and a `run_refused` entry, while one it started is going; a run started from the command line is caught by the Runner's lock, which ends the Runner with exit code `2` and a diagnostic, reported the same way.
- **BE-42** **[Suggested]** while a run goes, the backend reads the Runner's standard output line by line; each line is one Runner event (`03_runner.md`, events table), forwarded to the live stream (`BE-70`) and logged at `verbose` (`runner_event`). A line that isn't JSON is logged at `minimal` as a backend warning and otherwise ignored. Standard error is kept and logged if the exit code isn't `0`.
- **BE-43** **[Suggested]** when the Runner exits, the backend logs `run_result` or `dry_run_result` (`minimal`), then, for a real run, reads the cache (`--read-cache`), builds and checks the graph model for that source (`BE-50`, `BE-60` series), stores it if it passes (`BE-56`), logs `output_checked`, and announces `graph_updated` on the stream. A dry run changes no graph (`VIEW-31`); its result is kept in memory for the Tools tab and comes back from the Runner's cache (its `dryRun` part, `RUN-27`).
- **BE-44** **[Known]** the Runner's cache holds only the last run's source; the backend uses it only when its `run.sourceRoot` is the source asked for (`VIEW-08`). **[Suggested]** it reads the cache on each request that needs it, not once at start-up, since a command-line run may have replaced it; reading is cheap (a few hundred kilobytes for the test source).

## 6. The graph model

The backend's one product: what the page shows, and also the file format of each cache entry. **[Suggested]** throughout, built on `VIEW-10` to `VIEW-16` and the accepted graph rules; it replaces the reference schema's section 10, which still describes the earlier draft.

- **BE-50** The model, format 1:

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

  The model carries no build time, so the same cache gives the same bytes (as the tools' outputs, `DATA-22`). Node and edge styles are not in it: the page picks them from `dataName` plus `kind` (`UI-41`). `container` is a new key name (the node a node is shown inside), kept apart from the records' `parent` because containment can change it (`VIEW-11`); to register in the reference schema with the other new keys of this section (`thisNode`, `members`, `recordId`, `what`).
- **BE-51** **Nodes.** Files come from the cache's file list (`kind` `file`, label the file name, `container` `null`). Every group with `represents: "nodes"` gives nodes: `id`, `kind`, `label` and `location` through its `fields` roles, `container` from the `parent` role, `owner` from the `owner` role if declared. Every group with `represents: "containment"` then re-sets the container of the nodes it names (`VIEW-11`): with M3, each symbol's container becomes its scope.
- **BE-52** **Relations.** Every group with `represents: "relations"` gives relations, through `fields` (`from`, `to`, `kind`, `location`, and `reason` if present). References of kind `declaration` are dropped (accepted rule, `UI-34`). A relation's `label`, used for unresolved ones, is the record's `name` if it has one.
- **BE-53** **Lifting, for the view of an entered node `C`** (the top view has `C` = none; accepted rules, `VIEW-13`, `UI-34`, `UI-36`). For each relation whose `to` isn't `null`:
  1. **Owners first:** an end that is a scope's owner is replaced by that scope, at either end (the start rule of `VIEW-13` and its mirror, `UI-34`). A file owns its file scope, so code at file level starts and ends at the file scope.
  2. **Each end is placed:** inside `C`, at its ancestor that is a direct child of `C`; equal to `C`, at the **this node** of `C` (`UI-36`, drawn as "<name>, this scope"); outside `C`, at its ancestor that is a direct child of the lowest common ancestor of the end and `C`, drawn as a **stub**. (At level 2 inside `main.ts` this gives the stubs `counter.ts` and `math.ts`; at level 3 inside the scope `run`, an end in `main.ts`'s file scope gives the stub "main.ts, file scope".)
  3. **An edge whose two ends land on the same node isn't drawn** at this level; it shows one level down (`UI-34`). Neither is an edge between two stubs.
  4. **Edges with the same two ends are merged:** one edge, `count` its members, `kind` theirs if they all share one, else `mixed`, `members` the relation IDs (`VIEW-13`).

  A relation whose `to` is `null` is listed in `unresolved` of every view where its `from` end lands on a shown node, a stub excepted (`VIEW-12`).
- **BE-54** **Which views are built:** the top view, and one view per node that has a node inside it (files and scopes, with M3). The model holds them all, so moving between levels needs no request. For the test source: 1 top view, 3 file views, 6 scope views.
- **BE-55** **The test source's views must come out as `50_viewer_ui.md`, section 4.1, says**, edge for edge and count for count. That table becomes the expected result of `BE-91`.
- **BE-56** **What is stored and shown** (`VIEW-16`): a model with nothing in `checks.invalid` is written as the source's `last-good-graph.json` and replaces the previous one; one with invalid records is returned to the page, marked partly invalid, but never stored; if no model can be built, the page gets the stored one, if any, with the reason. Extra data never stops storing.
- **BE-57** **Choosing the model for a request** (`GET /api/graph?source=<key>`), in order:
  1. the Runner's cache is for this source and its `run.runId` differs from the stored entry's: build from the cache, check, store if valid (`BE-56`), and return it, with `status` `latest` (or `partly-invalid`, or `failed` when the run's `outcome` isn't `succeeded`, in which case the stored entry is returned with `status` `last-good`);
  2. otherwise the stored entry, `status` `latest` when the cache's run is the same, else `stored`;
  3. otherwise `status` `no-good-data` (a run exists but nothing usable), `no-run` (never run) or `unusable` (an entry with another `formatVersion`, or unreadable), with the reason.

  The page can also ask for the stored entry explicitly (`&which=last-good`), for the switch in `UI-70`.

## 7. Checks

- **BE-60** **[Known]** the checks of `VIEW-15`, generic, run while the model is built. **[Suggested]** In the order they apply:
  - a record lacking a field its role needs, or with a malformed Location: invalid, skipped;
  - two nodes with the same `id`, across all data names: invalid; the second is skipped;
  - a node whose container isn't a known node or file: invalid, skipped (its own members then fail the same check);
  - a containment record whose child or container isn't known: invalid, skipped;
  - a relation whose `from` isn't known, or whose `to` is neither known nor `null`: invalid, skipped;
  - a scope whose owner isn't known: invalid, kept as a node, but no edge starts or ends at it through its owner;
  - **extra**: a group whose `represents` isn't `nodes`, `relations` or `containment` (not shown); keys beyond the roles (ignored, listed once per data name, not per record; `name` and `reason` count as read, `BE-52`); a `kind` the page has no style for is not extra, since it is drawn generically. *(As built, the test source always shows 3 extra items: `code.symbol` `exported`, `import`, `range`; `code.reference` `enclosing`, `symbol`; `code.link` `moduleSpecifier`. To decide whether record keys should count as extra, `FND-69`.)*
- **BE-61** **[Suggested]** any error while building, the backend's own included, is caught for that source; the request gets `status` `no-good-data` or `last-good` with the error's message as the reason, and a `minimal` `warn` entry is logged. The server keeps running (`VIEW-15`, `BE-05`).

## 8. Endpoints

**[Accepted]** The live stream, the security and the source routes. **[Suggested]** The table itself, which replaces the list in `VIEW-02`. Every API answer is JSON, except the log text and the stream. Every request needs the token (`BE-71`). `source` is a `sourceKey`.

| Method and path | Does | Answer |
|---|---|---|
| `GET /` | The page. With `?token=<token>` and a valid token, sets the session cookie and redirects to `/` (`BE-71`) | HTML |
| `GET /ui/<file>` | The page's compiled scripts, its stylesheet and images, from `app/viewer/ui/dist/` (`BE-90`) | the file |
| `GET /lib/cytoscape.js` | Cytoscape's prebuilt file, from the local install | the file |
| `GET /api/sources` | The cached sources, and the current one (`BE-34`) | `{ "current": "<key>" \| null, "sources": [ ... ] }` |
| `POST /api/sources` | Adds a source: `{ "sourceRoot": "<absolute path>" }` (`BE-33`) | the source, `201`; `400` with the reason |
| `POST /api/sources/current` | Switches the current source: `{ "source": "<key>" }` | `204` |
| `GET /api/graph?source=&which=` | The graph model to show, with `status` and `reason` (`BE-57`) | `{ "status", "reason?", "model?" }` |
| `GET /api/tools?source=` | The record of tools in order, and, if the Runner's cache is for this source, each invocation's latest result, the dry-run results and the diagnostics (`VIEW-31`) | JSON |
| `POST /api/run` | Starts a real run: `{ "source": "<key>" }` (`BE-40`) | `202`; `409` if a run is going |
| `POST /api/dry-run` | Starts a dry run: `{ "source": "<key>" }` | `202`; `409` |
| `GET /api/source?source=&file=&line=` | That line of the file and two lines on each side, for a file ID in that source's file list (`BE-72`) | `{ "file", "firstLine", "lines": [ ... ] }` |
| `GET /api/source?source=&file=&line=&end=` | Added 2026-11-09 (`FND-106`): the lines `line` to `end`, a record's range, at most 200; same checks; `404` when `end` is before `line` | `{ "file", "firstLine", "lines": [ ... ], "cut": <true when more than 200> }` |
| `GET /api/log?path=` | A log file as text, only under `data/` and only `*.log` (`BE-72`) | text |
| `GET /api/events` | The live stream (`BE-70`) | `text/event-stream` |
| `POST /api/activity` | The page reports a navigation or selection: `{ "event": "level_entered" \| "level_left" \| "node_selected" \| "log_opened" \| "graph_switched", "nodeId?": "<NodeID>" }`; the backend writes the entry's text itself (`BE-82`) | `204` |
| `POST /api/activity/clear` | Clears the activity log (`UI-72`, `BE-83`) | `204` |

- **BE-63** **[Suggested]** request bodies are JSON, at most 64 KiB; anything else is `400`. Unknown paths are `404`. Errors return `{ "error": "<message>" }`.

## 9. Live stream and security

- **BE-70** **[Accepted]** **Server-sent events** on `GET /api/events` (`FND-60`, item 2). **[Suggested]** each message has an event name and one JSON object:
  - `activity`: one activity entry, as logged (`BE-80`); on connecting, the stream first sends every entry of the session, so a reload shows the whole session (`UI-69`);
  - `runner`: one Runner event, as printed, while a run started by this backend goes;
  - `run_state`: `{ "running": true \| false, "kind": "run" \| "dry-run", "source": "<key>" }`, so every tab can disable its buttons (`UI-23`);
  - `graph_updated`: `{ "source": "<key>" }` after a model was built from a new run, so the page reloads it;
  - a comment line every 15 seconds, to keep the connection open.

  Any number of tabs may be connected; each gets every message.
- **BE-71** **[Accepted]** **The security minimum** (`FND-60`, item 3; `security.md`, sections 7 and 8). **[Suggested]** details:
  - **token:** 32 random bytes from Node's `crypto`, written as hex, made at each start and printed in the URL (`UI-02`). `GET /?token=<token>` with the right token sets a cookie (`HttpOnly`, `SameSite=Strict`, path `/`, no expiry: it dies with the browser session) and redirects to `/`, so the token leaves the address bar. Every other request must carry the cookie; without it, or with an old one, the answer is `403` with the text of `UI-03`. Tokens are compared in constant time;
  - **`Host`:** must be `127.0.0.1:<port>` or `localhost:<port>`, else `403`, so a web page that rebinds a name to `127.0.0.1` gets nothing;
  - **`Origin`:** on every `POST`, must be the server's own origin, else `403`; no CORS headers are ever sent;
  - **headers on every answer:** `Content-Security-Policy: default-src 'self'` (no inline script, no outside source), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store` on API answers;
  - **nothing from the internet:** Cytoscape and the page's files are served from the local install (`security.md`, section 8).
- **BE-72** **[Accepted]** **Reads only where allowed.** **[Suggested]** `/api/source` accepts only a file ID present in that source's file list (from its model), joins it to the source root, resolves the real path, and refuses (`404`) anything whose real path isn't under the source root's real path; it reads only the lines asked for. `/api/log` resolves the real path and serves it only if it is under the real path of `data/` and ends in `.log`. Both answer `404` rather than say why, so they reveal nothing about other files.
- **BE-73** **[Known]** everything the page shows is text, never HTML (`VIEW-40`); the backend sends data, never markup built from data.

## 10. Activity log

- **BE-80** **[Known]** one file, `data/viewer/activity.log`, appended, in the shared log format: `<time> TAB <level> TAB <event> TAB <JSON details>`, every entry's details holding `verbosity`, `actor` and `text`, plus its facts; comments start with `#` (`VIEW-17`, `UI-71`; `DATA-16`; reference schema, section 15).
- **BE-81** **[Known]** only one backend uses the file, so it may be deleted and recreated at any time (`UI-71`). **[Suggested]** the file is opened, appended to and closed for each entry, so a deleted file just comes back. The session's entries are also kept in memory, for the stream (`BE-70`).
- **BE-82** **[Known]** the backend logs its own actions and results and the user's actions it receives (`VIEW-17`); suggested levels in `UI-62`. **[Suggested]** the page reports only an event name and a node ID (`POST /api/activity`); the backend writes the sentence (for example "You entered main.ts", from the node's label), so every entry's text comes from the backend, and a report with an unknown event name is refused (`400`). Event names: `viewer_started`, `viewer_stopped`, `source_added`, `source_opened`, `cached_graph_loaded`, `run_requested`, `dry_run_requested`, `run_refused`, `runner_event`, `run_result`, `dry_run_result`, `output_checked`, `output_partly_invalid`, `entry_unusable`, `graph_switched`, `level_entered`, `level_left`, `node_selected`, `log_opened`, `log_cleared`, `backend_warning`, `backend_error`.
- **BE-83** **[Known]** Clear deletes the file and empties the session's entries; the next entry, `log_cleared`, starts the file again (`UI-72`). **[Suggested]** the stream then sends a `cleared` message, so every open tab empties its activity line.

## 11. The page's code: getting TypeScript to the browser

- **BE-90** **[Accepted]** **Compiled with `tsc`, no bundler** (option (a), `FND-68`). **[Suggested]**
  - the page's TypeScript lives in `app/viewer/ui/src/`, compiled by `tsc` into ES modules in `app/viewer/ui/dist/`, with `index.html` and `style.css` beside them, served under `/ui/`; `npm run build` in `app/viewer/` does it, and the server refuses to start if `dist/` is missing, saying to run the build;
  - Cytoscape is a dependency of `app/viewer/package.json`, its version pinned when it is installed; the server serves its prebuilt browser file from `node_modules` as `/lib/cytoscape.js`, which the page loads before its own modules;
  - the server's own TypeScript (`app/viewer/server/src/`) runs directly with Node's type stripping, like the Runner, with no build;
  - one `tsc` type check covers both (`npm run typecheck`).

## 6a. MVP 2

The graph model's format 2 and the source-lines rule: `05_viewer.md`, `VIEW-50`; built in `server/src/model.ts` and `server/src/server.ts` (`FND-98`). The page's MVP 2 changes: `50_viewer_ui.md`, `UI-37` (a frame for any entered container), `UI-47`, `UI-48`.

## 12. Tests

*(For MVP 2, `tests/viewer/check-server.mjs` was rewritten on 2026-11-09 for `test-source-mvp2` and `ts-program`, 35 checks; the first stage's version is kept as `check-server-stage1.mjs`, superseded, `FND-99`.)*

All **[Suggested]**, following the tools' pattern: a check script and a broken-input script, run by hand, on temporary copies so `data/` isn't touched.

- **BE-91** **Graph model check:** a script builds the model from `expected/runner-cache.json` and compares it with an expected model, `expected/graph-model.json`, generated from the tables in `50_viewer_ui.md`, section 4.1 (`BE-55`); then builds it twice and compares the bytes (no build time in it).
- **BE-92** **Checks on damaged caches** (`FND-64`): copies of the cache with a missing container, an edge to an unknown node, a duplicate ID, an unknown `represents` and an extra key; each gives the expected `invalid` or `extra` items, isn't stored, keeps the last good entry, and gives the same answer after a restart. A damaged `sources.json` is rebuilt; an entry with `formatVersion` 0 gives `unusable`.
- **BE-93** **Endpoints and security** (`FND-31`): no cookie gives `403`; a wrong `Host` or `Origin` gives `403`; `/api/source` with `../`, an absolute path, a file not in the list, or a symbolic link leading out of the source gives `404`; `/api/log` outside `data/` gives `404`; a second run while one goes gives `409`; a body over 64 KiB gives `400`.
- **BE-94** **Activity log:** a session's entries come back in order on a new stream; deleting `activity.log` while the server runs breaks nothing and the next entry recreates it; Clear empties it; a page report with an unknown event is refused.
- **BE-95** **The page** stays a human review (P3), against the preview (`FND-67`).

## 13. Out of the MVP

Cancelling a run; more than one backend at a time; positions, preferences and pending versions in the store (`VIEW-06`); the config manager; serving outside `127.0.0.1`; HTTPS; starting from the file manager or a shortcut, and opening the browser automatically (`FND-62`); a desktop window around the page (`VW-38`).

## 14. Still open after this file

- ~~The new key names of section 6 (`container`, `thisNode`, `members`, `recordId`, `what`), to register in the reference schema when the model is built.~~ Registered on 2026-11-08, with the others the build added (reference schema, section 12).
- ~~The reference schema's section 10, to replace with section 6 of this file.~~ Done on 2026-11-08.
- Whether a record's keys the Viewer doesn't read count as extra data (`FND-69`).
- `FND-60`, item 6 (the duplicate keys in M1's references) and item 7 (stating the scope cuts in `05_viewer.md`).
- `MVP-8`: the success criteria and a time target.

## 15. As built (2026-11-08)

What the build changed or added, against the sections above. **[Known]** throughout: it is what the code does.

- **BE-100** **The page's static files** sit in `app/viewer/ui/static/` (`index.html`, `style.css`); `tsc` writes only `ui/dist/main.js`. Both are served under `/ui/`, `dist/` first (refines `BE-90`). Cytoscape is **3.34.4**, pinned in `app/viewer/package.json`; the server serves `node_modules/cytoscape/dist/cytoscape.min.js` as `/lib/cytoscape.js`, and the page imports only Cytoscape's types.
- **BE-101** **The security policy is strict:** `Content-Security-Policy: default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`, with no inline style or script. Checked: Cytoscape draws under it (headless Firefox).
- **BE-102** **A body over 64 KiB is read to its end and dropped**, then answered `400`, so the client gets the answer rather than a reset connection (refines `BE-63`).
- **BE-103** **The server's TypeScript must be erasable syntax only** (no parameter properties, enums or namespaces): Node's type stripping refuses the rest, and TypeScript 5.6's type check doesn't catch it (`erasableSyntaxOnly` came in 5.8). Found when the first start failed.
- **BE-104** **A scope's members are listed in its label**, not drawn as nodes nested inside it: drawn nested, Cytoscape's automatic layout (`cose`) blew the file scope up and overlapped the scopes. A view's node shows its children in its label when they are all leaves (refines `UI-30`; the preview drew them nested).
- **BE-105** **The activity log names what the user acted on:** a node by its label, a scope as "scope <name>" or "the file scope of <file>", an edge as "the edge <from> → <to>" (`BE-82`). Invalid records and extra data each get a `verbose` entry, with the item under the new key `item`.
- **BE-106** **A test hook:** `window.zaansouvi` exposes `enter`, `select`, `tab` and `state`, so a script can drive the page as a double-click, a click or a tab would.
- **BE-107** **Layout per level:** Cytoscape's `cose` for two nodes or more, `grid` for one; the view is fitted after each change (the item left open in `FND-60`'s list of what can be decided while building).
- **BE-108** **Checks built:** `tests/viewer/check-model.mjs` (`BE-91` and the model part of `BE-92`: the views against `expected/graph-views.json`, byte-identical builds, six damaged caches) and `tests/viewer/check-server.mjs` (`BE-92` to `BE-94` on a temporary copy of the MVP: 32 checks). The expected views, written by hand from `50_viewer_ui.md`, section 4.1, missed one edge at level 3 that the model found; the table and the preview were corrected (`FND-69`).
- **BE-109** **Scopes and files are recognized by their roles, not their data names:** a node with an `owner` is a scope (the file scope when its owner is its container), a node with no container is a file. Four places worded labels by the data name `code.scope`; made generic on 2026-11-08 while writing `98_first_implementation.md` (`VIEW-14`, `FND-70`). Data names still pick styles, as `UI-41` accepts.
