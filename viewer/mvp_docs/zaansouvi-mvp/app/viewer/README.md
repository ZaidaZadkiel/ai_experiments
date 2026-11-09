# zaansouvi-view (the Viewer)

The MVP Viewer: a local backend on `127.0.0.1` and one page in the browser. It shows the examined source's graph, level by level, from the Runner's output only. Specified in `mvp_docs/05_viewer.md`, `mvp_docs/50_viewer_ui.md` (the page) and `mvp_docs/55_viewer_backend.md` (the backend).

## Install, build and run

Needs Node 22.18 or later.

```
cd app/viewer
npm install                 # Cytoscape 3.34.4 (pinned), and TypeScript for the build and the type check
npm run build               # compiles the page (ui/src) into ui/dist; needed once, and after changing the page
./zaansouvi-view            # or with --port <n>; default 4310
```

It prints the URL to open, with a one-time token; open it in a browser. It runs until Ctrl + C. Run it from any folder except inside an examined source.

First use: add a source (its absolute path), then **Run**. The Runner must be installed (`app/runner/`), and the tools (`app/tools/`).

## Layout

| Path | What |
|---|---|
| `zaansouvi-view` | The launcher (`BE-11`) |
| `server/src/server.ts` | Start-up, security, routes, the live stream, runs (`BE-10` to `BE-14`, sections 8 and 9) |
| `server/src/model.ts` | The graph model: checks and lifting, no I/O (section 6, 7) |
| `server/src/store.ts` | `data/viewer/`: `sources.json` and one entry per source (sections 3, 4) |
| `server/src/activity.ts` | `data/viewer/activity.log` (section 10) |
| `server/src/runner.ts` | Calling the Runner (section 5) |
| `ui/src/main.ts` | The page's code, compiled by `tsc` into `ui/dist/main.js` (`BE-90`) |
| `ui/static/` | `index.html` and `style.css`, served as they are |

The server runs its TypeScript directly with Node's type stripping, so it may use only erasable syntax: no parameter properties, enums or namespaces (TypeScript 5.6 can't check this; `erasableSyntaxOnly` came in 5.8).

## Its own data

`data/viewer/`, written only by this backend: `sources.json`, `sources/<source-key>/last-good-graph.json`, `activity.log`. It can be deleted at any time; clearing the Runner's and the tools' data (`data/zaansouvi.sqlite`, `data/runner/`, `data/tools/`) leaves it alone (`VIEW-09`).

## Checks

From `zaansouvi-mvp/`:
- `node tests/viewer/check-model.mjs`: the graph model against `expected/graph-views.json`, two builds byte-identical, six damaged caches (`BE-91`, `BE-92`).
- `node tests/viewer/check-server.mjs`: the backend on a temporary copy of the MVP: security, reads, the activity log, runs, bad data across restarts (`BE-92` to `BE-94`). Needs a Runner cache in `data/`.
- `npm run typecheck` in this folder.

The page itself is reviewed by a person (`BE-95`). `window.zaansouvi` exposes `enter`, `select`, `tab` and `tools` for scripted checks; `tests/viewer/browse/` drives the page in headless Firefox, printing what it holds and taking screenshots (its `README.md`).
