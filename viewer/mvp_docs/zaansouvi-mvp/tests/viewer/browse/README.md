# Driving the Viewer's page in headless Firefox

Scripted checks of the page itself, used while building it on 2026-11-08 and 2026-11-09 (`FND-69`, `FND-71` to `FND-73`). They complement the review by a person (`BE-95`): they print what the page holds and take screenshots; they don't judge them.

| File | What |
|---|---|
| `browse.sh` | Starts the Viewer on port 4399 and headless Firefox with a fresh profile, runs a steps file, stops both |
| `drive.py` | A tiny Marionette client (Firefox's remote protocol) that runs the steps |
| `frame-views.json` | Enters every scope view of `test-source`, prints each frame's contents and any overlap, takes screenshots (`UI-37`) |
| `selection.json` | Selects one node, adds a second and an edge, clears, then selects in a scope view; prints the selection, the highlighted edges and their colors, and the groups in Details (`UI-38`, `UI-56`) |
| `enter-marks.json` | At levels 1 to 3, lists the nodes marked as enterable and those not, with screenshots (`UI-45`) |
| `zoom-controls.json` | Prints the zoom and its readout after loading, Text, a zoom from code and Fit, and the controls' order from the bottom up (`UI-46`) |
| `problems.json` | Prints the Problems pane at levels 1 to 3 with This view and All, then on the source `runner` (a copy of the Runner's code, many repeats), and switches back to `test-source` (`UI-54`, `UI-57`). Needs both sources added in the Viewer |
| `contains.json` | Selects a file, a scope, then two scopes together, and prints Details' headings and Contains items (`UI-52`) |
| `problem-items.json` | Adds three invalid records to the page's copy of the model (two sharing a problem), then prints how each box in Problems is built: invalid, extra and unresolved (`UI-57`). Changes nothing on disk |
| `activity-count.json` | Logs a few verbose entries (selections, a level entered), then prints the activity line's "shown / logged" count with each level toggled, and where it sits (`UI-73`) |
| `tools-pane.json` | Clicks Run, then Dry run, on `test-source` (replacing the Runner's cache), then gives the Tools pane made-up answers through `window.zaansouvi.tools()`: a failed run, a run in progress, the same run ended failed, a no-go dry run; prints every box (`UI-58`) |
| `layout-repeat.json` | Enters the scope `run` three times and after a reload, printing node positions, which must repeat (`UI-32`) |

From `zaansouvi-mvp/`:

```
tests/viewer/browse/browse.sh tests/viewer/browse/frame-views.json /tmp/shots
```

Needs Firefox, Python 3, the Viewer built (`app/viewer`: `npm install`, `npm run build`), and `test-source` added in the Viewer with a run. It uses the real `data/` and adds entries to its activity log.

## Steps files

A JSON array of steps, starting with `["go", "<anything>"]`. `browse.sh` replaces the URL of every `go` step with the Viewer's URL and token, in a temporary copy, so the token is never written to the steps file; a later `go` reloads the page:

| Step | Does |
|---|---|
| `["go", url]` | Opens the URL |
| `["wait", "<js condition>", seconds]` | Waits until the condition is true |
| `["js", "<js code returning a value>"]` | Runs the code in the page and prints its result (up to 4000 characters) |
| `["shot", "<file.png>"]` | Takes a screenshot, into the output folder |
| `["sleep", seconds]` | Waits |

The page exposes `window.zaansouvi` (`enter`, `select`, `tab`, `state`, `ready`, `tools`); the Cytoscape instance is `document.querySelector('#cy')._cyreg.cy`.

## Pitfalls met

- **A locked profile:** a Firefox killed mid-run leaves its profile locked, and the next start can't be reached ("can't reach Marionette"). Hence a fresh profile every time.
- **`pkill -f <pattern>`** also matches the shell running it when the pattern is in its own command line, and kills it. Hence stopping by process ID.
- **Positioned but invisible nodes:** Cytoscape draws a node sized by its label only once a layout has measured it (`FND-73`). A check that a node exists is not a check that it's drawn: test `visible()` too.
